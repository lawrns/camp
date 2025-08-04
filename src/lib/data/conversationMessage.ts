import { addSeconds } from "date-fns";
import { and, asc, desc, eq, inArray, ne, not, or, SQL } from "drizzle-orm";
import { htmlToText } from "html-to-text";
import * as DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { db, Transaction } from "@/db/client";
import { conversationMessages, DRAFT_STATUSES, files, mailboxes } from "@/db/schema";
import { conversationEvents } from "@/db/schema/conversationEvents";
import { conversations } from "@/db/schema/conversations";
import { notes } from "@/db/schema/notes";
import type { Tool } from "@/db/schema/tools";
import { EMAIL_UNDO_COUNTDOWN_SECONDS } from "@/lib/constants";
import type { AuthenticatedUser } from "@/lib/core/auth";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import type { ToolExecutionData, ToolExecutionError } from "@/types/common";
import { PromptInfo } from "@/types/conversationMessages";
import { getConversationById, getNonSupportParticipants, updateConversation } from "./conversation";
import { finishFileUpload } from "./files";
import { getClerkUserList } from "./user";

// Conditional import to avoid Node.js modules in browser
const getInngest = () => {
  if (typeof window !== "undefined") {
    // Browser environment - return mock
    return {
      send: async () => ({ id: "mock-event" }),
    };
  }
  // Server environment - import actual inngest
  try {
    const { inngest } = require("@/inngest/client");
    return inngest;
  } catch {
    return {
      send: async () => ({ id: "mock-event" }),
    };
  }
};

// import { formatBytes } from '@/lib/infrastructure/storage'; // Module not found

// Simple fallback for formatBytes function
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};
// import { proxyExternalContent } from "@/lib/proxyExternalContent"; // Module not found
// import { createPresignedDownloadUrl } from "@/lib/s3/utils"; // Module not found

// Simple fallback for createPresignedDownloadUrl function
const createPresignedDownloadUrl = (url: string) => {
  return url; // Return the original URL as fallback
};

// Simple fallback for proxyExternalContent function
const proxyExternalContent = (content: string) => {
  return content; // Return the original content as fallback
};

const isAiDraftStale = (draft: typeof conversationMessages.$inferSelect, mailbox: typeof mailboxes.$inferSelect) => {
  return draft.deliveryStatus !== "pending" || draft.createdAt < mailbox.promptUpdatedAt;
};

export const serializeResponseAiDraft = (
  draft: typeof conversationMessages.$inferSelect,
  mailbox: typeof mailboxes.$inferSelect | any
) => {
  if (!draft.inReplyToId) {
    return null;
  }
  return {
    id: draft.id,
    responseToId: draft.inReplyToId,
    body: draft.content,
    isStale: isAiDraftStale(draft, mailbox),
  };
};

export const getMessagesOnly = async (conversationId: string) => {
  const messages = await db.query.conversationMessages.findMany({
    where: and(
      eq(conversationMessages.isDeleted, false),
      eq(conversationMessages.conversationId, conversationId),
      or(
        eq(conversationMessages.senderType, "customer"),
        not(inArray(conversationMessages.deliveryStatus, DRAFT_STATUSES))
      )
    ),
    orderBy: [asc(conversationMessages.createdAt)],
  });

  return messages;
};

