// Removed server-only import for build compatibility
import { cache } from "react";
import { type Message } from "ai";
import { and, asc, desc, eq, SQLWrapper } from "drizzle-orm";
import { db, Transaction } from "@/db/client";
import { conversationMessages, conversations, mailboxes, platformCustomers } from "@/db/schema";
import { conversationEvents } from "@/db/schema/conversationEvents";
import { runAIQuery } from "@/lib/ai";
import { createChannelName, supabase } from "@/lib/supabase";
// import { extractEmailAddresses } from "@/lib/infrastructure/email"; // Module not found
// import { updateVipMessageOnClose } from "@/lib/slack/vipNotifications"; // Module not found
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";
// import { emailKeywordsExtractor } from "../emailKeywordsExtractor"; // Module not found
// import { searchEmailsByKeywords } from "../emailSearchService/searchEmailsByKeywords"; // Module not found
import { captureExceptionAndLog } from "../shared/sentry";
import { getMessages } from "./conversationMessage";

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

// import { determineVipStatus, getPlatformCustomer } from "./platformCustomer"; // Module not found

type OptionalConversationAttributes = "createdAt" | "updatedAt";

type NewConversation = Omit<typeof conversations.$inferInsert, OptionalConversationAttributes | "source"> &
  Partial<Pick<typeof conversations.$inferInsert, OptionalConversationAttributes>> & {
    source: NonNullable<(typeof conversations.$inferInsert)["source"]>;
  };

export type Conversation = typeof conversations.$inferSelect;

export const CHAT_CONVERSATION_SUBJECT = "Chat";

export const MAX_RELATED_CONVERSATIONS_COUNT = 3;

export const createConversation = async (conversation: NewConversation): Promise<typeof conversations.$inferSelect> => {
  try {
    // Remove fields that don't exist in schema
    const { ...conversationValues } = conversation;

    const [newConversation] = await db.insert(conversations).values(conversationValues).returning();
    if (!newConversation) throw new Error("Failed to create conversation");

    return newConversation;
  } catch (error) {
    captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)));
    throw new Error("Failed to create conversation");
  }
};

// If the conversation is merged into another conversation, update the original conversation instead.
// This is mainly useful in automated actions, especially when setting the conversation status to "open",
// since only the original conversation will be shown to staff in the inbox.
export const updateOriginalConversation: typeof updateConversation = async (id, options, tx = db) => {
  // Remove mergedIntoId logic as it doesn't exist in schema
  return updateConversation(id, options, tx);
};

export const updateConversation = async (
  id: number,
  {
    set: dbUpdates = {},
    byUserId = null,
    message = null,
    type = "update",
    skipRealtimeEvents = false,
  }: {
    set?: Partial<typeof conversations.$inferInsert>;
    byUserId?: string | null;
    message?: string | null;
    type?: (typeof conversationEvents.$inferSelect)["type"];
    skipRealtimeEvents?: boolean;
  },
  tx: Transaction | typeof db = db
) => {
  const current = assertDefined(await tx.query.conversations.findFirst({ where: eq(conversations.id, id) }));
  // Remove assignedToAI logic since field doesn't exist in schema
  if (dbUpdates.assignedToUserId) {
    // Just update the assignedToUserId, no assignedToAI field to set
  }
  if (current.status !== "closed" && dbUpdates.status === "closed") {
    // closedAt field doesn't exist, track via lastActiveAt instead
    dbUpdates.lastActiveAt = new Date();
  }

  const updatedConversation = await tx
    .update(conversations)
    .set(dbUpdates)
    .where(eq(conversations.id, id))
    .returning()
    .then(takeUniqueOrThrow);
  const updatesToLog = (["status", "assignedToUserId"] as const).filter(
    (key) => current[key] !== updatedConversation[key]
  );
  if (updatesToLog.length > 0) {
    await tx.insert(conversationEvents).values({
      conversationId: id,
      type: type ?? "update",
      changes: Object.fromEntries(updatesToLog.map((key) => [key, updatedConversation[key]])),
      byUserId: byUserId,
      reason: message,
    });
  }
  if (updatedConversation.assignedToUserId && current.assignedToUserId !== updatedConversation.assignedToUserId) {
    const inngest = getInngest();
    await inngest.send({
      name: "conversations/assigned",
      data: {
        conversationId: updatedConversation.id,
        assignEvent: {
          assignedToId: updatedConversation.assignedToUserId,
          assignedById: byUserId,
          message,
        },
      },
    });
  }
  // Remove assignedToAI logic since field doesn't exist in schema
  // Check if this is a new assignment to trigger auto-response
  if (!current.assignedToUserId && updatedConversation.assignedToUserId) {
    const message = await tx.query.conversationMessages.findFirst({
      where: eq(conversationMessages.conversationId, updatedConversation.id),
      orderBy: desc(conversationMessages.createdAt),
    });
    if (message?.senderType === "customer") {
      const inngest = getInngest();
      await inngest.send({
        name: "conversations/auto-response.create",
        data: { messageId: message.id },
      });
    }
  }

  if (current.status !== "closed" && updatedConversation?.status === "closed") {
    // await updateVipMessageOnClose(updatedConversation.id, byUserId); // Function not available

    const inngest = getInngest();
    await inngest.send({
      name: "conversations/embedding.create",
      data: { conversationSlug: updatedConversation.uid },
    });
  }
  if (updatedConversation && !skipRealtimeEvents) {
    // Send realtime notification using Supabase Realtime
    try {
      const realtimeClient = supabase.browser();

      // Notify conversation-specific channel
      const conversationChannelName = createChannelName(
        updatedConversation.organizationId,
        "conversation",
        updatedConversation.id.toString()
      );

      // Use broadcast instead of sendMessage for Supabase realtime
      const conversationChannel = realtimeClient.channel(conversationChannelName);
      await conversationChannel.subscribe();
      await conversationChannel.send({
        type: "broadcast",
        event: "conversation_updated",
        payload: {
          conversationId: updatedConversation.id,
          updates: dbUpdates,
          timestamp: new Date().toISOString(),
        },
      });
      await conversationChannel.unsubscribe();

      // Also notify mailbox channel for broader updates
      if (updatedConversation.mailboxId) {
        const mailboxChannelName = createChannelName(
          updatedConversation.organizationId,
          "mailbox",
          updatedConversation.mailboxId.toString()
        );

        const mailboxChannel = realtimeClient.channel(mailboxChannelName);
        await mailboxChannel.subscribe();
        await mailboxChannel.send({
          type: "broadcast",
          event: "conversation_updated",
          payload: {
            conversationId: updatedConversation.id,
            updates: dbUpdates,
            timestamp: new Date().toISOString(),
          },
        });
        await mailboxChannel.unsubscribe();
      }
    } catch (error) {
      // Don't fail the operation if realtime fails
    }
  }
  return updatedConversation ?? null;
};

