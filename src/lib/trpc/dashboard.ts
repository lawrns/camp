/**
 * Dashboard tRPC Router
 * Replaces /api/dashboard/* routes with type-safe procedures
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "./server";

export const dashboardRouter = createTRPCRouter({
  /**
   * Get dashboard summary metrics
   * Replaces: GET /api/dashboard/summary
   */
  summary: orgProcedure
    .input(
      z.object({
        range: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
      })
    )
    .query(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      const now = new Date();
      let startDate!: Date;

      switch (input.range) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      try {
        // Get conversations data
        const { data: conversations, error: convError } = await ctx.supabase
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
            messages!inner(
              id,
              created_at,
              sender_type,
              content
            )
          `
          )
          .eq("organization_id", ctx.organizationId)
          .gte("created_at", startDate.toISOString());

        if (convError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch conversation data",
            cause: convError,
          });
        }

        // Calculate metrics
        const totalConversations = conversations?.length || 0;
        const resolvedConversations = conversations?.filter((c: unknown) => c.status === "resolved").length || 0;
        const openConversations = conversations?.filter((c: unknown) => c.status === "open").length || 0;
        const assignedConversations = conversations?.filter((c: unknown) => c.status === "assigned").length || 0;

        // Calculate response times
        const conversationsWithResponse = conversations?.filter((c: unknown) => c.first_response_at) || [];
        const avgResponseTime =
          conversationsWithResponse.length > 0
            ? conversationsWithResponse.reduce((acc: unknown, conv: unknown) => {
                const responseTime = new Date(conv.first_response_at!).getTime() - new Date(conv.created_at).getTime();
                return acc + responseTime;
              }, 0) / conversationsWithResponse.length
            : 0;

        // Calculate resolution times
        const resolvedConversationsWithTime = conversations?.filter((c: unknown) => c.resolved_at) || [];
        const avgResolutionTime =
          resolvedConversationsWithTime.length > 0
            ? resolvedConversationsWithTime.reduce((acc: unknown, conv: unknown) => {
                const resolutionTime = new Date(conv.resolved_at!).getTime() - new Date(conv.created_at).getTime();
                return acc + resolutionTime;
              }, 0) / resolvedConversationsWithTime.length
            : 0;

        // Get total messages
        const totalMessages =
          conversations?.reduce((acc: unknown, conv: unknown) => acc + (conv.messages?.length || 0), 0) || 0;

        // Calculate satisfaction rate (placeholder - would need actual satisfaction data)
        const satisfactionRate = resolvedConversations > 0 ? 0.85 : 0; // 85% placeholder

        // Priority distribution
        const priorityDistribution = {
          low: conversations?.filter((c: unknown) => c.priority === "low").length || 0,
          normal: conversations?.filter((c: unknown) => c.priority === "normal").length || 0,
          high: conversations?.filter((c: unknown) => c.priority === "high").length || 0,
          urgent: conversations?.filter((c: unknown) => c.priority === "urgent").length || 0,
        };

        // Agent performance (simplified)
        const agentStats =
          conversations?.reduce(
            (acc: unknown, conv: unknown) => {
              if (conv.assigned_agent_id) {
                if (!acc[conv.assigned_agent_id]) {
                  acc[conv.assigned_agent_id] = {
                    total: 0,
                    resolved: 0,
                    avgResponseTime: 0,
                  };
                }
                acc[conv.assigned_agent_id].total++;
                if (conv.status === "resolved") {
                  acc[conv.assigned_agent_id].resolved++;
                }
              }
              return acc;
            },
            {} as Record<string, any>
          ) || {};

        return {
          success: true,
          data: {
            overview: {
              totalConversations,
              openConversations,
              assignedConversations,
              resolvedConversations,
              totalMessages,
              satisfactionRate,
            },
            performance: {
              avgResponseTime: Math.round(avgResponseTime / 1000 / 60), // Convert to minutes
              avgResolutionTime: Math.round(avgResolutionTime / 1000 / 60 / 60), // Convert to hours
              resolutionRate: totalConversations > 0 ? resolvedConversations / totalConversations : 0,
            },
            distribution: {
              priority: priorityDistribution,
              status: {
                open: openConversations,
                assigned: assignedConversations,
                resolved: resolvedConversations,
                closed: conversations?.filter((c: unknown) => c.status === "closed").length || 0,
              },
            },
            agents: agentStats,
            timeRange: input.range,
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate dashboard summary",
          cause: error,
        });
      }
    }),

  /**
   * Get real-time activity feed
   * Replaces: GET /api/dashboard/activity
   */
  activity: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }: { ctx: unknown; input: unknown }) => {
      try {
        // Get recent messages as activity
        const { data: recentMessages, error } = await ctx.supabase
          .from("messages")
          .select(
            `
            id,
            content,
            sender_type,
            created_at,
            conversations!inner(
              id,
              subject,
              organization_id
            ),
            profiles!sender_id(
              first_name,
              last_name,
              email
            )
          `
          )
          .eq("conversations.organization_id", ctx.organizationId)
          .order("created_at", { ascending: false })
          .limit(input.limit);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch activity",
            cause: error,
          });
        }

        const activities =
          recentMessages?.map((message: unknown) => ({
            id: message.id,
            type: "message",
            description: `${message.senderType === "agent" ? "Agent" : "Visitor"} sent a message`,
            content: message.content.substring(0, 100) + (message.content.length > 100 ? "..." : ""),
            timestamp: message.created_at,
            conversationId: message.conversations?.id,
            conversationSubject: message.conversations?.subject,
            user: message.profiles
              ? {
                  name: `${message.profiles.first_name || ""} ${message.profiles.last_name || ""}`.trim(),
                  email: message.profiles.email,
                }
              : null,
          })) || [];

        return activities;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard activity",
          cause: error,
        });
      }
    }),
});
