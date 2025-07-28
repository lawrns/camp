/**
 * Centralized Performance Measurement Infrastructure
 *
 * Tracks all performance metrics across domains to ensure targets are met:
 * - Message latency (<100ms)
 * - Dashboard load (<500ms)
 * - Notification latency (<100ms)
 * - Widget load (<100ms)
 * - AI response time (<2000ms)
 * - Database query time (<200ms)
 * - Real-time sync latency (<500ms)
 * - Authentication time (<300ms)
 * - File upload time (<5000ms)
 * - Search response time (<300ms)
 * - Analytics load time (<1000ms)
 * - Conversation load time (<400ms)
 * - Ticket creation time (<500ms)
 */

import { supabase } from "@/lib/supabase/consolidated-exports";

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  timestamp: Date;
  organizationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  category: PerformanceCategory;
  severity: "info" | "warning" | "error";
}

export type PerformanceCategory =
  | "messaging"
  | "dashboard"
  | "notifications"
  | "widgets"
  | "ai"
  | "database"
  | "realtime"
  | "authentication"
  | "files"
  | "search"
  | "analytics"
  | "conversations"
  | "tickets";

export interface PerformanceTarget {
  name: string;
  target: number;
  unit: string;
  category: PerformanceCategory;
  description: string;
}

export const PERFORMANCE_TARGETS: PerformanceTarget[] = [
  { name: "message_send_latency", target: 100, unit: "ms", category: "messaging", description: "Time to send message" },
  {
    name: "message_receive_latency",
    target: 100,
    unit: "ms",
    category: "messaging",
    description: "Time to receive message",
  },
  {
    name: "dashboard_load_time",
    target: 500,
    unit: "ms",
    category: "dashboard",
    description: "Dashboard initial load time",
  },
  {
    name: "notification_latency",
    target: 100,
    unit: "ms",
    category: "notifications",
    description: "Real-time notification delivery",
  },
  { name: "widget_load_time", target: 100, unit: "ms", category: "widgets", description: "Widget initialization time" },
  {
    name: "widget_message_latency",
    target: 100,
    unit: "ms",
    category: "widgets",
    description: "Widget message send/receive",
  },
  { name: "ai_response_time", target: 2000, unit: "ms", category: "ai", description: "AI response generation time" },
  {
    name: "ai_confidence_calculation",
    target: 500,
    unit: "ms",
    category: "ai",
    description: "AI confidence score calculation",
  },
  {
    name: "database_query_time",
    target: 200,
    unit: "ms",
    category: "database",
    description: "Database query execution",
  },
  {
    name: "realtime_sync_latency",
    target: 500,
    unit: "ms",
    category: "realtime",
    description: "Real-time data synchronization",
  },
  {
    name: "authentication_time",
    target: 300,
    unit: "ms",
    category: "authentication",
    description: "User authentication process",
  },
  { name: "file_upload_time", target: 5000, unit: "ms", category: "files", description: "File upload completion" },
  { name: "search_response_time", target: 300, unit: "ms", category: "search", description: "Search query response" },
  {
    name: "analytics_load_time",
    target: 1000,
    unit: "ms",
    category: "analytics",
    description: "Analytics dashboard load",
  },
  {
    name: "conversation_load_time",
    target: 400,
    unit: "ms",
    category: "conversations",
    description: "Conversation view load",
  },
  {
    name: "ticket_creation_time",
    target: 500,
    unit: "ms",
    category: "tickets",
    description: "Ticket creation process",
  },
];

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private supabaseClient = supabase.admin();

  public static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Start tracking a performance metric
   */
  startTracking(name: string, metadata?: Record<string, any>): string {
    const trackingId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    // Store start time in metadata
    const trackingMetadata = {
      ...metadata,
      startTime,
      trackingId,
    };

    // Store in memory for completion
    if (!this.metrics.has(trackingId)) {
      this.metrics.set(trackingId, []);
    }

    return trackingId;
  }

  /**
   * Complete tracking and record the metric
   */
  async completeTracking(
    trackingId: string,
    organizationId?: string,
    userId?: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const endTime = performance.now();

    // Extract name from tracking ID
    const name = trackingId.split("_")[0];
    const target = PERFORMANCE_TARGETS.find((t) => t.name === name);

    if (!target) {

      return;
    }

    // Get stored metrics for this tracking ID
    const storedMetrics = this.metrics.get(trackingId) || [];
    const startMetadata = storedMetrics[0]?.metadata;
    const startTime = startMetadata?.startTime || endTime;

    const duration = endTime - startTime;
    const severity = duration > target.target * 1.5 ? "error" : duration > target.target ? "warning" : "info";

    const metric: PerformanceMetric = {
      id: trackingId,
      name,
      value: duration,
      target: target.target,
      unit: target.unit,
      timestamp: new Date(),
      organizationId,
      userId,
      metadata: {
        ...startMetadata,
        ...additionalMetadata,
        duration,
        endTime,
      },
      category: target.category,
      severity,
    };

    // Store in memory
    const metrics = this.metrics.get(name) || [];
    metrics.push(metric);
    this.metrics.set(name, metrics);

    // Persist to database (async, don't block)
    this.persistMetric(metric).catch((error) => {

    });

    // Clean up tracking data
    this.metrics.delete(trackingId);

    // Log performance issues
    if (severity !== "info") {

    }
  }

  /**
   * Record a simple metric without tracking
   */
  async recordMetric(
    name: string,
    value: number,
    organizationId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const target = PERFORMANCE_TARGETS.find((t) => t.name === name);

    if (!target) {

      return;
    }

    const severity = value > target.target * 1.5 ? "error" : value > target.target ? "warning" : "info";

    const metric: PerformanceMetric = {
      id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      target: target.target,
      unit: target.unit,
      timestamp: new Date(),
      organizationId,
      userId,
      metadata,
      category: target.category,
      severity,
    };

    // Store in memory
    const metrics = this.metrics.get(name) || [];
    metrics.push(metric);
    this.metrics.set(name, metrics);

    // Persist to database
    await this.persistMetric(metric);

    if (severity !== "info") {

    }
  }

  /**
   * Get performance metrics for analysis
   */
  getMetrics(
    name?: string,
    category?: PerformanceCategory,
    timeRange?: { start: Date; end: Date }
  ): PerformanceMetric[] {
    let allMetrics: PerformanceMetric[] = [];

    if (name) {
      allMetrics = this.metrics.get(name) || [];
    } else {
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics);
      }
    }

    // Filter by category
    if (category) {
      allMetrics = allMetrics.filter((m) => m.category === category);
    }

    // Filter by time range
    if (timeRange) {
      allMetrics = allMetrics.filter((m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(category?: PerformanceCategory): {
    totalMetrics: number;
    targetsMetCount: number;
    averagePerformance: number;
    worstPerformers: PerformanceMetric[];
    categoryBreakdown: Record<string, number>;
  } {
    const metrics = this.getMetrics(undefined, category);

    const targetsMetCount = metrics.filter((m) => m.value <= m.target).length;
    const averagePerformance =
      metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value / m.target, 0) / metrics.length : 0;

    const worstPerformers = metrics
      .filter((m) => m.severity === "error")
      .sort((a, b) => b.value / b.target - a.value / a.target)
      .slice(0, 5);

    const categoryBreakdown = metrics.reduce(
      (acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalMetrics: metrics.length,
      targetsMetCount,
      averagePerformance,
      worstPerformers,
      categoryBreakdown,
    };
  }

  /**
   * Persist metric to database
   */
  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const { error } = await this.supabaseClient.from("performance_metrics").insert({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        target: metric.target,
        unit: metric.unit,
        timestamp: metric.timestamp.toISOString(),
        organization_id: metric.organizationId,
        user_id: metric.userId,
        metadata: metric.metadata,
        category: metric.category,
        severity: metric.severity,
      });

      if (error) {

      }
    } catch (error) {

    }
  }

  /**
   * Clear old metrics from memory (keep last 1000 per metric)
   */
  cleanup(): void {
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 1000) {
        const sorted = metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        this.metrics.set(name, sorted.slice(0, 1000));
      }
    }
  }
}
