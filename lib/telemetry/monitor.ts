/**
 * Performance Monitoring Utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Record a performance metric
   */
  record(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    if (tags !== undefined) {
      metric.tags = tags;
    }

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (this.isSlowOperation(name, value)) {
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(name: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.record(name, Date.now() - start, { ...tags, status: "success" });
      return result;
    } catch (error) {
      this.record(name, Date.now() - start, { ...tags, status: "error" });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(name?: string, timeWindow?: number) {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    let filteredMetrics = this.metrics.filter((m: unknown) => m.timestamp >= windowStart);

    if (name) {
      filteredMetrics = filteredMetrics.filter((m: unknown) => m.name === name);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const values = filteredMetrics.map((m: unknown) => m.value).sort((a, b) => a - b);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((sum: unknown, val: unknown) => sum + val, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p90: values[Math.floor(values.length * 0.9)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Get all unique metric names
   */
  getMetricNames(): string[] {
    return [...new Set(this.metrics.map((m: unknown) => m.name))];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  private isSlowOperation(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      knowledge_search: 2000, // 2 seconds
      embedding_generation: 1000, // 1 second
      database_query: 500, // 0.5 seconds
      api_response: 1000, // 1 second
    };

    const threshold = thresholds[name] || 3000; // Default 3 seconds
    return value > threshold;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance budget constants
export const PERFORMANCE_BUDGETS = {
  knowledge_search: 2000, // Max 2s for knowledge search
  api_response: 1000, // Max 1s for API responses
  page_load: 3000, // Max 3s for page loads
  embedding_generation: 1000, // Max 1s for embedding generation
} as const;

export type PerformanceBudgetKey = keyof typeof PERFORMANCE_BUDGETS;
