// tRPC Conversations Router with Multi-Tenant Security
// Demonstrates comprehensive tenant validation using middleware

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, conversations as conversationsTable } from "@/db/schema";
import { getSupabase } from "@/lib/supabase";
import {
  agentMiddleware,
  createAuditMiddleware,
  createConversationMiddleware,
  createMailboxMiddleware,
  tenantMiddleware,
} from "../middleware/tenant";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Input validation schemas
const getConversationsSchema = z.object({
  mailboxId: z.number(),
  status: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
});

const createConversationSchema = z.object({
  mailboxId: z.number(),
  customerEmail: z.string().email(),
  subject: z.string().min(1).max(200),
  status: z.enum(["open", "pending", "closed"]).default("open"),
  metadata: z.record(z.unknown()).optional(),
});

const getMessagesSchema = z.object({
  conversationId: z.number(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const createMessageSchema = z.object({
  conversationId: z.number(),
  content: z.string().min(1),
  senderType: z.enum(["agent", "customer", "system"]),
  senderEmail: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const conversationsRouter = createTRPCRouter({
  /**
   * List conversations with pagination and filtering
   * Alias for getConversations for compatibility
   */
  list: publicProcedure
    .input(getConversationsSchema)
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("conversations.list"))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Direct database query since getConversations method doesn't exist
        const conditions = [eq(conversationsTable.mailboxId, input.mailboxId)];
        if (input.status) {
          conditions.push(eq(conversationsTable.status, input.status));
        }

        const conversations = await db.query.conversations.findMany({
          where: conditions.length > 1 ? and(...conditions) : conditions[0],
          limit: input.limit,
          offset: input.offset,
          orderBy: (conversations, { desc }) => desc(conversations.createdAt),
        });

        return {
          conversations: conversations.map((conv) => ({
            ...conv,
            id: Number(conv.id), // Convert bigint to number
            mailboxId: Number(conv.mailboxId),
          })),
          total: conversations.length,
          hasMore: conversations.length === input.limit,
        };
      } catch (error) {
        console.error("Error fetching conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  /**
   * Get conversations for a specific mailbox with tenant validation
   * Requires agent-level access to the mailbox
   */
  getConversations: publicProcedure
    .input(getConversationsSchema)
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("conversations.getConversations"))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Direct database query since getConversations method doesn't exist
        const conditions = [eq(conversationsTable.mailboxId, input.mailboxId)];
        if (input.status) {
          conditions.push(eq(conversationsTable.status, input.status));
        }

        const conversations = await db.query.conversations.findMany({
          where: conditions.length > 1 ? and(...conditions) : conditions[0],
          limit: input.limit,
          offset: input.offset,
          orderBy: (conversations, { desc }) => desc(conversations.createdAt),
        });

        return {
          conversations: conversations.map((conv) => ({
            ...conv,
            id: Number(conv.id), // Convert bigint to number
            mailboxId: Number(conv.mailboxId),
          })),
          pagination: {
            limit: input.limit,
            offset: input.offset,
            total: conversations.length, // In production, get actual count
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
          cause: error,
        });
      }
    }),

  /**
   * Create a new conversation with automatic tenant association
   * Requires agent-level access to the target mailbox
   */
  createConversation: publicProcedure
    .input(createConversationSchema)
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("conversations.createConversation"))
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const validatedMailboxId = "validatedMailboxId" in ctx ? ctx.validatedMailboxId : input.mailboxId;

      try {
        // Direct database insert since createConversation method doesn't exist
        const result = await db
          .insert(conversationsTable)
          .values({
            mailboxId: Number(validatedMailboxId),
            customerEmail: input.customerEmail,
            subject: input.subject,
            status: input.status,
            organizationId: ctx.user?.organizationId || "default",
            uid: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          })
          .returning();

        const conversation = result[0];
        if (!conversation) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create conversation",
          });
        }

        return {
          ...conversation,
          id: Number(conversation.id),
          mailboxId: Number(conversation.mailboxId),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
          cause: error,
        });
      }
    }),

  /**
   * Get messages for a specific conversation
   * Validates conversation access through RLS
   */
  getMessages: publicProcedure
    .input(getMessagesSchema)
    .use(createConversationMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("conversations.getMessages"))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const validatedConversationId =
        "validatedConversationId" in ctx ? ctx.validatedConversationId : input.conversationId;

      try {
        // Direct database query since getConversationMessages method doesn't exist
        const messages = await db.query.conversationMessages.findMany({
          where: eq(conversationMessages.conversationId, Number(validatedConversationId)),
          limit: input.limit,
          offset: input.offset,
          orderBy: (messages, { asc }) => asc(messages.createdAt),
        });

        return {
          messages: messages.map((msg) => ({
            ...msg,
            id: Number(msg.id),
            conversationId: msg.conversationId,
          })),
          conversationId: validatedConversationId,
          pagination: {
            limit: input.limit,
            offset: input.offset,
            total: messages.length,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
          cause: error,
        });
      }
    }),

  /**
   * Create a new message in a conversation
   * Validates conversation access and agent permissions
   */
  createMessage: publicProcedure
    .input(createMessageSchema)
    .use(createConversationMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("conversations.createMessage"))
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const validatedConversationId =
        "validatedConversationId" in ctx ? ctx.validatedConversationId : input.conversationId;

      try {
        // Direct database insert since createMessage method doesn't exist
        const result = await db
          .insert(conversationMessages)
          .values({
            conversationId: Number(validatedConversationId),
            content: input.content,
            senderType: input.senderType,
            senderEmail: input.senderEmail || ctx.user?.email || "",
            role: input.senderType === "agent" ? "assistant" : input.senderType === "customer" ? "user" : "system",
            organizationId: ctx.user?.organizationId || "default",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const message = result[0];
        if (!message) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create message",
          });
        }

        return {
          ...message,
          id: Number(message.id),
          conversationId: message.conversationId,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create message",
          cause: error,
        });
      }
    }),

  /**
   * Get conversation details with tenant validation
   * Demonstrates basic tenant middleware usage
   */
  getConversationDetails: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .use(tenantMiddleware)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      if (!supabase) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supabase client not initialized",
        });
      }

      try {
        // Use RLS-protected query to get conversation
        const conversation = await supabase
          .from("conversations")
          .select(
            `
            *,
            messages!inner (
              id,
              content,
              sender_type,
              created_at
            )
          `
          )
          .eq("id", input.conversationId)
          .single();

        if (conversation.error || !conversation.data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found or access denied",
          });
        }

        return conversation.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation details",
          cause: error,
        });
      }
    }),

  /**
   * Admin-only procedure to get conversation analytics
   * Demonstrates role-based access control
   */
  getConversationAnalytics: publicProcedure
    .input(z.object({ mailboxId: z.number(), dateRange: z.string().optional() }))
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin"] }))
    .use(createAuditMiddleware("conversations.getAnalytics"))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const validatedMailboxId = "validatedMailboxId" in ctx ? ctx.validatedMailboxId : input.mailboxId;

      if (!supabase) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supabase client not initialized",
        });
      }

      try {
        // Get conversation statistics
        const { data: conversations, error } = await supabase
          .from("conversations")
          .select("id, status, createdAt")
          .eq("mailboxId", validatedMailboxId);

        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        // Calculate basic analytics
        const total = conversations?.length || 0;
        const statusCounts = conversations?.reduce(
          (acc: Record<string, number>, conv: { status: string }) => {
            acc[conv.status] = (acc[conv.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return {
          mailboxId: validatedMailboxId,
          analytics: {
            totalConversations: total,
            statusBreakdown: statusCounts,
            dateRange: input.dateRange || "all-time",
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation analytics",
          cause: error,
        });
      }
    }),
});