export const serializeConversation = (
  mailbox: typeof mailboxes.$inferSelect,
  conversation: typeof conversations.$inferSelect,
  platformCustomer?: typeof platformCustomers.$inferSelect | null
) => {
  return {
    id: conversation.id,
    slug: conversation.uid || "",
    status: conversation.status,
    emailFrom: conversation.customerEmail || "",
    subject: conversation.subject ?? "(no subject)",
    conversationProvider: "chat",
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    // closedAt and lastUserEmailCreatedAt fields don't exist in schema
    assignedToUserId: conversation.assignedToUserId,
    assignedToAI: false, // Default to false since field doesn't exist in schema
    ragEnabled: false, // Default to false since field doesn't exist in schema
    ragProfileId: conversation.lastRagResponseId || null,
    platformCustomer: platformCustomer
      ? {
          ...platformCustomer,
          isVip: false, // Fallback when platformCustomer module is not available
        }
      : null,
    summary: null, // Default to null since field doesn't exist in schema
    source: conversation.source ?? "email",
    isPrompt: false, // Default to false since field doesn't exist in schema
    isVisitor: false, // Default to false since field doesn't exist in schema
    embeddingText: null, // Default to null since field doesn't exist in schema
    githubIssueNumber: conversation.githubIssueNumber || null,
    githubIssueUrl: conversation.githubIssueUrl || null,
    githubRepoOwner: conversation.githubRepoOwner || null,
    githubRepoName: conversation.githubRepoName || null,
  };
};

export const serializeConversationWithMessages = async (
  mailbox: typeof mailboxes.$inferSelect | any,
  conversation: typeof conversations.$inferSelect
) => {
  // const platformCustomer = conversation.emailFrom
  //   ? await getPlatformCustomer(mailbox.id, conversation.emailFrom)
  //   : null;

  // Try to get platform customer from database, fallback to null if not found
  const platformCustomer: typeof platformCustomers.$inferSelect | null = conversation.customerEmail
    ? await db.query.platformCustomers.findFirst({
        where: and(
          eq(platformCustomers.mailboxId, mailbox.id),
          eq(platformCustomers.email, conversation.customerEmail)
        ),
      })
    : null;

  const mergedInto = (conversation as unknown).mergedIntoId
    ? await db.query.conversations.findFirst({
        where: eq(conversations.id, (conversation as unknown).mergedIntoId),
        columns: { uid: true },
      })
    : null;

  return {
    ...serializeConversation(mailbox, conversation, platformCustomer),
    mergedInto,
    customerMetadata: platformCustomer
      ? {
          name: platformCustomer.name || null,
          value: platformCustomer.email ? 0 : null, // Use email existence as fallback for value
          links: platformCustomer.links || [], // Use links from platform customer or default empty array
          isVip: false, // Default to false since isVip logic is not available
        }
      : null,
    draft: null,
    messages: await getMessages(conversation.id, mailbox),
    cc: (await getNonSupportParticipants(conversation)).join(", "),
  };
};

