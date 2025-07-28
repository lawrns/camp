/**
 * AI Performance Monitoring Service
 *
 * Real-time metrics, confidence tracking, escalation analytics for:
 * - AI response quality and confidence levels
 * - Handover success rates and reasons
 * - Customer satisfaction correlation with AI interactions
 * - Performance benchmarking and optimization insights
 */

import { supabase } from "@/lib/supabase";

const supabaseClient = supabase.admin();

export interface AIPerformanceMetrics {
  totalInteractions: number;
  successfulResolutions: number;
  averageConfidence: number;
  handoverRate: number;
  averageResponseTime: number; // in seconds
  customerSatisfactionScore: number; // 0-10
  escalationRate: number;
  topHandoverReasons: Array<{ reason: string; count: number }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseQualityScore: number; // 0-100
  timeRange: {
    start: string;
    end: string;
  };
}

export interface AIInteractionEvent {
  id: string;
  conversationId: string;
  organizationId: string;
  type: "response_generated" | "handover_triggered" | "escalation_occurred" | "resolution_achieved";
  confidence: number;
  responseTime: number; // in seconds
  customerSatisfactionScore?: number;
  sentimentScore?: number;
  handoverReason?: string;
  escalationReason?: string;
  metadata: {
    modelUsed: string;
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
    timestamp: string;
  };
}

export interface PerformanceDashboardData {
  overview: AIPerformanceMetrics;
  realTimeEvents: AIInteractionEvent[];
  trends: {
    hourlyInteractions: Array<{ hour: string; count: number; avgConfidence: number }>;
    dailyPerformance: Array<{ date: string; handoverRate: number; satisfactionScore: number }>;
    confidenceDistribution: Array<{ range: string; count: number }>;
  };
  alerts: Array<{
    id: string;
    type: "low_confidence" | "high_handover_rate" | "poor_satisfaction" | "performance_degradation";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: string;
    conversationId?: string;
  }>;
}

export class AIPerformanceMonitoringService {
  private performanceThresholds = {
    minimumConfidence: 0.7,
    maxHandoverRate: 0.3, // 30%
    minSatisfactionScore: 7.0,
    maxResponseTime: 10, // seconds
    maxEscalationRate: 0.1, // 10%
  };

  /**
   * Track AI interaction performance
   */
  async trackInteraction(event: Omit<AIInteractionEvent, "id" | "metadata">): Promise<void> {
    try {
      const interactionEvent: AIInteractionEvent = {
        ...event,
        id: `ai-interaction-${Date.now()}`,
        metadata: {
          modelUsed: "gpt-4",
          promptTokens: 0,
          responseTokens: 0,
          totalTokens: 0,
          timestamp: new Date().toISOString(),
        },
      };

      // Save to database
      await supabase.from("ai_usage_events").insert({
        id: interactionEvent.id,
        conversation_id: interactionEvent.conversationId,
        organization_id: interactionEvent.organizationId,
        event_type: interactionEvent.type,
        confidence: interactionEvent.confidence,
        response_time: interactionEvent.responseTime,
        customer_satisfaction_score: interactionEvent.customerSatisfactionScore,
        sentiment_score: interactionEvent.sentimentScore,
        handover_reason: interactionEvent.handoverReason,
        escalation_reason: interactionEvent.escalationReason,
        metadata: interactionEvent.metadata,
      });

      // Check for performance alerts
      await this.checkPerformanceAlerts(interactionEvent);
    } catch (error) {}
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(
    organizationId: string,
    timeRange?: { start: string; end: string }
  ): Promise<PerformanceDashboardData> {
    try {
      const range = timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        end: new Date().toISOString(),
      };

      // Get performance metrics
      const overview = await this.calculateMetrics(organizationId, range);

      // Get real-time events (last 100)
      const realTimeEvents = await this.getRecentEvents(organizationId, 100);

      // Get trends data
      const trends = await this.calculateTrends(organizationId, range);

      // Get active alerts
      const alerts = await this.getActiveAlerts(organizationId);

      return {
        overview,
        realTimeEvents,
        trends,
        alerts,
      };
    } catch (error) {
      return this.getEmptyDashboardData();
    }
  }

