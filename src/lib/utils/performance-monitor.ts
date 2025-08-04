"use client";

/**
 * Performance monitoring utility for widget optimization
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();
  private observers: PerformanceObserver[] = [];
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "navigation") {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navObserver);
    } catch (e) {

    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "resource") {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);
    } catch (e) {

    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set("lcp", lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);
    } catch (e) {

    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.set("fid", entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);
    } catch (e) {

    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint()
    };

    this.metrics.set("navigation", metrics);
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming) {
    if (entry.name.includes("chunk") || entry.name.includes(".js") || entry.name.includes(".css")) {
      const resourceMetrics = this.metrics.get("resources") || [];
      resourceMetrics.push({
        name: entry.name,
        size: entry.transferSize || entry.encodedBodySize,
        loadTime: entry.responseEnd - entry.requestStart,
        type: this.getResourceType(entry.name)
      });
      this.metrics.set("resources", resourceMetrics);
    }
  }

  private getResourceType(name: string): string {
    if (name.includes(".js")) return "javascript";
    if (name.includes(".css")) return "stylesheet";
    if (name.includes("chunk")) return "chunk";
    return "other";
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find(entry => entry.name === "first-paint");
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType("paint");
    const fcp = paintEntries.find(entry => entry.name === "first-contentful-paint");
    return fcp ? fcp.startTime : null;
  }

  /**
   * Start timing a specific operation
   */
  startTiming(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  /**
   * End timing and record the duration
   */
  endTiming(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {

      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(label);

    const timings = this.metrics.get("customTimings") || {};
    timings[label] = duration;
    this.metrics.set("customTimings", timings);

    return duration;
  }

  /**
   * Record component load time
   */
  recordComponentLoad(componentName: string, loadTime: number, bundleSize?: number): void {
    const componentMetrics = this.metrics.get("components") || {};
    componentMetrics[componentName] = {
      loadTime,
      bundleSize,
      timestamp: Date.now()
    };
    this.metrics.set("components", componentMetrics);
  }

  /**
   * Record lazy loading metrics
   */
  recordLazyLoad(componentName: string, triggerType: "viewport" | "interaction" | "manual"): void {
    const lazyMetrics = this.metrics.get("lazyLoading") || [];
    lazyMetrics.push({
      component: componentName,
      triggerType,
      timestamp: Date.now(),
      loadTime: performance.now()
    });
    this.metrics.set("lazyLoading", lazyMetrics);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Get bundle size analysis
   */
  getBundleAnalysis(): unknown {
    const resources = this.metrics.get("resources") || [];
    const jsResources = resources.filter((r: unknown) => r.type === "javascript");
    const cssResources = resources.filter((r: unknown) => r.type === "stylesheet");
    const chunks = resources.filter((r: unknown) => r.type === "chunk");

    return {
      totalJSSize: jsResources.reduce((sum: number, r: unknown) => sum + (r.size || 0), 0),
      totalCSSSize: cssResources.reduce((sum: number, r: unknown) => sum + (r.size || 0), 0),
      chunkCount: chunks.length,
      largestChunk: chunks.reduce((largest: unknown, current: unknown) =>
        (current.size || 0) > (largest.size || 0) ? current : largest, {}),
      averageLoadTime: resources.reduce((sum: number, r: unknown) => sum + (r.loadTime || 0), 0) / resources.length || 0
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    const bundleAnalysis = this.getBundleAnalysis();

    // Check LCP
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push("LCP is above 2.5s - consider optimizing largest content element");
    }

    // Check FID
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push("FID is above 100ms - consider reducing JavaScript execution time");
    }

    // Check bundle size
    if (bundleAnalysis.totalJSSize > 200000) { // 200KB
      recommendations.push("JavaScript bundle size is large - consider code splitting");
    }

    // Check chunk count
    if (bundleAnalysis.chunkCount < 3) {
      recommendations.push("Consider implementing more granular code splitting");
    }

    // Check component load times
    const components = metrics.components || {};
    Object.entries(components).forEach(([name, data]: [string, any]) => {
      if (data.loadTime > 100) {
        recommendations.push(`Component ${name} takes ${data.loadTime.toFixed(2)}ms to load - consider optimization`);
      }
    });

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generateReport(): unknown {
    const metrics = this.getMetrics();
    const bundleAnalysis = this.getBundleAnalysis();
    const recommendations = this.getOptimizationRecommendations();

    return {
      timestamp: new Date().toISOString(),
      coreWebVitals: {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: this.getCLS()
      },
      bundleAnalysis,
      componentMetrics: metrics.components || {},
      lazyLoadingMetrics: metrics.lazyLoading || [],
      customTimings: metrics.customTimings || {},
      recommendations,
      score: this.calculatePerformanceScore()
    };
  }

  private getCLS(): number {
    // Simplified CLS calculation
    try {
      const clsEntries = performance.getEntriesByType("layout-shift");
      return clsEntries.reduce((sum, entry: unknown) => {
        if (!entry.hadRecentInput) {
          return sum + entry.value;
        }
        return sum;
      }, 0);
    } catch {
      return 0;
    }
  }

  private calculatePerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Deduct points for poor metrics
    if (metrics.lcp > 2500) score -= 20;
    if (metrics.fid > 100) score -= 15;
    if (this.getCLS() > 0.1) score -= 15;

    const bundleAnalysis = this.getBundleAnalysis();
    if (bundleAnalysis.totalJSSize > 200000) score -= 10;
    if (bundleAnalysis.averageLoadTime > 200) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Clean up observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export function measureComponentLoad<T>(
  componentName: string,
  loadFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  return loadFn().then(result => {
    const loadTime = performance.now() - startTime;
    performanceMonitor.recordComponentLoad(componentName, loadTime);
    return result;
  });
}

export function withPerformanceTracking<T extends (...args: unknown[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: unknown[]) => {
    performanceMonitor.startTiming(label);
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.endTiming(label);
      });
    } else {
      performanceMonitor.endTiming(label);
      return result;
    }
  }) as T;
}