/**
 * Tickets tRPC Router
 * 
 * Handles support ticket management:
 * - CRUD operations for tickets
 * - Status tracking and assignment
 * - Priority management
 * - Integration with conversations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, orgScopedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const createTicketSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  conversationId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateTicketSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const getTicketsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

export const ticketsRouter = createTRPCRouter({
  /**
   * Create a new support ticket
   */
  create: orgScopedProcedure
    .input(createTicketSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { data: ticket, error } = await ctx.supabase
          .from('tickets')
          .insert({
            organization_id: input.organizationId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: 'open',
            category: input.category,
            tags: input.tags,
            conversation_id: input.conversationId,
            createdBy: ctx.user.id,
            metadata: input.metadata || {},
          })
          .select(`
            id,
            title,
            description,
            status,
            priority,
            category,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by,
            conversation_id
          `)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create ticket',
            cause: error,
          });
        }

        return ticket;
      } catch (error) {
        console.error('[Tickets] Create error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create ticket',
        });
      }
    }),

  /**
   * Get tickets with filtering and pagination
   */
  list: orgScopedProcedure
    .input(getTicketsSchema)
    .query(async ({ input, ctx }) => {
      try {
        let query = ctx.supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            category,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by,
            conversation_id,
            conversation:conversations(id, title, status)
          `)
          .eq('organization_id', input.organizationId)
          .order('updated_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        // Apply filters
        if (input.status) {
          query = query.eq('status', input.status);
        }

        if (input.priority) {
          query = query.eq('priority', input.priority);
        }

        if (input.assignedTo) {
          query = query.eq('assigned_to', input.assignedTo);
        }

        if (input.category) {
          query = query.eq('category', input.category);
        }

        if (input.search) {
          query = query.or(`title.ilike.%${input.search}%,description.ilike.%${input.search}%,tags.cs.{${input.search}}`);
        }

        const { data: tickets, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch tickets',
            cause: error,
          });
        }

        return tickets || [];
      } catch (error) {
        console.error('[Tickets] List error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tickets',
        });
      }
    }),

  /**
   * Get a single ticket by ID
   */
  getById: orgScopedProcedure
    .input(z.object({
      id: z.string().uuid(),
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { data: ticket, error } = await ctx.supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            category,
            created_at,
            updated_at,
            tags,
            metadata,
            assigned_to,
            created_by,
            conversation_id,
            conversation:conversations(
              id,
              title,
              status,
              messages(id, content, type, sender_type, created_at)
            )
          `)
          .eq('id', input.id)
          .eq('organization_id', input.organizationId)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Ticket not found',
            cause: error,
          });
        }

        return ticket;
      } catch (error) {
        console.error('[Tickets] GetById error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch ticket',
        });
      }
    }),

  /**
   * Update a ticket
   */
  update: orgScopedProcedure
    .input(updateTicketSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, organizationId, ...updates } = input;

        const { data: ticket, error } = await ctx.supabase
          .from('tickets')
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
            message: 'Ticket not found or update failed',
            cause: error,
          });
        }

        return ticket;
      } catch (error) {
        console.error('[Tickets] Update error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update ticket',
        });
      }
    }),

  /**
   * Assign a ticket to a user
   */
  assign: orgScopedProcedure
    .input(z.object({
      id: z.string().uuid(),
      organizationId: z.string().uuid(),
      assignedTo: z.string().uuid().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify the assignee is a member of the organization (if not null)
        if (input.assignedTo) {
          const { data: member } = await ctx.supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', input.assignedTo)
            .eq('organization_id', input.organizationId)
            .eq('status', 'active')
            .single();

          if (!member) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Assignee is not a member of this organization',
            });
          }
        }

        const { data: ticket, error } = await ctx.supabase
          .from('tickets')
          .update({
            assigned_to: input.assignedTo,
            status: input.assignedTo ? 'in_progress' : 'open',
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('organization_id', input.organizationId)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Ticket not found or assignment failed',
            cause: error,
          });
        }

        return ticket;
      } catch (error) {
        console.error('[Tickets] Assign error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign ticket',
        });
      }
    }),

  /**
   * Get ticket statistics for dashboard
   */
  getStats: orgScopedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      timeframe: z.enum(['day', 'week', 'month', 'year']).default('month'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // Calculate date range based on timeframe
        const now = new Date();
        const startDate = new Date();
        
        switch (input.timeframe) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        // Get ticket counts by status
        const { data: statusCounts, error: statusError } = await ctx.supabase
          .from('tickets')
          .select('status')
          .eq('organization_id', input.organizationId)
          .gte('created_at', startDate.toISOString());

        if (statusError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch ticket statistics',
            cause: statusError,
          });
        }

        // Calculate statistics
        const stats = {
          total: statusCounts?.length || 0,
          open: statusCounts?.filter(t => t.status === 'open').length || 0,
          in_progress: statusCounts?.filter(t => t.status === 'in_progress').length || 0,
          pending: statusCounts?.filter(t => t.status === 'pending').length || 0,
          resolved: statusCounts?.filter(t => t.status === 'resolved').length || 0,
          closed: statusCounts?.filter(t => t.status === 'closed').length || 0,
        };

        return stats;
      } catch (error) {
        console.error('[Tickets] GetStats error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch ticket statistics',
        });
      }
    }),
});
