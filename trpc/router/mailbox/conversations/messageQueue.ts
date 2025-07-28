import { TRPCError } from "@trpc/server";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, conversations } from "@/db/schema";
import { messageQueue, QueueStatus } from "@/db/schema/messageQueue";
import { broadcastToConversation } from "@/lib/realtime/lean-server";
import { assertDefined } from "@/lib/utils/assert";
import { mailboxProcedure } from "../procedure";
import { conversationProcedure } from "./procedure";

// Type definitions for message queue handling
interface QueueStatusResult {
  messageId: number;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
}

interface ExtendedQueueStatusResult extends QueueStatusResult {
  id: number;
}

interface MessageWithConversation {
  id: number;
  messageId: number;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
  message?: {
    conversation?: {
      mailboxId: number;
    };
  };
}

export const messageQueueRouter = {
  // Get queue status for a specific message
  getQueueStatus: conversationProcedure
    .input(
      z.object({
        messageId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { messageId } = input;

      // Verify message belongs to the conversation
      const message = await db.query.conversationMessages.findFirst({
        where: and(
          eq(conversationMessages.id, messageId),
          eq(conversationMessages.conversationId, ctx.conversation.id),
          isNull(conversationMessages.deletedAt)
        ),
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found or not part of this conversation",
        });
      }

      // Get queue status
      const queuedMessage = await db.query.messageQueue.findFirst({
        where: eq(messageQueue.messageId, messageId),
      });

      if (!queuedMessage) {
        return {
          messageId,
          status: "delivered" as QueueStatus, // If no queue record exists, assume it was delivered
          retryCount: 0,
          maxRetries: 0,
          nextRetryAt: null,
          errorMessage: null,
        };
      }

      return {
        messageId: queuedMessage.messageId,
        status: queuedMessage.status,
        retryCount: queuedMessage.retryCount,
        maxRetries: queuedMessage.maxRetries,
        nextRetryAt: queuedMessage.nextRetryAt,
        errorMessage: queuedMessage.errorMessage,
      };
    }),

  // Add a message to the queue or update its status
  updateQueueStatus: conversationProcedure
    .input(
      z.object({
        messageId: z.number(),
        status: z.enum(["queued", "processing", "delivered", "failed"]),
        retryCount: z.number().optional(),
        maxRetries: z.number().optional(),
        nextRetryAt: z.date().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { messageId, status, retryCount, maxRetries, nextRetryAt, errorMessage } = input;

      // Verify message belongs to the conversation
      const message = await db.query.conversationMessages.findFirst({
        where: and(
          eq(conversationMessages.id, messageId),
          eq(conversationMessages.conversationId, ctx.conversation.id),
          isNull(conversationMessages.deletedAt)
        ),
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found or not part of this conversation",
        });
      }

      // Check for existing queue record
      const existingQueue = await db.query.messageQueue.findFirst({
        where: eq(messageQueue.messageId, messageId),
      });

      let updatedQueue;

      if (existingQueue) {
        // Update existing queue record
        updatedQueue = await db
          .update(messageQueue)
          .set({
            status,
            retryCount: retryCount !== undefined ? retryCount : existingQueue.retryCount,
            maxRetries: maxRetries !== undefined ? maxRetries : existingQueue.maxRetries,
            nextRetryAt: nextRetryAt !== undefined ? nextRetryAt : existingQueue.nextRetryAt,
            errorMessage: errorMessage !== undefined ? errorMessage : existingQueue.errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(messageQueue.id, existingQueue.id))
          .returning();
      } else {
        // Create new queue record
        updatedQueue = await db
          .insert(messageQueue)
          .values({
            messageId,
            status,
            retryCount: retryCount !== undefined ? retryCount : 0,
            maxRetries: maxRetries !== undefined ? maxRetries : 5,
            nextRetryAt,
            errorMessage,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      // Broadcast queue status update via Supabase Realtime
      try {
        await broadcastToConversation(ctx.mailbox.organizationId, ctx.conversation.uid, "messageQueueStatus", {
          messageId,
          status,
          retryCount: updatedQueue[0]?.retryCount,
          maxRetries: updatedQueue[0]?.maxRetries,
          nextRetryAt: updatedQueue[0]?.nextRetryAt,
          errorMessage: updatedQueue[0]?.errorMessage,
          timestamp: new Date().toISOString(),
        });
      } catch (realtimeError) {
        // Don't fail the main operation if realtime broadcast fails
      }

      return {
        messageId,
        status: updatedQueue[0]?.status,
        retryCount: updatedQueue[0]?.retryCount,
        maxRetries: updatedQueue[0]?.maxRetries,
        nextRetryAt: updatedQueue[0]?.nextRetryAt,
        errorMessage: updatedQueue[0]?.errorMessage,
      };
    }),

  // Get all messages that need to be retried
  getPendingRetries: mailboxProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit } = input;

      const now = new Date();

      // Find messages that need to be retried
      const messagesToRetry = await db.query.messageQueue.findMany({
        where: and(
          eq(messageQueue.status, "failed"),
          lte(messageQueue.retryCount, messageQueue.maxRetries),
          sql`${messageQueue.nextRetryAt} <= NOW()`
        ),
        with: {
          message: {
            with: {
              conversation: {
                columns: {
                  mailboxId: true,
                },
              },
            },
          },
        },
        limit,
      });

      // Filter for this mailbox's messages
      const mailboxMessages = messagesToRetry.filter(
        (m) => (m as any).message?.conversation?.mailboxId === ctx.mailbox.id
      );

      return mailboxMessages.map(
        (m): ExtendedQueueStatusResult => ({
          id: m.id,
          messageId: m.messageId,
          status: m.status,
          retryCount: m.retryCount,
          maxRetries: m.maxRetries,
          nextRetryAt: m.nextRetryAt,
          errorMessage: m.errorMessage,
        })
      );
    }),

  // Process a specific message to retry sending
  retryMessage: mailboxProcedure
    .input(
      z.object({
        queueId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { queueId } = input;

      // Find the queue record
      const queueRecord = await db.query.messageQueue.findFirst({
        where: eq(messageQueue.id, queueId),
        with: {
          message: {
            with: {
              conversation: true,
            },
          },
        },
      });

      if (!queueRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Queue record not found",
        });
      }

      // Verify the message belongs to this mailbox
      if ((queueRecord.message as any)?.conversation?.mailboxId !== ctx.mailbox.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Message does not belong to this mailbox",
        });
      }

      // Update the queue status to "processing"
      await db
        .update(messageQueue)
        .set({
          status: "processing",
          retryCount: queueRecord.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(messageQueue.id, queueId));

      return {
        queueId,
        messageId: queueRecord.messageId,
        status: "processing" as QueueStatus,
        retryCount: queueRecord.retryCount + 1,
      };
    }),

  // Get message queue statistics for a mailbox
  getQueueStats: mailboxProcedure.query(async ({ ctx }) => {
    const counts = await Promise.all([
      // Get count of queued messages
      db
        .select({ count: sql<number>`count(*)` })
        .from(messageQueue)
        .innerJoin(conversationMessages, eq(messageQueue.messageId, conversationMessages.id))
        .innerJoin(conversations, eq(conversationMessages.conversationId, conversations.id))
        .where(and(eq(conversations.mailboxId, ctx.mailbox.id), eq(messageQueue.status, "queued"))),

      // Get count of processing messages
      db
        .select({ count: sql<number>`count(*)` })
        .from(messageQueue)
        .innerJoin(conversationMessages, eq(messageQueue.messageId, conversationMessages.id))
        .innerJoin(conversations, eq(conversationMessages.conversationId, conversations.id))
        .where(and(eq(conversations.mailboxId, ctx.mailbox.id), eq(messageQueue.status, "processing"))),

      // Get count of failed messages
      db
        .select({ count: sql<number>`count(*)` })
        .from(messageQueue)
        .innerJoin(conversationMessages, eq(messageQueue.messageId, conversationMessages.id))
        .innerJoin(conversations, eq(conversationMessages.conversationId, conversations.id))
        .where(and(eq(conversations.mailboxId, ctx.mailbox.id), eq(messageQueue.status, "failed"))),
    ]);

    return {
      queued: Number(counts[0][0]?.count || 0),
      processing: Number(counts[1][0]?.count || 0),
      failed: Number(counts[2][0]?.count || 0),
    };
  }),
};
