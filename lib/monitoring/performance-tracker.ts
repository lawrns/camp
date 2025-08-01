/**
 * Performance Tracking and Monitoring
 * Tracks API response times, database query performance, and real-time message delivery
 */

interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: 'api' | 'database' | 'realtime' | 'widget';
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
  error?: string;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  slowestRequests: PerformanceMetric[];
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private isEnabled = true;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Track a performance metric
   */
  track(
    type: PerformanceMetric['type'],
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      operation,
      duration,
      success,
      metadata,
      error
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > 1000) { // > 1 second
      console.warn(`Slow ${type} operation detected:`, {
        operation,
        duration: `${duration}ms`,
        metadata
      });
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(
    type: PerformanceMetric['type'],
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      this.track(type, operation, duration, success, metadata, error);
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(
    type: PerformanceMetric['type'],
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      this.track(type, operation, duration, success, metadata, error);
    }
  }

  /**
   * Get performance statistics for a specific type and time range
   */
  getStats(
    type?: PerformanceMetric['type'],
    operation?: string,
    timeRangeMs: number = 3600000 // Default: last hour
  ): PerformanceStats {
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    
    let filteredMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    
    if (type) {
      filteredMetrics = filteredMetrics.filter(m => m.type === type);
    }
    
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorCount: 0,
        slowestRequests: []
      };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulRequests = filteredMetrics.filter(m => m.success);
    const errorCount = filteredMetrics.length - successfulRequests.length;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const slowestRequests = filteredMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalRequests: filteredMetrics.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: (successfulRequests.length / filteredMetrics.length) * 100,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorCount,
      slowestRequests
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      totalMetrics: this.metrics.length,
      oldestMetric: this.metrics[0]?.timestamp,
      newestMetric: this.metrics[this.metrics.length - 1]?.timestamp
    };
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// Helper functions for common tracking scenarios
export const trackApiCall = (operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>, error?: string) => {
  performanceTracker.track('api', operation, duration, success, metadata, error);
};

export const trackDatabaseQuery = (operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>, error?: string) => {
  performanceTracker.track('database', operation, duration, success, metadata, error);
};

export const trackRealtimeMessage = (operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>, error?: string) => {
  performanceTracker.track('realtime', operation, duration, success, metadata, error);
};

export const trackWidgetOperation = (operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>, error?: string) => {
  performanceTracker.track('widget', operation, duration, success, metadata, error);
};

// Middleware helper for automatic API tracking
export const withPerformanceTracking = (operation: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        performanceTracker.track('api', operation, duration, success, { args: args.length }, error);
      }
    };

    return descriptor;
  };
};
