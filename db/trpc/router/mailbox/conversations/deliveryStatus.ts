import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages } from "@/db/schema";
import { DeliveryStatus, messageDeliveryStatus } from "@/db/schema/messageDeliveryStatus";
import { messageReadStatus } from "@/db/schema/messageReadStatus";
import { getUser } from "@/lib/core/auth";
import { broadcastToConversation } from "@/lib/realtime/lean-server";
import { assertDefined } from "@/lib/utils/assert";
import { conversationProcedure } from "./procedure";

// Type definitions for delivery status handling
interface DeliveryStatusUpdate {
  messageId: number;
  status: DeliveryStatus;
  errorMessage?: string | null;
  updatedAt?: Date | null;
}

interface ReadReceiptRecord {
  userId: string;
  readAt: Date;
}

interface BulkStatusResult {
  messageId: number;
  status: DeliveryStatus;
  errorMessage: string | null;
  readBy: ReadReceiptRecord[];
  updatedAt: Date | null;
}

export const deliveryStatusRouter = {
  // Get message delivery status for a specific message
  getStatus: conversationProcedure
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

      // Get delivery status
      const status = await db.query.messageDeliveryStatus.findFirst({
        where: eq(messageDeliveryStatus.messageId, messageId),
      });

      // Get read receipts
      const readReceipts = await db.query.messageReadStatus.findMany({
        where: eq(messageReadStatus.messageId, messageId),
      });

      return {
        messageId,
        status: status?.status || "sent", // Default to sent if no status record exists
        errorMessage: status?.errorMessage || null,
        readBy: readReceipts.map((receipt) => ({
          userId: receipt.userId,
          readAt: receipt.readAt,
        })),
        updatedAt: status?.updatedAt || null,
      };
    }),

  // Get delivery status for multiple messages
  getBulkStatus: conversationProcedure
    .input(
      z.object({
        messageIds: z.array(z.number()),
      })
    )
    .query(async ({ input, ctx }) => {
      const { messageIds } = input;

      // Verify messages belong to the conversation
      const messages = await db.query.conversationMessages.findMany({
        where: and(
          inArray(conversationMessages.id, messageIds),
          eq(conversationMessages.conversationId, ctx.conversation.id),
          isNull(conversationMessages.deletedAt)
        ),
      });

      if (messages.length !== messageIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more messages not found or not part of this conversation",
        });
      }

      // Get delivery statuses
      const statuses = await db.query.messageDeliveryStatus.findMany({
        where: inArray(messageDeliveryStatus.messageId, messageIds),
      });

      // Get read receipts
      const readReceipts = await db.query.messageReadStatus.findMany({
        where: inArray(messageReadStatus.messageId, messageIds),
      });

      // Group read receipts by message ID
      const readReceiptsByMessageId = readReceipts.reduce(
        (acc, receipt) => {
          if (!acc[receipt.messageId]) {
            acc[receipt.messageId] = [];
          }
          acc[receipt.messageId]?.push({
            userId: receipt.userId,
            readAt: receipt.readAt,
          });
          return acc;
        },
        {} as Record<number, ReadReceiptRecord[]>
      );

      // Create a map of status records by message ID
      const statusesByMessageId = statuses.reduce(
        (acc, status) => {
          acc[status.messageId] = status;
          return acc;
        },
        {} as Record<number, (typeof statuses)[0]>
      );

      return messageIds.map(
        (messageId): BulkStatusResult => ({
          messageId,
          status: statusesByMessageId[messageId]?.status || "sent",
          errorMessage: statusesByMessageId[messageId]?.errorMessage || null,
          readBy: readReceiptsByMessageId[messageId] || [],
          updatedAt: statusesByMessageId[messageId]?.updatedAt || null,
        })
      );
    }),

  // Update message delivery status
  updateStatus: conversationProcedure
    .input(
      z.object({
        messageId: z.number(),
        status: z.enum(["sending", "sent", "delivered", "read", "error"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { messageId, status, errorMessage } = input;

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

      // Check for existing status record
      const existingStatus = await db.query.messageDeliveryStatus.findFirst({
        where: eq(messageDeliveryStatus.messageId, messageId),
      });

      let updatedStatus;

      if (existingStatus) {
        // Update existing status
        updatedStatus = await db
          .update(messageDeliveryStatus)
          .set({
            status,
            errorMessage: errorMessage || null,
            updatedAt: new Date(),
          })
          .where(eq(messageDeliveryStatus.id, existingStatus.id))
          .returning();
      } else {
        // Create new status
        updatedStatus = await db
          .insert(messageDeliveryStatus)
          .values({
            messageId,
            status,
            errorMessage: errorMessage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      // Map status to database enum values
      const dbStatus =
        status === "error" ? "failed" : status === "sending" ? "pending" : status === "read" ? "delivered" : status;

      // Also update the message's delivery status column
      await db
        .update(conversationMessages)
        .set({
          deliveryStatus: dbStatus as "pending" | "sent" | "delivered" | "failed",
        })
        .where(eq(conversationMessages.id, messageId));

      // Broadcast delivery status via Supabase Realtime
      try {
        await broadcastToConversation(ctx.mailbox.organizationId, ctx.conversation.uid, "messageDeliveryStatus", {
          messageId,
          status,
          errorMessage: errorMessage || null,
          updatedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (realtimeError) {
        // Don't fail the main operation if realtime broadcast fails
      }

      return {
        messageId,
        status: updatedStatus[0]?.status,
        errorMessage: updatedStatus[0]?.errorMessage || null,
        updatedAt: updatedStatus[0]?.updatedAt,
      };
    }),

  // Mark message as read
  markAsRead: conversationProcedure
    .input(
      z.object({
        messageId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { messageId } = input;
      const user = ctx.user;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

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

      // Check if read receipt already exists
      const existingReceipt = await db.query.messageReadStatus.findFirst({
        where: and(eq(messageReadStatus.messageId, messageId), eq(messageReadStatus.userId, user.id)),
      });

      if (!existingReceipt) {
        // Create read receipt
        await db.insert(messageReadStatus).values({
          messageId,
          userId: user.id,
          readAt: new Date(),
        });
      }

      // Update message delivery status to read if not already
      const currentStatus = await db.query.messageDeliveryStatus.findFirst({
        where: eq(messageDeliveryStatus.messageId, messageId),
      });

      if (!currentStatus || currentStatus.status !== "read") {
        // Update to read status - execute the logic directly instead of self-referential call
        const updatedStatus = await db
          .insert(messageDeliveryStatus)
          .values({
            messageId,
            status: "read" as DeliveryStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [messageDeliveryStatus.messageId],
            set: {
              status: "read" as DeliveryStatus,
              updatedAt: new Date(),
            },
          })
          .returning();
      }

      // Broadcast message read status via Supabase Realtime
      try {
        await broadcastToConversation(ctx.mailbox.organizationId, ctx.conversation.uid, "messageRead", {
          messageId,
          userId: user.id,
          readAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (realtimeError) {
        // Don't fail the main operation if realtime broadcast fails
      }

      return {
        messageId,
        userId: user.id,
        readAt: new Date(),
      };
    }),

  // Get all unread messages for the current user
  getUnreadMessages: conversationProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    // Get all messages in conversation
    const messages = await db.query.conversationMessages.findMany({
      where: and(eq(conversationMessages.conversationId, ctx.conversation.id), isNull(conversationMessages.deletedAt)),
      orderBy: [desc(conversationMessages.createdAt)],
    });

    // Get read receipts for current user
    const readReceipts = await db.query.messageReadStatus.findMany({
      where: and(
        inArray(
          messageReadStatus.messageId,
          messages.map((m: unknown) => m.id)
        ),
        eq(messageReadStatus.userId, user.id)
      ),
    });

    // Create a set of read message IDs
    const readMessageIds = new Set(readReceipts.map((r: unknown) => r.messageId));

    // Filter for unread messages
    const unreadMessages = messages.filter((message: unknown) => !readMessageIds.has(message.id));

    return unreadMessages.map((message: unknown) => ({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      createdAt: message.createdAt,
    }));
  }),
};
