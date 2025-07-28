/**
 * Unified Performance Monitor
 * Centralized performance monitoring and metrics collection
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface AlertConfig {
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  channels: ("console" | "webhook" | "email")[];
}

export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number;
  bufferSize: number;
  flushInterval: number;
  thresholds: PerformanceThreshold[];
  alerts: AlertConfig;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: "warning" | "critical";
  timestamp: Date;
  resolved: boolean;
}

export class UnifiedPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private config: MonitoringConfig;
  private observer?: PerformanceObserver;
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      bufferSize: 1000,
      flushInterval: 30000, // 30 seconds
      thresholds: [
        { metric: "response_time", warning: 1000, critical: 3000, unit: "ms" },
        { metric: "memory_usage", warning: 100, critical: 200, unit: "MB" },
        { metric: "cpu_usage", warning: 70, critical: 90, unit: "%" },
        { metric: "error_rate", warning: 0.05, critical: 0.1, unit: "%" },
      ],
      alerts: {
        enabled: true,
        channels: ["console"],
      },
      ...config,
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    // Initialize Web Performance API observer
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVital(entry);
        }
      });

      try {
        this.observer.observe({
          type: "navigation",
          buffered: true,
        });
        this.observer.observe({
          type: "paint",
          buffered: true,
        });
        this.observer.observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
        this.observer.observe({
          type: "first-input",
          buffered: true,
        });
        this.observer.observe({
          type: "layout-shift",
          buffered: true,
        });
      } catch (error) {}
    }

    // Start periodic flushing
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = "",
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      metadata,
    };

    this.metrics.push(metric);
    this.checkThresholds(metric);

    // Prevent buffer overflow
    if (this.metrics.length > this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Record API response time
   */
  recordApiResponse(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.recordMetric("api_response_time", duration, "ms", {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });

    // Record error rate
    if (statusCode >= 400) {
      this.recordMetric("api_error", 1, "count", {
        endpoint,
        method,
        status_code: statusCode.toString(),
      });
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(table: string, operation: string, duration: number, rowCount?: number): void {
    this.recordMetric("db_query_time", duration, "ms", {
      table,
      operation,
    });

    if (rowCount !== undefined) {
      this.recordMetric("db_rows_affected", rowCount, "count", {
        table,
        operation,
      });
    }
  }

  /**
   * Record real-time event
   */
  recordRealtimeEvent(eventType: string, duration?: number, metadata?: Record<string, any>): void {
    this.recordMetric(
      "realtime_event",
      1,
      "count",
      {
        event_type: eventType,
      },
      metadata
    );

    if (duration !== undefined) {
      this.recordMetric("realtime_latency", duration, "ms", {
        event_type: eventType,
      });
    }
  }

  /**
   * Record AI operation
   */
  recordAIOperation(operation: string, model: string, tokens: number, duration: number, confidence?: number): void {
    this.recordMetric("ai_operation_time", duration, "ms", {
      operation,
      model,
    });

    this.recordMetric("ai_tokens_used", tokens, "count", {
      operation,
      model,
    });

    if (confidence !== undefined) {
      this.recordMetric("ai_confidence", confidence, "score", {
        operation,
        model,
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(filters?: { name?: string; since?: Date; tags?: Record<string, string> }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filters?.name) {
      filtered = filtered.filter((m) => m.name === filters.name);
    }

    if (filters?.since) {
      filtered = filtered.filter((m) => m.timestamp >= filters.since!);
    }

    if (filters?.tags) {
      filtered = filtered.filter((m) => {
        if (!m.tags) return false;
        return Object.entries(filters.tags!).every(([key, value]) => m.tags![key] === value);
      });
    }

    return filtered;
  }

  /**
   * Get performance summary
   */
  getSummary(since?: Date): Record<string, any> {
    const metrics = this.getMetrics(since ? { since } : {});
    const summary: Record<string, any> = {};

    // Group by metric name
    const grouped = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) acc[metric.name] = [];
        acc[metric.name]?.push(metric.value);
        return acc;
      },
      {} as Record<string, number[]>
    );

    // Calculate statistics
    for (const [name, values] of Object.entries(grouped)) {
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99),
      };
    }

    return summary;
  }

  /**
   * Get active alerts
   */
  getAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Flush metrics to storage/external service
   */
  flush(): void {
    if (this.metrics.length === 0) return;

    // In a real implementation, this would send metrics to your monitoring service
    console.debug(`Flushing ${this.metrics.length} performance metrics`);

    // Clear buffer
    this.metrics = [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flush();
  }

  /**
   * Record web vital metrics
   */
  private recordWebVital(entry: PerformanceEntry): void {
    const name = entry.entryType === "navigation" ? "page_load" : entry.name;
    let value = 0;

    if (entry.entryType === "navigation") {
      const nav = entry as PerformanceNavigationTiming;
      value = nav.loadEventEnd - nav.navigationStart;
    } else if (entry.entryType === "paint") {
      value = entry.startTime;
    } else if (entry.entryType === "largest-contentful-paint") {
      value = entry.startTime;
    } else if (entry.entryType === "first-input") {
      const input = entry as PerformanceEventTiming;
      value = input.processingStart - input.startTime;
    } else if (entry.entryType === "layout-shift") {
      const shift = entry as any;
      value = shift.value;
    }

    this.recordMetric(`web_vital_${name}`, value, "ms", {
      entry_type: entry.entryType,
    });
  }

  /**
   * Check metric against thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.config.thresholds.find((t) => t.metric === metric.name);
    if (!threshold) return;

    let severity: "warning" | "critical" | null = null;
    let thresholdValue = 0;

    if (metric.value >= threshold.critical) {
      severity = "critical";
      thresholdValue = threshold.critical;
    } else if (metric.value >= threshold.warning) {
      severity = "warning";
      thresholdValue = threshold.warning;
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: `${metric.name}_${Date.now()}`,
        metric: metric.name,
        value: metric.value,
        threshold: thresholdValue,
        severity,
        timestamp: new Date(),
        resolved: false,
      };

      this.alerts.push(alert);
      this.sendAlert(alert);
    }
  }

  /**
   * Send alert notification
   */
  private sendAlert(alert: PerformanceAlert): void {
    if (!this.config.alerts.enabled) return;

    const message = `Performance Alert: ${alert.metric} = ${alert.value} exceeds ${alert.severity} threshold of ${alert.threshold}`;

    if (this.config.alerts.channels.includes("console")) {
    }

    // Additional alert channels would be implemented here
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }
}

// Export singleton instance
export const performanceMonitor = new UnifiedPerformanceMonitor();

// Export helper functions
export function startTimer(): () => number {
  const start = performance.now();
  return () => performance.now() - start;
}

export function measureAsync<T>(
  operation: () => Promise<T>,
  metricName: string,
  tags?: Record<string, string>
): Promise<T> {
  const timer = startTimer();
  return operation().finally(() => {
    performanceMonitor.recordMetric(metricName, timer(), "ms", tags);
  });
}

export function measureSync<T>(operation: () => T, metricName: string, tags?: Record<string, string>): T {
  const timer = startTimer();
  try {
    return operation();
  } finally {
    performanceMonitor.recordMetric(metricName, timer(), "ms", tags);
  }
}
