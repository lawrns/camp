import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { aiUsageEvents } from "@/db/schema/aiUsageEvents";
import { modelVersions } from "@/db/schema/modelVersions";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

const AnalyticsTimeRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

// Real AI Analytics service with database connections
class AIAnalyticsService {
  async getDashboardData(mailboxId?: number) {
    const whereConditions = [...(mailboxId ? [eq(aiUsageEvents.mailboxId, mailboxId)] : [])];

    // Get total usage metrics
    const totalUsage = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        totalInputTokens: sql<number>`sum(${aiUsageEvents.inputTokensCount})`,
        totalOutputTokens: sql<number>`sum(${aiUsageEvents.outputTokensCount})`,
        totalCost: sql<number>`sum(${aiUsageEvents.cost})`,
        avgResponseTime: sql<number>`avg(extract(epoch from (${aiUsageEvents.updatedAt} - ${aiUsageEvents.createdAt})) * 1000)`,
      })
      .from(aiUsageEvents)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get usage by model
    const modelUsage = await db
      .select({
        modelName: aiUsageEvents.modelName,
        requestCount: sql<number>`count(*)`,
        totalCost: sql<number>`sum(${aiUsageEvents.cost})`,
        avgTokens: sql<number>`avg(${aiUsageEvents.inputTokensCount} + ${aiUsageEvents.outputTokensCount})`,
      })
      .from(aiUsageEvents)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(aiUsageEvents.modelName)
      .orderBy(desc(sql`count(*)`));

    // Get usage by query type
    const queryTypeUsage = await db
      .select({
        queryType: aiUsageEvents.queryType,
        requestCount: sql<number>`count(*)`,
        totalCost: sql<number>`sum(${aiUsageEvents.cost})`,
      })
      .from(aiUsageEvents)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(aiUsageEvents.queryType)
      .orderBy(desc(sql`count(*)`));

    return {
      mailboxId,
      summary: totalUsage[0] || {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        avgResponseTime: 0,
      },
      modelBreakdown: modelUsage,
      queryTypeBreakdown: queryTypeUsage,
    };
  }

  async getModelPerformanceMetrics(modelVersionId: number, timeRange: { start: Date; end: Date }) {
    // Get model version details
    const modelVersion = await db.select().from(modelVersions).where(eq(modelVersions.id, modelVersionId)).limit(1);

    if (!modelVersion.length) {
      throw new Error(`Model version ${modelVersionId} not found`);
    }

    const model = modelVersion[0];

    // Get usage metrics for this model in the time range
    const metrics = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        totalInputTokens: sql<number>`sum(${aiUsageEvents.inputTokensCount})`,
        totalOutputTokens: sql<number>`sum(${aiUsageEvents.outputTokensCount})`,
        totalCost: sql<number>`sum(${aiUsageEvents.cost})`,
        avgResponseTime: sql<number>`avg(extract(epoch from (${aiUsageEvents.updatedAt} - ${aiUsageEvents.createdAt})) * 1000)`,
        successRate: sql<number>`count(*) * 1.0 / count(*)`, // Simplified - would need error tracking
      })
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.modelName, model.modelName),
          gte(aiUsageEvents.createdAt, timeRange.start),
          lte(aiUsageEvents.createdAt, timeRange.end)
        )
      );

    return {
      modelVersionId,
      modelName: model.modelName,
      version: model.version,
      timeRange,
      metrics: metrics[0] || {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        avgResponseTime: 0,
        successRate: 0,
      },
    };
  }

  async getRealTimeMetrics() {
    // Get metrics from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentMetrics = await db
      .select({
        requestCount: sql<number>`count(*)`,
        avgResponseTime: sql<number>`avg(extract(epoch from (${aiUsageEvents.updatedAt} - ${aiUsageEvents.createdAt})) * 1000)`,
        totalCost: sql<number>`sum(${aiUsageEvents.cost})`,
      })
      .from(aiUsageEvents)
      .where(gte(aiUsageEvents.createdAt, oneHourAgo));

    // Get active models
    const activeModels = await db
      .select({
        modelName: aiUsageEvents.modelName,
        lastUsed: sql<Date>`max(${aiUsageEvents.createdAt})`,
        requestCount: sql<number>`count(*)`,
      })
      .from(aiUsageEvents)
      .where(gte(aiUsageEvents.createdAt, oneHourAgo))
      .groupBy(aiUsageEvents.modelName)
      .orderBy(desc(sql`max(${aiUsageEvents.createdAt})`));

    return {
      timestamp: new Date(),
      metrics: recentMetrics[0] || {
        requestCount: 0,
        avgResponseTime: 0,
        totalCost: 0,
      },
      activeModels,
      systemStatus: "healthy", // Would implement actual health checks
    };
  }

  async getErrorAnalysis(modelVersionId: number, timeRange: { start: Date; end: Date }) {
    // Get model version details
    const modelVersion = await db.select().from(modelVersions).where(eq(modelVersions.id, modelVersionId)).limit(1);

    if (!modelVersion.length) {
      throw new Error(`Model version ${modelVersionId} not found`);
    }

    // For now, return empty errors since we don't have error tracking in the schema
    // In a real implementation, you'd have an errors table or error fields
    return {
      modelVersionId,
      timeRange,
      errors: [],
      errorRate: 0,
      commonErrors: [],
      recommendations: [
        "Implement error tracking to get detailed error analysis",
        "Add error logging to AI usage events",
        "Monitor response times for performance issues",
      ],
    };
  }

  async configureAlerts(input: unknown) {
    // In a real implementation, you'd store alert configurations in a database table
    // For now, just return success
    return { input, configured: true };
  }

  async checkAlerts() {
    // In a real implementation, you'd check current metrics against configured thresholds
    return { alerts: [] };
  }
}