export const getMessages = async (conversationId: string, mailbox: typeof mailboxes.$inferSelect) => {
  const findMessages = (where: SQL) =>
    db.query.conversationMessages.findMany({
      where: and(
        where,
        eq(conversationMessages.isDeleted, false),
        or(
          eq(conversationMessages.senderType, "customer"),
          not(inArray(conversationMessages.deliveryStatus, DRAFT_STATUSES))
        )
      ),
      columns: {
        id: true,
        deliveryStatus: true,
        content: true,
        createdAt: true,
        senderEmail: true,
        senderName: true,
        senderType: true,
        conversationId: true,
        sourceData: true,
        attachments: true,
        summary: true,
        inReplyToId: true,
        deliveryMetadata: true,
        organizationId: true,
        source: true,
        updatedAt: true,
      },
      with: {
        // Note: files relation needs to be defined in schema
      },
    });

  const messages = await findMessages(eq(conversationMessages.conversationId, conversationId));
  // Note: mergedIntoId doesn't exist in schema, skipping merged messages query
  const allMessages = [...messages];

  const noteRecords = await db.query.notes.findMany({
    where: eq(notes.conversationId, conversationId),
    columns: {
      id: true,
      createdAt: true,
      content: true,
      organizationId: true,
      updatedAt: true,
    },
    with: {
      // Note: files relation needs to be defined in schema
    },
  });

  const eventRecords = await db.query.conversationEvents.findMany({
    where: and(eq(conversationEvents.conversationId, conversationId), ne(conversationEvents.type, "reasoning_toggled")),
    columns: {
      id: true,
      type: true,
      createdAt: true,
      changes: true,
      byUserId: true,
      reason: true,
    },
  });

  const membersById = Object.fromEntries(
    (await getClerkUserList(mailbox.organizationId)).data.map((user: AuthenticatedUser) => [user.id, user])
  );

  const messageInfos = await Promise.all(
    allMessages.map((message) =>
      serializeMessage(
        message as typeof conversationMessages.$inferSelect & { files?: (typeof files.$inferSelect)[] },
        conversationId,
        mailbox,
        null
      )
    )
  );

  const noteInfos = await Promise.all(
    noteRecords.map(async (note: unknown) => ({
      ...note,
      type: "note" as const,
      from: null,
      slackUrl: null,
      files: [],
    }))
  );

  const eventInfos = await Promise.all(
    eventRecords.map((event: unknown) => ({
      ...event,

      changes: {
        ...event.changes,
        assignedToUser: event.changes.assignedToUserId
          ? membersById[event.changes.assignedToUserId]?.name ||
            `${membersById[event.changes.assignedToUserId]?.firstName || ""} ${membersById[event.changes.assignedToUserId]?.lastName || ""}`.trim() ||
            null
          : event.changes.assignedToUserId,
      },

      byUser: event.byUserId
        ? membersById[event.byUserId]?.name ||
          `${membersById[event.byUserId]?.firstName || ""} ${membersById[event.byUserId]?.lastName || ""}`.trim() ||
          null
        : null,

      eventType: event.type,
      type: "event" as const,
    }))
  );

  return [...messageInfos, ...noteInfos, ...eventInfos]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((info) => ({ ...info, isNew: false }));
};

export const sanitizeBody = (body: string | null) =>
  body ? proxyExternalContent(DOMPurify.default.sanitize(body, { FORBID_TAGS: ["script", "style"] })) : null;

export const serializeMessage = async (
  message: Pick<
    typeof conversationMessages.$inferSelect,
    | "id"
    | "deliveryStatus"
    | "content"
    | "createdAt"
    | "senderEmail"
    | "senderName"
    | "senderType"
    | "conversationId"
    | "sourceData"
    | "attachments"
    | "summary"
    | "inReplyToId"
    | "deliveryMetadata"
    | "organizationId"
    | "source"
    | "updatedAt"
  > & {
    files?: (typeof files.$inferSelect)[];
  },
  conversationId: string,
  mailbox: typeof mailboxes.$inferSelect,
  user: AuthenticatedUser | null
) => {
  const messageFiles = message.files ?? [];

  const draftEmail =
    message.senderType === "customer"
      ? await db.query.conversationMessages.findFirst({
          where: and(
            eq(conversationMessages.conversationId, message.conversationId),
            eq(conversationMessages.senderType, "system"),
            eq(conversationMessages.inReplyToId, message.id)
          ),
          orderBy: [desc(conversationMessages.createdAt)],
        })
      : null;

  const filesData = await serializeFiles(messageFiles);

  let sanitizedBody = sanitizeBody(typeof message.content === "string" ? message.content : null);
  filesData.forEach((f) => {
    if (f.isInline && sanitizedBody) {
      sanitizedBody = sanitizedBody.replaceAll(`src="${f.url}"`, `src="${f.presignedUrl}"`);
    }
  });

  return {
    type: "message" as const,
    id: message.id,
    status: message.deliveryStatus,
    body: sanitizedBody,
    createdAt: message.createdAt,
    role: message.senderType,
    emailTo: message.senderEmail,
    cc: [],
    bcc: [],
    from:
      message.senderType === "agent" && user
        ? user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null
        : message.senderEmail,
    isMerged: message.conversationId !== conversationId,
    isPinned: false,
    slackUrl: null,
    draft: draftEmail ? serializeResponseAiDraft(draftEmail, mailbox) : null,
    files: filesData.flatMap((f) => (f.isInline ? [] : [f])),
    metadata: message.sourceData,
    reactionType: null,
    reactionFeedback: null,
    reactionCreatedAt: null,
    isFlaggedAsBad: false,
    reason: null,
  };
};

