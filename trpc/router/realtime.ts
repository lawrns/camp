import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { broadcastToChannel, CHANNEL_PATTERNS, EVENT_TYPES } from "@/lib/realtime/standardized-realtime";

// Input schemas
const typingIndicatorSchema = z.object({
  organizationId: z.string().uuid(),
  conversationId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  isTyping: z.boolean(),
});

const messageUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  conversationId: z.string().uuid(),
  messageId: z.string(),
  content: z.string(),
  userId: z.string(),
  type: z.enum(['message', 'system', 'handoff']).default('message'),
});

const presenceUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string(),
  status: z.enum(['online', 'away', 'offline']),
});

const conversationUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  conversationId: z.string().uuid(),
  status: z.enum(['active', 'closed', 'handoff', 'waiting']),
  assignedAgent: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const realtimeRouter = createTRPCRouter({
  /**
   * Send typing indicator
   */
  sendTypingIndicator: publicProcedure
    .input(typingIndicatorSchema)
    .mutation(async ({ input }) => {
      try {
        const payload = {
          userId: input.userId,
          userName: input.userName,
          isTyping: input.isTyping,
          timestamp: Date.now(),
        };

        await broadcastToChannel(
          CHANNEL_PATTERNS.conversationTyping(input.organizationId, input.conversationId),
          EVENT_TYPES.TYPING_START,
          payload
        );

        return { success: true, timestamp: payload.timestamp };
      } catch (error) {
        console.error('[Realtime] Typing indicator error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send typing indicator',
        });
      }
    }),

  /**
   * Broadcast message update
   */
  broadcastMessage: publicProcedure
    .input(messageUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const payload = {
          conversationId: input.conversationId,
          messageId: input.messageId,
          content: input.content,
          timestamp: Date.now(),
          userId: input.userId,
          type: input.type,
        };

        await broadcastToChannel(
          CHANNEL_PATTERNS.conversation(input.organizationId, input.conversationId),
          EVENT_TYPES.MESSAGE_CREATED,
          payload
        );

        return { success: true, timestamp: payload.timestamp };
      } catch (error) {
        console.error('[Realtime] Message broadcast error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to broadcast message',
        });
      }
    }),

  /**
   * Update agent presence
   */
  updatePresence: publicProcedure
    .input(presenceUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const payload = {
          userId: input.userId,
          status: input.status,
          lastSeen: Date.now(),
        };

        await broadcastToChannel(
          CHANNEL_PATTERNS.agentsPresence(input.organizationId),
          EVENT_TYPES.PRESENCE_UPDATE,
          payload
        );

        return { success: true, timestamp: payload.lastSeen };
      } catch (error) {
        console.error('[Realtime] Presence update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update presence',
        });
      }
    }),

  /**
   * Update conversation status
   */
  updateConversation: publicProcedure
    .input(conversationUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const payload = {
          conversationId: input.conversationId,
          status: input.status,
          assignedAgent: input.assignedAgent,
          priority: input.priority,
          timestamp: Date.now(),
        };

        // Broadcast to both conversation and organization channels using standardized patterns
        await Promise.all([
          broadcastToChannel(
            CHANNEL_PATTERNS.conversation(input.organizationId, input.conversationId),
            EVENT_TYPES.CONVERSATION_UPDATED,
            payload
          ),
          broadcastToChannel(
            CHANNEL_PATTERNS.conversations(input.organizationId),
            EVENT_TYPES.CONVERSATION_UPDATED,
            payload
          ),
        ]);

        return { success: true, timestamp: payload.timestamp };
      } catch (error) {
        console.error('[Realtime] Conversation update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update conversation',
        });
      }
    }),

  /**
   * Get connection status
   */
  getConnectionStatus: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        // This would check the actual connection status in a real implementation
        // For now, return a basic status
        return {
          connected: true,
          organizationId: input.organizationId,
          timestamp: Date.now(),
          channels: {
            organization: `org:${input.organizationId}`,
            conversations: [], // Would list active conversation channels
          },
        };
      } catch (error) {
        console.error('[Realtime] Connection status error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get connection status',
        });
      }
    }),

  /**
   * Ping for connection health check
   */
  ping: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      timestamp: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = Date.now();
      const latency = input.timestamp ? now - input.timestamp : 0;

      return {
        pong: true,
        timestamp: now,
        latency,
        organizationId: input.organizationId,
      };
    }),
});
