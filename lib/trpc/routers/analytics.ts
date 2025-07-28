/**
 * Analytics tRPC Router
 * 
 * Handles metrics and reporting:
 * - Dashboard metrics
 * - Performance analytics
 * - AI interaction statistics
 * - Real-time metrics
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, orgScopedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const getMetricsSchema = z.object({
  organizationId: z.string().uuid(),
  timeframe: z.enum(['hour', 'day', 'week', 'month', 'year']).default('day'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const getConversationMetricsSchema = z.object({
  organizationId: z.string().uuid(),
  timeframe: z.enum(['day', 'week', 'month', 'year']).default('month'),
  includeAI: z.boolean().default(true),
});

export const analyticsRouter = createTRPCRouter({
  /**
   * Get dashboard overview metrics
   */
  getDashboardMetrics: orgScopedProcedure
    .input(getMetricsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Calculate date range
        const now = new Date();
        const endDate = input.endDate ? new Date(input.endDate) : now;
        const startDate = input.startDate ? new Date(input.startDate) : (() => {
          const date = new Date(endDate);
          switch (input.timeframe) {
            case 'hour':
              date.setHours(date.getHours() - 1);
              break;
            case 'day':
              date.setDate(date.getDate() - 1);
              break;
            case 'week':
              date.setDate(date.getDate() - 7);
              break;
            case 'month':
              date.setMonth(date.getMonth() - 1);
              break;
            case 'year':
              date.setFullYear(date.getFullYear() - 1);
              break;
          }
          return date;
        })();

        // Get conversation metrics
        const { data: conversations, error: convError } = await ctx.supabase
          .from('conversations')
          .select('id, status, created_at, updated_at')
          .eq('organization_id', input.organizationId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (convError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch conversation metrics',
            cause: convError,
          });
        }

        // Get message metrics
        const { data: messages, error: msgError } = await ctx.supabase
          .from('messages')
          .select('id, sender_type, created_at, conversation_id')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (msgError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch message metrics',
            cause: msgError,
          });
        }

        // Get ticket metrics
        const { data: tickets, error: ticketError } = await ctx.supabase
          .from('tickets')
          .select('id, status, priority, created_at, updated_at')
          .eq('organization_id', input.organizationId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (ticketError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch ticket metrics',
            cause: ticketError,
          });
        }

        // Calculate metrics
        const metrics = {
          conversations: {
            total: conversations?.length || 0,
            active: conversations?.filter(c => c.status === 'open').length || 0,
            resolved: conversations?.filter(c => c.status === 'resolved').length || 0,
          },
          messages: {
            total: messages?.length || 0,
            user: messages?.filter(m => m.sender_type === 'user').length || 0,
            ai: messages?.filter(m => m.sender_type === 'ai').length || 0,
            agent: messages?.filter(m => m.sender_type === 'agent').length || 0,
          },
          tickets: {
            total: tickets?.length || 0,
            open: tickets?.filter(t => t.status === 'open').length || 0,
            in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
            resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
            high_priority: tickets?.filter(t => t.priority === 'high' || t.priority === 'urgent').length || 0,
          },
          timeframe: input.timeframe,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        return metrics;
      } catch (error) {
        console.error('[Analytics] GetDashboardMetrics error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard metrics',
        });
      }
    }),

  /**
   * Get conversation analytics with AI performance
   */
  getConversationAnalytics: orgScopedProcedure
    .input(getConversationMetricsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Calculate date range
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

        // Get conversations with message counts
        const { data: conversations, error: convError } = await ctx.supabase
          .from('conversations')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            messages(id, sender_type, created_at)
          `)
          .eq('organization_id', input.organizationId)
          .gte('created_at', startDate.toISOString());

        if (convError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch conversation analytics',
            cause: convError,
          });
        }

        // Calculate AI performance metrics
        const analytics = {
          total_conversations: conversations?.length || 0,
          ai_handled: 0,
          human_escalated: 0,
          avg_resolution_time: 0,
          ai_response_rate: 0,
          satisfaction_score: 0, // TODO: Implement satisfaction tracking
          response_times: {
            ai_avg: 0, // TODO: Calculate from message timestamps
            human_avg: 0,
          },
          conversation_trends: [], // TODO: Implement time-series data
        };

        // Calculate AI handling statistics
        if (conversations && input.includeAI) {
          conversations.forEach(conv => {
            const messages = conv.messages || [];
            const hasAI = messages.some(m => m.sender_type === 'ai');
            const hasHuman = messages.some(m => m.sender_type === 'agent');
            
            if (hasAI && !hasHuman) {
              analytics.ai_handled++;
            } else if (hasHuman) {
              analytics.human_escalated++;
            }
          });

          analytics.ai_response_rate = analytics.total_conversations > 0 
            ? (analytics.ai_handled / analytics.total_conversations) * 100 
            : 0;
        }

        return analytics;
      } catch (error) {
        console.error('[Analytics] GetConversationAnalytics error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch conversation analytics',
        });
      }
    }),

  /**
   * Get real-time metrics for live dashboard
   */
  getRealTimeMetrics: orgScopedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get active conversations (last hour)
        const { data: activeConversations, error: activeError } = await ctx.supabase
          .from('conversations')
          .select('id, status, updated_at')
          .eq('organization_id', input.organizationId)
          .eq('status', 'open')
          .gte('updated_at', oneHourAgo.toISOString());

        if (activeError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch active conversations',
            cause: activeError,
          });
        }

        // Get recent messages (last hour)
        const { data: recentMessages, error: msgError } = await ctx.supabase
          .from('messages')
          .select('id, sender_type, created_at')
          .in('conversation_id', activeConversations?.map(c => c.id) || [])
          .gte('created_at', oneHourAgo.toISOString());

        if (msgError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch recent messages',
            cause: msgError,
          });
        }

        // Get online agents (TODO: Implement presence tracking)
        const onlineAgents = 0; // Placeholder

        const realTimeMetrics = {
          active_conversations: activeConversations?.length || 0,
          messages_last_hour: recentMessages?.length || 0,
          online_agents: onlineAgents,
          avg_response_time: 0, // TODO: Calculate from message timestamps
          queue_length: activeConversations?.filter(c => c.status === 'open').length || 0,
          timestamp: now.toISOString(),
        };

        return realTimeMetrics;
      } catch (error) {
        console.error('[Analytics] GetRealTimeMetrics error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch real-time metrics',
        });
      }
    }),

  /**
   * Get performance trends over time
   */
  getPerformanceTrends: orgScopedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      metric: z.enum(['conversations', 'messages', 'response_time', 'satisfaction']),
      timeframe: z.enum(['day', 'week', 'month']).default('week'),
      granularity: z.enum(['hour', 'day', 'week']).default('day'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // Calculate date range
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
        }

        // TODO: Implement time-series data aggregation
        // This would require more complex SQL queries or a time-series database
        
        const trends = {
          metric: input.metric,
          timeframe: input.timeframe,
          granularity: input.granularity,
          data_points: [], // TODO: Implement actual trend calculation
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        };

        return trends;
      } catch (error) {
        console.error('[Analytics] GetPerformanceTrends error:', error);
        throw error instanceof TRPCError ? error : new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance trends',
        });
      }
    }),
});
