/**
 * React-specific performance monitoring using React DevTools Profiler API
 * Monitors component render times, mount/unmount, and update patterns
 */

import { Profiler, ProfilerOnRenderCallback } from "react";

export interface ComponentMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  mountTime?: number;
  updateCount: number;
  phase: "mount" | "update" | "nested-update";
}

export interface ReactPerformanceMetrics {
  components: Map<string, ComponentMetrics>;
  slowRenders: RenderSnapshot[];
  renderPatterns: RenderPattern[];
  totalRenders: number;
  slowRenderThreshold: number;
}

export interface RenderSnapshot {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: number;
  interactions: Set<any>;
}

export interface RenderPattern {
  componentId: string;
  pattern: "frequent-updates" | "slow-renders" | "cascading-updates";
  count: number;
  averageDuration: number;
}

export class ReactPerformanceMonitor {
  private metrics: ReactPerformanceMetrics = {
    components: new Map(),
    slowRenders: [],
    renderPatterns: [],
    totalRenders: 0,
    slowRenderThreshold: 16, // 16ms for 60fps
  };

  private callbacks: ((metrics: ReactPerformanceMetrics) => void)[] = [];
  private patternDetectionInterval?: NodeJS.Timeout;
  private cascadingUpdates = new Map<string, number[]>();

  constructor(slowRenderThreshold = 16) {
    this.metrics.slowRenderThreshold = slowRenderThreshold;
    this.startPatternDetection();
  }

  /**
   * Profile callback for React Profiler
   */
  onRender: ProfilerOnRenderCallback = (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
    interactions: Set<any>
  ) => {
    this.metrics.totalRenders++;

    // Update component metrics
    const component = this.metrics.components.get(id) || {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      updateCount: 0,
      phase: phase,
    };

    component.renderCount++;
    component.totalRenderTime += actualDuration;
    component.averageRenderTime = component.totalRenderTime / component.renderCount;
    component.lastRenderTime = actualDuration;
    component.phase = phase;

    if (phase === "mount") {
      component.mountTime = actualDuration;
    } else {
      component.updateCount++;
    }

    this.metrics.components.set(id, component);

    // Track slow renders
    if (actualDuration > this.metrics.slowRenderThreshold) {
      const snapshot: RenderSnapshot = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        timestamp: Date.now(),
        interactions,
      };

      this.metrics.slowRenders.push(snapshot);

      // Keep only last 100 slow renders
      if (this.metrics.slowRenders.length > 100) {
        this.metrics.slowRenders.shift();
      }
    }

    // Track cascading updates
    this.trackCascadingUpdates(id, startTime);

    // Notify callbacks
    this.notifyCallbacks();

    // Log in development
    if (process.env.NODE_ENV === "development" && actualDuration > this.metrics.slowRenderThreshold) {
    }
  };

  /**
   * Track cascading updates
   */
  private trackCascadingUpdates(componentId: string, startTime: number): void {
    const updates = this.cascadingUpdates.get(componentId) || [];
    const now = performance.now();

    // Remove old updates (older than 100ms)
    const recentUpdates = updates.filter((time: any) => now - time < 100);
    recentUpdates.push(startTime);

    this.cascadingUpdates.set(componentId, recentUpdates);

    // Detect cascading pattern (3+ updates within 100ms)
    if (recentUpdates.length >= 3) {
      const existingPattern = this.metrics.renderPatterns.find(
        (p) => p.componentId === componentId && p.pattern === "cascading-updates"
      );

      if (existingPattern) {
        existingPattern.count++;
      } else {
        this.metrics.renderPatterns.push({
          componentId,
          pattern: "cascading-updates",
          count: 1,
          averageDuration: this.metrics.components.get(componentId)?.averageRenderTime || 0,
        });
      }
    }
  }

  /**
   * Start pattern detection
   */
  private startPatternDetection(): void {
    this.patternDetectionInterval = setInterval(() => {
      this.detectRenderPatterns();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Detect render patterns
   */
  private detectRenderPatterns(): void {
    this.metrics.components.forEach((metrics, componentId) => {
      // Detect frequent updates (more than 10 renders per second)
      const rendersPerSecond = metrics.renderCount / ((Date.now() - (metrics.mountTime || 0)) / 1000);
      if (rendersPerSecond > 10) {
        this.addOrUpdatePattern({
          componentId,
          pattern: "frequent-updates",
          count: metrics.renderCount,
          averageDuration: metrics.averageRenderTime,
        });
      }

      // Detect consistently slow renders
      if (metrics.averageRenderTime > this.metrics.slowRenderThreshold && metrics.renderCount > 5) {
        this.addOrUpdatePattern({
          componentId,
          pattern: "slow-renders",
          count: metrics.renderCount,
          averageDuration: metrics.averageRenderTime,
        });
      }
    });
  }

  /**
   * Add or update render pattern
   */
  private addOrUpdatePattern(pattern: RenderPattern): void {
    const existingIndex = this.metrics.renderPatterns.findIndex(
      (p) => p.componentId === pattern.componentId && p.pattern === pattern.pattern
    );

    if (existingIndex >= 0) {
      this.metrics.renderPatterns[existingIndex] = pattern;
    } else {
      this.metrics.renderPatterns.push(pattern);
    }
  }

  /**
   * Get component metrics
   */
  getComponentMetrics(componentId: string): ComponentMetrics | undefined {
    return this.metrics.components.get(componentId);
  }

  /**
   * Get all metrics
   */
  getMetrics(): ReactPerformanceMetrics {
    return {
      ...this.metrics,
      components: new Map(this.metrics.components),
      slowRenders: [...this.metrics.slowRenders],
      renderPatterns: [...this.metrics.renderPatterns],
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for slow renders
    const slowComponents = Array.from(this.metrics.components.entries())
      .filter(([_, metrics]) => metrics.averageRenderTime > this.metrics.slowRenderThreshold)
      .sort((a, b) => b[1].averageRenderTime - a[1].averageRenderTime);

    if (slowComponents.length > 0) {
      recommendations.push(
        `Components with slow renders: ${slowComponents
          .slice(0, 3)
          .map(([id, m]) => `${id} (${m.averageRenderTime.toFixed(1)}ms)`)
          .join(", ")}`
      );
    }

    // Check for frequent updates
    const frequentUpdaters = this.metrics.renderPatterns
      .filter((p: any) => p.pattern === "frequent-updates")
      .sort((a, b) => b.count - a.count);

    if (frequentUpdaters.length > 0) {
      recommendations.push(
        `Components with frequent updates: ${frequentUpdaters
          .slice(0, 3)
          .map((p: any) => `${p.componentId} (${p.count} renders)`)
          .join(", ")}`
      );
    }

    // Check for cascading updates
    const cascadingComponents = this.metrics.renderPatterns.filter((p: any) => p.pattern === "cascading-updates");

    if (cascadingComponents.length > 0) {
      recommendations.push(
        `Components with cascading updates: ${cascadingComponents.map((p: any) => p.componentId).join(", ")}`
      );
    }

    return recommendations;
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: ReactPerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);

    return () => {
      this.callbacks = this.callbacks.filter((cb: any) => cb !== callback);
    };
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback: any) => callback(this.metrics));
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.components.clear();
    this.metrics.slowRenders = [];
    this.metrics.renderPatterns = [];
    this.metrics.totalRenders = 0;
    this.cascadingUpdates.clear();
    this.notifyCallbacks();
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.patternDetectionInterval) {
      clearInterval(this.patternDetectionInterval);
    }
    this.callbacks = [];
    this.reset();
  }
}

// Singleton instance
export const reactPerformanceMonitor = new ReactPerformanceMonitor();
