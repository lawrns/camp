/**
 * AI Confidence Analytics Service
 * Provides analytics and insights for AI confidence scoring
 */

import { createApiClient } from "@/lib/supabase";

export interface ConfidenceMetrics {
  averageConfidence: number;
  totalResponses: number;
  escalationRate: number;
  confidenceDistribution: {
    high: number; // > 0.8
    medium: number; // 0.5 - 0.8
    low: number; // < 0.5
  };
  responsesByModel: Record<string, number>;
  averageResponseTime: number; // in ms
  sourcesUsedAverage: number;
}

export interface ConfidenceTrend {
  timestamp: string;
  confidence: number;
  responseCount: number;
  escalated: boolean;
  processingTime: number;
  sourcesUsed: number;
}

export interface ThresholdRecommendation {
  currentThreshold: number;
  recommendedThreshold: number;
  confidence: number;
  reasoning: string;
  potentialImpact: {
    escalationRateChange: number;
    automationRateChange: number;
  };
}

export interface OrganizationProfile {
  organizationId: string;
  industryType?: string;
  averageQueryComplexity: number;
  peakHours: number[];
  preferredEscalationRate: number;
  historicalThresholds: Array<{
    threshold: number;
    period: string;
    performance: number;
  }>;
}

class ConfidenceAnalyticsService {
  private supabase: ReturnType<typeof createApiClient>;

  constructor() {
    this.supabase = createApiClient();
  }

  /**
   * Get confidence metrics for an organization
   */
  async getConfidenceMetrics(
    organizationId: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
  ): Promise<ConfidenceMetrics> {
    const startDate = this.getStartDate(timeRange);

    // Get AI sessions for the time range
    const { data: sessions, error } = await this.supabase
      .from("ai_sessions")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString());

    if (error || !sessions) {

      return this.getEmptyMetrics();
    }

    // Calculate metrics
    const totalResponses = sessions.length;
    const totalConfidence = sessions.reduce((sum, s) => sum + (s.confidence_score || 0), 0);
    const averageConfidence = totalResponses > 0 ? totalConfidence / totalResponses : 0;

    const escalatedCount = sessions.filter((s) => s.escalated_to_human).length;
    const escalationRate = totalResponses > 0 ? escalatedCount / totalResponses : 0;

    // Confidence distribution
    const distribution = {
      high: sessions.filter((s) => (s.confidence_score || 0) > 0.8).length,
      medium: sessions.filter((s) => (s.confidence_score || 0) >= 0.5 && (s.confidence_score || 0) <= 0.8).length,
      low: sessions.filter((s) => (s.confidence_score || 0) < 0.5).length,
    };

    // Responses by model
    const responsesByModel = sessions.reduce(
      (acc, session) => {
        const model = session.model || "unknown";
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Average processing time
    const totalProcessingTime = sessions.reduce((sum, s) => sum + (s.processing_time_ms || 0), 0);
    const averageResponseTime = totalResponses > 0 ? totalProcessingTime / totalResponses : 0;

    // Sources used average
    const totalSources = sessions.reduce((sum, s) => sum + (s.sources_used || 0), 0);
    const sourcesUsedAverage = totalResponses > 0 ? totalSources / totalResponses : 0;

    return {
      averageConfidence,
      totalResponses,
      escalationRate,
      confidenceDistribution: distribution,
      responsesByModel,
      averageResponseTime,
      sourcesUsedAverage,
    };
  }

  /**
   * Get confidence trends over time
   */
  async getConfidenceTrends(
    organizationId: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
    granularity: "hour" | "day" = "hour"
  ): Promise<ConfidenceTrend[]> {
    const startDate = this.getStartDate(timeRange);

    const { data: sessions, error } = await this.supabase
      .from("ai_sessions")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error || !sessions) {

      return [];
    }

    // Group sessions by time interval
    const trendsMap = new Map<string, ConfidenceTrend>();

    sessions.forEach((session) => {
      const date = new Date(session.created_at);
      const key = granularity === "hour" ? `${date.toISOString().slice(0, 13)}:00:00` : date.toISOString().slice(0, 10);

      if (!trendsMap.has(key)) {
        trendsMap.set(key, {
          timestamp: key,
          confidence: 0,
          responseCount: 0,
          escalated: false,
          processingTime: 0,
          sourcesUsed: 0,
        });
      }

      const trend = trendsMap.get(key)!;
      trend.confidence += session.confidence_score || 0;
      trend.responseCount++;
      trend.escalated = trend.escalated || session.escalated_to_human;
      trend.processingTime += session.processing_time_ms || 0;
      trend.sourcesUsed += session.sources_used || 0;
    });

    // Calculate averages
    return Array.from(trendsMap.values()).map((trend) => ({
      ...trend,
      confidence: trend.responseCount > 0 ? trend.confidence / trend.responseCount : 0,
      processingTime: trend.responseCount > 0 ? trend.processingTime / trend.responseCount : 0,
      sourcesUsed: trend.responseCount > 0 ? trend.sourcesUsed / trend.responseCount : 0,
    }));
  }

