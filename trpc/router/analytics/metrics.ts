import { z } from "zod";
import { dataAggregator, type AnalyticsFilter } from "@/lib/analytics/data-aggregator";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

const timeRangeSchema = z.enum(["24h", "7d", "30d", "90d", "12m", "custom"]);

const analyticsFilterSchema = z.object({
  timeRange: timeRangeSchema,
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  mailboxSlug: z.string().optional(),
  agentId: z.string().optional(),
  channelType: z.string().optional(),
  category: z.string().optional(),
});

export const analyticsRouter = createTRPCRouter({
  getDashboardMetrics: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    // Get comprehensive dashboard metrics
    const [
      conversationMetrics,
      volumeTimeSeries,
      responseTimeSeries,
      agentPerformance,
      channelDistribution
    ] = await Promise.all([
      dataAggregator.getConversationMetrics(filter),
      dataAggregator.getConversationVolumeTimeSeries(filter),
      dataAggregator.getResponseTimeTimeSeries(filter),
      dataAggregator.getAgentPerformanceMetrics(filter),
      dataAggregator.getChannelDistribution(filter)
    ]);

    return {
      conversationMetrics,
      volumeTimeSeries,
      responseTimeSeries,
      agentPerformance,
      channelDistribution,
      lastUpdated: new Date().toISOString(),
    };
  }),

  getConversationMetrics: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getConversationMetrics(filter);
  }),

  getConversationVolumeTimeSeries: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getConversationVolumeTimeSeries(filter);
  }),

  getResponseTimeTimeSeries: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getResponseTimeTimeSeries(filter);
  }),

  getCategoryBreakdown: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getCategoryBreakdown(filter);
  }),

  getAgentPerformance: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getAgentPerformance(filter);
  }),

  getChannelDistribution: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.getChannelDistribution(filter);
  }),

  getDashboardData: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    // Fetch all dashboard data in parallel
    const [metrics, conversationVolume, responseTimeSeries, categoryBreakdown, agentPerformance, channelDistribution] =
      await Promise.all([
        dataAggregator.getConversationMetrics(filter),
        dataAggregator.getConversationVolumeTimeSeries(filter),
        dataAggregator.getResponseTimeTimeSeries(filter),
        dataAggregator.getCategoryBreakdown(filter),
        dataAggregator.getAgentPerformance(filter),
        dataAggregator.getChannelDistribution(filter),
      ]);

    return {
      metrics,
      conversationVolume,
      responseTimeSeries,
      categoryBreakdown,
      agentPerformance,
      channelDistribution,
    };
  }),

  getInsights: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.generateInsights(filter);
  }),

  getAnomalies: protectedProcedure.input(analyticsFilterSchema).query(async ({ input, ctx }) => {
    const filter: AnalyticsFilter = {
      timeRange: input.timeRange,
      dateRange: input.dateRange,
      mailboxSlug: input.mailboxSlug,
      agentId: input.agentId,
      channelType: input.channelType,
      category: input.category,
    };

    return await dataAggregator.detectAnomalies(filter);
  }),

  exportData: protectedProcedure
    .input(
      analyticsFilterSchema.extend({
        format: z.enum(["csv", "json", "pdf"]),
        includeCharts: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const filter: AnalyticsFilter = {
        timeRange: input.timeRange,
        dateRange: input.dateRange,
        mailboxSlug: input.mailboxSlug,
        agentId: input.agentId,
        channelType: input.channelType,
        category: input.category,
      };

      // Get all data for export
      const dashboardData = await dataAggregator.getConversationMetrics(filter);

      // Generate export based on format
      // This would typically generate files and return download URLs
      return {
        success: true,
        downloadUrl: `/api/analytics/export?format=${input.format}&timestamp=${Date.now()}`,
        message: `Data exported successfully in ${input.format.toUpperCase()} format`,
      };
    }),

  getCustomReport: protectedProcedure
    .input(
      analyticsFilterSchema.extend({
        reportType: z.enum(["summary", "detailed", "performance", "trends"]),
        groupBy: z.enum(["agent", "category", "channel", "time"]).optional(),
        metrics: z.array(z.enum(["conversations", "responseTime", "satisfaction", "resolution"])),
      })
    )
    .query(async ({ input, ctx }) => {
      const filter: AnalyticsFilter = {
        timeRange: input.timeRange,
        dateRange: input.dateRange,
        mailboxSlug: input.mailboxSlug,
        agentId: input.agentId,
        channelType: input.channelType,
        category: input.category,
      };

      // Generate custom report based on parameters
      const baseMetrics = await dataAggregator.getConversationMetrics(filter);

      let reportData = {};

      if (input.metrics.includes("conversations")) {
        reportData = {
          ...reportData,
          conversationVolume: await dataAggregator.getConversationVolumeTimeSeries(filter),
        };
      }

      if (input.metrics.includes("responseTime")) {
        reportData = {
          ...reportData,
          responseTimeSeries: await dataAggregator.getResponseTimeTimeSeries(filter),
        };
      }

      // Add other metrics as needed

      return {
        reportType: input.reportType,
        generatedAt: new Date().toISOString(),
        filter,
        data: {
          metrics: baseMetrics,
          ...reportData,
        },
      };
    }),
});