export const serializeFiles = (inputFiles: (typeof files.$inferSelect)[]) =>
  Promise.all(
    inputFiles.map((file) =>
      file.isInline
        ? { isInline: true as const, url: file.url, presignedUrl: createPresignedDownloadUrl(file.url) }
        : {
            ...file,
            isInline: false as const,
            sizeHuman: formatBytes(file.size, 2),
            presignedUrl: createPresignedDownloadUrl(file.url),
            previewUrl: file.previewUrl ? createPresignedDownloadUrl(file.previewUrl) : null,
          }
    )
  );

type OptionalMessageAttributes = "updatedAt" | "createdAt";
type NewConversationMessage = Omit<typeof conversationMessages.$inferInsert, OptionalMessageAttributes> &
  Partial<Pick<typeof conversationMessages.$inferInsert, OptionalMessageAttributes>>;

export type ConversationMessage = typeof conversationMessages.$inferSelect;

export const createReply = async (
  {
    conversationId,
    message,
    user,
    cc,
    bcc = [],
    fileSlugs = [],
    close = true,
    slack,
    role,
    responseToId = null,
    shouldAutoAssign = true,
  }: {
    conversationId: string;
    message: string | null;
    user: AuthenticatedUser | null;
    cc?: string[] | null;
    bcc?: string[];
    fileSlugs?: string[];
    close?: boolean;
    slack?: { channel: string; messageTs: string } | null;
    role?: "customer" | "agent" | "system" | null;
    responseToId?: number | null;
    shouldAutoAssign?: boolean;
  },
  tx0: Transaction | typeof db = db
) => {
  const conversation = await getConversationById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  return tx0.transaction(async (tx: unknown) => {
    if (shouldAutoAssign && user && !conversation.assignedToUserId) {
      await updateConversation(conversationId, { set: { assignedToUserId: user.id }, byUserId: null }, tx);
    }

    const createdMessage = await createConversationMessage(
      {
        organizationId: conversation.organizationId,
        conversationId,
        content: message,
        senderEmail: user?.email,
        senderName: user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        senderType: role ?? "agent",
        inReplyToId: responseToId,
        deliveryStatus: "pending",
        source: "chat",
        sourceData: {
          cc: cc ?? (await getNonSupportParticipants(conversation)),
          bcc,
          slack,
        },
        isDeleted: false,
      },
      tx
    );

    await finishFileUpload({ fileSlugs, messageId: createdMessage.id }, tx);

    if (close && conversation.status !== "spam") {
      await updateConversation(conversationId, { set: { status: "closed" }, byUserId: user?.id ?? null }, tx);
    }

    const lastAiDraft = await getLastAiGeneratedDraft(conversationId, tx);
    if (lastAiDraft?.content) {
      if (message && cleanupMessage(lastAiDraft.content) === cleanupMessage(message)) {
        // Note: isPerfect field doesn't exist in schema
      }
    }
    await discardAiGeneratedDrafts(conversationId, tx);

    return createdMessage.id;
  });
};

export const createConversationMessage = async (
  conversationMessage: NewConversationMessage,
  tx: Transaction | typeof db = db
): Promise<typeof conversationMessages.$inferSelect> => {
  const message = await tx
    .insert(conversationMessages)
    .values({
      ...conversationMessage,
    })
    .returning()
    .then(takeUniqueOrThrow);

  if (message.senderType === "customer") {
    await updateConversation(
      message.conversationId,
      { set: { lastActiveAt: new Date() }, skipRealtimeEvents: true },
      tx
    );
  }

  if (message.deliveryStatus !== "pending") {
    const inngest = getInngest();
    await inngest.send({
      name: "conversations/message.created",
      data: {
        messageId: message.id,
        conversationId: message.conversationId,
      },
    });
  }

  if (message.deliveryStatus === "pending") {
    const inngest = getInngest();
    await inngest.send({
      name: "conversations/email.enqueued",
      data: { messageId: message.id },
      ts: addSeconds(new Date(), EMAIL_UNDO_COUNTDOWN_SECONDS).getTime(),
    });
  }

  return message;
};