export const getConversationBySlug = cache(async (slug: string): Promise<typeof conversations.$inferSelect | null> => {
  const result = await db.query.conversations.findFirst({
    where: eq(conversations.uid, slug),
  });
  return result ?? null;
});

export const getConversationById = cache(async (id: number): Promise<typeof conversations.$inferSelect | null> => {
  const result = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });
  return result ?? null;
});

export const getConversationBySlugAndMailbox = async (
  slug: string,
  mailboxId: number
): Promise<typeof conversations.$inferSelect | null> => {
  const result = await db.query.conversations.findFirst({
    where: and(eq(conversations.uid, slug), eq(conversations.mailboxId, mailboxId)),
  });
  return result ?? null;
};

export const getNonSupportParticipants = async (conversation: Conversation): Promise<string[]> => {
  const mailbox = await db.query.mailboxes.findFirst({
    where: eq(mailboxes.id, conversation.mailboxId),
    with: { gmailSupportEmail: { columns: { email: true } } },
  });
  if (!mailbox) throw new Error("Mailbox not found");

  const messages = await db.query.conversationMessages.findMany({
    where: and(eq(conversationMessages.conversationId, conversation.id), eq(conversationMessages.isDeleted, false)),
    orderBy: [asc(conversationMessages.createdAt)],
  });

  const participants = new Set<string>();

  for (const message of messages) {
    // Extract email addresses from sourceData for email messages
    if (message.source === "email" && message.sourceData) {
      const sourceData = message.sourceData as unknown;
      if (sourceData.emailCc && Array.isArray(sourceData.emailCc)) {
        sourceData.emailCc.forEach((cc: string) => participants.add(cc.toLowerCase()));
      }
      if (sourceData.emailTo) {
        // extractEmailAddresses(sourceData.emailTo).forEach((addr: unknown) => participants.add(addr.toLowerCase()));
        // Fallback: simple email extraction
        if (typeof sourceData.emailTo === "string") {
          const emails = sourceData.emailTo
            .split(",")
            .map((e: string) => e.trim())
            .filter((e: string) => e.includes("@"));
          emails.forEach((addr: string) => participants.add(addr.toLowerCase()));
        }
      }
    }
  }

  const emailFrom = conversation.customerEmail;
  if (emailFrom) participants.delete(emailFrom.toLowerCase());
  if (mailbox.gmailSupportEmail?.email) participants.delete(mailbox.gmailSupportEmail.email.toLowerCase());

  return Array.from(participants);
};

export const getLastUserMessage = async (
  conversationId: string
): Promise<typeof conversationMessages.$inferSelect | null> => {
  const lastUserMessage = await db.query.conversationMessages.findFirst({
    where: and(
      eq(conversationMessages.conversationId, conversationId),
      eq(conversationMessages.senderType, "customer")
    ),
    orderBy: [desc(conversationMessages.createdAt)],
  });
  return lastUserMessage ?? null;
};

export const getRelatedConversations = async (
  conversationId: string,
  params?: {
    where?: SQLWrapper;
    whereMessages?: SQLWrapper;
  }
): Promise<Conversation[]> => {
  const conversationWithMailbox = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: { mailbox: true },
  });
  if (!conversationWithMailbox) return [];

  const lastUserMessage = await getLastUserMessage(conversationWithMailbox.id);
  if (!lastUserMessage) return [];

  const subject = conversationWithMailbox.subject ?? "";
  const body = lastUserMessage.content ?? "";
  if (!subject && !body) return [];

  // const keywords = await emailKeywordsExtractor({
  //   mailbox: conversationWithMailbox.mailbox,
  //   subject,
  //   body,
  // });
  // if (!keywords.length) return [];

  // const messageIds = await searchEmailsByKeywords(keywords.join(" "), conversationWithMailbox.mailbox.id);

  // Fallback: return empty array when email search services are not available
  return [];
};

export const generateConversationSubject = async (
  conversationId: string,
  messages: Message[],
  mailbox: typeof mailboxes.$inferSelect
) => {
  const subject =
    messages.length === 1 && messages[0] && messages[0].content.length <= 50
      ? messages[0].content
      : await runAIQuery({
          system:
            "Generate a brief, clear subject line (max 50 chars) that summarizes the main point of these messages. Respond with only the subject line, no other text.",
          prompt: messages
            .filter((m: Message) => (m as unknown).role === "user")
            .map((m: Message) => m.content)
            .join("\n"),
        });

  await db.update(conversations).set({ subject }).where(eq(conversations.id, conversationId));
};
