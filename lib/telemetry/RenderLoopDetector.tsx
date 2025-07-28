"use client";

import { useCallback, useEffect, useRef } from "react";

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  avgRenderTime: number;
  renderTimes: number[];
  isLooping: boolean;
  hookCalls: Map<string, number>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, RenderMetrics>();
  private renderThreshold = 10; // renders per second
  private timeWindow = 1000; // 1 second window
  private maxStoredRenderTimes = 50;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordRender(componentName: string, hookCalls?: Map<string, number>) {
    const now = performance.now();
    const existing = this.metrics.get(componentName);

    if (!existing) {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: now,
        avgRenderTime: 0,
        renderTimes: [now],
        isLooping: false,
        hookCalls: hookCalls || new Map(),
      });
      return;
    }

    // Update metrics
    existing.renderCount++;
    existing.renderTimes.push(now);
    existing.hookCalls = hookCalls || existing.hookCalls;

    // Keep only recent render times
    if (existing.renderTimes.length > this.maxStoredRenderTimes) {
      existing.renderTimes = existing.renderTimes.slice(-this.maxStoredRenderTimes);
    }

    // Calculate average render time
    const recentRenderTimes = existing.renderTimes.filter((time: any) => now - time < this.timeWindow);
    existing.avgRenderTime =
      recentRenderTimes.length > 1 ? (now - (recentRenderTimes[0] || 0)) / (recentRenderTimes.length - 1) : 0;

    // Check for render loop
    const rendersInWindow = recentRenderTimes.length;
    const wasLooping = existing.isLooping;
    existing.isLooping = rendersInWindow > this.renderThreshold;

    // Log render loop detection
    if (existing.isLooping && !wasLooping) {
      this.logRenderLoop(existing);
    }

    existing.lastRenderTime = now;
  }

  private logRenderLoop(metrics: RenderMetrics) {
    // Suggest common fixes
    this.suggestFixes(metrics);
  }

  private suggestFixes(metrics: RenderMetrics) {
    const suggestions: string[] = [];

    // Check for common hook issues
    if (metrics.hookCalls.has("useCallback") && metrics.hookCalls.get("useCallback")! > 5) {
      suggestions.push("• Check useCallback dependencies - they might be changing on every render");
    }

    if (metrics.hookCalls.has("useMemo") && metrics.hookCalls.get("useMemo")! > 5) {
      suggestions.push("• Check useMemo dependencies - they might be unstable");
    }

    if (metrics.hookCalls.has("useEffect") && metrics.hookCalls.get("useEffect")! > 3) {
      suggestions.push("• Check useEffect dependencies - infinite loop detected");
    }

    if (metrics.hookCalls.has("useState") && metrics.hookCalls.get("useState")! > 10) {
      suggestions.push("• Multiple setState calls detected - consider batching state updates");
    }

    if (suggestions.length > 0) {
    }
  }

  getMetrics(componentName?: string) {
    if (componentName) {
      return this.metrics.get(componentName);
    }
    return Array.from(this.metrics.values());
  }

  reset(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  generateReport() {
    const allMetrics = Array.from(this.metrics.values());
    const loopingComponents = allMetrics.filter((m: any) => m.isLooping);
    const heavyComponents = allMetrics.filter((m: any) => m.renderCount > 50);

    console.group("📊 PERFORMANCE REPORT");
    if (loopingComponents.length > 0) {
      console.group("🔄 Render Loop Components:");
      loopingComponents.forEach((metrics: any) => {});
      console.groupEnd();
    }

    if (heavyComponents.length > 0) {
      console.group("🔥 Heavy Rendering Components:");
      heavyComponents.forEach((metrics: any) => {});
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Hook to monitor component renders
export function useRenderLoopDetector(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  const renderCountRef = useRef(0);
  const hookCallsRef = useRef(new Map<string, number>());

  // Track hook calls
  const trackHookCall = useCallback((hookName: string) => {
    const current = hookCallsRef.current.get(hookName) || 0;
    hookCallsRef.current.set(hookName, current + 1);
  }, []);

  // Record render on every render
  useEffect(() => {
    renderCountRef.current++;
    monitor.recordRender(componentName, new Map(hookCallsRef.current));

    // Reset hook calls after recording
    hookCallsRef.current.clear();
  });

  // Development-only hook call tracking
  if (process.env.NODE_ENV === "development") {
    // This will be called on every render to track hook usage
    trackHookCall("useEffect");
  }

  return {
    trackHookCall,
    getRenderCount: () => renderCountRef.current,
    getMetrics: () => monitor.getMetrics(componentName),
  };
}

// Hook to track specific hook calls
export function useHookCallTracker(componentName: string, hookName: string) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    const metrics = monitor.getMetrics(componentName);
    if (metrics) {
      metrics.hookCalls.set(hookName, (metrics.hookCalls.get(hookName) || 0) + 1);
    }
  });
}

// Performance reporting utilities
export const PerformanceReporter = {
  generateReport: () => PerformanceMonitor.getInstance().generateReport(),
  getMetrics: () => PerformanceMonitor.getInstance().getMetrics(),
  reset: () => PerformanceMonitor.getInstance().reset(),

  // Set up automatic reporting
  startAutoReporting: (intervalMs = 30000) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      const interval = setInterval(() => {
        PerformanceMonitor.getInstance().generateReport();
      }, intervalMs);

      return () => clearInterval(interval);
    }
    return () => {};
  },
};

// Improved component wrapper for render monitoring
export function withRenderMonitoring<P extends object>(Component: React.ComponentType<P>, componentName?: string) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || "Unknown";
    useRenderLoopDetector(name);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withRenderMonitoring(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}