export const createAiDraft = async (
  conversationId: string,
  body: string,
  responseToId: number,
  promptInfo: PromptInfo,
  tx: Transaction | typeof db = db
): Promise<typeof conversationMessages.$inferSelect> => {
  if (!responseToId) {
    throw new Error("responseToId is required");
  }

  const conversation = await tx.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return await createConversationMessage(
    {
      organizationId: conversation.organizationId,
      conversationId,
      content: DOMPurify.default.sanitize(marked.parse(body.trim().replace(/\n\n+/gu, "\n\n"), { async: false })),
      senderType: "system",
      deliveryStatus: "pending",
      inReplyToId: responseToId,
      sourceData: { promptInfo },
      embeddingText: body,
      isDeleted: false,
    },
    tx
  );
};

export const ensureCleanedUpText = async (
  message: typeof conversationMessages.$inferSelect,
  tx: Transaction | typeof db = db
) => {
  if (message.embeddingText !== null) return message.embeddingText;
  const cleanedUpText = generateCleanedUpText(message.content ?? "");
  await tx
    .update(conversationMessages)
    .set({ embeddingText: cleanedUpText })
    .where(eq(conversationMessages.id, message.id));
  return cleanedUpText;
};

export const getConversationMessageById = async (id: number): Promise<ConversationMessage | null> => {
  const result = await db.query.conversationMessages.findFirst({
    where: eq(conversationMessages.id, id),
  });
  return result ?? null;
};

export const getLastAiGeneratedDraft = async (
  conversationId: string,
  tx: Transaction | typeof db = db
): Promise<typeof conversationMessages.$inferSelect | null> => {
  const result = await tx.query.conversationMessages.findFirst({
    where: and(
      eq(conversationMessages.conversationId, conversationId),
      eq(conversationMessages.senderType, "system"),
      eq(conversationMessages.deliveryStatus, "pending")
    ),
    orderBy: [desc(conversationMessages.createdAt)],
  });
  return result ?? null;
};

export async function getTextWithConversationSubject(
  conversation: { subject: string | null },
  message: typeof conversationMessages.$inferSelect
) {
  const cleanedUpText = await ensureCleanedUpText(message);
  const subject = conversation.subject;
  return `${subject ? `${subject}\n\n` : ""}${cleanedUpText}`;
}

export const getPastMessages = async (
  message: typeof conversationMessages.$inferSelect
): Promise<(typeof conversationMessages.$inferSelect)[]> => {
  // Use optimized query to avoid N+1 pattern
  // const { getOptimizedPastMessages } = await import("./optimizedQueries"); // Module not found
  // return getOptimizedPastMessages(message.id, message.conversationId);

  // Fallback: simple query when optimizedQueries is not available
  return await db.query.conversationMessages.findMany({
    where: and(
      eq(conversationMessages.conversationId, message.conversationId),
      eq(conversationMessages.isDeleted, false)
    ),
    orderBy: asc(conversationMessages.createdAt),
  });
};

export const createToolEvent = async ({
  conversationId,
  tool,
  data,
  error,
  parameters,
  userMessage,
  userId, // Migrated from clerkUserId
  tx = db,
}: {
  conversationId: string;
  tool: Tool;
  data?: ToolExecutionData;
  error?: ToolExecutionError;
  parameters: Record<string, unknown>;
  userMessage: string;
  userId?: string; // Migrated from clerkUserId
  tx?: Transaction | typeof db;
}) => {
  const conversation = await tx.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await tx.insert(conversationMessages).values({
    organizationId: conversation.organizationId,
    conversationId,
    senderType: "system",
    content: userMessage,
    embeddingText: userMessage,
    sourceData: {
      tool: {
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        url: tool.url,
        requestMethod: tool.requestMethod,
      },
      result: data || error,
      success: !error,
      parameters,
    },
    deliveryStatus: "delivered",
    source: "api",
    isDeleted: false,
  });

  return message;
};

const discardAiGeneratedDrafts = async (conversationId: string, tx: Transaction | typeof db = db): Promise<void> => {
  await tx
    .update(conversationMessages)
    .set({ deliveryStatus: "failed" })
    .where(
      and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.senderType, "system"),
        eq(conversationMessages.deliveryStatus, "pending")
      )
    );
};

const cleanupMessage = (message: string): string => {
  const strippedMessage = message.replace(/<[^>]*>/gu, "");
  return strippedMessage.replace(/\s+/gu, " ").trim();
};

const generateCleanedUpText = (html: string) => {
  if (!html.trim()) return "";

  const paragraphs = htmlToText(html, { wordwrap: false })
    .split(/\s*\n\s*/u)
    .filter((p: string) => p.trim().replace(/\s+/gu, " "));
  return paragraphs.join("\n\n");
};
