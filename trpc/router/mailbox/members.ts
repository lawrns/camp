import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { subHours } from "date-fns";
import { z } from "zod";
import { getTeamMemberStats } from "@/lib/data/stats";
import { getUsersWithMailboxAccess, updateUserMailboxData } from "@/lib/data/user";
import { captureExceptionAndLog } from "@/lib/shared/sentry";
import { mailboxProcedure } from "./procedure";

export const membersRouter = {
  update: mailboxProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["core", "nonCore", "afk"]),
        keywords: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Handle exactOptionalPropertyTypes - only pass keywords if defined
        const updates: {
          role: "core" | "nonCore" | "afk";
          keywords?: string[];
        } = {
          role: input.role,
        };
        if (input.keywords !== undefined) {
          updates.keywords = input.keywords;
        }

        const user = await updateUserMailboxData(input.userId, ctx.mailbox.id, updates);

        return user;
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            userId: input.userId,
            mailboxId: ctx.mailbox.id,
            role: input.role,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update team member",
        });
      }
    }),

  list: mailboxProcedure.query(async ({ ctx }) => {
    try {
      return await getUsersWithMailboxAccess(ctx.mailbox.organizationId, ctx.mailbox.id);
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: "mailbox.members.list" },
        extra: {
          mailboxId: ctx.mailbox.id,
          organizationId: ctx.mailbox.organizationId,
          mailboxSlug: ctx.mailbox.slug,
        },
      });
      return [];
    }
  }),

  stats: mailboxProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d", "1y"]),
        customDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const periodInHours = {
        "24h": 24,
        "7d": 24 * 7,
        "30d": 24 * 30,
        "1y": 24 * 365,
      } as const;

      const startDate = input.customDate || subHours(now, periodInHours[input.period]);
      // Map 1y to 30d since getTeamMemberStats doesn't support 1y
      const timeRange = input.period === "1y" ? "30d" : input.period;
      return await getTeamMemberStats(ctx.mailbox.id.toString(), timeRange);
    }),

  invite: mailboxProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        role: z.enum(["owner", "admin", "agent", "viewer"]),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implement actual email invitation logic
        // For now, simulate the invitation process

        console.log(`[TeamInvite] Inviting ${input.email} as ${input.role} to mailbox ${ctx.mailbox.slug}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real implementation, this would:
        // 1. Create an invitation record in the database
        // 2. Generate a secure invitation token
        // 3. Send an email with the invitation link
        // 4. Return the invitation details

        return {
          success: true,
          invitationId: `inv_${Date.now()}`,
          email: input.email,
          role: input.role,
          status: "sent",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          message: `Invitation sent to ${input.email}`,
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            email: input.email,
            role: input.role,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation",
        });
      }
    }),

  listInvitations: mailboxProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Implement actual database query for invitations
      // For now, return mock data

      console.log(`[TeamInvitations] Listing invitations for mailbox ${ctx.mailbox.slug}`);

      // Mock invitation data
      return [
        {
          id: "inv_1",
          email: "alice@example.com",
          role: "agent" as const,
          status: "pending" as const,
          invitedBy: "admin@company.com",
          invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        },
        {
          id: "inv_2",
          email: "bob@example.com",
          role: "admin" as const,
          status: "pending" as const,
          invitedBy: "admin@company.com",
          invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        },
      ];
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: "mailbox.members.listInvitations" },
        extra: {
          mailboxId: ctx.mailbox.id,
          organizationId: ctx.mailbox.organizationId,
          mailboxSlug: ctx.mailbox.slug,
        },
      });
      return [];
    }
  }),

  cancelInvitation: mailboxProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implement actual invitation cancellation
        console.log(`[TeamInvite] Cancelling invitation ${input.invitationId} for mailbox ${ctx.mailbox.slug}`);

        return {
          success: true,
          message: "Invitation cancelled successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            invitationId: input.invitationId,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel invitation",
        });
      }
    }),

  // Team Performance Analytics
  performance: mailboxProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[TeamPerformance] Getting performance metrics for mailbox ${ctx.mailbox.slug}, period: ${input.period}`);

        // Import the analytics service
        const { getTeamPerformanceMetrics } = await import("../../../services/teamAnalyticsService");

        // Calculate timeframe
        const periodHours = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 };
        const startDate = new Date(Date.now() - periodHours[input.period] * 60 * 60 * 1000);
        const endDate = new Date();

        const result = await getTeamPerformanceMetrics(ctx.mailbox.organizationId, {
          period: input.period,
          startDate,
          endDate,
        });

        return result;
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          tags: { route: "mailbox.members.performance" },
          extra: {
            mailboxId: ctx.mailbox.id,
            organizationId: ctx.mailbox.organizationId,
            mailboxSlug: ctx.mailbox.slug,
            period: input.period,
          },
        });

        // Return empty data on error
        return {
          members: [],
          overall: {
            totalMembers: 0,
            activeMembers: 0,
            totalTickets: 0,
            resolvedTickets: 0,
            avgTeamSatisfaction: 0,
            avgResolutionTime: 0,
            teamEfficiency: 0,
            workloadDistribution: { balanced: 0, overloaded: 0, underutilized: 0 },
            trends: { ticketVolumeTrend: 0, satisfactionTrend: 0, efficiencyTrend: 0 },
          },
        };
      }
    }),

  workload: mailboxProcedure.query(async ({ ctx }) => {
    try {
      console.log(`[TeamWorkload] Getting workload distribution for mailbox ${ctx.mailbox.slug}`);

      const { getWorkloadDistribution } = await import("../../../services/teamAnalyticsService");
      const workload = await getWorkloadDistribution(ctx.mailbox.organizationId);

      return workload;
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: "mailbox.members.workload" },
        extra: {
          mailboxId: ctx.mailbox.id,
          organizationId: ctx.mailbox.organizationId,
          mailboxSlug: ctx.mailbox.slug,
        },
      });
      return [];
    }
  }),

  trends: mailboxProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[TeamTrends] Getting performance trends for mailbox ${ctx.mailbox.slug}, ${input.days} days`);

        const { getTeamPerformanceTrends } = await import("../../../services/teamAnalyticsService");
        const trends = await getTeamPerformanceTrends(ctx.mailbox.organizationId, input.days);

        return trends;
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          tags: { route: "mailbox.members.trends" },
          extra: {
            mailboxId: ctx.mailbox.id,
            organizationId: ctx.mailbox.organizationId,
            mailboxSlug: ctx.mailbox.slug,
            days: input.days,
          },
        });
        return {
          ticketVolume: [],
          satisfaction: [],
          efficiency: [],
        };
      }
    }),
} satisfies TRPCRouterRecord;
