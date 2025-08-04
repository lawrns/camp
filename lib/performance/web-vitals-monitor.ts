/**
 * Web Vitals monitoring with Core Web Vitals metrics
 * Tracks LCP, INP, CLS, TTFB and other essential performance metrics
 */

import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay (deprecated in web-vitals v5.x, replaced by INP)
  cls?: number; // Cumulative Layout Shift
  inp?: number; // Interaction to Next Paint

  // Other important metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom metrics
  tti?: number; // Time to Interactive
  tbt?: number; // Total Blocking Time
  longTasks?: number; // Count of long tasks
}

export interface WebVitalsThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  inp: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

// Google's Core Web Vitals thresholds
export const DEFAULT_THRESHOLDS: WebVitalsThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  inp: { good: 200, needsImprovement: 500 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

export type MetricRating = "good" | "needs-improvement" | "poor";

export class WebVitalsMonitor {
  private metrics: WebVitalsMetrics = {};
  private callbacks: ((metrics: WebVitalsMetrics) => void)[] = [];
  private thresholds: WebVitalsThresholds;
  private isInitialized = false;
  private longTaskObserver?: PerformanceObserver;
  private navigationObserver?: PerformanceObserver;

  constructor(thresholds: WebVitalsThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Initialize Web Vitals monitoring
   */
  initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    this.isInitialized = true;

    // Core Web Vitals
    onLCP((metric: unknown) => this.handleMetric("lcp", metric));
    // onFID is deprecated in web-vitals v5.x - FID has been replaced by INP
    // Keeping fid property for backward compatibility but it won't be updated
    onCLS((metric: unknown) => this.handleMetric("cls", metric));
    onINP((metric: unknown) => this.handleMetric("inp", metric));

    // Other metrics
    onFCP((metric: unknown) => this.handleMetric("fcp", metric));
    onTTFB((metric: unknown) => this.handleMetric("ttfb", metric));

    // Long Tasks monitoring
    this.observeLongTasks();

    // Navigation timing for TTI
    this.observeNavigationTiming();
  }

  /**
   * Handle metric update
   */
  private handleMetric(name: keyof WebVitalsMetrics, metric: Metric): void {
    this.metrics[name] = metric.value;
    this.notifyCallbacks();

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const rating = this.getRating(name, metric.value);
    }
  }

  /**
   * Observe long tasks for TBT calculation
   */
  private observeLongTasks(): void {
    if (!("PerformanceObserver" in window)) return;

    let longTaskCount = 0;

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        longTaskCount += entries.length;

        this.metrics.longTasks = longTaskCount;

        // Calculate Total Blocking Time (simplified)
        const tbt = entries.reduce((total: unknown, entry: unknown) => {
          const blockingTime = Math.max(0, entry.duration - 50);
          return total + blockingTime;
        }, this.metrics.tbt || 0);

        this.metrics.tbt = tbt;
        this.notifyCallbacks();
      });

      this.longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (error) {}
  }

  /**
   * Observe navigation timing for TTI
   */
  private observeNavigationTiming(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      this.navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navEntry = entries.find((entry) => entry.entryType === "navigation") as PerformanceNavigationTiming;

        if (navEntry && navEntry.loadEventEnd > 0) {
          // Simple TTI approximation
          const tti = navEntry.loadEventEnd - navEntry.fetchStart;
          this.metrics.tti = tti;
          this.notifyCallbacks();
        }
      });

      this.navigationObserver.observe({ entryTypes: ["navigation"] });
    } catch (error) {}
  }

  /**
   * Get rating for a metric value
   */
  getRating(metric: string, value: number): MetricRating {
    const threshold = this.thresholds[metric as keyof WebVitalsThresholds];
    if (!threshold) return "poor";

    if (value <= threshold.good) return "good";
    if (value <= threshold.needsImprovement) return "needs-improvement";
    return "poor";
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metrics: WebVitalsMetrics) => void): () => void {
    this.callbacks.push(callback);

    // Send current metrics immediately
    if (Object.keys(this.metrics).length > 0) {
      callback(this.metrics);
    }

    return () => {
      this.callbacks = this.callbacks.filter((cb: unknown) => cb !== callback);
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const weights = {
      lcp: 0.25,
      inp: 0.25, // Using INP instead of deprecated FID
      cls: 0.25,
      fcp: 0.15,
      ttfb: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics[metric as keyof WebVitalsMetrics];
      if (typeof value === "number") {
        const rating = this.getRating(metric, value);
        const score = rating === "good" ? 100 : rating === "needs-improvement" ? 50 : 0;
        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback: unknown) => callback(this.metrics));
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.longTaskObserver?.disconnect();
    this.navigationObserver?.disconnect();
    this.callbacks = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();
