import { performance } from "perf_hooks";
import { context, metrics, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { env } from "@/lib/utils/env-config";

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "campfire-rag",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV || "development",
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || "http://localhost:4318/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || "http://localhost:4318/v1/metrics",
    }),
    exportIntervalMillis: 30000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK only in production or when explicitly enabled
if (env.NODE_ENV === "production" || process.env.ENABLE_TELEMETRY === "true") {
  sdk.start();
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private tracer = trace.getTracer("campfire-auth", "1.0.0");
  private meter = metrics.getMeter("campfire-metrics");
  private metrics: PerformanceMetrics[] = [];

  // OpenTelemetry metrics
  private authAttempts = this.meter.createCounter("auth_attempts_total", {
    description: "Total number of authentication attempts",
  });

  private aiResponses = this.meter.createCounter("ai_responses_total", {
    description: "Total number of AI responses generated",
  });

  private escalations = this.meter.createCounter("ai_escalations_total", {
    description: "Total number of AI escalations to humans",
  });

  private authDuration = this.meter.createHistogram("auth_duration_ms", {
    description: "Duration of authentication operations in milliseconds",
  });

  private aiResponseTime = this.meter.createHistogram("ai_response_time_ms", {
    description: "AI response generation time in milliseconds",
  });

  private confidence = this.meter.createHistogram("ai_confidence_score", {
    description: "AI response confidence scores",
  });

  static getInstance(): PerformanceTracker {
    if (!this.instance) {
      this.instance = new PerformanceTracker();
    }
    return this.instance;
  }

  async trackOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const span = this.tracer.startSpan(operation, {
      kind: SpanKind.INTERNAL,
      attributes: {
        "operation.name": operation,
        "operation.timestamp": new Date().toISOString(),
        ...metadata,
      },
    });

    const start = performance.now();

    try {
      // Execute within span context
      const result = await context.with(trace.setSpan(context.active(), span), async () => await fn());

      const duration = performance.now() - start;

      span.setAttributes({
        "operation.duration": duration,
        "operation.success": true,
      });

      span.setStatus({ code: SpanStatusCode.OK });

      // Record metrics
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
      const duration = performance.now() - start;

      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });

      // Record failed metric
      this.recordMetric({
        operation,
        duration,
        success: false,
        error: error as Error,
        ...(metadata !== undefined ? { metadata } : {}),
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Track multiple operations in parallel
   */
  async trackParallel<T extends Record<string, () => Promise<any>>>(
    operations: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const span = this.tracer.startSpan("parallel-operations", {
      kind: SpanKind.INTERNAL,
      attributes: {
        "operations.count": Object.keys(operations).length,
        "operations.names": Object.keys(operations).join(","),
      },
    });

    const start = performance.now();

    try {
      const results = await context.with(trace.setSpan(context.active(), span), async () => {
        const promises = Object.entries(operations).map(async ([name, fn]) => {
          const result = await this.trackOperation(name, fn);
          return [name, result];
        });

        const resolvedResults = await Promise.all(promises);
        return Object.fromEntries(resolvedResults);
      });

      const duration = performance.now() - start;

      span.setAttributes({
        "parallel.duration": duration,
        "parallel.success": true,
      });

      span.setStatus({ code: SpanStatusCode.OK });

      return results as unknown;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Track auth-specific operations
   */
  async trackAuthFlow<T>(step: "session" | "profile" | "organization" | "setup", fn: () => Promise<T>): Promise<T> {
    const start = performance.now();

    try {
      this.authAttempts.add(1, { step });
      const result = await this.trackOperation(`auth.${step}`, fn, {
        "auth.step": step,
        "auth.timestamp": Date.now(),
      });

      const duration = performance.now() - start;
      this.authDuration.record(duration, { step, success: "true" });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.authDuration.record(duration, { step, success: "false" });
      throw error;
    }
  }

  /**
   * Track AI-specific operations
   */
  async trackAIOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: { confidence?: number; tokens?: number }
  ): Promise<T> {
    const start = performance.now();

    try {
      this.aiResponses.add(1, { operation });
      const result = await this.trackOperation(`ai.${operation}`, fn, metadata);

      const duration = performance.now() - start;
      this.aiResponseTime.record(duration, { operation });

      if (metadata?.confidence !== undefined) {
        this.confidence.record(metadata.confidence, { operation });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record escalation events
   */
  recordEscalation(reason: string, organizationId: string) {
    this.escalations.add(1, { reason, organization_id: organizationId });

    const span = this.tracer.startSpan("ai.escalation");
    span.setAttributes({
      reason,
      organization_id: organizationId,
      timestamp: Date.now(),
    });
    span.end();
  }

  /**
   * Record cache operations
   */
  recordCacheHit(type: "memory" | "persistent" | "miss", key: string) {
    const cacheHits = this.meter.createCounter("cache_operations_total", {
      description: "Cache operations by type",
    });

    cacheHits.add(1, { type, cache_key_prefix: key.split(":")[0] });
  }

  /**
   * Record metric for analysis
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Emit to console in development
    if (env.NODE_ENV === "development") {
      const emoji = metric.success ? "✅" : "❌";
      const color = metric.duration < 500 ? "green" : metric.duration < 1000 ? "yellow" : "red";
    }
  }

  /**
   * Get performance report
   */
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

  /**
   * Clear metrics (useful for testing)
   */
  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// Helper function for manual instrumentation
export function createSpan(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveTracer().startSpan(name);
  if (attributes) {
    span.setAttributes(attributes);
  }
  return span;
}

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk.shutdown().finally(() => process.exit(0));
});