  /**
   * Get threshold recommendation based on historical data
   */
  async getThresholdRecommendation(organizationId: string, currentThreshold: number): Promise<ThresholdRecommendation> {
    // Get recent metrics
    const metrics = await this.getConfidenceMetrics(organizationId, "7d");

    // Analyze escalation patterns
    const targetEscalationRate = 0.15; // 15% target escalation rate
    const currentEscalationRate = metrics.escalationRate;

    let recommendedThreshold = currentThreshold;
    let reasoning = "";

    if (currentEscalationRate > targetEscalationRate * 1.5) {
      // Too many escalations
      recommendedThreshold = Math.max(0.3, currentThreshold - 0.1);
      reasoning = "High escalation rate detected. Lowering threshold to reduce human handovers.";
    } else if (currentEscalationRate < targetEscalationRate * 0.5) {
      // Too few escalations
      recommendedThreshold = Math.min(0.9, currentThreshold + 0.1);
      reasoning = "Low escalation rate detected. Raising threshold to ensure quality responses.";
    } else {
      reasoning = "Current threshold is performing within optimal range.";
    }

    // Calculate potential impact
    const potentialEscalationChange = (recommendedThreshold - currentThreshold) * -0.3; // Rough estimate
    const potentialAutomationChange = -potentialEscalationChange;

    return {
      currentThreshold,
      recommendedThreshold,
      confidence: 0.85, // Confidence in the recommendation
      reasoning,
      potentialImpact: {
        escalationRateChange: potentialEscalationChange,
        automationRateChange: potentialAutomationChange,
      },
    };
  }

  /**
   * Get organization profile for analytics
   */
  async getOrganizationProfile(organizationId: string): Promise<OrganizationProfile> {
    // Get historical data
    const { data: sessions } = await this.supabase
      .from("ai_sessions")
      .select("created_at, confidence_threshold, confidence_score")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1000);

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    sessions?.forEach((session) => {
      const hour = new Date(session.created_at).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > maxCount * 0.7)
      .map(({ hour }) => hour);

    // Get historical thresholds
    const thresholdMap = new Map<number, { count: number; performance: number }>();
    sessions?.forEach((session) => {
      const threshold = session.confidence_threshold || 0.6;
      if (!thresholdMap.has(threshold)) {
        thresholdMap.set(threshold, { count: 0, performance: 0 });
      }
      const data = thresholdMap.get(threshold)!;
      data.count++;
      data.performance += session.confidence_score || 0;
    });

    const historicalThresholds = Array.from(thresholdMap.entries())
      .map(([threshold, data]) => ({
        threshold,
        period: "historical",
        performance: data.performance / data.count,
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);

    const profile: OrganizationProfile = {
      organizationId,
      averageQueryComplexity: 0.65, // Placeholder - would be calculated from query analysis
      peakHours,
      preferredEscalationRate: 0.15,
      historicalThresholds,
    };
    // industryType is optional, so we don't include it when undefined
    return profile;
  }

  /**
   * Analyze knowledge base quality
   */
  async analyzeKnowledgeBaseQuality(organizationId: string): Promise<{
    coverage: number;
    accuracy: number;
    freshness: number;
    recommendations: Array<{
      type: string;
      priority: "high" | "medium" | "low";
      message: string;
    }>;
  }> {
    // This would analyze knowledge base documents and their usage
    // For now, return placeholder data
    return {
      coverage: 0.75,
      accuracy: 0.88,
      freshness: 0.92,
      recommendations: [
        {
          type: "content_gap",
          priority: "high",
          message: "Add more content about refund policies",
        },
        {
          type: "update_needed",
          priority: "medium",
          message: "Update pricing information in 3 documents",
        },
      ],
    };
  }

  /**
   * Helper to calculate start date based on time range
   */
  private getStartDate(timeRange: "1h" | "24h" | "7d" | "30d"): Date {
    const now = new Date();
    switch (timeRange) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): ConfidenceMetrics {
    return {
      averageConfidence: 0,
      totalResponses: 0,
      escalationRate: 0,
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
      responsesByModel: {},
      averageResponseTime: 0,
      sourcesUsedAverage: 0,
    };
  }
}

// Singleton instance
let analyticsService: ConfidenceAnalyticsService | null = null;

/**
 * Get the confidence analytics service instance
 */
export function getConfidenceAnalyticsService(): ConfidenceAnalyticsService {
  if (!analyticsService) {
    analyticsService = new ConfidenceAnalyticsService();
  }
  return analyticsService;
}

/**
 * Export singleton instance for convenience
 */
export const confidenceAnalytics = getConfidenceAnalyticsService();