  /**
   * Calculate performance metrics
   */
  private async calculateMetrics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<AIPerformanceMetrics> {
    try {
      // Get all events in time range
      const { data: events } = await supabase
        .from("ai_usage_events")
        .select("*")
        .eq("organization_id", organizationId)
        .gte("created_at", timeRange.start)
        .lte("created_at", timeRange.end);

      if (!events || events.length === 0) {
        return this.getEmptyMetrics(timeRange);
      }

      // Calculate basic metrics
      const totalInteractions = events.length;
      const responseEvents = events.filter((e: unknown) => e.event_type === "response_generated");
      const handoverEvents = events.filter((e: unknown) => e.event_type === "handover_triggered");
      const escalationEvents = events.filter((e: unknown) => e.event_type === "escalation_occurred");
      const resolutionEvents = events.filter((e: unknown) => e.event_type === "resolution_achieved");

      // Calculate averages
      const averageConfidence =
        responseEvents.length > 0
          ? responseEvents.reduce((sum: any, e: unknown) => sum + e.confidence, 0) / responseEvents.length
          : 0;

      const averageResponseTime =
        responseEvents.length > 0
          ? responseEvents.reduce((sum: any, e: unknown) => sum + e.response_time, 0) / responseEvents.length
          : 0;

      const satisfactionScores = events
        .filter((e: unknown) => e.customer_satisfaction_score !== null)
        .map((e: unknown) => e.customer_satisfaction_score);

      const customerSatisfactionScore =
        satisfactionScores.length > 0
          ? satisfactionScores.reduce((sum: any, score: unknown) => sum + score, 0) / satisfactionScores.length
          : 0;

      // Calculate rates
      const handoverRate = totalInteractions > 0 ? handoverEvents.length / totalInteractions : 0;
      const escalationRate = totalInteractions > 0 ? escalationEvents.length / totalInteractions : 0;

      // Get top handover reasons
      const handoverReasons = handoverEvents
        .filter((e: unknown) => e.handover_reason)
        .reduce(
          (acc: any, e: unknown) => {
            const reason = e.handover_reason;
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

      const topHandoverReasons = Object.entries(handoverReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate sentiment distribution
      const sentimentEvents = events.filter((e: unknown) => e.sentiment_score !== null);
      const sentimentDistribution = {
        positive: sentimentEvents.filter((e: unknown) => e.sentiment_score > 0.3).length,
        neutral: sentimentEvents.filter((e: unknown) => e.sentiment_score >= -0.3 && e.sentiment_score <= 0.3).length,
        negative: sentimentEvents.filter((e: unknown) => e.sentiment_score < -0.3).length,
      };

      // Calculate response quality score (0-100)
      const responseQualityScore = Math.round(
        averageConfidence * 40 + // 40% weight on confidence
          Math.min(customerSatisfactionScore / 10, 1) * 30 + // 30% weight on satisfaction
          Math.max(0, 1 - handoverRate) * 20 + // 20% weight on low handover rate
          Math.max(0, 1 - escalationRate) * 10 // 10% weight on low escalation rate
      );

      return {
        totalInteractions,
        successfulResolutions: resolutionEvents.length,
        averageConfidence,
        handoverRate,
        averageResponseTime,
        customerSatisfactionScore,
        escalationRate,
        topHandoverReasons,
        sentimentDistribution,
        responseQualityScore,
        timeRange,
      };
    } catch (error) {
      return this.getEmptyMetrics(timeRange);
    }
  }

  /**
   * Get recent events for real-time monitoring
   */
  private async getRecentEvents(organizationId: string, limit: number): Promise<AIInteractionEvent[]> {
    try {
      const { data: events } = await supabase
        .from("ai_usage_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (
        events?.map((event: unknown) => ({
          id: event.id,
          conversationId: event.conversation_id,
          organizationId: event.organization_id,
          type: event.event_type,
          confidence: event.confidence,
          responseTime: event.response_time,
          customerSatisfactionScore: event.customer_satisfaction_score,
          sentimentScore: event.sentiment_score,
          handoverReason: event.handover_reason,
          escalationReason: event.escalation_reason,
          metadata: event.metadata || {
            modelUsed: "unknown",
            promptTokens: 0,
            responseTokens: 0,
            totalTokens: 0,
            timestamp: event.created_at,
          },
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate trends data
   */
  private async calculateTrends(organizationId: string, timeRange: { start: string; end: string }): Promise<any> {
    try {
      // This would typically involve more complex aggregation queries
      // For now, return sample trend data
      return {
        hourlyInteractions: [],
        dailyPerformance: [],
        confidenceDistribution: [
          { range: "0.0-0.3", count: 5 },
          { range: "0.3-0.5", count: 12 },
          { range: "0.5-0.7", count: 28 },
          { range: "0.7-0.9", count: 45 },
          { range: "0.9-1.0", count: 32 },
        ],
      };
    } catch (error) {
      return {
        hourlyInteractions: [],
        dailyPerformance: [],
        confidenceDistribution: [],
      };
    }
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(organizationId: string): Promise<any[]> {
    try {
      const { data: alerts } = await supabase
        .from("ai_performance_alerts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      return (
        alerts?.map((alert: unknown) => ({
          id: alert.id,
          type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.created_at,
          conversationId: alert.conversation_id,
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(event: AIInteractionEvent): Promise<void> {
    try {
      const alerts: Array<{ type: string; severity: string; message: string }> = [];

      // Check confidence threshold
      if (event.confidence < this.performanceThresholds.minimumConfidence) {
        alerts.push({
          type: "low_confidence",
          severity: event.confidence < 0.5 ? "high" : "medium",
          message: `Low AI confidence detected: ${(event.confidence * 100).toFixed(1)}%`,
        });
      }

      // Check response time
      if (event.responseTime > this.performanceThresholds.maxResponseTime) {
        alerts.push({
          type: "performance_degradation",
          severity: event.responseTime > 20 ? "high" : "medium",
          message: `Slow AI response time: ${event.responseTime.toFixed(1)}s`,
        });
      }

      // Check customer satisfaction
      if (
        event.customerSatisfactionScore &&
        event.customerSatisfactionScore < this.performanceThresholds.minSatisfactionScore
      ) {
        alerts.push({
          type: "poor_satisfaction",
          severity: event.customerSatisfactionScore < 5 ? "high" : "medium",
          message: `Low customer satisfaction: ${event.customerSatisfactionScore.toFixed(1)}/10`,
        });
      }

      // Save alerts to database
      for (const alert of alerts) {
        await supabase.from("ai_performance_alerts").insert({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          organization_id: event.organizationId,
          conversation_id: event.conversationId,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          is_active: true,
          metadata: { event_id: event.id },
        });
      }

      if (alerts.length > 0) {
      }
    } catch (error) {}
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(timeRange: { start: string; end: string }): AIPerformanceMetrics {
    return {
      totalInteractions: 0,
      successfulResolutions: 0,
      averageConfidence: 0,
      handoverRate: 0,
      averageResponseTime: 0,
      customerSatisfactionScore: 0,
      escalationRate: 0,
      topHandoverReasons: [],
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      responseQualityScore: 0,
      timeRange,
    };
  }

  /**
   * Get empty dashboard data
   */
  private getEmptyDashboardData(): PerformanceDashboardData {
    const emptyTimeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    };

    return {
      overview: this.getEmptyMetrics(emptyTimeRange),
      realTimeEvents: [],
      trends: {
        hourlyInteractions: [],
        dailyPerformance: [],
        confidenceDistribution: [],
      },
      alerts: [],
    };
  }

  /**
   * Mark alert as resolved
   */
  async resolveAlert(alertId: string, organizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("ai_performance_alerts")
        .update({ is_active: false, resolved_at: new Date().toISOString() })
        .eq("id", alertId)
        .eq("organization_id", organizationId);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get performance recommendations
   */
  async getRecommendations(
    organizationId: string
  ): Promise<Array<{ type: string; message: string; priority: string }>> {
    try {
      const dashboardData = await this.getDashboardData(organizationId);
      const { overview } = dashboardData;
      const recommendations: Array<{ type: string; message: string; priority: string }> = [];

      // Analyze performance and generate recommendations
      if (overview.averageConfidence < 0.7) {
        recommendations.push({
          type: "confidence_improvement",
          message: "Consider improving AI training data or adjusting model parameters to increase confidence scores",
          priority: "high",
        });
      }

      if (overview.handoverRate > 0.4) {
        recommendations.push({
          type: "handover_reduction",
          message: "High handover rate detected. Review common handover reasons and improve AI capabilities",
          priority: "high",
        });
      }

      if (overview.customerSatisfactionScore < 7) {
        recommendations.push({
          type: "satisfaction_improvement",
          message: "Customer satisfaction is below target. Consider reviewing AI response quality and tone",
          priority: "medium",
        });
      }

      if (overview.averageResponseTime > 8) {
        recommendations.push({
          type: "performance_optimization",
          message: "Response times are slow. Consider optimizing AI model or infrastructure",
          priority: "medium",
        });
      }

      return recommendations;
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const aiPerformanceMonitoringService = new AIPerformanceMonitoringService();
