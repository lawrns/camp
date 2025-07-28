import { metrics, trace } from "@opentelemetry/api";
import * as Sentry from "@sentry/nextjs";

// Temporarily disabled due to build issues
// import { performanceTracker } from './performance-tracker';

export interface AIInteractionData {
  responseTime: number;
  confidence: number;
  tokens: number;
  hallucinationScore?: number;
  escalated?: boolean;
  escalationReason?: string;
  organizationId: string;
  conversationId: string;
}

export interface DashboardData {
  operations: {
    auth: {
      count: number;
      avgDuration: number;
      p95Duration: number;
      errorRate: number;
    };
    aiResponse: {
      count: number;
      avgDuration: number;
      p95Duration: number;
      avgConfidence: number;
    };
  };
  ai: {
    avgConfidence: number;
    escalationRate: number;
    hallucinationRate: number;
    totalResponses: number;
    tokensUsed: number;
  };
  errors: {
    rate: number;
    count: number;
    recentErrors: Array<{
      timestamp: string;
      message: string;
      level: string;
    }>;
  };
  cache: {
    hitRate: number;
    evictions: number;
    memoryUsage: number;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    activeUsers: number;
    activeConversations: number;
  };
}

export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private meter = metrics.getMeter("campfire-production-metrics");
  private tracer = trace.getTracer("campfire-production");

  // Metrics collectors
  private operationDurations = new Map<string, number[]>();
  private errorCounts = new Map<string, number>();
  private aiInteractions: AIInteractionData[] = [];
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  // OpenTelemetry metrics
  private httpRequestDuration = this.meter.createHistogram("http_request_duration_ms", {
    description: "HTTP request duration in milliseconds",
  });

  private httpRequestCount = this.meter.createCounter("http_requests_total", {
    description: "Total number of HTTP requests",
  });

  private aiResponseDuration = this.meter.createHistogram("ai_response_duration_ms", {
    description: "AI response generation time in milliseconds",
  });

  private aiConfidenceScore = this.meter.createHistogram("ai_confidence_score", {
    description: "AI response confidence scores",
  });

  private aiEscalationCount = this.meter.createCounter("ai_escalations_total", {
    description: "Total number of AI escalations",
  });

  private errorCount = this.meter.createCounter("errors_total", {
    description: "Total number of errors",
  });

  private cacheOperations = this.meter.createCounter("cache_operations_total", {
    description: "Cache operations by type",
  });

  static getInstance(): ProductionMonitor {
    if (!this.instance) {
      this.instance = new ProductionMonitor();
    }
    return this.instance;
  }

  /**
   * Track operation with performance budget enforcement
   */
  async trackOperation<T>(operation: string, budget: number, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(`operation.${operation}`);
    const start = performance.now();

    try {
      this.httpRequestCount.add(1, { operation });

      const result = await fn();
      const duration = performance.now() - start;

      // Record metrics
      this.httpRequestDuration.record(duration, { operation, withinBudget: duration <= budget });
      this.recordOperationDuration(operation, duration);

      // Alert if over budget
      if (duration > budget) {
        const message = `Performance budget exceeded: ${operation} took ${duration}ms (budget: ${budget}ms)`;

        Sentry.captureMessage(message, "warning");

        span.setAttributes({
          "operation.budget_exceeded": true,
          "operation.budget": budget,
          "operation.actual_duration": duration,
          "operation.overage": duration - budget,
        });
      }

      span.setAttributes({
        "operation.duration": duration,
        "operation.success": true,
        "operation.within_budget": duration <= budget,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.httpRequestDuration.record(duration, { operation, withinBudget: false });
      this.recordError(operation, error as Error);

      span.recordException(error as Error);
      span.setAttributes({
        "operation.duration": duration,
        "operation.success": false,
        "operation.error": (error as Error).message,
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Record AI interaction metrics
   */
  recordAIInteraction(data: AIInteractionData): void {
    const span = this.tracer.startSpan("ai.interaction");

    try {
      // Record OpenTelemetry metrics
      this.aiResponseDuration.record(data.responseTime, {
        organization_id: data.organizationId,
      });

      this.aiConfidenceScore.record(data.confidence, {
        organization_id: data.organizationId,
      });

      if (data.escalated) {
        this.aiEscalationCount.add(1, {
          reason: data.escalationReason || "unknown",
          organization_id: data.organizationId,
        });
      }

      // Store for dashboard aggregation
      this.aiInteractions.push({
        ...data,
        timestamp: Date.now(),
      } as any);

      // Keep only last 1000 interactions for performance
      if (this.aiInteractions.length > 1000) {
        this.aiInteractions = this.aiInteractions.slice(-1000);
      }

      // Log concerning metrics
      if (data.confidence < 0.6) {
      }

      if (data.hallucinationScore && data.hallucinationScore > 0.3) {
        Sentry.captureMessage(`High hallucination detected: ${data.hallucinationScore}`, "warning");
      }

      span.setAttributes({
        "ai.confidence": data.confidence,
        "ai.response_time": data.responseTime,
        "ai.tokens": data.tokens,
        "ai.escalated": data.escalated || false,
        "ai.hallucination_score": data.hallucinationScore || 0,
        "organization.id": data.organizationId,
        "conversation.id": data.conversationId,
      });
    } finally {
      span.end();
    }
  }

  /**
   * Record cache operations
   */
  recordCacheOperation(type: "hit" | "miss" | "eviction", key: string): void {
    this.cacheOperations.add(1, {
      type,
      cache_key_prefix: key.split(":")[0],
    });

    switch (type) {
      case "hit":
        this.cacheStats.hits++;
        break;
      case "miss":
        this.cacheStats.misses++;
        break;
      case "eviction":
        this.cacheStats.evictions++;
        break;
    }
  }

  /**
   * Record application errors
   */
  recordError(context: string, error: Error): void {
    this.errorCount.add(1, { context });

    const errorKey = `${context}:${error.name}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Send to Sentry for detailed tracking
    Sentry.captureException(error, {
      tags: {
        context,
        component: "production-monitor",
      },
    });
  }

  /**
   * Get real-time dashboard metrics
   */
  getDashboardMetrics(): DashboardData {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;

    // Filter recent AI interactions
    const recentAIInteractions = this.aiInteractions.filter((interaction: any) => interaction.timestamp > lastHour);

    // Calculate auth metrics
    const authDurations = this.operationDurations.get("auth") || [];
    const authErrorCount = this.errorCounts.get("auth") || 0;

    // Calculate AI metrics
    const aiDurations = this.operationDurations.get("ai.generate") || [];
    const totalEscalations = recentAIInteractions.filter((i: any) => i.escalated).length;
    const avgConfidence =
      recentAIInteractions.length > 0
        ? recentAIInteractions.reduce((sum: any, i: any) => sum + i.confidence, 0) / recentAIInteractions.length
        : 0;

    // Calculate error rate
    const totalOperations = Array.from(this.operationDurations.values()).reduce(
      (sum, durations) => sum + durations.length,
      0
    );
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum: any, count: any) => sum + count, 0);

    return {
      operations: {
        auth: {
          count: authDurations.length,
          avgDuration: this.calculateAverage(authDurations),
          p95Duration: this.calculatePercentile(authDurations, 95),
          errorRate: authDurations.length > 0 ? authErrorCount / authDurations.length : 0,
        },
        aiResponse: {
          count: aiDurations.length,
          avgDuration: this.calculateAverage(aiDurations),
          p95Duration: this.calculatePercentile(aiDurations, 95),
          avgConfidence: avgConfidence,
        },
      },
      ai: {
        avgConfidence,
        escalationRate: recentAIInteractions.length > 0 ? totalEscalations / recentAIInteractions.length : 0,
        hallucinationRate: this.calculateHallucinationRate(recentAIInteractions),
        totalResponses: recentAIInteractions.length,
        tokensUsed: recentAIInteractions.reduce((sum: any, i: any) => sum + i.tokens, 0),
      },
      errors: {
        rate: totalOperations > 0 ? totalErrors / totalOperations : 0,
        count: totalErrors,
        recentErrors: this.getRecentErrors(),
      },
      cache: {
        hitRate: this.calculateCacheHitRate(),
        evictions: this.cacheStats.evictions,
        memoryUsage: this.getMemoryUsage(),
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        activeUsers: this.getActiveUserCount(),
        activeConversations: this.getActiveConversationCount(),
      },
    };
  }

  /**
   * Get Prometheus-formatted metrics
   */
  getPrometheusMetrics(): string {
    const metrics = this.getDashboardMetrics();
    const timestamp = Date.now();

    return `
# HELP campfire_auth_duration_ms Authentication request duration
# TYPE campfire_auth_duration_ms histogram
campfire_auth_duration_ms_avg ${metrics.operations.auth.avgDuration} ${timestamp}
campfire_auth_duration_ms_p95 ${metrics.operations.auth.p95Duration} ${timestamp}

# HELP campfire_ai_response_duration_ms AI response generation time
# TYPE campfire_ai_response_duration_ms histogram  
campfire_ai_response_duration_ms_avg ${metrics.operations.aiResponse.avgDuration} ${timestamp}
campfire_ai_response_duration_ms_p95 ${metrics.operations.aiResponse.p95Duration} ${timestamp}

# HELP campfire_ai_confidence_score AI response confidence
# TYPE campfire_ai_confidence_score gauge
campfire_ai_confidence_score ${metrics.ai.avgConfidence} ${timestamp}

# HELP campfire_ai_escalation_rate AI escalation rate
# TYPE campfire_ai_escalation_rate gauge
campfire_ai_escalation_rate ${metrics.ai.escalationRate} ${timestamp}

# HELP campfire_error_rate Application error rate
# TYPE campfire_error_rate gauge
campfire_error_rate ${metrics.errors.rate} ${timestamp}

# HELP campfire_cache_hit_rate Cache hit rate
# TYPE campfire_cache_hit_rate gauge
campfire_cache_hit_rate ${metrics.cache.hitRate} ${timestamp}

# HELP campfire_memory_usage_mb Memory usage in MB
# TYPE campfire_memory_usage_mb gauge
campfire_memory_usage_mb ${metrics.system.memoryUsage} ${timestamp}

# HELP campfire_active_users Active user count
# TYPE campfire_active_users gauge
campfire_active_users ${metrics.system.activeUsers} ${timestamp}
`.trim();
  }

  // Helper methods
  private recordOperationDuration(operation: string, duration: number): void {
    if (!this.operationDurations.has(operation)) {
      this.operationDurations.set(operation, []);
    }

    const durations = this.operationDurations.get(operation)!;
    durations.push(duration);

    // Keep only last 1000 measurements
    if (durations.length > 1000) {
      durations.splice(0, durations.length - 1000);
    }
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum: any, val: any) => sum + val, 0) / values.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private calculateHallucinationRate(interactions: AIInteractionData[]): number {
    const withHallucination = interactions.filter((i: any) => i.hallucinationScore && i.hallucinationScore > 0.15);
    return interactions.length > 0 ? withHallucination.length / interactions.length : 0;
  }

  private calculateCacheHitRate(): number {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return total > 0 ? this.cacheStats.hits / total : 0;
  }

  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  private getActiveUserCount(): number {
    // This would integrate with your session management
    // For now, return a placeholder
    return 0;
  }

  private getActiveConversationCount(): number {
    // This would integrate with your conversation management
    // For now, return a placeholder
    return 0;
  }

  private getRecentErrors(): Array<{ timestamp: string; message: string; level: string }> {
    // This would integrate with your error logging system
    // For now, return a placeholder
    return [];
  }

  /**
   * Health check for monitoring systems
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, boolean>;
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      cacheHitRate: number;
    };
  } {
    const dashboardMetrics = this.getDashboardMetrics();

    const checks = {
      lowErrorRate: dashboardMetrics.errors.rate < 0.05, // <5% error rate
      acceptableResponseTime: dashboardMetrics.operations.auth.avgDuration < 2000, // <2s auth
      healthyCacheHitRate: dashboardMetrics.cache.hitRate > 0.8, // >80% cache hit rate
      aiPerformance: dashboardMetrics.ai.avgConfidence > 0.7, // >70% confidence
      lowEscalationRate: dashboardMetrics.ai.escalationRate < 0.3, // <30% escalation
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: "healthy" | "degraded" | "unhealthy";
    if (healthyChecks === totalChecks) {
      status = "healthy";
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      status,
      checks,
      metrics: {
        errorRate: dashboardMetrics.errors.rate,
        avgResponseTime: dashboardMetrics.operations.auth.avgDuration,
        cacheHitRate: dashboardMetrics.cache.hitRate,
      },
    };
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();
