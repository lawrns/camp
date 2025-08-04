import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { and, eq, exists, gte, inArray, isNotNull, isNull, not, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, conversations } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { getUser } from "@/lib/core/auth";
// import { createConversationEmbedding } from "@/lib/ai/conversationEmbedding"; // Module not found
import { createReply, sanitizeBody } from "@/lib/data/conversationMessage";
// import { findSimilarConversations } from "@/lib/data/retrieval"; // Module not found
import { assertDefined } from "@/lib/utils/assert";
import { mailboxProcedure } from "../../mailbox/procedure";
import { conversationProcedure } from "./procedure";

// Type definitions for messages

interface PreviousReply {
  id: string;
  content: string;
  cleanedUpText: string;
  timestamp: string;
  conversationSubject: string | null;
  similarity: number;
}

interface StatusByTypeResult {
  type: "open" | "ai" | "human";
  count: number;
}

interface ReactionCountResult {
  timePeriod: string;
  reactionType: string | null;
  count: number;
}

export const messagesRouter = {
  previousReplies: conversationProcedure.query(async ({ ctx }) => {
    let conversation = ctx.conversation;
    // Note: createConversationEmbedding and findSimilarConversations are not available
    // For now, return empty array
    const similarConversations: Array<{ id: number; similarity: number }> = [];
    // if (!conversation.embeddingText) {
    //   conversation = await createConversationEmbedding(conversation.id);
    // }

    // const similarConversations = await findSimilarConversations(
    //   assertDefined(conversation.embedding),
    //   ctx.mailbox,
    //   5,
    //   conversation.slug
    // );

    if (!similarConversations?.length) return [];

    const replies = await db.query.conversationMessages.findMany({
      where: and(
        eq(conversationMessages.senderType, "agent"),
        eq(conversationMessages.deliveryStatus, "sent"),
        eq(conversationMessages.isDeleted, false),
        inArray(
          conversationMessages.conversationId,
          similarConversations.map((c) => c.id)
        )
      ),
      orderBy: [sql`${conversationMessages.createdAt} desc`],
      limit: 10,
      with: {
        conversation: {
          columns: {
            subject: true,
          },
        },
      },
    });

    return Promise.all(
      replies.map(
        async (reply): Promise<PreviousReply> => ({
          id: reply.id.toString(),
          content: (await sanitizeBody(reply.content ?? "")) || "",
          cleanedUpText: reply.content ?? "",
          timestamp: reply.createdAt.toISOString(),
          conversationSubject: (reply.conversation as unknown)?.subject ?? null,
          similarity: similarConversations.find((c) => c.id === reply.conversationId)?.similarity ?? 0,
        })
      )
    );
  }),
  reply: conversationProcedure
    .input(
      z.object({
        message: z.string(),
        fileSlugs: z.array(z.string()),
        cc: z.array(z.string()),
        bcc: z.array(z.string()),
        shouldAutoAssign: z.boolean().optional().default(true),
        shouldClose: z.boolean().optional().default(true),
        responseToId: z.number().nullable(),
      })
    )
    .mutation(async ({ input: { message, fileSlugs, cc, bcc, shouldAutoAssign, shouldClose, responseToId }, ctx }) => {
      // Use the authenticated user from the context
      const user = {
        id: ctx.user.id,
        email: ctx.user.email,
        organizationId: ctx.user.organizationId,
        organizationRole: ctx.user.organizationRole,
      };

      const id = await createReply({
        conversationId: ctx.conversation.id,
        user: user,
        message,
        fileSlugs,
        // TODO Add proper email validation on the frontend and backend using Zod,
        // similar to how the new conversation modal does it.
        cc: cc.filter(Boolean),
        bcc: bcc.filter(Boolean),
        shouldAutoAssign,
        close: shouldClose,
        responseToId,
      });
      return { id };
    }),
  flagAsBad: conversationProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, reason } = input;

      const updatedMessage = await db
        .update(conversationMessages)
        .set({
          // Note: Using isDeleted as a flag instead of isFlaggedAsBad
          isDeleted: true,
          // Note: Using embeddingText to store reason temporarily
          embeddingText: reason || null,
        })
        .where(
          and(
            eq(conversationMessages.id, id),
            eq(conversationMessages.conversationId, ctx.conversation.id),
            eq(conversationMessages.senderType, "system"),
            eq(conversationMessages.isDeleted, false)
          )
        )
        .returning({ id: conversationMessages.id });

      if (updatedMessage.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found or not part of this conversation",
        });
      }

      await inngest.send({
        name: "messages/flagged.bad",
        data: { messageId: id, reason: reason || null },
      });
    }),
  reactionCount: mailboxProcedure
    .input(
      z.object({
        startDate: z.date(),
        period: z.enum(["hourly", "daily", "monthly"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const groupByFormat = (() => {
        switch (input.period) {
          case "hourly":
            return "YYYY-MM-DD HH24:00:00";
          case "daily":
            return "YYYY-MM-DD";
          case "monthly":
            return "YYYY-MM";
        }
      })();

      const data = await db
        .select({
          timePeriod: sql<string>`to_char(${conversationMessages.createdAt}, ${groupByFormat}) AS period`,
          reactionType: sql<string>`'default'`,
          count: sql<number | string>`count(*)`,
        })
        .from(conversationMessages)
        .innerJoin(conversations, eq(conversations.id, conversationMessages.conversationId))
        .where(
          and(
            gte(conversationMessages.createdAt, input.startDate),
            isNotNull(conversationMessages.metadata),
            isNull(conversationMessages.deletedAt),
            eq(conversations.mailboxId, ctx.mailbox.id)
          )
        )
        .groupBy(sql`period`, conversationMessages.metadata);

      return data.map(({ count, ...rest }) => ({
        ...rest,
        count: Number(count),
      }));
    }),
  statusByTypeCount: mailboxProcedure
    .input(
      z.object({
        startDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Using a try/catch to handle potential errors and provide better debugging
        const results = await Promise.all([
          // Count open conversations
          db
            .select({ count: sql<number>`count(*)` })
            .from(conversations)
            .where(
              and(
                eq(conversations.mailboxId, ctx.mailbox.id),
                eq(conversations.status, "open"),
                gte(conversations.createdAt, input.startDate)
              )
            )
            .then((result) => ({ type: "open" as const, count: Number(result[0]?.count || 0) })),

          // Count AI-only resolved conversations
          db
            .select({ count: sql<number>`count(*)` })
            .from(conversations)
            .where(
              and(
                eq(conversations.mailboxId, ctx.mailbox.id),
                eq(conversations.status, "closed"),
                gte(conversations.createdAt, input.startDate),
                exists(
                  db
                    .select({ one: sql<number>`1` })
                    .from(conversationMessages)
                    .where(
                      and(
                        eq(conversationMessages.conversationId, conversations.id),
                        eq(conversationMessages.senderType, "system"),
                        eq(conversationMessages.status, "sent"),
                        isNull(conversationMessages.deletedAt)
                      )
                    )
                ),
                not(
                  exists(
                    db
                      .select({ one: sql<number>`1` })
                      .from(conversationMessages)
                      .where(
                        and(
                          eq(conversationMessages.conversationId, conversations.id),
                          eq(conversationMessages.senderType, "agent"),
                          isNull(conversationMessages.deletedAt)
                        )
                      )
                  )
                )
              )
            )
            .then((result) => ({ type: "ai" as const, count: Number(result[0]?.count || 0) })),

          // Count human-resolved conversations
          db
            .select({ count: sql<number>`count(*)` })
            .from(conversations)
            .where(
              and(
                eq(conversations.mailboxId, ctx.mailbox.id),
                eq(conversations.status, "closed"),
                gte(conversations.createdAt, input.startDate),
                exists(
                  db
                    .select({ one: sql<number>`1` })
                    .from(conversationMessages)
                    .where(
                      and(
                        eq(conversationMessages.conversationId, conversations.id),
                        eq(conversationMessages.senderType, "agent"),
                        isNull(conversationMessages.deletedAt)
                      )
                    )
                )
              )
            )
            .then((result) => ({ type: "human" as const, count: Number(result[0]?.count || 0) })),
        ]);

        return results;
      } catch (error) {
        console.error("Error in statusByTypeCount:", error);
        // Return zero counts in case of error to prevent 500 response
        return [
          { type: "open" as const, count: 0 },
          { type: "ai" as const, count: 0 },
          { type: "human" as const, count: 0 },
        ] as StatusByTypeResult[];
      }
    }),
} satisfies TRPCRouterRecord;
