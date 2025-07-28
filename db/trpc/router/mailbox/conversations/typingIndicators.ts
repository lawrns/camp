import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversations } from "@/db/schema";
import { SenderType, typingIndicators } from "@/db/schema/typingIndicators";
import { getUser } from "@/lib/core/auth";
import { broadcastToConversation } from "@/lib/realtime/lean-server";
import { assertDefined } from "@/lib/utils/assert";
import { conversationProcedure } from "./procedure";

// Type definitions for typing indicators
interface TypingIndicatorResult {
  userId: string;
  senderType: SenderType;
  content: string | null;
  updatedAt: Date;
}

interface TypingStatusUpdate {
  userId: string;
  senderType: SenderType;
  isTyping: boolean;
  content: string | null;
  updatedAt: Date;
}

export const typingIndicatorsRouter = {
  // Get all active typing indicators for a conversation
  getTypingUsers: conversationProcedure.query(async ({ ctx }) => {
    const activeIndicators = await db.query.typingIndicators.findMany({
      where: and(
        eq(typingIndicators.conversationId, ctx.conversation.id),
        eq(typingIndicators.isTyping, true),
        sql`${typingIndicators.updatedAt} > NOW() - INTERVAL '30 seconds'` // Only get recent typing indicators
      ),
    });

    return activeIndicators.map(
      (indicator): TypingIndicatorResult => ({
        userId: indicator.userId,
        senderType: indicator.senderType,
        content: indicator.content,
        updatedAt: indicator.updatedAt,
      })
    );
  }),

  // Set typing indicator status for the current user
  setTypingStatus: conversationProcedure
    .input(
      z.object({
        isTyping: z.boolean(),
        content: z.string().optional(),
        senderType: z.enum(["agent", "visitor", "system", "bot"]).default("agent"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { isTyping, content, senderType } = input;
      const user = ctx.user;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Check for existing typing indicator
      const existingIndicator = await db.query.typingIndicators.findFirst({
        where: and(eq(typingIndicators.conversationId, ctx.conversation.id), eq(typingIndicators.userId, user.id)),
      });

      let updatedIndicator;

      if (existingIndicator) {
        // Update existing indicator
        updatedIndicator = await db
          .update(typingIndicators)
          .set({
            isTyping,
            content: content || null,
            senderType,
            updatedAt: new Date(),
          })
          .where(eq(typingIndicators.id, existingIndicator.id))
          .returning();
      } else {
        // Create new indicator
        updatedIndicator = await db
          .insert(typingIndicators)
          .values({
            conversationId: ctx.conversation.id,
            userId: user.id,
            senderType,
            isTyping,
            content: content || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      // Broadcast typing indicator via Supabase Realtime
      try {
        await broadcastToConversation(ctx.mailbox.organizationId, ctx.conversation.uid, "typingIndicator", {
          userId: user.id,
          senderType,
          isTyping,
          content: content || null,
          updatedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (realtimeError) {
        // Don't fail the main operation if realtime broadcast fails
      }

      return {
        userId: user.id,
        senderType,
        isTyping,
        content: content || null,
        updatedAt: updatedIndicator[0]?.updatedAt || new Date(),
      } as TypingStatusUpdate;
    }),

  // Set typing indicator for a non-user entity (like AI assistant)
  setSystemTypingStatus: conversationProcedure
    .input(
      z.object({
        userId: z.string(),
        isTyping: z.boolean(),
        content: z.string().optional(),
        senderType: z.enum(["agent", "visitor", "system", "bot"]).default("system"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, isTyping, content, senderType } = input;

      // Check for existing typing indicator
      const existingIndicator = await db.query.typingIndicators.findFirst({
        where: and(eq(typingIndicators.conversationId, ctx.conversation.id), eq(typingIndicators.userId, userId)),
      });

      let updatedIndicator;

      if (existingIndicator) {
        // Update existing indicator
        updatedIndicator = await db
          .update(typingIndicators)
          .set({
            isTyping,
            content: content || null,
            senderType,
            updatedAt: new Date(),
          })
          .where(eq(typingIndicators.id, existingIndicator.id))
          .returning();
      } else {
        // Create new indicator
        updatedIndicator = await db
          .insert(typingIndicators)
          .values({
            conversationId: ctx.conversation.id,
            userId,
            senderType,
            isTyping,
            content: content || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      // Broadcast system typing indicator via Supabase Realtime
      try {
        await broadcastToConversation(ctx.mailbox.organizationId, ctx.conversation.uid, "typingIndicator", {
          userId,
          senderType,
          isTyping,
          content: content || null,
          updatedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (realtimeError) {
        // Don't fail the main operation if realtime broadcast fails
      }

      return {
        userId,
        senderType,
        isTyping,
        content: content || null,
        updatedAt: updatedIndicator[0]?.updatedAt || new Date(),
      } as TypingStatusUpdate;
    }),

  // Clear stale typing indicators manually
  clearStaleIndicators: conversationProcedure.mutation(async ({ ctx }) => {
    const clearedCount = await db
      .delete(typingIndicators)
      .where(
        and(
          eq(typingIndicators.conversationId, ctx.conversation.id),
          eq(typingIndicators.isTyping, true),
          sql`${typingIndicators.updatedAt} < NOW() - INTERVAL '30 seconds'`
        )
      )
      .returning({ id: typingIndicators.id });

    return {
      count: clearedCount.length,
    };
  }),
};
