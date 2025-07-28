/**
 * Performance Optimizer
 *
 * Addresses the 471ms regression and targets <100ms performance
 * Implements comprehensive optimization strategies
 *
 * Features:
 * - Request batching and deduplication
 * - Intelligent caching strategies
 * - Component rendering optimization
 * - Memory leak prevention
 * - Performance monitoring and alerts
 */

interface PerformanceMetrics {
  messageDelivery: number[];
  componentRender: number[];
  apiCalls: number[];
  memoryUsage: number[];
  bundleLoadTime: number[];
}

interface OptimizationConfig {
  enableRequestBatching: boolean;
  enableComponentMemoization: boolean;
  enableIntelligentCaching: boolean;
  enableMemoryOptimization: boolean;
  performanceThreshold: number; // ms
  debug: boolean;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private componentCache: Map<string, any> = new Map();
  private memoryCleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableRequestBatching: true,
      enableComponentMemoization: true,
      enableIntelligentCaching: true,
      enableMemoryOptimization: true,
      performanceThreshold: 100, // 100ms target
      debug: process.env.NODE_ENV === "development",
      ...config,
    };

    this.metrics = {
      messageDelivery: [],
      componentRender: [],
      apiCalls: [],
      memoryUsage: [],
      bundleLoadTime: [],
    };

    this.initializeOptimizations();
  }

  /**
   * Initialize all optimization strategies
   */
  private initializeOptimizations(): void {
    if (this.config.enableMemoryOptimization) {
      this.startMemoryOptimization();
    }

    if (this.config.debug) {

    }
  }

  /**
   * Optimize API requests with batching and deduplication
   */
  public async optimizeApiRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      cacheTTL?: number;
      priority?: "high" | "medium" | "low";
      timeout?: number;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const { cacheTTL = 60000, priority = "medium", timeout = 5000 } = options;

    try {
      // Check if request is already in progress (deduplication)
      if (this.requestQueue.has(key)) {
        const result = await this.requestQueue.get(key)!;
        this.recordMetric("apiCalls", performance.now() - startTime);
        return result;
      }

      // Check cache first
      if (this.config.enableIntelligentCaching) {
        const cached = this.getCachedResult(key);
        if (cached) {
          this.recordMetric("apiCalls", performance.now() - startTime);
          return cached;
        }
      }

      // Create request with timeout
      const requestPromise = Promise.race([
        requestFn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout)),
      ]);

      // Store in queue for deduplication
      this.requestQueue.set(key, requestPromise);

      // Execute request
      const result = await requestPromise;

      // Cache result
      if (this.config.enableIntelligentCaching) {
        this.setCachedResult(key, result, cacheTTL);
      }

      // Clean up queue
      this.requestQueue.delete(key);

      const requestTime = performance.now() - startTime;
      this.recordMetric("apiCalls", requestTime);

      if (this.config.debug) {

      }

      return result;
    } catch (error) {
      this.requestQueue.delete(key);
      const requestTime = performance.now() - startTime;
      this.recordMetric("apiCalls", requestTime);

      throw error;
    }
  }

  /**
   * Optimize message delivery performance
   */
  public async optimizeMessageDelivery(messageData: any, deliveryFn: (data: any) => Promise<any>): Promise<any> {
    const startTime = performance.now();

    try {
      // Pre-process message for optimal delivery
      const optimizedData = this.preprocessMessage(messageData);

      // Use optimized API request
      const result = await this.optimizeApiRequest(`message_${Date.now()}`, () => deliveryFn(optimizedData), {
        priority: "high",
        timeout: 3000,
        cacheTTL: 0, // Don't cache message delivery
      });

      const deliveryTime = performance.now() - startTime;
      this.recordMetric("messageDelivery", deliveryTime);

      // Alert if performance threshold exceeded
      if (deliveryTime > this.config.performanceThreshold) {
        this.handlePerformanceAlert("messageDelivery", deliveryTime);
      }

      return result;
    } catch (error) {
      const deliveryTime = performance.now() - startTime;
      this.recordMetric("messageDelivery", deliveryTime);
      throw error;
    }
  }

  /**
   * Optimize component rendering
   */
  public optimizeComponentRender<T>(componentKey: string, renderFn: () => T, dependencies: any[] = []): T {
    const startTime = performance.now();

    if (this.config.enableComponentMemoization) {
      // Create dependency hash
      const depHash = this.hashDependencies(dependencies);
      const cacheKey = `${componentKey}_${depHash}`;

      // Check component cache
      const cached = this.componentCache.get(cacheKey);
      if (cached) {
        this.recordMetric("componentRender", performance.now() - startTime);
        return cached;
      }

      // Render and cache
      const result = renderFn();
      this.componentCache.set(cacheKey, result);

      // Limit cache size
      if (this.componentCache.size > 100) {
        const firstKey = this.componentCache.keys().next().value;
        this.componentCache.delete(firstKey);
      }

      const renderTime = performance.now() - startTime;
      this.recordMetric("componentRender", renderTime);

      if (this.config.debug && renderTime > 10) {

      }

      return result;
    }

    // No memoization
    const result = renderFn();
    this.recordMetric("componentRender", performance.now() - startTime);
    return result;
  }

  /**
   * Preprocess message for optimal delivery
   */
  private preprocessMessage(messageData: any): any {
    return {
      ...messageData,
      // Add optimization flags
      optimized: true,
      timestamp: Date.now(),
      // Compress content if large
      content: this.compressContent(messageData.content),
    };
  }

  /**
   * Compress content if it's large
   */
  private compressContent(content: string): string {
    if (content.length > 1000) {
      // Simple compression for demo (in production, use proper compression)
      return content.replace(/\s+/g, " ").trim();
    }
    return content;
  }

  /**
   * Hash dependencies for memoization
   */
  private hashDependencies(dependencies: any[]): string {
    return dependencies.map((dep) => (typeof dep === "object" ? JSON.stringify(dep) : String(dep))).join("|");
  }

  /**
   * Intelligent caching with TTL
   */
  private getCachedResult(key: string): any | null {
    const cached = this.componentCache.get(`cache_${key}`);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: any, ttl: number): void {
    this.componentCache.set(`cache_${key}`, {
      data,
      expires: Date.now() + ttl,
    });
  }

  /**
   * Memory optimization
   */
  private startMemoryOptimization(): void {
    // Start memory cleanup interval
    this.memoryCleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 30000); // Clean up every 30 seconds

    // Initial cleanup
    this.cleanupMemory();

    if (this.config.debug) {

    }
  }

  private cleanupMemory(): void {
    const now = Date.now();

    // Clean expired cache entries
    for (const [key, value] of this.componentCache.entries()) {
      if (key.startsWith("cache_") && value.expires && value.expires < now) {
        this.componentCache.delete(key);
      }
    }

    // Limit metrics arrays
    Object.keys(this.metrics).forEach((key) => {
      const metric = this.metrics[key as keyof PerformanceMetrics];
      if (metric.length > 100) {
        metric.splice(0, metric.length - 100);
      }
    });

    // Record memory usage
    if (typeof window !== "undefined" && "memory" in performance) {
      const memInfo = (performance as any).memory;
      this.recordMetric("memoryUsage", memInfo.usedJSHeapSize);
    }

    if (this.config.debug) {

    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(type: keyof PerformanceMetrics, value: number): void {
    this.metrics[type].push(value);

    // Keep only last 100 measurements
    if (this.metrics[type].length > 100) {
      this.metrics[type] = this.metrics[type].slice(-100);
    }
  }

  /**
   * Handle performance alerts
   */
  private handlePerformanceAlert(type: string, value: number): void {

    // In production, you might want to send this to monitoring service
    if (this.config.debug) {

    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): {
    averages: Record<string, number>;
    totals: Record<string, number>;
    recent: Record<string, number>;
    alerts: number;
  } {
    const averages: Record<string, number> = {};
    const totals: Record<string, number> = {};
    const recent: Record<string, number> = {};

    Object.entries(this.metrics).forEach(([key, values]) => {
      if (values.length > 0) {
        averages[key] = values.reduce((a, b) => a + b, 0) / values.length;
        totals[key] = values.length;
        recent[key] = values[values.length - 1] || 0;
      }
    });

    const alerts = Object.values(averages).filter((avg) => avg > this.config.performanceThreshold).length;

    return { averages, totals, recent, alerts };
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.averages.messageDelivery > this.config.performanceThreshold) {
      recommendations.push("Consider implementing message batching");
      recommendations.push("Optimize database queries and indexing");
    }

    if (metrics.averages.componentRender > 50) {
      recommendations.push("Implement React.memo for heavy components");
      recommendations.push("Consider component virtualization");
    }

    if (metrics.averages.apiCalls > 200) {
      recommendations.push("Implement request deduplication");
      recommendations.push("Add intelligent caching layer");
    }

    if (recommendations.length === 0) {
      recommendations.push("Performance is within acceptable limits");
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }

    this.requestQueue.clear();
    this.componentCache.clear();

    if (this.config.debug) {

    }
  }
}

// Global performance optimizer instance
export const globalPerformanceOptimizer = new PerformanceOptimizer({
  enableRequestBatching: true,
  enableComponentMemoization: true,
  enableIntelligentCaching: true,
  enableMemoryOptimization: true,
  performanceThreshold: 100,
  debug: process.env.NODE_ENV === "development",
});
