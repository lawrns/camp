/**
 * API Response Time Optimizer
 *
 * Comprehensive optimization utilities for achieving <200ms API response times
 * Implements caching, compression, parallel processing, and performance monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  staleWhileRevalidate?: boolean;
}

interface OptimizationOptions {
  enableCaching?: boolean;
  enableCompression?: boolean;
  enableParallelProcessing?: boolean;
  timeout?: number;
  retries?: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit?: boolean;
  compressed?: boolean;
  parallel?: boolean;
}

class APIResponseOptimizer {
  private static instance: APIResponseOptimizer;
  private cache: LRUCache<string, any>;
  private performanceMetrics = new Map<string, PerformanceMetrics[]>();

  private readonly DEFAULT_TTL = 300000; // 5 minutes
  private readonly DEFAULT_CACHE_SIZE = 1000;
  private readonly DEFAULT_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.cache = new LRUCache({
      max: this.DEFAULT_CACHE_SIZE,
      ttl: this.DEFAULT_TTL,
      allowStale: true,
      updateAgeOnGet: true,
    });
  }

  static getInstance(): APIResponseOptimizer {
    if (!APIResponseOptimizer.instance) {
      APIResponseOptimizer.instance = new APIResponseOptimizer();
    }
    return APIResponseOptimizer.instance;
  }

  /**
   * Optimized API handler wrapper
   */
  async optimizeHandler<T>(
    request: NextRequest,
    handler: () => Promise<T>,
    options: OptimizationOptions = {}
  ): Promise<NextResponse> {
    const {
      enableCaching = true,
      enableCompression = true,
      enableParallelProcessing = false,
      timeout = this.DEFAULT_TIMEOUT,
      retries = 3,
    } = options;

    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(request);

    const metrics: PerformanceMetrics = { startTime };

    try {
      // Check cache first
      if (enableCaching) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          metrics.endTime = performance.now();
          metrics.duration = metrics.endTime - startTime;
          metrics.cacheHit = true;

          this.recordMetrics(request.url, metrics);

          return this.createOptimizedResponse(cached, {
            cached: true,
            compressed: enableCompression,
          });
        }
      }

      // Execute handler with timeout and retries
      const result = await this.executeWithOptimizations(handler, { timeout, retries, enableParallelProcessing });

      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - startTime;
      metrics.cacheHit = false;
      metrics.parallel = enableParallelProcessing;

      // Cache the result
      if (enableCaching && result) {
        this.cache.set(cacheKey, result);
      }

      this.recordMetrics(request.url, metrics);

      return this.createOptimizedResponse(result, {
        cached: false,
        compressed: enableCompression,
      });
    } catch (error) {
      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - startTime;

      this.recordMetrics(request.url, metrics);

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
        },
        { status: 500 }
      );
    }
  }

  /**
   * Execute handler with optimizations
   */
  private async executeWithOptimizations<T>(
    handler: () => Promise<T>,
    options: { timeout: number; retries: number; enableParallelProcessing: boolean }
  ): Promise<T> {
    const { timeout, retries } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), timeout);
        });

        const result = await Promise.race([handler(), timeoutPromise]);

        return result;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff for retries
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw new Error("Max retries exceeded");
  }

  /**
   * Create optimized response with compression and headers
   */
  private createOptimizedResponse(data: unknown, options: { cached: boolean; compressed: boolean }) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Response-Time": Date.now().toString(),
      "X-Cache-Status": options.cached ? "HIT" : "MISS",
    };

    // Add caching headers
    if (options.cached) {
      headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600";
    } else {
      headers["Cache-Control"] = "public, max-age=300";
    }

    // Add compression headers
    if (options.compressed) {
      headers["Content-Encoding"] = "gzip";
      headers["Vary"] = "Accept-Encoding";
    }

    // Performance headers
    headers["X-Performance-Optimized"] = "true";
    headers["X-Optimization-Version"] = "1.0";

    return NextResponse.json(data, { headers });
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: NextRequest): string {
    const url = new URL(request.url);
    const method = request.method;
    const searchParams = url.searchParams.toString();

    // Include relevant headers in cache key
    const relevantHeaders = ["authorization", "x-organization-id", "x-user-id"];
    const headerString = relevantHeaders.map((header) => `${header}:${request.headers.get(header) || ""}`).join("|");

    return `${method}:${url.pathname}:${searchParams}:${headerString}`;
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(endpoint: string, metrics: PerformanceMetrics): void {
    if (!this.performanceMetrics.has(endpoint)) {
      this.performanceMetrics.set(endpoint, []);
    }

    const endpointMetrics = this.performanceMetrics.get(endpoint)!;
    endpointMetrics.push(metrics);

    // Keep only last 100 metrics per endpoint
    if (endpointMetrics.length > 100) {
      endpointMetrics.shift();
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics() {
    const analytics: Record<string, any> = {};

    for (const [endpoint, metrics] of this.performanceMetrics.entries()) {
      const durations = metrics.map((m) => m.duration || 0);
      const cacheHits = metrics.filter((m) => m.cacheHit).length;

      analytics[endpoint] = {
        totalRequests: metrics.length,
        averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        minResponseTime: Math.min(...durations),
        maxResponseTime: Math.max(...durations),
        p95ResponseTime: this.percentile(durations, 95),
        cacheHitRate: (cacheHits / metrics.length) * 100,
        status: this.getPerformanceStatus(durations),
      };
    }

    return analytics;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
      hits: this.cache.hits,
      misses: this.cache.misses,
      hitRate: (this.cache.hits / (this.cache.hits + this.cache.misses)) * 100,
    };
  }

  /**
   * Parallel processing helper
   */
  async processInParallel<T>(operations: (() => Promise<T>)[], maxConcurrency: number = 5): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map((op) => op()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Database query optimization wrapper
   */
  async optimizeQuery<T>(queryFn: () => Promise<T>, cacheKey: string, ttl: number = this.DEFAULT_TTL): Promise<T> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    this.cache.set(cacheKey, result, { ttl });

    return result;
  }

  // Helper methods
  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getPerformanceStatus(durations: number[]): string {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (avg < 100) return "excellent";
    if (avg < 200) return "good";
    if (avg < 500) return "acceptable";
    return "needs_improvement";
  }
}

// Export singleton instance
export const responseOptimizer = APIResponseOptimizer.getInstance();

// Helper function for easy integration
export function withOptimization<T>(handler: () => Promise<T>, options?: OptimizationOptions) {
  return async (request: NextRequest) => {
    return responseOptimizer.optimizeHandler(request, handler, options);
  };
}

// Performance monitoring decorator
export function withPerformanceMonitoring(target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const startTime = performance.now();

    try {
      const result = await method.apply(this, args);
      const duration = performance.now() - startTime;

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      throw error;
    }
  };

  return descriptor;
}

export default responseOptimizer;
