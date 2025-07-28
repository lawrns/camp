import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { and, count, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, conversations, files, platformCustomers } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { createConversationEmbedding, PromptTooLongError } from "@/lib/ai/conversationEmbedding";
import { generateDraftResponse } from "@/lib/ai/generateResponse";
import { getUser } from "@/lib/core/auth";
import { serializeConversation, serializeConversationWithMessages, updateConversation } from "@/lib/data/conversation";
import {
  createAiDraft,
  createReply,
  getLastAiGeneratedDraft,
  serializeResponseAiDraft,
} from "@/lib/data/conversationMessage";
import { getOrganizationMembers } from "@/lib/data/organization";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";
import type {
  ConversationContext,
  MailboxContext,
  ConversationSearchInput as SearchInput,
  SearchResult,
} from "@/trpc/types";
import { mailboxProcedure } from "../procedure";
import { filesRouter } from "./files";
import { githubRouter } from "./github";
import { messagesRouter } from "./messages";
import { notesRouter } from "./notes";
import { conversationProcedure } from "./procedure";
import { toolsRouter } from "./tools";

// Additional search-specific types
type ConversationSearchResult = ConversationContext & { similarity?: number };

interface SearchResults {
  results: ConversationSearchResult[];
  nextCursor: string | null;
}

interface SearchReturn {
  list: Promise<SearchResults>;
  where: Record<string, unknown>;
  metadataEnabled: boolean;
}

// Search schema
const searchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["open", "closed", "spam"]).optional(),
  assignedTo: z.string().optional(),
  assignee: z.string().optional(),
  limit: z.number().default(25),
  offset: z.number().default(0),
});

// Simple fallbacks for conversation search
const searchConversations = (mailbox: MailboxContext, input: SearchInput, userId: string): SearchReturn => {
  return {
    list: Promise.resolve({ results: [], nextCursor: null }),
    where: {},
    metadataEnabled: false,
  };
};

const countSearchResults = (where: Record<string, unknown>): Promise<number> => {
  return Promise.resolve(0);
};

// Simple fallback for getGmailSupportEmail
const getGmailSupportEmail = (mailbox: MailboxContext): Promise<string | null> => {
  return Promise.resolve(null); // Fallback: no Gmail support email
};

// Define the findSimilarConversations function
const findSimilarConversations = (
  embedding: number[],
  mailbox: MailboxContext,
  limit: number,
  excludeUid: string
): Promise<ConversationSearchResult[]> => {
  // Simple fallback implementation
  // In a real implementation, this would use vector search
  return Promise.resolve([]);
};

export { conversationProcedure };