const AIAnalytics = new AIAnalyticsService();

export const analyticsRouter = createTRPCRouter({
  // Get comprehensive dashboard data
  getDashboard: protectedProcedure.input(z.object({ mailboxId: z.number().optional() })).query(async ({ input }) => {
    return await AIAnalytics.getDashboardData(input.mailboxId);
  }),

  // Get performance metrics for a specific model
  getModelMetrics: protectedProcedure
    .input(
      z.object({
        modelVersionId: z.number(),
        timeRange: AnalyticsTimeRangeSchema,
      })
    )
    .query(async ({ input }) => {
      return await AIAnalytics.getModelPerformanceMetrics(input.modelVersionId, input.timeRange);
    }),

  // Compare multiple models
  compareModels: protectedProcedure
    .input(
      z.object({
        modelVersionIds: z.array(z.number()),
        timeRange: AnalyticsTimeRangeSchema,
      })
    )
    .query(async ({ input }) => {
      return await AIAnalytics.compareModels(input.modelVersionIds, input.timeRange);
    }),

  // Get real-time metrics
  getRealTime: protectedProcedure.query(async () => {
    return await AIAnalytics.getRealTimeMetrics();
  }),

  // Get error analysis
  getErrorAnalysis: protectedProcedure
    .input(
      z.object({
        modelVersionId: z.number(),
        timeRange: AnalyticsTimeRangeSchema,
      })
    )
    .query(async ({ input }) => {
      return await AIAnalytics.getErrorAnalysis(input.modelVersionId, input.timeRange);
    }),

  // Generate performance report
  generateReport: protectedProcedure
    .input(
      z.object({
        modelVersionIds: z.array(z.number()),
        timeRange: AnalyticsTimeRangeSchema,
        format: z.enum(["pdf", "excel", "csv"]).default("pdf"),
      })
    )
    .mutation(async ({ input }) => {
      const report = await AIAnalytics.generatePerformanceReport(input.modelVersionIds, input.timeRange);

      // In a real implementation, you would generate the actual file
      // and return a download URL or base64 encoded data
      return {
        report,
        downloadUrl: `/api/reports/performance-${Date.now()}.${input.format}`,
        filename: `performance-report-${new Date().toISOString().split("T")[0]}.${input.format}`,
      };
    }),

  // Configure alerts
  configureAlerts: protectedProcedure
    .input(
      z.object({
        modelVersionId: z.number(),
        thresholds: z.object({
          maxResponseTime: z.number(),
          minSuccessRate: z.number(),
          maxErrorRate: z.number(),
          maxCostPerRequest: z.number(),
          minThroughput: z.number(),
        }),
        notifications: z.object({
          email: z.array(z.string().email()),
          webhook: z.string().url().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await AIAnalytics.configureAlerts(input);
      return { success: true };
    }),

  // Get active alerts
  getAlerts: protectedProcedure.query(async () => {
    return await AIAnalytics.checkAlerts();
  }),

  // Get metrics for specific time series data
  getTimeSeriesData: protectedProcedure
    .input(
      z.object({
        modelVersionId: z.number().optional(),
        metric: z.enum(["requests", "response_time", "success_rate", "cost", "errors"]),
        timeRange: AnalyticsTimeRangeSchema,
        granularity: z.enum(["hour", "day", "week"]).default("hour"),
      })
    )
    .query(async ({ input }) => {
      let truncateFunction: string;
      switch (input.granularity) {
        case "hour":
          truncateFunction = "hour";
          break;
        case "day":
          truncateFunction = "day";
          break;
        case "week":
          truncateFunction = "week";
          break;
      }

      // Build where conditions
      const whereConditions = [
        gte(aiUsageEvents.createdAt, input.timeRange.start),
        lte(aiUsageEvents.createdAt, input.timeRange.end),
      ];

      // Add model filter if specified
      if (input.modelVersionId) {
        const modelVersion = await db
          .select({ modelName: modelVersions.modelName })
          .from(modelVersions)
          .where(eq(modelVersions.id, input.modelVersionId))
          .limit(1);

        if (modelVersion.length > 0) {
          whereConditions.push(eq(aiUsageEvents.modelName, modelVersion[0].modelName));
        }
      }

      let data: unknown[] = [];

      switch (input.metric) {
        case "requests":
          data = await db
            .select({
              timestamp: sql<Date>`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`,
              value: sql<number>`count(*)`,
            })
            .from(aiUsageEvents)
            .where(and(...whereConditions))
            .groupBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`)
            .orderBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`);
          break;

        case "cost":
          data = await db
            .select({
              timestamp: sql<Date>`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`,
              value: sql<number>`sum(${aiUsageEvents.cost})`,
            })
            .from(aiUsageEvents)
            .where(and(...whereConditions))
            .groupBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`)
            .orderBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`);
          break;

        case "response_time":
          data = await db
            .select({
              timestamp: sql<Date>`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`,
              value: sql<number>`avg(extract(epoch from (${aiUsageEvents.updatedAt} - ${aiUsageEvents.createdAt})) * 1000)`,
            })
            .from(aiUsageEvents)
            .where(and(...whereConditions))
            .groupBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`)
            .orderBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`);
          break;

        case "success_rate":
          // Simplified success rate calculation (would need error tracking for real implementation)
          data = await db
            .select({
              timestamp: sql<Date>`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`,
              value: sql<number>`1.0`, // Assuming 100% success rate without error tracking
            })
            .from(aiUsageEvents)
            .where(and(...whereConditions))
            .groupBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`)
            .orderBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`);
          break;

        case "errors":
          // Return zero errors since we don't have error tracking
          data = await db
            .select({
              timestamp: sql<Date>`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`,
              value: sql<number>`0`,
            })
            .from(aiUsageEvents)
            .where(and(...whereConditions))
            .groupBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`)
            .orderBy(sql`date_trunc('${sql.raw(truncateFunction)}', ${aiUsageEvents.createdAt})`);
          break;
      }

      // Format data for chart consumption
      const formattedData = data.map((item) => ({
        timestamp: item.timestamp,
        value: Number(item.value),
        label: item.timestamp.toISOString(),
      }));

      const values = formattedData.map((d) => d.value);

      return {
        metric: input.metric,
        data: formattedData,
        summary: {
          total: values.reduce((sum, val) => sum + val, 0),
          average: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
        },
      };
    }),

  // Get cost breakdown
  getCostBreakdown: protectedProcedure
    .input(
      z.object({
        timeRange: AnalyticsTimeRangeSchema,
        groupBy: z.enum(["model", "day", "hour"]).default("model"),
      })
    )
    .query(async ({ input }) => {
      let breakdown: unknown[] = [];

      if (input.groupBy === "model") {
        // Group by model
        breakdown = await db
          .select({
            label: aiUsageEvents.modelName,
            cost: sql<number>`sum(${aiUsageEvents.cost})`,
            requests: sql<number>`count(*)`,
          })
          .from(aiUsageEvents)
          .where(
            and(gte(aiUsageEvents.createdAt, input.timeRange.start), lte(aiUsageEvents.createdAt, input.timeRange.end))
          )
          .groupBy(aiUsageEvents.modelName)
          .orderBy(desc(sql`sum(${aiUsageEvents.cost})`));
      } else if (input.groupBy === "day") {
        // Group by day
        breakdown = await db
          .select({
            label: sql<string>`date(${aiUsageEvents.createdAt})`,
            cost: sql<number>`sum(${aiUsageEvents.cost})`,
            requests: sql<number>`count(*)`,
          })
          .from(aiUsageEvents)
          .where(
            and(gte(aiUsageEvents.createdAt, input.timeRange.start), lte(aiUsageEvents.createdAt, input.timeRange.end))
          )
          .groupBy(sql`date(${aiUsageEvents.createdAt})`)
          .orderBy(desc(sql`sum(${aiUsageEvents.cost})`));
      } else {
        // Group by hour
        breakdown = await db
          .select({
            label: sql<string>`date_trunc('hour', ${aiUsageEvents.createdAt})`,
            cost: sql<number>`sum(${aiUsageEvents.cost})`,
            requests: sql<number>`count(*)`,
          })
          .from(aiUsageEvents)
          .where(
            and(gte(aiUsageEvents.createdAt, input.timeRange.start), lte(aiUsageEvents.createdAt, input.timeRange.end))
          )
          .groupBy(sql`date_trunc('hour', ${aiUsageEvents.createdAt})`)
          .orderBy(desc(sql`sum(${aiUsageEvents.cost})`));
      }

      const totalCost = breakdown.reduce((sum, item) => sum + Number(item.cost), 0);
      const totalRequests = breakdown.reduce((sum, item) => sum + Number(item.requests), 0);

      // Calculate percentages
      const breakdownWithPercentages = breakdown.map((item) => ({
        ...item,
        cost: Number(item.cost),
        requests: Number(item.requests),
        percentage: totalCost > 0 ? Math.round((Number(item.cost) / totalCost) * 100) : 0,
      }));

      return {
        breakdown: breakdownWithPercentages,
        summary: {
          totalCost,
          totalRequests,
          averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
          period: `${input.timeRange.start.toLocaleDateString()} - ${input.timeRange.end.toLocaleDateString()}`,
        },
      };
    }),

  // Get performance trends
  getTrends: protectedProcedure
    .input(
      z.object({
        modelVersionId: z.number().optional(),
        timeRange: AnalyticsTimeRangeSchema,
        metrics: z.array(z.enum(["requests", "response_time", "success_rate", "cost"])),
      })
    )
    .query(async ({ input }) => {
      // Mock trends data
      const trends = input.metrics.map((metric: unknown) => {
        const currentValue = Math.random() * 100;
        const previousValue = Math.random() * 100;
        const change = ((currentValue - previousValue) / previousValue) * 100;

        return {
          metric,
          currentValue,
          previousValue,
          change,
          direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
          isGoodTrend:
            (metric === "requests" && change > 0) ||
            (metric === "success_rate" && change > 0) ||
            (metric === "response_time" && change < 0) ||
            (metric === "cost" && change < 0),
        };
      });

      return {
        trends,
        summary: {
          improvingMetrics: trends.filter((t: unknown) => t.isGoodTrend).length,
          decliningMetrics: trends.filter((t: unknown) => !t.isGoodTrend && t.change !== 0).length,
          stableMetrics: trends.filter((t: unknown) => t.change === 0).length,
        },
      };
    }),

  // Get model efficiency ranking
  getEfficiencyRanking: protectedProcedure
    .input(
      z.object({
        timeRange: AnalyticsTimeRangeSchema,
        criteria: z.enum(["cost_efficiency", "performance", "reliability", "overall"]).default("overall"),
      })
    )
    .query(async ({ input }) => {
      // Mock efficiency ranking
      const models = [
        {
          modelVersionId: 1,
          modelName: "Custom Support v2.1",
          version: "2.1",
          score: 92,
          rank: 1,
          metrics: {
            costEfficiency: 88,
            performance: 94,
            reliability: 96,
          },
          insights: ["Highest reliability score", "Excellent performance-to-cost ratio"],
        },
        {
          modelVersionId: 2,
          modelName: "GPT-4o-mini",
          version: "base",
          score: 85,
          rank: 2,
          metrics: {
            costEfficiency: 95,
            performance: 78,
            reliability: 82,
          },
          insights: ["Most cost-effective", "Good baseline performance"],
        },
        {
          modelVersionId: 3,
          modelName: "Fine-tuned Billing",
          version: "1.5",
          score: 79,
          rank: 3,
          metrics: {
            costEfficiency: 72,
            performance: 89,
            reliability: 76,
          },
          insights: ["Specialized for billing queries", "High accuracy in domain"],
        },
      ];

      return {
        ranking: models,
        criteria: input.criteria,
        recommendations: [
          "Consider promoting top-ranked model for more traffic",
          "Review low-performing models for optimization opportunities",
          "Monitor cost-efficiency trends for budget planning",
        ],
      };
    }),
});
