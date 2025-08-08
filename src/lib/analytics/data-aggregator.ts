import { supabase } from "@/lib/supabase";

export interface AnalyticsFilter {
  timeRange: "24h" | "7d" | "30d" | "90d" | "12m" | "custom";
  dateRange?:
    | {
        start: Date;
        end: Date;
      }
    | undefined;
  mailboxSlug?: string | undefined;
  agentId?: string | undefined;
  channelType?: string | undefined;
  category?: string | undefined;
  organizationId?: string | undefined;
}

export interface ConversationMetrics {
  totalConversations: number;
  resolvedConversations: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  firstResponseTime: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalConversations: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
}

export interface ChannelDistribution {
  channel: string;
  count: number;
  percentage: number;
}

export interface AnalyticsInsights {
  summary: string;
  recommendations: string[];
  trends: {
    type: "increase" | "decrease" | "stable";
    metric: string;
    value: number;
    change: number;
  }[];
}

export interface AnomalyDetection {
  detected: boolean;
  anomalies: {
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: "low" | "medium" | "high";
    timestamp: string;
  }[];
}

class DataAggregator {
  private supabaseClient = supabase.admin();

  private getDateRange(filter: AnalyticsFilter): { start: Date; end: Date } {
    if (filter.dateRange) {
      return filter.dateRange;
    }

    const end = new Date();
    const start = new Date();

    switch (filter.timeRange) {
      case "24h":
        start.setHours(start.getHours() - 24);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "12m":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }

  async getConversationMetrics(filter: AnalyticsFilter): Promise<ConversationMetrics> {
    const { start, end } = this.getDateRange(filter);

    try {
      // Build base query
      let query = this.supabaseClient
        .from("conversations")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (filter.organizationId) {
        query = query.eq("organization_id", filter.organizationId);
      }

      const { data: conversations, error } = await query;
      if (error) throw error;

      const totalConversations = conversations?.length || 0;
      const resolvedConversations =
        conversations?.filter((c) => c.status === "resolved" || c.status === "closed").length || 0;

      // Calculate response times from messages
      const messageQuery = this.supabaseClient
        .from("messages")
        .select("created_at, conversation_id, sender_type")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (filter.organizationId) {
        messageQuery.eq("organization_id", filter.organizationId);
      }

      const { data: messages } = await messageQuery;

      // Calculate average response time (simplified)
      let totalResponseTime = 0;
      let responseCount = 0;

      if (messages && conversations) {
        conversations.forEach((conv) => {
          const convMessages = messages.filter((m) => m.conversation_id === conv.id);
          if (convMessages.length >= 2) {
            const firstCustomer = convMessages.find((m) => m.senderType === "customer");
            const firstAgent = convMessages.find(
              (m) =>
                m.senderType === "agent" &&
                firstCustomer &&
                new Date(m.created_at) > new Date(firstCustomer.created_at)
            );

            if (firstCustomer && firstAgent) {
              const responseTime =
                new Date(firstAgent.created_at).getTime() - new Date(firstCustomer.created_at).getTime();
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        });
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 / 60 : 0; // in minutes

      return {
        totalConversations,
        resolvedConversations,
        avgResponseTime,
        avgResolutionTime: avgResponseTime * 2, // Estimate resolution time
        satisfactionScore: 4.2, // TODO: Implement from feedback table
        firstResponseTime: avgResponseTime,
      };
    } catch (error) {

      return {
        totalConversations: 0,
        resolvedConversations: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        satisfactionScore: 0,
        firstResponseTime: 0,
      };
    }
  }

  async getConversationVolumeTimeSeries(filter: AnalyticsFilter): Promise<TimeSeriesData[]> {
    const { start, end } = this.getDateRange(filter);
    const timeSeries: TimeSeriesData[] = [];

    try {
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < daysDiff; i++) {
        const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        let query = this.supabaseClient
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString())
          .lt("created_at", dayEnd.toISOString());

        if (filter.organizationId) {
          query = query.eq("organization_id", filter.organizationId);
        }

        const { count } = await query;

        timeSeries.push({
          timestamp: dayStart.toISOString(),
          value: count || 0,
        });
      }

      return timeSeries;
    } catch (error) {

      return [];
    }
  }

  async getResponseTimeTimeSeries(filter: AnalyticsFilter): Promise<TimeSeriesData[]> {
    // Simplified implementation - in production would calculate actual response times per day
    const volumeData = await this.getConversationVolumeTimeSeries(filter);
    return volumeData.map((point) => ({
      timestamp: point.timestamp,
      value: 2.5 + Math.random() * 2, // Mock response time in minutes
    }));
  }

  async getCategoryBreakdown(filter: AnalyticsFilter): Promise<CategoryBreakdown[]> {
    // TODO: Implement based on conversation tags or categories
    return [
      { category: "Support", count: 45, percentage: 45 },
      { category: "Sales", count: 30, percentage: 30 },
      { category: "Technical", count: 25, percentage: 25 },
    ];
  }

  async getAgentPerformance(filter: AnalyticsFilter): Promise<AgentPerformance[]> {
    const { start, end } = this.getDateRange(filter);

    try {
      // Get conversations assigned to agents
      let query = this.supabaseClient
        .from("conversations")
        .select("assigned_to_user_id, status")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .not("assigned_to_user_id", "is", null);

      if (filter.organizationId) {
        query = query.eq("organization_id", filter.organizationId);
      }

      const { data: conversations } = await query;
      if (!conversations) return [];

      // Group by agent
      const agentStats = conversations.reduce(
        (acc, conv) => {
          const agentId = conv.assigned_to_user_id;
          if (!acc[agentId]) {
            acc[agentId] = {
              totalConversations: 0,
              resolvedConversations: 0,
            };
          }
          acc[agentId].totalConversations++;
          if (conv.status === "resolved" || conv.status === "closed") {
            acc[agentId].resolvedConversations++;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.entries(agentStats).map(([agentId, stats]) => ({
        agentId,
        agentName: `Agent ${agentId.slice(0, 8)}`, // TODO: Get real agent names
        totalConversations: stats.totalConversations,
        avgResponseTime: 2.5 + Math.random() * 2, // TODO: Calculate real response time
        satisfactionScore: 4.0 + Math.random() * 1, // TODO: Get from feedback
        resolutionRate: stats.resolvedConversations / stats.totalConversations,
      }));
    } catch (error) {

      return [];
    }
  }

  async getChannelDistribution(filter: AnalyticsFilter): Promise<ChannelDistribution[]> {
    // TODO: Implement based on message source or conversation channel
    return [
      { channel: "Chat", count: 60, percentage: 60 },
      { channel: "Email", count: 25, percentage: 25 },
      { channel: "API", count: 15, percentage: 15 },
    ];
  }

  async generateInsights(filter: AnalyticsFilter): Promise<AnalyticsInsights> {
    const metrics = await this.getConversationMetrics(filter);

    return {
      summary: `Analyzed ${metrics.totalConversations} conversations with ${metrics.resolvedConversations} resolved.`,
      recommendations: [
        "Consider implementing automated responses for common queries",
        "Monitor response times to maintain customer satisfaction",
        "Review unresolved conversations for improvement opportunities",
      ],
      trends: [
        {
          type: metrics.totalConversations > 100 ? "increase" : "stable",
          metric: "conversation_volume",
          value: metrics.totalConversations,
          change: 5.2,
        },
      ],
    };
  }

  async detectAnomalies(filter: AnalyticsFilter): Promise<AnomalyDetection> {
    const metrics = await this.getConversationMetrics(filter);

    // Simple anomaly detection - in production would use statistical methods
    const anomalies = [];

    if (metrics.avgResponseTime > 10) {
      // More than 10 minutes
      anomalies.push({
        metric: "response_time",
        value: metrics.avgResponseTime,
        expectedValue: 5,
        deviation: metrics.avgResponseTime - 5,
        severity: "high" as const,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      detected: anomalies.length > 0,
      anomalies,
    };
  }
}

export const dataAggregator = new DataAggregator();
