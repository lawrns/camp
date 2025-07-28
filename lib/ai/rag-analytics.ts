/**
 * RAG Analytics Functions - Helper2 Style
 * Replaces RAGAnalyticsService class with simple exported functions
 * Direct Supabase calls, no abstraction layers, no caching complexity
 */

import { supabase } from "@/lib/supabase";

// Trust your tools - use Supabase directly with singleton
const supabaseClient = supabase.admin();

// Simple types - no over-engineering
interface RAGMetrics {
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
  usage: {
    totalRequests: number;
    uniqueOrganizations: number;
    requestsByDay: Array<{ date: string; count: number }>;
  };
  quality: {
    averageRelevanceScore: number;
    feedbackPositive: number;
    feedbackNegative: number;
  };
  cost: {
    totalCost: number;
    costPerRequest: number;
  };
}

interface PerformanceInsight {
  type: "optimization" | "warning" | "recommendation";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Get comprehensive RAG metrics
 * Helper2 approach: simple function, direct queries
 */
export async function getRAGMetrics(organizationId?: string, days: number = 7): Promise<RAGMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  try {
    // Get RAG events from the last N days
    let query = supabase.from("rag_events").select("*").gte("created_at", startDate.toISOString());

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: events, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch RAG events: ${error.message}`);
    }

    const ragEvents = events || [];

    // Calculate performance metrics
    const successfulEvents = ragEvents.filter((e: unknown) => e.success);
    const responseTimes = ragEvents.filter((e: unknown) => e.response_time).map((e: unknown) => e.response_time);

    const performance = {
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((sum: any, time: unknown) => sum + time, 0) / responseTimes.length
          : 0,
      successRate: ragEvents.length > 0 ? successfulEvents.length / ragEvents.length : 0,
      errorRate: ragEvents.length > 0 ? (ragEvents.length - successfulEvents.length) / ragEvents.length : 0,
      throughput: ragEvents.length / days, // requests per day
    };

    // Calculate usage metrics
    const uniqueOrgs = new Set(ragEvents.map((e: unknown) => e.organization_id)).size;
    const requestsByDay = aggregateByDay(ragEvents);

    const usage = {
      totalRequests: ragEvents.length,
      uniqueOrganizations: uniqueOrgs,
      requestsByDay,
    };

    // Calculate quality metrics (simplified)
    const qualityEvents = ragEvents.filter((e: unknown) => e.relevance_score !== null);
    const avgRelevance =
      qualityEvents.length > 0
        ? qualityEvents.reduce((sum: any, e: unknown) => sum + (e.relevance_score || 0), 0) / qualityEvents.length
        : 0;

    const quality = {
      averageRelevanceScore: avgRelevance,
      feedbackPositive: ragEvents.filter((e: unknown) => e.feedback === "positive").length,
      feedbackNegative: ragEvents.filter((e: unknown) => e.feedback === "negative").length,
    };

    // Calculate cost metrics (simplified)
    const totalTokens = ragEvents.reduce((sum: any, e: unknown) => sum + (e.tokens_used || 0), 0);
    const estimatedCost = totalTokens * 0.0001; // Rough estimate

    const cost = {
      totalCost: estimatedCost,
      costPerRequest: ragEvents.length > 0 ? estimatedCost / ragEvents.length : 0,
    };

    return { performance, usage, quality, cost };
  } catch (error) {
    throw error;
  }
}

/**
 * Get performance insights
 */
export async function getPerformanceInsights(organizationId?: string, days: number = 7): Promise<PerformanceInsight[]> {
  try {
    const metrics = await getRAGMetrics(organizationId, days);
    const insights: PerformanceInsight[] = [];

    // Check response time
    if (metrics.performance.averageResponseTime > 2000) {
      insights.push({
        type: "warning",
        severity: "medium",
        title: "High Response Time",
        description: `Average response time is ${metrics.performance.averageResponseTime}ms`,
        recommendation: "Consider optimizing vector search or reducing context size",
      });
    }

    // Check error rate
    if (metrics.performance.errorRate > 0.05) {
      insights.push({
        type: "warning",
        severity: "high",
        title: "High Error Rate",
        description: `Error rate is ${(metrics.performance.errorRate * 100).toFixed(1)}%`,
        recommendation: "Review error logs and improve error handling",
      });
    }

    // Check quality
    if (metrics.quality.averageRelevanceScore < 0.7) {
      insights.push({
        type: "recommendation",
        severity: "medium",
        title: "Low Relevance Score",
        description: `Average relevance score is ${metrics.quality.averageRelevanceScore.toFixed(2)}`,
        recommendation: "Consider improving knowledge base content or search algorithms",
      });
    }

    // Check usage trends
    if (metrics.usage.totalRequests > 1000) {
      insights.push({
        type: "optimization",
        severity: "low",
        title: "High Usage Volume",
        description: `${metrics.usage.totalRequests} requests in ${days} days`,
        recommendation: "Consider implementing caching to reduce costs",
      });
    }

    return insights;
  } catch (error) {
    return [];
  }
}

/**
 * Log RAG event
 */
export async function logRAGEvent(event: {
  organizationId: string;
  operation: string;
  success: boolean;
  responseTime?: number;
  tokensUsed?: number;
  relevanceScore?: number;
  feedback?: "positive" | "negative";
  metadata?: Record<string, any>;
}) {
  try {
    const { error } = await supabase.from("rag_events").insert({
      organization_id: event.organizationId,
      operation: event.operation,
      success: event.success,
      response_time: event.responseTime,
      tokens_used: event.tokensUsed,
      relevance_score: event.relevanceScore,
      feedback: event.feedback,
      metadata: event.metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
    }
  } catch (error) {}
}

/**
 * Get RAG usage for organization
 */
export async function getOrganizationRAGUsage(
  organizationId: string | undefined,
  days: number = 30
): Promise<{
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalCost: number;
  dailyUsage: Array<{ date: string; count: number; cost: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const { data: events, error } = await supabase
      .from("rag_events")
      .select("*")
      .eq("organization_id", organizationId as string)
      .gte("created_at", startDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch organization RAG usage: ${error.message}`);
    }

    const ragEvents = events || [];
    const successfulEvents = ragEvents.filter((e: unknown) => e.success);
    const responseTimes = ragEvents.filter((e: unknown) => e.response_time).map((e: unknown) => e.response_time);

    const totalTokens = ragEvents.reduce((sum: any, e: unknown) => sum + (e.tokens_used || 0), 0);
    const totalCost = totalTokens * 0.0001; // Rough estimate

    const dailyUsage = aggregateByDay(ragEvents).map((day: unknown) => ({
      date: day.date,
      count: day.count,
      cost: day.count * (totalCost / ragEvents.length || 0),
    }));

    return {
      totalRequests: ragEvents.length,
      successRate: ragEvents.length > 0 ? successfulEvents.length / ragEvents.length : 0,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((sum: any, time: unknown) => sum + time, 0) / responseTimes.length
          : 0,
      totalCost,
      dailyUsage,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get real-time RAG status
 */
export async function getRAGStatus(): Promise<{
  status: "healthy" | "degraded" | "down";
  activeRequests: number;
  averageResponseTime: number;
  errorRate: number;
}> {
  try {
    // Get recent events (last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: recentEvents, error } = await supabase
      .from("rag_events")
      .select("*")
      .gte("created_at", fiveMinutesAgo.toISOString());

    if (error) {
      return {
        status: "down",
        activeRequests: 0,
        averageResponseTime: 0,
        errorRate: 1,
      };
    }

    const events = recentEvents || [];
    const successfulEvents = events.filter((e: unknown) => e.success);
    const responseTimes = events.filter((e: unknown) => e.response_time).map((e: unknown) => e.response_time);

    const errorRate = events.length > 0 ? (events.length - successfulEvents.length) / events.length : 0;
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum: any, time: unknown) => sum + time, 0) / responseTimes.length
        : 0;

    let status: "healthy" | "degraded" | "down" = "healthy";
    if (errorRate > 0.1 || avgResponseTime > 5000) {
      status = "degraded";
    }
    if (errorRate > 0.5) {
      status = "down";
    }

    return {
      status,
      activeRequests: events.length,
      averageResponseTime: avgResponseTime,
      errorRate,
    };
  } catch (error) {
    return {
      status: "down",
      activeRequests: 0,
      averageResponseTime: 0,
      errorRate: 1,
    };
  }
}

// Helper functions
function aggregateByDay(events: unknown[]): Array<{ date: string; count: number }> {
  const dayMap = new Map<string, number>();

  events.forEach((event: unknown) => {
    const date = new Date(event.created_at || new Date()).toISOString().split("T")[0];
    if (date) {
      dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
    }
  });

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
