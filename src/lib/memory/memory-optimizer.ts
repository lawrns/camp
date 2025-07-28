"use client";

/**
 * Memory Optimizer
 *
 * Comprehensive memory optimization utilities for React applications
 * Target: <512MB memory usage with efficient garbage collection
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

interface MemoryOptimizationConfig {
  enableAutoCleanup: boolean;
  enableWeakReferences: boolean;
  enableLazyLoading: boolean;
  maxCacheSize: number;
  cleanupInterval: number;
}

interface MemoryMetrics {
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
  percentUsed: number;
  timestamp: number;
}

class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private config: MemoryOptimizationConfig;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private weakCache = new WeakMap();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryMetrics[] = [];
  private componentRegistry = new Set<string>();

  constructor(config: Partial<MemoryOptimizationConfig> = {}) {
    this.config = {
      enableAutoCleanup: true,
      enableWeakReferences: true,
      enableLazyLoading: true,
      maxCacheSize: 100,
      cleanupInterval: 30000, // 30 seconds
      ...config,
    };

    this.initializeOptimizations();
  }

  static getInstance(config?: Partial<MemoryOptimizationConfig>): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer(config);
    }
    return MemoryOptimizer.instance;
  }

  private initializeOptimizations() {
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  private startAutoCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private startMemoryMonitoring() {
    if (typeof window !== "undefined" && "performance" in window) {
      setInterval(() => {
        this.recordMemoryMetrics();
      }, 5000); // Every 5 seconds
    }
  }

  private recordMemoryMetrics() {
    if (typeof window !== "undefined" && "performance" in window) {
      // @ts-ignore - performance.memory is Chrome-specific
      const memory = (window.performance as any).memory;
      if (memory) {
        const metrics: MemoryMetrics = {
          usedHeapSize: memory.usedJSHeapSize,
          totalHeapSize: memory.totalJSHeapSize,
          heapSizeLimit: memory.jsHeapSizeLimit,
          percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          timestamp: Date.now(),
        };

        this.memoryHistory.push(metrics);

        // Keep only last 100 measurements
        if (this.memoryHistory.length > 100) {
          this.memoryHistory.shift();
        }

        // Alert if memory usage is high
        if (metrics.percentUsed > 80) {
          this.handleHighMemoryUsage(metrics);
        }
      }
    }
  }

  private handleHighMemoryUsage(metrics: MemoryMetrics) {

    // Force cleanup
    this.performCleanup();

    // Suggest garbage collection
    if (typeof window !== "undefined" && "gc" in window) {
      // @ts-ignore - gc is available in some environments
      window.gc();
    }
  }

  private performCleanup() {
    const now = Date.now();
    let cleanedItems = 0;

    // Clean expired cache entries
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp + value.ttl < now) {
        this.cache.delete(key);
        cleanedItems++;
      }
    }

    // Limit cache size
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, entries.length - this.config.maxCacheSize);
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
        cleanedItems++;
      });
    }

    if (cleanedItems > 0) {

    }
  }

  /**
   * Optimized caching with automatic cleanup
   */
  public cache_set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public cache_get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Weak reference caching for objects
   */
  public weakCache_set(obj: object, key: string, data: any): void {
    if (this.config.enableWeakReferences) {
      this.weakCache.set(obj, { ...this.weakCache.get(obj), [key]: data });
    }
  }

  public weakCache_get(obj: object, key: string): any | null {
    if (this.config.enableWeakReferences) {
      const cache = this.weakCache.get(obj);
      return cache ? cache[key] : null;
    }
    return null;
  }

  /**
   * Component registration for memory tracking
   */
  public registerComponent(componentName: string): void {
    this.componentRegistry.add(componentName);
  }

  public unregisterComponent(componentName: string): void {
    this.componentRegistry.delete(componentName);
  }

  /**
   * Get current memory metrics
   */
  public getMemoryMetrics(): MemoryMetrics | null {
    if (this.memoryHistory.length === 0) return null;
    return this.memoryHistory[this.memoryHistory.length - 1];
  }

  /**
   * Get memory usage trend
   */
  public getMemoryTrend(): { trend: "increasing" | "decreasing" | "stable"; rate: number } {
    if (this.memoryHistory.length < 2) {
      return { trend: "stable", rate: 0 };
    }

    const recent = this.memoryHistory.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const change = last.usedHeapSize - first.usedHeapSize;
    const timeSpan = last.timestamp - first.timestamp;
    const rate = change / timeSpan; // bytes per ms

    if (Math.abs(rate) < 0.1) return { trend: "stable", rate: 0 };
    return { trend: rate > 0 ? "increasing" : "decreasing", rate: Math.abs(rate) };
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if (typeof window !== "undefined" && "gc" in window) {
      // @ts-ignore
      window.gc();

    }
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.cache.clear();
    this.componentRegistry.clear();
    this.memoryHistory = [];

  }
}

// React hooks for memory optimization

/**
 * Hook for optimized state management with automatic cleanup
 */
export function useOptimizedState<T>(initialValue: T, options: { ttl?: number; weakRef?: boolean } = {}) {
  const optimizer = MemoryOptimizer.getInstance();
  const { ttl = 300000, weakRef = false } = options;

  const stateRef = useRef<T>(initialValue);
  const timestampRef = useRef<number>(Date.now());

  const getValue = useCallback(() => {
    if (ttl > 0 && Date.now() - timestampRef.current > ttl) {
      stateRef.current = initialValue;
      timestampRef.current = Date.now();
    }
    return stateRef.current;
  }, [initialValue, ttl]);

  const setValue = useCallback((newValue: T) => {
    stateRef.current = newValue;
    timestampRef.current = Date.now();
  }, []);

  return [getValue(), setValue] as const;
}

/**
 * Hook for memory-efficient memoization
 */
export function useMemoryEfficientMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: { maxAge?: number; weakRef?: boolean } = {}
): T {
  const optimizer = MemoryOptimizer.getInstance();
  const { maxAge = 300000, weakRef = false } = options;

  const cacheKey = useMemo(() => {
    return `memo_${JSON.stringify(deps)}_${Date.now()}`;
  }, deps);

  return useMemo(() => {
    const cached = optimizer.cache_get(cacheKey);
    if (cached) return cached;

    const result = factory();
    optimizer.cache_set(cacheKey, result, maxAge);
    return result;
  }, [factory, cacheKey, maxAge, optimizer]);
}

/**
 * Hook for automatic component cleanup
 */
export function useMemoryCleanup(componentName: string) {
  const optimizer = MemoryOptimizer.getInstance();

  useEffect(() => {
    optimizer.registerComponent(componentName);

    return () => {
      optimizer.unregisterComponent(componentName);
    };
  }, [componentName, optimizer]);

  const forceCleanup = useCallback(() => {
    optimizer.forceGarbageCollection();
  }, [optimizer]);

  return { forceCleanup };
}

/**
 * Hook for memory monitoring
 */
export function useMemoryMonitoring() {
  const optimizer = MemoryOptimizer.getInstance();

  const getMetrics = useCallback(() => {
    return optimizer.getMemoryMetrics();
  }, [optimizer]);

  const getTrend = useCallback(() => {
    return optimizer.getMemoryTrend();
  }, [optimizer]);

  return { getMetrics, getTrend };
}

// Export singleton instance
export const memoryOptimizer = MemoryOptimizer.getInstance({
  enableAutoCleanup: true,
  enableWeakReferences: true,
  enableLazyLoading: true,
  maxCacheSize: 100,
  cleanupInterval: 30000,
});

export default memoryOptimizer;
