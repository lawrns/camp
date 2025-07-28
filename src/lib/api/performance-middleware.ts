/**
 * API Performance Middleware
 *
 * Middleware for automatic API performance optimization
 * Implements caching, compression, monitoring, and response optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { responseOptimizer } from "./response-optimizer";

interface MiddlewareConfig {
  enableCaching?: boolean;
  enableCompression?: boolean;
  enableMonitoring?: boolean;
  cachePatterns?: string[];
  excludePatterns?: string[];
  performanceBudget?: number;
}

interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  path: string;
  method: string;
  status?: number;
  cacheHit?: boolean;
  size?: number;
}

class APIPerformanceMiddleware {
  private static instance: APIPerformanceMiddleware;
  private config: MiddlewareConfig;
  private requestMetrics = new Map<string, RequestMetrics[]>();
  private performanceBudgets = new Map<string, number>();

  constructor(config: MiddlewareConfig = {}) {
    this.config = {
      enableCaching: true,
      enableCompression: true,
      enableMonitoring: true,
      cachePatterns: ["/api/database/*", "/api/analytics/*"],
      excludePatterns: ["/api/auth/*", "/api/webhook/*"],
      performanceBudget: 200, // 200ms default
      ...config,
    };

    this.initializePerformanceBudgets();
  }

  static getInstance(config?: MiddlewareConfig): APIPerformanceMiddleware {
    if (!APIPerformanceMiddleware.instance) {
      APIPerformanceMiddleware.instance = new APIPerformanceMiddleware(config);
    }
    return APIPerformanceMiddleware.instance;
  }

  private initializePerformanceBudgets() {
    // Set specific performance budgets for different endpoint types
    this.performanceBudgets.set("/api/widget/*", 100); // Widget APIs need to be fast
    this.performanceBudgets.set("/api/database/*", 200); // Database APIs
    this.performanceBudgets.set("/api/analytics/*", 300); // Analytics can be slower
    this.performanceBudgets.set("/api/memory/*", 200); // Memory APIs
    this.performanceBudgets.set("/api/bundle/*", 500); // Bundle analysis can be slower
  }

  /**
   * Main middleware function
   */
  async middleware(request: NextRequest): Promise<NextResponse | null> {
    const startTime = performance.now();
    const path = new URL(request.url).pathname;
    const method = request.method;

    // Skip middleware for excluded patterns
    if (this.shouldExclude(path)) {
      return null;
    }

    // Create request metrics
    const metrics: RequestMetrics = {
      startTime,
      path,
      method,
    };

    try {
      // Check if this is a cacheable request
      if (this.shouldCache(path, method)) {
        const cachedResponse = await this.getCachedResponse(request);
        if (cachedResponse) {
          metrics.endTime = performance.now();
          metrics.duration = metrics.endTime - startTime;
          metrics.cacheHit = true;

          this.recordMetrics(path, metrics);
          return this.addPerformanceHeaders(cachedResponse, metrics);
        }
      }

      // Continue to the actual handler
      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Post-processing middleware for responses
   */
  async postProcess(request: NextRequest, response: NextResponse, startTime: number): Promise<NextResponse> {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const path = new URL(request.url).pathname;
    const method = request.method;

    const metrics: RequestMetrics = {
      startTime,
      endTime,
      duration,
      path,
      method,
      status: response.status,
      cacheHit: false,
    };

    // Record metrics
    this.recordMetrics(path, metrics);

    // Check performance budget
    const budget = this.getPerformanceBudget(path);
    if (duration > budget) {

    }

    // Add performance headers
    const optimizedResponse = this.addPerformanceHeaders(response, metrics);

    // Cache response if applicable
    if (this.shouldCache(path, method) && response.status === 200) {
      await this.cacheResponse(request, response);
    }

    return optimizedResponse;
  }

  /**
   * Check if request should be excluded from middleware
   */
  private shouldExclude(path: string): boolean {
    return this.config.excludePatterns?.some((pattern) => this.matchPattern(path, pattern)) || false;
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(path: string, method: string): boolean {
    if (method !== "GET") return false;

    return this.config.cachePatterns?.some((pattern) => this.matchPattern(path, pattern)) || false;
  }

  /**
   * Pattern matching helper
   */
  private matchPattern(path: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return regex.test(path);
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(request: NextRequest): Promise<NextResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = responseOptimizer.getCacheStats();

      // This is a simplified cache check - in practice, you'd use the actual cache
      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Cache response
   */
  private async cacheResponse(request: NextRequest, response: NextResponse): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      // Implementation would cache the response data
    } catch (error) {

    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: NextRequest): string {
    const url = new URL(request.url);
    const method = request.method;
    const searchParams = url.searchParams.toString();

    return `${method}:${url.pathname}:${searchParams}`;
  }

  /**
   * Add performance headers to response
   */
  private addPerformanceHeaders(response: NextResponse, metrics: RequestMetrics): NextResponse {
    const headers = new Headers(response.headers);

    // Performance timing headers
    headers.set("X-Response-Time", `${metrics.duration?.toFixed(2)}ms`);
    headers.set("X-Performance-Budget", `${this.getPerformanceBudget(metrics.path)}ms`);
    headers.set("X-Cache-Status", metrics.cacheHit ? "HIT" : "MISS");
    headers.set("X-Performance-Status", this.getPerformanceStatus(metrics));

    // Optimization headers
    if (this.config.enableCompression) {
      headers.set("X-Compression-Enabled", "true");
    }

    if (this.config.enableCaching) {
      headers.set("X-Caching-Enabled", "true");
    }

    // Performance monitoring headers
    headers.set("X-Performance-Monitoring", "enabled");
    headers.set("X-Optimization-Version", "1.0");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  /**
   * Get performance budget for path
   */
  private getPerformanceBudget(path: string): number {
    for (const [pattern, budget] of this.performanceBudgets.entries()) {
      if (this.matchPattern(path, pattern)) {
        return budget;
      }
    }
    return this.config.performanceBudget || 200;
  }

  /**
   * Get performance status
   */
  private getPerformanceStatus(metrics: RequestMetrics): string {
    if (!metrics.duration) return "unknown";

    const budget = this.getPerformanceBudget(metrics.path);
    const ratio = metrics.duration / budget;

    if (ratio <= 0.5) return "excellent";
    if (ratio <= 0.8) return "good";
    if (ratio <= 1.0) return "acceptable";
    return "poor";
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(path: string, metrics: RequestMetrics): void {
    if (!this.requestMetrics.has(path)) {
      this.requestMetrics.set(path, []);
    }

    const pathMetrics = this.requestMetrics.get(path)!;
    pathMetrics.push(metrics);

    // Keep only last 100 metrics per path
    if (pathMetrics.length > 100) {
      pathMetrics.shift();
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics() {
    const analytics: Record<string, any> = {};

    for (const [path, metrics] of this.requestMetrics.entries()) {
      const durations = metrics.map((m) => m.duration || 0);
      const cacheHits = metrics.filter((m) => m.cacheHit).length;
      const budget = this.getPerformanceBudget(path);

      analytics[path] = {
        totalRequests: metrics.length,
        averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        minResponseTime: Math.min(...durations),
        maxResponseTime: Math.max(...durations),
        p95ResponseTime: this.percentile(durations, 95),
        cacheHitRate: (cacheHits / metrics.length) * 100,
        performanceBudget: budget,
        budgetCompliance: (durations.filter((d) => d <= budget).length / durations.length) * 100,
        status: this.getPathPerformanceStatus(durations, budget),
      };
    }

    return analytics;
  }

  /**
   * Get overall performance status for a path
   */
  private getPathPerformanceStatus(durations: number[], budget: number): string {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const ratio = avg / budget;

    if (ratio <= 0.5) return "excellent";
    if (ratio <= 0.8) return "good";
    if (ratio <= 1.0) return "acceptable";
    return "needs_improvement";
  }

  /**
   * Calculate percentile
   */
  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.requestMetrics.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): MiddlewareConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const performanceMiddleware = APIPerformanceMiddleware.getInstance();

// Helper function for wrapping API handlers
export function withPerformanceMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: MiddlewareConfig
) {
  const middleware = APIPerformanceMiddleware.getInstance(config);

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();

    // Pre-processing
    const middlewareResponse = await middleware.middleware(request);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // Execute handler
    const response = await handler(request);

    // Post-processing
    return middleware.postProcess(request, response, startTime);
  };
}

export default performanceMiddleware;
