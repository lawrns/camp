import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  props?: Record<string, any>;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private lastWarnings = new Map<string, number>(); // Rate limiting for warnings
  private memoryThresholds = {
    warning: 50 * 1024 * 1024, // 50MB
    critical: 100 * 1024 * 1024, // 100MB
  };

  constructor() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.initializeObservers();
    }
  }

  private rateLimitedWarn(key: string, message: string, data?: any, intervalMs = 10000) {
    const now = Date.now();
    const lastWarning = this.lastWarnings.get(key) || 0;

    if (now - lastWarning > intervalMs) {
      this.lastWarnings.set(key, now);
    }
  }

  private initializeObservers() {
    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.rateLimitedWarn("long-task", `⚠️ Long task detected: ${entry.duration}ms`, {
            name: entry.name,
            startTime: entry.startTime,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      this.observers.set("longtask", longTaskObserver);
    } catch (e) {
      // Long task observer not supported
    }

    // Monitor layout shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let totalShift = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            totalShift += (entry as any).value;
          }
        }
        if (totalShift > 0.1) {
          this.rateLimitedWarn("layout-shift", `⚠️ Cumulative Layout Shift: ${totalShift}`);
        }
      });
      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.set("layout-shift", layoutShiftObserver);
    } catch (e) {
      // Layout shift observer not supported
    }
  }

  measureRender(componentName: string, callback: () => void) {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Get memory usage if available
    const memoryUsage = this.getMemoryUsage();

    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now(),
      memoryUsage,
    };

    this.metrics.push(metric);

    if (renderTime > 16) {
      this.rateLimitedWarn(
        `slow-render-${componentName}`,
        `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    // Check memory usage
    if (memoryUsage) {
      this.checkMemoryThresholds(componentName, memoryUsage);
    }

    return renderTime;
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageRenderTime(componentName?: string) {
    const relevantMetrics = componentName
      ? this.metrics.filter((m: any) => m.componentName === componentName)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum: any, m: any) => sum + m.renderTime, 0);
    return total / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  private getMemoryUsage() {
    if (typeof window !== "undefined" && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  private checkMemoryThresholds(componentName: string, memoryUsage: any) {
    const { usedJSHeapSize } = memoryUsage;

    if (usedJSHeapSize > this.memoryThresholds.critical) {
      this.rateLimitedWarn(
        `critical-memory-${componentName}`,
        `🚨 Critical memory usage in ${componentName}: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        { memoryUsage, componentName }
      );
    } else if (usedJSHeapSize > this.memoryThresholds.warning) {
      this.rateLimitedWarn(
        `high-memory-${componentName}`,
        `⚠️ High memory usage in ${componentName}: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        { memoryUsage, componentName }
      );
    }
  }

  getMemoryStats() {
    const recentMetrics = this.metrics.filter((m) => m.memoryUsage && Date.now() - m.timestamp < 60000);
    if (recentMetrics.length === 0) return null;

    const memoryUsages = recentMetrics.map((m) => m.memoryUsage!.usedJSHeapSize);
    return {
      current: memoryUsages[memoryUsages.length - 1],
      average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      peak: Math.max(...memoryUsages),
      componentsWithHighMemory: recentMetrics
        .filter((m) => m.memoryUsage!.usedJSHeapSize > this.memoryThresholds.warning)
        .map((m) => ({ component: m.componentName, memory: m.memoryUsage!.usedJSHeapSize })),
    };
  }

  setMemoryThresholds(warning: number, critical: number) {
    this.memoryThresholds = { warning, critical };
  }

  destroy() {
    this.observers.forEach((observer: any) => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      renderCount.current++;
      totalRenderTime.current += renderTime;

      if (renderCount.current % 10 === 0) {
        const avgRenderTime = totalRenderTime.current / renderCount.current;
        if (avgRenderTime > 16) {
        }
      }
    };
  });
}

// Utility to measure async operations
export async function measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    if (duration > 1000) {
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    throw error;
  }
}

// Database query performance tracking
export function trackDatabaseQuery(queryName: string, duration: number) {
  if (duration > 100) {
  }
}

// Bundle size tracking
export function trackBundleSize() {
  if (typeof window !== "undefined" && "performance" in window) {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

    if (navigation) {
      const stats = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
      };

      if (stats.domContentLoaded > 3000) {
      }
    }
  }
}
