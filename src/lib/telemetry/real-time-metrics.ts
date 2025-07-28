import { EventEmitter } from "events";
import { and, avg, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationMessages, conversations, userPresence } from "@/db/schema";

export interface RealTimeMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MetricThreshold {
  metric: string;
  operator: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
  value: number;
  severity: "low" | "medium" | "high" | "critical";
}

export interface MetricAlert {
  id: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
}

export class RealTimeMetricsService extends EventEmitter {
  private intervals: NodeJS.Timeout[] = [];
  private thresholds: Map<string, MetricThreshold[]> = new Map();
  private lastValues: Map<string, number> = new Map();
  private updateFrequency = 30000; // 30 seconds

  constructor() {
    super();
    this.setupMetricCollection();
  }

  private setupMetricCollection() {
    // All metric collection intervals disabled to prevent polling chaos
    // Metrics should be collected on-demand or through real-time events
    // This eliminates multiple 30-60 second intervals that were causing API spam

    return;

    // These intervals are commented out to prevent API polling
    // const conversationMetricsInterval = setInterval(() => this.collectConversationMetrics(), this.updateFrequency);
    // const responseTimeInterval = setInterval(() => this.collectResponseTimeMetrics(), this.updateFrequency);
    // const agentActivityInterval = setInterval(() => this.collectAgentActivityMetrics(), this.updateFrequency);
    // const systemHealthInterval = setInterval(() => this.collectSystemHealthMetrics(), this.updateFrequency);

    // this.intervals.push(conversationMetricsInterval, responseTimeInterval, agentActivityInterval, systemHealthInterval);
  }

  private async collectConversationMetrics() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Active conversations in last 5 minutes
      const activeConversationsResult = await db
        .select({ count: count() })
        .from(conversations)
        .where(and(gte(conversations.updatedAt, fiveMinutesAgo), eq(conversations.status, "open")));

      const activeConversations = activeConversationsResult[0]?.count || 0;

      // New conversations in last 5 minutes
      const newConversationsResult = await db
        .select({ count: count() })
        .from(conversations)
        .where(gte(conversations.createdAt, fiveMinutesAgo));

      const newConversations = newConversationsResult[0]?.count || 0;

      // Resolved conversations in last 5 minutes
      const resolvedConversationsResult = await db
        .select({ count: count() })
        .from(conversations)
        .where(and(gte(conversations.updatedAt, fiveMinutesAgo), eq(conversations.status, "resolved")));

      const resolvedConversations = resolvedConversationsResult[0]?.count || 0;

      // Emit metrics
      this.emitMetric("active_conversations", activeConversations);
      this.emitMetric("new_conversations_5min", newConversations);
      this.emitMetric("resolved_conversations_5min", resolvedConversations);