export const conversationsRouter = {
  list: mailboxProcedure.input(searchSchema).query(async ({ input, ctx }) => {
    const searchInput = {
      limit: input.limit,
      offset: input.offset,
      ...(input.status ? { status: input.status } : {}),
      ...(input.query ? { query: input.query } : {}),
      ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
      ...(input.assignee ? { assignee: input.assignee } : {}),
    };
    const { list, where, metadataEnabled } = await searchConversations(
      ctx.mailbox as MailboxContext,
      searchInput,
      ctx.user.id
    );

    const [{ results, nextCursor }, total] = await Promise.all([list, countSearchResults(where)]);

    return {
      conversations: results,
      total,
      defaultSort: metadataEnabled ? ("highest_value" as const) : ("oldest" as const),
      hasGmailSupportEmail: !!(await getGmailSupportEmail(ctx.mailbox as MailboxContext)),
      assignedToIds: input.assignee ?? null,
      nextCursor,
    };
  }),

  listWithPreview: mailboxProcedure.input(searchSchema).query(async ({ input, ctx }) => {
    const searchInput = {
      limit: input.limit,
      offset: input.offset,
      ...(input.status ? { status: input.status } : {}),
      ...(input.query ? { query: input.query } : {}),
      ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
      ...(input.assignee ? { assignee: input.assignee } : {}),
    };
    const { list } = await searchConversations(ctx.mailbox as MailboxContext, searchInput, ctx.user.id);
    const { results, nextCursor } = await list;

    const messages = await db
      .select({
        role: conversationMessages.senderType,
        cleanedUpText: conversationMessages.cleanedUpText,
        conversationId: conversationMessages.conversationId,
        createdAt: conversationMessages.createdAt,
      })
      .from(conversationMessages)
      .where(
        inArray(
          conversationMessages.conversationId,
          results.map((c) => c.id)
        )
      )
      .orderBy(desc(conversationMessages.createdAt));

    return {
      conversations: results.map((conversation) => {
        const lastUserMessage = messages.find((m) => m.role === "customer" && m.conversationId === conversation.id);
        const lastStaffMessage = messages.find((m) => m.role === "agent" && m.conversationId === conversation.id);

        return {
          ...conversation,
          userMessageText: lastUserMessage?.cleanedUpText ?? null,
          staffMessageText:
            lastStaffMessage && lastUserMessage && lastStaffMessage.createdAt > lastUserMessage.createdAt
              ? lastStaffMessage.cleanedUpText
              : null,
        };
      }),
      nextCursor,
    };
  }),

  bySlug: mailboxProcedure.input(z.object({ slugs: z.array(z.string()) })).query(async ({ input, ctx }) => {
    const list = await db.query.conversations.findMany({
      where: and(eq(conversations.mailboxId, ctx.mailbox.id), inArray(conversations.uid, input.slugs)),
    });
    return await Promise.all(list.map((c) => serializeConversationWithMessages(ctx.mailbox, c)));
  }),
  get: conversationProcedure.query(async ({ ctx }) => {
    const conversation = ctx.conversation;
    const draft = await getLastAiGeneratedDraft(conversation.id.toString());
    const user = assertDefined(ctx.user);

    return {
      ...(await serializeConversationWithMessages(ctx.mailbox, ctx.dbConversation)),
      draft: draft ? serializeResponseAiDraft(draft, ctx.mailbox) : null,
    };
  }),
  create: mailboxProcedure
    .input(
      z.object({
        conversation: z.object({
          to_email_address: z.string().email(),
          subject: z.string(),
          cc: z.array(z.string().email()),
          bcc: z.array(z.string().email()),
          message: z.string().optional(),
          file_slugs: z.array(z.string()),
          conversation_slug: z.string(),
        }),
      })
    )
    .mutation(async ({ input: { conversation }, ctx }) => {
      const { id: conversationId } = await db
        .insert(conversations)
        .values({
          organizationId: ctx.mailbox.organizationId || ctx.user.organizationId,
          mailboxId: ctx.mailbox.id,
          uid: conversation.conversation_slug,
          subject: conversation.subject,
          customerEmail: conversation.to_email_address,
          source: "gmail",
        })
        .returning({ id: conversations.id })
        .then(takeUniqueOrThrow);

      await createReply({
        conversationId: conversationId.toString(),
        user: assertDefined(ctx.user),
        message: conversation.message?.trim() || null,
        fileSlugs: conversation.file_slugs,
        cc: conversation.cc,
        bcc: conversation.bcc,
      });
    }),
  update: conversationProcedure
    .input(
      z.object({
        status: z.enum(["open", "closed", "spam"]).optional(),
        assignedToId: z.string().nullable().optional(),
        message: z.string().nullable().optional(),
        assignedToAI: z.boolean().optional(),
        ragEnabled: z.boolean().optional(),
        ragProfileId: z.string().uuid().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.assignedToId) {
        const members = await getOrganizationMembers(ctx.user.organizationId);
        if (!members.data.some((m: any) => m.userId === input.assignedToId)) {
          throw new TRPCError({ code: "BAD_REQUEST" });
        }
      }

      await updateConversation(ctx.conversation.id, {
        set: {
          status: input.status,
          assignedToId: input.assignedToId ? Number(input.assignedToId) : null,
          // assignedToAI: input.assignedToAI, // Property not available in schema
          // ragEnabled: input.ragEnabled, // Property not available in schema
          // ragProfileId: input.ragProfileId, // Property not available in schema
        },
        byUserId: ctx.user.id,
        message: input.message ?? null,
      });
    }),
  bulkUpdate: mailboxProcedure
    .input(
      z.object({
        conversationFilter: z.union([z.array(z.number()), searchSchema]),
        status: z.enum(["open", "closed", "spam"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { conversationFilter, status } = input;

      if (Array.isArray(conversationFilter) && conversationFilter.length < 25) {
        for (const conversationId of conversationFilter) {
          await updateConversation(conversationId, { set: { status }, byUserId: ctx.user.id });
        }
        return { updatedImmediately: true };
      }

      await inngest.send({
        name: "conversations/bulk-update",
        data: {
          mailboxId: ctx.mailbox.id,
          userId: ctx.user.id,
          conversationFilter: input.conversationFilter,
          status: input.status,
        },
      });
      return { updatedImmediately: false };
    }),
  refreshDraft: conversationProcedure.mutation(async ({ ctx }) => {
    const lastUserMessage = await db.query.conversationMessages.findFirst({
      where: and(eq(conversationMessages.conversationId, ctx.conversation.id), eq(conversationMessages.role, "user")),
      orderBy: desc(conversationMessages.createdAt),
      with: {
        conversation: {
          columns: {
            subject: true,
          },
        },
      },
    });
    if (!lastUserMessage) throw new TRPCError({ code: "NOT_FOUND", message: "No user message found" });
    const metadata = (lastUserMessage.metadata as Record<string, unknown>) || {};
    const metadataObj = metadata ?? {};

    const oldDraft = await getLastAiGeneratedDraft(ctx.conversation.id.toString());
    const typedLastUserMessage = lastUserMessage as typeof lastUserMessage & {
      conversation: { subject: string | null };
    };
    const { draftResponse, promptInfo } = await generateDraftResponse(
      ctx.mailbox.id,
      typedLastUserMessage,
      metadataObj
    );

    const newDraft = await db.transaction(async (tx) => {
      if (oldDraft) {
        await tx.update(conversationMessages).set({ status: "sent" }).where(eq(conversationMessages.id, oldDraft.id));
      }
      return await createAiDraft(ctx.conversation.id.toString(), draftResponse, lastUserMessage.id, promptInfo, tx);
    });

    return serializeResponseAiDraft(newDraft, ctx.mailbox);
  }),
  undo: conversationProcedure.input(z.object({ emailId: z.number() })).mutation(async ({ ctx, input }) => {
    const email = await db.query.conversationMessages.findFirst({
      where: and(
        eq(conversationMessages.id, input.emailId),
        eq(conversationMessages.conversationId, ctx.conversation.id),
        isNull(conversationMessages.deletedAt),
        eq(conversationMessages.status, "pending")
      ),
    });
    if (!email) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Email not found",
      });
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx.update(conversationMessages).set({ deletedAt: new Date() }).where(eq(conversationMessages.id, email.id)),
        tx.update(conversations).set({ status: "open" }).where(eq(conversations.id, ctx.conversation.id)),
        tx.update(files).set({ messageId: null }).where(eq(files.messageId, email.id)),
      ]);
    });
  }),
  splitMerged: mailboxProcedure.input(z.object({ messageId: z.number() })).mutation(async ({ ctx, input }) => {
    const message = await db.query.conversationMessages.findFirst({
      where: and(eq(conversationMessages.id, input.messageId)),
      with: {
        conversation: true,
      },
    });
    if (!message || (message.conversation as any)?.mailboxId !== ctx.mailbox.id) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
    }
    const conversation = await db
      .update(conversations)
      .set({ status: "open" })
      .where(eq(conversations.id, (message.conversation as any).id))
      .returning()
      .then(takeUniqueOrThrow);
    // Convert conversation to match expected interface
    const serializedConversation = {
      ...conversation,
      organizationId: ctx.mailbox.organizationId,
      customerId: "",
      customerName: null,
      customerAvatar: null,
      assignedOperatorId: conversation.assignedToId,
      lastMessageAt: null,
      tags: [],
      priority: null,
      source: "email" as const,
      githubIssueNumber: null,
      githubIssueUrl: null,
      githubRepoOwner: null,
      githubRepoName: null,
      lastActiveAt: conversation.updatedAt,
      lastRagResponseId: null,
      assignedToUserId: conversation.assignedToId,
    };
    return serializeConversation(ctx.mailbox as any, serializedConversation as any, null);
  }),
  messages: messagesRouter,
  files: filesRouter,
  tools: toolsRouter,
  notes: notesRouter,
  github: githubRouter,

  findSimilar: conversationProcedure.query(async ({ ctx }) => {
    let conversation = ctx.conversation;
    if (!conversation.embedding) {
      try {
        const updatedConv = await createConversationEmbedding(conversation.id.toString());
        conversation = { ...conversation, ...updatedConv };
      } catch (e) {
        if (e instanceof PromptTooLongError) return null;
        throw e;
      }
    }

    const similarConversations = await findSimilarConversations(
      assertDefined(conversation.embedding),
      ctx.mailbox as MailboxContext,
      5,
      conversation.uid
    );

    return {
      conversations: await Promise.all(
        similarConversations.map((conversation) => serializeConversation(ctx.mailbox as any, conversation as any, null))
      ),
      similarityMap: similarConversations.reduce(
        (acc: Record<string, number>, c) => {
          acc[c.uid] = c.similarity ?? 0;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }),
  alertCounts: mailboxProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const [conversation, assignedToMe, vipOverdue] = await Promise.all([
      db.query.conversations.findFirst({
        columns: { id: true },
        where: and(eq(conversations.mailboxId, ctx.mailbox.id)),
      }),
      db.$count(
        conversations,
        and(
          eq(conversations.mailboxId, ctx.mailbox.id),
          eq(conversations.assignedToUserId, ctx.user.id),
          eq(conversations.status, "open")
        )
      ),
      ctx.mailbox.vipThreshold && ctx.mailbox.vipExpectedResponseHours
        ? db
            .select({ count: count() })
            .from(conversations)
            .leftJoin(
              platformCustomers,
              and(
                eq(conversations.mailboxId, platformCustomers.mailboxId),
                eq(conversations.customerEmail, platformCustomers.email)
              )
            )
            .where(
              and(
                eq(conversations.mailboxId, ctx.mailbox.id),
                eq(conversations.status, "open"),
                lt(
                  conversations.lastActiveAt,
                  new Date(now.getTime() - (ctx.mailbox.vipExpectedResponseHours || 0) * 60 * 60 * 1000)
                ),
                sql`${platformCustomers.value} >= ${(ctx.mailbox.vipThreshold || 0) * 100}`
              )
            )
        : [],
    ]);

    return {
      hasConversations: !!conversation,
      assignedToMe,
      vipOverdue: Array.isArray(vipOverdue) ? Number(vipOverdue[0]?.count ?? 0) : 0,
      vipExpectedResponseHours: ctx.mailbox.vipExpectedResponseHours ?? null,
    };
  }),
} satisfies TRPCRouterRecord;
