import { env } from "@/lib/utils/env-config";

/**
 * Lightweight Performance Tracker
 * A simpler alternative to OpenTelemetry that works in Edge Runtime
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export class LightweightPerformanceTracker {
  private static instance: LightweightPerformanceTracker;
  private metrics: PerformanceMetrics[] = [];
  private enabled: boolean;

  constructor() {
    // Only enable in development or when explicitly enabled
    this.enabled = env.NODE_ENV === "development" || process.env.ENABLE_LIGHTWEIGHT_TELEMETRY === "true";
  }

  static getInstance(): LightweightPerformanceTracker {
    if (!this.instance) {
      this.instance = new LightweightPerformanceTracker();
    }
    return this.instance;
  }

  async trackOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.recordMetric({
        operation,
        duration,
        success: true,
        ...(metadata !== undefined ? { metadata } : {}),
      });

      // Log slow operations
      if (duration > 1000) {
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.recordMetric({
        operation,
        duration,
        success: false,
        error: error as Error,
        ...(metadata !== undefined ? { metadata } : {}),
      });

      throw error;
    }
  }

  async trackParallel<T extends Record<string, () => Promise<any>>>(
    operations: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    if (!this.enabled) {
      const promises = Object.entries(operations).map(async ([name, fn]) => {
        const result = await fn();
        return [name, result];
      });
      const resolvedResults = await Promise.all(promises);
      return Object.fromEntries(resolvedResults) as unknown;
    }

    const start = Date.now();

    try {
      const promises = Object.entries(operations).map(async ([name, fn]) => {
        const result = await this.trackOperation(name, fn);
        return [name, result];
      });

      const resolvedResults = await Promise.all(promises);
      const duration = Date.now() - start;

      this.recordMetric({
        operation: "parallel-operations",
        duration,
        success: true,
        metadata: {
          operationCount: Object.keys(operations).length,
          operations: Object.keys(operations),
        },
      });

      return Object.fromEntries(resolvedResults) as unknown;
    } catch (error) {
      const duration = Date.now() - start;

      this.recordMetric({
        operation: "parallel-operations",
        duration,
        success: false,
        error: error as Error,
      });

      throw error;
    }
  }

  async trackAuthFlow<T>(step: "session" | "profile" | "organization" | "setup", fn: () => Promise<T>): Promise<T> {
    return this.trackOperation(`auth.${step}`, fn, { authStep: step });
  }

  async trackAIOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: { confidence?: number; tokens?: number }
  ): Promise<T> {
    return this.trackOperation(`ai.${operation}`, fn, metadata);
  }

  recordEscalation(reason: string, organizationId: string) {
    if (!this.enabled) return;

    this.recordMetric({
      operation: "ai.escalation",
      duration: 0,
      success: true,
      metadata: { reason, organizationId },
    });
  }

  recordCacheHit(type: "memory" | "persistent" | "miss", key: string) {
    if (!this.enabled) return;

    this.recordMetric({
      operation: "cache.operation",
      duration: 0,
      success: true,
      metadata: { type, cacheKey: key },
    });
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leak
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Emit to console in development
    if (env.NODE_ENV === "development") {
      const emoji = metric.success ? "✅" : "❌";
      const durationStr = metric.duration > 0 ? ` ${metric.duration}ms` : "";
    }
  }

  getReport(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
    failureRate: number;
    operationBreakdown: Record<string, { count: number; avgDuration: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        failureRate: 0,
        operationBreakdown: {},
      };
    }

    const totalDuration = this.metrics.reduce((sum: unknown, m: unknown) => sum + m.duration, 0);
    const failures = this.metrics.filter((m: unknown) => !m.success).length;
    const slowest = this.metrics.reduce((max: unknown, m: unknown) => (m.duration > (max?.duration || 0) ? m : max));

    // Group by operation
    const breakdown = this.metrics.reduce(
      (acc, m) => {
        if (!acc[m.operation]) {
          acc[m.operation] = { count: 0, totalDuration: 0 };
        }
        acc[m.operation]!.count++;
        acc[m.operation]!.totalDuration += m.duration;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>
    );

    const operationBreakdown = Object.entries(breakdown).reduce(
      (acc, [op, data]) => {
        acc[op] = {
          count: data.count,
          avgDuration: data.totalDuration / data.count,
        };
        return acc;
      },
      {} as Record<string, { count: number; avgDuration: number }>
    );

    return {
      totalOperations: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      slowestOperation: slowest,
      failureRate: (failures / this.metrics.length) * 100,
      operationBreakdown,
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceTracker = LightweightPerformanceTracker.getInstance();

// Helper function for manual timing
export function createTimer(name: string) {
  const start = Date.now();
  return {
    end: (success = true, metadata?: Record<string, any>) => {
      if (performanceTracker) {
        performanceTracker["recordMetric"]({
          operation: name,
          duration: Date.now() - start,
          success,
          ...(metadata !== undefined ? { metadata } : {}),
        });
      }
    },
  };
}
