"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte

  // Custom Metrics
  renderTime?: number;
  memoryUsage?: number;
  componentMountTime?: number;

  // Frame Rate Monitoring
  fps: number;
  averageFps: number;
  frameDrops: number;
  isSlowDevice: boolean;
  shouldReduceAnimations: boolean;

  // Network
  connectionType?: string;
  isOnline: boolean;
  networkSpeed?: string; // slow-2g, 2g, 3g, 4g

  // Browser
  userAgent?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

interface PerformanceConfig {
  enableCoreWebVitals?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkTracking?: boolean;
  reportingInterval?: number;
  onMetricChange?: (metric: string, value: number) => void;
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
}

// Performance thresholds based on Core Web Vitals and mobile targets
const THRESHOLDS = {
  FCP: 1800, // ms
  LCP: 4000, // ms - Moto G4 target for mobile
  FID: 100, // ms
  CLS: 0.1, // score
  TTFB: 800, // ms
  RENDER_TIME: 16, // ms (60fps = 16.67ms per frame)
  MEMORY_USAGE: 100 * 1024 * 1024, // 100MB for widget consolidation
  MIN_FPS: 30, // Minimum acceptable frame rate
  FRAME_DROP_THRESHOLD: 5, // Max frame drops per second
};

/**
 * Performance Monitoring Hook
 * Tracks Core Web Vitals, memory usage, and custom performance metrics
 *
 * Usage:
 * const { metrics, startTimer, endTimer, reportMetric } = usePerformanceMonitor({
 *   enableCoreWebVitals: true,
 *   onThresholdExceeded: (metric, value, threshold) => {
 *     // Handle threshold exceeded
 *   }
 * });
 */