      // Calculate conversation resolution rate
      const resolutionRate = newConversations > 0 ? (resolvedConversations / newConversations) * 100 : 0;
      this.emitMetric("conversation_resolution_rate", resolutionRate);
    } catch (error) {}
  }

  private async collectResponseTimeMetrics() {
    try {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      // Average response time in last 15 minutes
      const responseTimeResult = await db
        .select({
          avgResponseTime: avg(
            sql`EXTRACT(EPOCH FROM (${conversationMessages.createdAt} - ${conversations.createdAt}))/60`
          ),
        })
        .from(conversations)
        .innerJoin(conversationMessages, eq(conversations.id, conversationMessages.conversationId))
        .where(and(gte(conversations.createdAt, fifteenMinutesAgo), eq(conversationMessages.role, "agent")));

      const avgResponseTime = Number(responseTimeResult[0]?.avgResponseTime) || 0;

      // 95th percentile response time (mock calculation for now)
      const p95ResponseTime = avgResponseTime * 1.5;

      this.emitMetric("avg_response_time", avgResponseTime);
      this.emitMetric("p95_response_time", p95ResponseTime);
    } catch (error) {}
  }

  private async collectAgentActivityMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Active agents (agents who sent messages in last hour)
      const activeAgentsResult = await db
        .select({ count: count(sql`DISTINCT ${conversationMessages.userId}`) })
        .from(conversationMessages)
        .where(and(gte(conversationMessages.createdAt, oneHourAgo), eq(conversationMessages.role, "agent")));

      const activeAgents = activeAgentsResult[0]?.count || 0;

      // Online agents (from user presence)
      const onlineAgentsResult = await db
        .select({ count: count() })
        .from(userPresence)
        .where(
          and(eq(userPresence.status, "online"), gte(userPresence.lastSeenAt, new Date(now.getTime() - 5 * 60 * 1000)))
        );

      const onlineAgents = onlineAgentsResult[0]?.count || 0;

      this.emitMetric("active_agents", activeAgents);
      this.emitMetric("online_agents", onlineAgents);

      // Agent utilization rate
      const utilizationRate = onlineAgents > 0 ? (activeAgents / onlineAgents) * 100 : 0;
      this.emitMetric("agent_utilization_rate", utilizationRate);
    } catch (error) {}
  }

  private async collectSystemHealthMetrics() {
    try {
      const now = new Date();

      // Database connection pool metrics (mock for now)
      const dbConnectionsActive = Math.floor(Math.random() * 20) + 5;
      const dbConnectionsIdle = Math.floor(Math.random() * 10) + 2;

      this.emitMetric("db_connections_active", dbConnectionsActive);
      this.emitMetric("db_connections_idle", dbConnectionsIdle);

      // Memory usage (mock for now)
      const memoryUsagePercent = Math.floor(Math.random() * 30) + 60;
      this.emitMetric("memory_usage_percent", memoryUsagePercent);

      // CPU usage (mock for now)
      const cpuUsagePercent = Math.floor(Math.random() * 40) + 20;
      this.emitMetric("cpu_usage_percent", cpuUsagePercent);

      // Request latency (mock for now)
      const avgRequestLatency = Math.floor(Math.random() * 50) + 100;
      this.emitMetric("avg_request_latency_ms", avgRequestLatency);
    } catch (error) {}
  }

  private emitMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: RealTimeMetric = {
      name,
      value,
      timestamp: new Date(),
    };

    if (metadata !== undefined) {
      metric.metadata = metadata;
    }

    // Store last value for threshold checking
    this.lastValues.set(name, value);

    // Check thresholds
    this.checkThresholds(metric);

    // Emit the metric
    this.emit("metric", metric);
    this.emit(`metric:${name}`, metric);
  }

  private checkThresholds(metric: RealTimeMetric) {
    const thresholds = this.thresholds.get(metric.name);
    if (!thresholds) return;

    for (const threshold of thresholds) {
      let triggered = false;

      switch (threshold.operator) {
        case "gt":
          triggered = metric.value > threshold.value;
          break;
        case "lt":
          triggered = metric.value < threshold.value;
          break;
        case "eq":
          triggered = metric.value === threshold.value;
          break;
        case "ne":
          triggered = metric.value !== threshold.value;
          break;
        case "gte":
          triggered = metric.value >= threshold.value;
          break;
        case "lte":
          triggered = metric.value <= threshold.value;
          break;
      }

      if (triggered) {
        const alert: MetricAlert = {
          id: `${metric.name}-${Date.now()}`,
          metric: metric.name,
          currentValue: metric.value,
          threshold: threshold.value,
          severity: threshold.severity,
          message: `${metric.name} ${threshold.operator} ${threshold.value} (current: ${metric.value})`,
          timestamp: metric.timestamp,
        };

        this.emit("alert", alert);
      }
    }
  }

  // Public methods
  addThreshold(threshold: MetricThreshold) {
    const existing = this.thresholds.get(threshold.metric) || [];
    existing.push(threshold);
    this.thresholds.set(threshold.metric, existing);
  }

  removeThreshold(metric: string, thresholdIndex: number) {
    const existing = this.thresholds.get(metric);
    if (existing && existing[thresholdIndex]) {
      existing.splice(thresholdIndex, 1);
      this.thresholds.set(metric, existing);
    }
  }

  getLastValue(metric: string): number | undefined {
    return this.lastValues.get(metric);
  }

  getAllLastValues(): Record<string, number> {
    return Object.fromEntries(this.lastValues);
  }

  // Get metric history (mock implementation)
  async getMetricHistory(metric: string, minutes: number = 60): Promise<RealTimeMetric[]> {
    // In a real implementation, this would query a time-series database
    const now = new Date();
    const history: RealTimeMetric[] = [];

    for (let i = minutes; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      const baseValue = this.lastValues.get(metric) || 0;
      const variance = baseValue * 0.1; // 10% variance
      const value = baseValue + (Math.random() - 0.5) * variance;

      history.push({
        name: metric,
        value: Math.max(0, value),
        timestamp,
      });
    }

    return history;
  }

  // Clean up
  destroy() {
    this.intervals.forEach((interval: any) => clearInterval(interval));
    this.intervals = [];
    this.removeAllListeners();
  }
}

// Singleton instance
export const realTimeMetricsService = new RealTimeMetricsService();
