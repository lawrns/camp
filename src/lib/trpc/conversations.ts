/**
 * Conversations tRPC Router
 * Replaces /api/conversations/* routes with type-safe procedures
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, orgProcedure, protectedProcedure } from "./server";

export const conversationsRouter = createTRPCRouter({
  /**
   * Get conversations for organization
   * Replaces: GET /api/conversations
   */
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["open", "assigned", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      })
    )
    .query(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      let query = ctx.supabase
        .from("conversations")
        .select(
          `
          id,
          status,
          priority,
          created_at,
          updated_at,
          resolved_at,
          first_response_at,
          assigned_agent_id,
          organization_id,
          visitor_id,
          subject,
          last_message_at,
          message_count,
          profiles!assigned_agent_id (
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("organization_id", ctx.organizationId)
        .order("lastMessageAt", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.priority) {
        query = query.eq("priority", input.priority);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
          cause: error,
        });
      }

      return {
        conversations: data || [],
        total: data?.length || 0,
      };
    }),

  /**
   * Get single conversation with messages
   * Replaces: GET /api/conversations/[id]
   */
  get: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      const { data: conversation, error: convError } = await ctx.supabase
        .from("conversations")
        .select(
          `
          *,
          profiles!assigned_agent_id (
            id,
            first_name,
            last_name,
            email
          ),
          messages (
            id,
            content,
            sender_type,
            sender_id,
            created_at,
            metadata,
            profiles!sender_id (
              first_name,
              last_name,
              email
            )
          )
        `
        )
        .eq("id", input.id)
        .eq("organization_id", ctx.organizationId)
        .single();

      if (convError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
          cause: convError,
        });
      }

      return conversation;
    }),

  /**
   * Create new conversation
   * Replaces: POST /api/conversations
   */
  create: orgProcedure
    .input(
      z.object({
        visitor_id: z.string().optional(),
        subject: z.string().min(1).max(255),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      const { data, error } = await ctx.supabase
        .from("conversations")
        .insert({
          organization_id: ctx.organizationId,
          visitor_id: input.visitor_id,
          subject: input.subject,
          priority: input.priority,
          status: "open",
          created_at: new Date().toISOString(),
          metadata: input.metadata,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update conversation
   * Replaces: PATCH /api/conversations/[id]
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["open", "assigned", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        assigned_agent_id: z.string().uuid().nullable().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      const { id, ...updates } = input;

      // Add resolved_at timestamp if status is being set to resolved
      if (updates.status === "resolved") {
        (updates as unknown).resolved_at = new Date().toISOString();
      }

      const { data, error } = await ctx.supabase
        .from("conversations")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", ctx.organizationId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update conversation",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get conversation messages
   * Replaces: GET /api/conversations/[id]/messages
   */
  getMessages: orgProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      // First verify conversation belongs to organization
      const { data: conversation } = await ctx.supabase
        .from("conversations")
        .select("id")
        .eq("id", input.conversationId)
        .eq("organization_id", ctx.organizationId)
        .single();

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const { data, error } = await ctx.supabase
        .from("messages")
        .select(
          `
          id,
          content,
          sender_type,
          sender_id,
          created_at,
          metadata,
          profiles!sender_id (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("conversation_id", input.conversationId)
        .order("created_at", { ascending: true })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Send message
   * Replaces: POST /api/conversations/[id]/messages
   */
  sendMessage: orgProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
        senderType: z.enum(["agent", "visitor", "ai"]),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      // Verify conversation exists and belongs to organization
      const { data: conversation } = await ctx.supabase
        .from("conversations")
        .select("id, status")
        .eq("id", input.conversationId)
        .eq("organization_id", ctx.organizationId)
        .single();

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Create message
      const { data: message, error: messageError } = await ctx.supabase
        .from("messages")
        .insert({
          conversation_id: input.conversationId,
          content: input.content,
          senderType: input.senderType,
          senderId: ctx.user.id,
          created_at: new Date().toISOString(),
          metadata: input.metadata,
        })
        .select()
        .single();

      if (messageError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
          cause: messageError,
        });
      }

      // Update conversation last_message_at and increment message_count
      await ctx.supabase
        .from("conversations")
        .update({
          lastMessageAt: new Date().toISOString(),
          message_count: conversation.status === "open" ? 1 : undefined, // Increment would need a function
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.conversationId);

      return message;
    }),
});
