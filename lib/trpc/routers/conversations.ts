/**
 * Conversations tRPC Router
 * 
 * Handles all conversation-related operations:
 * - CRUD operations for conversations
 * - Message management
 * - Real-time subscriptions
 * - AI integration hooks
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, orgScopedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const createConversationSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const updateConversationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const getConversationsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  assignedTo: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

const addMessageSchema = z.object({
  conversationId: z.string().uuid(),
  organizationId: z.string().uuid(),
  content: z.string().min(1),
  type: z.enum(['text', 'image', 'file', 'system']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export const conversationsRouter = createTRPCRouter({
  /**
   * Create a new conversation
   */
  create: orgScopedProcedure
    .input(createConversationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { data: conversation, error } = await ctx.supabase
          .from('conversations')
          .insert({
            organization_id: input.organizationId,
            title: input.title || 'New Conversation',
            priority: input.priority,
            status: 'open',
            created_by: ctx.user.id,
            tags: input.tags,
            metadata: input.metadata || {},
          })
          .select(`
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by
          `)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create conversation',
            cause: error,
          });
        }

        return conversation;
      } catch (error) {
        console.error('[Conversations] Create error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create conversation',
        });
      }
    }),

  /**
   * Get conversations with filtering and pagination
   */
  list: orgScopedProcedure
    .input(getConversationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        let query = ctx.supabase
          .from('conversations')
          .select(`
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by,
            message_count:messages(count),
            last_message:messages(content, created_at, sender_type)
          `)
          .eq('organization_id', input.organizationId)
          .order('updated_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        // Apply filters
        if (input.status) {
          query = query.eq('status', input.status);
        }

        if (input.assignedTo) {
          query = query.eq('assigned_to', input.assignedTo);
        }

        if (input.search) {
          query = query.or(`title.ilike.%${input.search}%,tags.cs.{${input.search}}`);
        }

        const { data: conversations, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch conversations',
            cause: error,
          });
        }

        return conversations || [];
      } catch (error) {
        console.error('[Conversations] List error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch conversations',
        });
      }
    }),

  /**
   * Get a single conversation by ID
   */
  getById: orgScopedProcedure
    .input(z.object({
      id: z.string().uuid(),
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { data: conversation, error } = await ctx.supabase
          .from('conversations')
          .select(`
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by,
            messages(
              id,
              content,
              type,
              sender_type,
              sender_id,
              created_at,
              metadata
            )
          `)
          .eq('id', input.id)
          .eq('organization_id', input.organizationId)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conversation not found',
            cause: error,
          });
        }

        return conversation;
      } catch (error) {
        console.error('[Conversations] GetById error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch conversation',
        });
      }
    }),

  /**
   * Update a conversation
   */
  update: orgScopedProcedure
    .input(updateConversationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, organizationId, ...updates } = input;

        const { data: conversation, error } = await ctx.supabase
          .from('conversations')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conversation not found or update failed',
            cause: error,
          });
        }

        return conversation;
      } catch (error) {
        console.error('[Conversations] Update error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update conversation',
        });
      }
    }),

  /**
   * Add a message to a conversation
   */
  addMessage: orgScopedProcedure
    .input(addMessageSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // First verify the conversation exists and user has access
        const { data: conversation } = await ctx.supabase
          .from('conversations')
          .select('id')
          .eq('id', input.conversationId)
          .eq('organization_id', input.organizationId)
          .single();

        if (!conversation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conversation not found',
          });
        }

        // Add the message
        const { data: message, error } = await ctx.supabase
          .from('messages')
          .insert({
            conversation_id: input.conversationId,
            content: input.content,
            type: input.type,
            sender_type: 'user',
            sender_id: ctx.user.id,
            metadata: input.metadata || {},
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add message',
            cause: error,
          });
        }

        // Update conversation's updated_at timestamp
        await ctx.supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', input.conversationId);

        return message;
      } catch (error) {
        console.error('[Conversations] AddMessage error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add message',
        });
      }
    }),

  /**
   * Delete a conversation (soft delete)
   */
  delete: orgScopedProcedure
    .input(z.object({
      id: z.string().uuid(),
      organizationId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { error } = await ctx.supabase
          .from('conversations')
          .update({ 
            status: 'closed',
            deleted_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('organization_id', input.organizationId);

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conversation not found or delete failed',
            cause: error,
          });
        }

        return { success: true };
      } catch (error) {
        console.error('[Conversations] Delete error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete conversation',
        });
      }
    }),
});