export const usePerformanceMonitor = (config: PerformanceConfig = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  const timers = useRef<Map<string, number>>(new Map());
  const observers = useRef<Set<PerformanceObserver>>(new Set());
  const reportingInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const {
    enableCoreWebVitals = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    reportingInterval: interval = 30000, // 30 seconds
    onMetricChange,
    onThresholdExceeded,
  } = config;

  // Check if metric exceeds threshold
  const checkThreshold = useCallback(
    (metric: string, value: number) => {
      const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
      if (threshold && value > threshold) {
        onThresholdExceeded?.(metric, value, threshold);

        // Auto-report critical performance issues
        if (typeof window !== "undefined" && (window as unknown).gtag) {
          (window as unknown).gtag("event", "performance_issue", {
            metric_name: metric,
            metric_value: value,
            threshold: threshold,
            severity: value > threshold * 2 ? "critical" : "warning",
          });
        }
      }
    },
    [onThresholdExceeded]
  );

  // Update metrics and trigger callbacks
  const updateMetric = useCallback(
    (key: keyof PerformanceMetrics, value: number | string | boolean) => {
      // Update state first
      setMetrics((prev) => ({ ...prev, [key]: value }));

      // Handle side effects after state update to prevent infinite loops
      if (typeof value === "number") {
        // Use setTimeout to defer side effects and prevent infinite loops
        setTimeout(() => {
          onMetricChange?.(key, value);
          checkThreshold(key, value);
        }, 0);
      }
    },
    [onMetricChange, checkThreshold]
  );

  // Core Web Vitals measurement
  const setupCoreWebVitals = useCallback(() => {
    if (!enableCoreWebVitals || typeof window === "undefined") return;

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((entry) => entry.name === "first-contentful-paint");
      if (fcp) {
        updateMetric("fcp", fcp.startTime);
      }
    });
    fcpObserver.observe({ entryTypes: ["paint"] });
    observers.current.add(fcpObserver);

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        updateMetric("lcp", lastEntry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    observers.current.add(lcpObserver);

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: unknown) => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          updateMetric("fid", fid);
        }
      });
    });
    fidObserver.observe({ entryTypes: ["first-input"] });
    observers.current.add(fidObserver);

    // Cumulative Layout Shift
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: unknown) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          updateMetric("cls", clsScore);
        }
      });
    });
    clsObserver.observe({ entryTypes: ["layout-shift"] });
    observers.current.add(clsObserver);
  }, [enableCoreWebVitals, updateMetric]);

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking || typeof window === "undefined") return;

    const measureMemory = () => {
      // @ts-expect-error - performance.memory is available in Chrome
      if (performance.memory) {
        // @ts-expect-error
        const memoryUsage = performance.memory.usedJSHeapSize;
        updateMetric("memoryUsage", memoryUsage);
      }
    };

    measureMemory();

    // Set up periodic memory tracking
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => clearInterval(memoryInterval);
  }, [enableMemoryTracking, updateMetric]);

  // Network tracking
  const setupNetworkTracking = useCallback(() => {
    if (!enableNetworkTracking || typeof navigator === "undefined") return;

    // Connection type
    // @ts-expect-error - connection is available in modern browsers
    if (navigator.connection) {
      // @ts-expect-error
      updateMetric("connectionType", navigator.connection.effectiveType);
    }

    // Device capabilities
    // @ts-expect-error
    if (navigator.deviceMemory) {
      // @ts-expect-error
      updateMetric("deviceMemory", navigator.deviceMemory);
    }

    if (navigator.hardwareConcurrency) {
      updateMetric("hardwareConcurrency", navigator.hardwareConcurrency);
    }

    updateMetric("userAgent", navigator.userAgent);

    // Online/offline status
    const handleOnline = () => updateMetric("isOnline", true);
    const handleOffline = () => updateMetric("isOnline", false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enableNetworkTracking, updateMetric]);

  // Custom timer functions
  const startTimer = useCallback((name: string) => {
    timers.current.set(name, performance.now());
  }, []);

  const endTimer = useCallback(
    (name: string): number | null => {
      const startTime = timers.current.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        timers.current.delete(name);

        // Auto-report render times
        if (name.includes("render")) {
          updateMetric("renderTime", duration);
        }

        return duration;
      }
      return null;
    },
    [updateMetric]
  );

  // Manual metric reporting
  const reportMetric = useCallback(
    (name: string, value: number) => {
      updateMetric(name as keyof PerformanceMetrics, value);
    },
    [updateMetric]
  );

  // Component mount time tracking
  const componentMountStart = useRef<number | undefined>(undefined);
  const componentMountTimeRef = useRef<number>(0);

  useEffect(() => {
    componentMountStart.current = performance.now();

    // Setup all monitoring
    const cleanupFunctions: (() => void)[] = [];

    setupCoreWebVitals();

    const memoryCleanup = trackMemoryUsage();
    if (memoryCleanup) cleanupFunctions.push(memoryCleanup);

    const networkCleanup = setupNetworkTracking();
    if (networkCleanup) cleanupFunctions.push(networkCleanup);

    // Periodic reporting
    if (interval > 0) {
      reportingInterval.current = setInterval(() => {
        // Custom reporting logic here
      }, interval);
    }

    return () => {
      // Cleanup observers
      observers.current.forEach((observer: unknown) => observer.disconnect());
      observers.current.clear();

      // Cleanup other listeners
      cleanupFunctions.forEach((cleanup: unknown) => cleanup());

      if (reportingInterval.current) {
        clearInterval(reportingInterval.current);
      }

      // Record component mount time (safely without triggering state updates during cleanup)
      if (componentMountStart.current) {
        const mountTime = performance.now() - componentMountStart.current;
        // Store in ref instead of triggering state update during cleanup
        componentMountTimeRef.current = mountTime;
      }
    };
  }, [setupCoreWebVitals, trackMemoryUsage, setupNetworkTracking, interval]); // Removed metrics and updateMetric to prevent infinite loops

  // Performance summary for debugging
  const getPerformanceSummary = useCallback(() => {
    const summary = {
      score: 0,
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Calculate performance score (0-100)
    let totalScore = 0;
    let scoreCount = 0;

    if (metrics.fcp) {
      const fcpScore = Math.max(0, 100 - (metrics.fcp / THRESHOLDS.FCP) * 100);
      totalScore += fcpScore;
      scoreCount++;
      if (metrics.fcp > THRESHOLDS.FCP) {
        summary.issues.push(`Slow First Contentful Paint: ${metrics.fcp.toFixed(0)}ms`);
        summary.recommendations.push("Optimize critical rendering path and reduce render-blocking resources");
      }
    }

    if (metrics.lcp) {
      const lcpScore = Math.max(0, 100 - (metrics.lcp / THRESHOLDS.LCP) * 100);
      totalScore += lcpScore;
      scoreCount++;
      if (metrics.lcp > THRESHOLDS.LCP) {
        summary.issues.push(`Slow Largest Contentful Paint: ${metrics.lcp.toFixed(0)}ms`);
        summary.recommendations.push("Optimize largest content element and improve server response times");
      }
    }

    if (metrics.cls) {
      const clsScore = Math.max(0, 100 - (metrics.cls / THRESHOLDS.CLS) * 100);
      totalScore += clsScore;
      scoreCount++;
      if (metrics.cls > THRESHOLDS.CLS) {
        summary.issues.push(`High Cumulative Layout Shift: ${metrics.cls.toFixed(3)}`);
        summary.recommendations.push("Set dimensions for images/videos and avoid injecting content");
      }
    }

    if (metrics.memoryUsage && metrics.memoryUsage > THRESHOLDS.MEMORY_USAGE) {
      summary.issues.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      summary.recommendations.push("Implement memory leak detection and optimize component cleanup");
    }

    summary.score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 100;

    // Frame rate analysis
    if (metrics.averageFps < THRESHOLDS.MIN_FPS) {
      summary.issues.push(`Low frame rate: ${metrics.averageFps.toFixed(1)}fps`);
      summary.recommendations.push("Reduce animations and optimize rendering performance");
    }

    if (metrics.frameDrops > THRESHOLDS.FRAME_DROP_THRESHOLD) {
      summary.issues.push(`High frame drops: ${metrics.frameDrops} per second`);
      summary.recommendations.push("Enable automatic animation reduction for better performance");
    }

    return summary;
  }, [metrics]);

  // Frame rate monitoring
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>();

  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      // Calculate FPS every second
      const fps = Math.round((frameCountRef.current * 1000) / delta);

      // Update FPS history (keep last 10 seconds)
      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift();
      }

      const averageFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
      const frameDrops = Math.max(0, 60 - fps); // Assuming 60fps target
      const isSlowDevice = averageFps < 45;
      const shouldReduceAnimations = averageFps < THRESHOLDS.MIN_FPS;

      // Batch all metric updates to prevent multiple re-renders
      setMetrics((prev) => ({
        ...prev,
        fps,
        averageFps,
        frameDrops,
        isSlowDevice,
        shouldReduceAnimations,
      }));

      // Apply performance optimizations
      const root = document.documentElement;
      if (shouldReduceAnimations) {
        root.classList.add("reduce-animations");
        root.style.setProperty("--animation-duration", "0ms");
      } else {
        root.classList.remove("reduce-animations");
        root.style.removeProperty("--animation-duration");
      }

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    frameCountRef.current++;
    animationFrameRef.current = requestAnimationFrame(calculateFPS);
  }, []); // Remove updateMetric dependency to prevent infinite loop

  // Initialize frame rate monitoring
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(calculateFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [calculateFPS]);

  // Memoize performance summary to prevent recalculation on every render
  const performanceSummary = useMemo(() => getPerformanceSummary(), [getPerformanceSummary]);

  return {
    metrics,
    startTimer,
    endTimer,
    reportMetric,
    getPerformanceSummary,
    isPerformanceGood: performanceSummary.score >= 80,
    shouldReduceAnimations: metrics.shouldReduceAnimations || false,
    currentFPS: metrics.fps || 60,
  };
};

export default usePerformanceMonitor;
