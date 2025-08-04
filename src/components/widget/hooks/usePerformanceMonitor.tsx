"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { performanceLogger } from "@/lib/utils/logger";

// Performance monitoring interfaces
interface PerformanceMetrics {
  loadTime: number;
  bundleSize: number;
  apiResponseTime: number;
  messageLatency: number;
  lighthouseScore: number;
  memoryUsage: number;
  p75LoadTime: number;
  region: string;
  device: string;
  networkType: string;
}

interface PerformanceContext {
  loadTime: number;
  apiLatency: number;
  networkType: string;
  region: string;
  device: string;
}

interface UserFeedback {
  type: "thumbs-up" | "thumbs-down";
  question: "was-chat-fast" | "was-chat-helpful";
  timestamp: number;
  sessionId: string;
  performanceContext: PerformanceContext;
}

interface UsePerformanceMonitorReturn {
  trackLoadTime: (duration: number) => void;
  trackBundleSize: (size: number) => void;
  trackApiLatency: (endpoint: string, duration: number) => void;
  trackUserInteraction: (action: string, metadata?: object) => void;
  getMetrics: () => PerformanceMetrics;
  reportWebVitals: () => void;
  exportMetrics: () => void;
  trackThumbFeedback: (positive: boolean, context: PerformanceContext) => void;
  trackUserSatisfaction: (score: number, context: object) => void;
}

// Global metrics storage
const metricsBuffer = {
  loadTimes: [] as number[],
  apiLatencies: [] as { endpoint: string; duration: number; timestamp: number }[],
  bundleSizes: [] as number[],
  userInteractions: [] as { action: string; metadata?: object; timestamp: number }[],
  webVitals: {} as Record<string, number>,
  feedbacks: [] as UserFeedback[],
};

// Utility functions
const getRegion = (): string => {
  // Simple region detection based on timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone.includes("America")) return "us";
  if (timezone.includes("Europe")) return "eu";
  if (timezone.includes("Asia")) return "apac";
  return "unknown";
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "mobile";
  if (/Tablet/.test(userAgent)) return "tablet";
  return "desktop";
};

const getNetworkType = (): string => {
  const connection =
    (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;
  return connection?.effectiveType || "unknown";
};

const calculateP75 = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.75) - 1;
  return sorted[index] || 0;
};

// Sentry integration with feature flags context
const initializeSentry = () => {
  if (typeof window !== "undefined" && !window.Sentry) {
    // Dynamically import Sentry for client-side only
    import("@sentry/nextjs").then((Sentry) => {
      window.Sentry = Sentry;

      // Initialize with widget-specific configuration
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,

        // Sampling rates for cost control
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.2, // 5% prod, 20% staging
        replaysSessionSampleRate: 0.01, // 1% session replays
        replaysOnErrorSampleRate: 1.0, // 100% error replays

        beforeSend(event, hint) {
          // Add widget-specific context
          event.tags = {
            ...event.tags,
            component: "widget",
            version: "3.0",
          };

          // Add performance context
          event.contexts = {
            ...event.contexts,
            performance: {
              loadTime: metricsBuffer.loadTimes[metricsBuffer.loadTimes.length - 1] || 0,
              apiLatency: metricsBuffer.apiLatencies[metricsBuffer.apiLatencies.length - 1]?.duration || 0,
              networkType: getNetworkType(),
              region: getRegion(),
              device: getDeviceType(),
            },
          };

          return event;
        },

        integrations: [
          new Sentry.BrowserTracing({
            tracingOrigins: ["localhost", "campfire.com", /^\//],
          }),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
    });
  }
};

export const usePerformanceMonitor = (): UsePerformanceMonitorReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    bundleSize: 0,
    apiResponseTime: 0,
    messageLatency: 0,
    lighthouseScore: 0,
    memoryUsage: 0,
    p75LoadTime: 0,
    region: getRegion(),
    device: getDeviceType(),
    networkType: getNetworkType(),
  });

  const sessionId = useRef<string>(
    sessionStorage.getItem("widget-session-id") || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Initialize session ID
  useEffect(() => {
    sessionStorage.setItem("widget-session-id", sessionId.current);
    initializeSentry();
  }, []);

  // Web Vitals tracking
  const reportWebVitals = useCallback(() => {
    if (typeof window !== "undefined") {
      // Track Core Web Vitals
      import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          metricsBuffer.webVitals.cls = metric.value;
          if (window.Sentry) {
            window.Sentry.addBreadcrumb({
              category: "web-vitals",
              message: "CLS measured",
              level: "info",
              data: { value: metric.value, rating: metric.rating },
            });
          }
        });

        getFID((metric) => {
          metricsBuffer.webVitals.fid = metric.value;
          if (window.Sentry) {
            window.Sentry.addBreadcrumb({
              category: "web-vitals",
              message: "FID measured",
              level: "info",
              data: { value: metric.value, rating: metric.rating },
            });
          }
        });

        getFCP((metric) => {
          metricsBuffer.webVitals.fcp = metric.value;
        });

        getLCP((metric) => {
          metricsBuffer.webVitals.lcp = metric.value;
        });

        getTTFB((metric) => {
          metricsBuffer.webVitals.ttfb = metric.value;
        });
      });
    }
  }, []);

  const trackLoadTime = useCallback((duration: number) => {
    metricsBuffer.loadTimes.push(duration);
    setMetrics((prev) => ({
      ...prev,
      loadTime: duration,
      p75LoadTime: calculateP75(metricsBuffer.loadTimes),
    }));

    // Alert if load time exceeds 100ms
    if (duration > 100) {
      performanceLogger.warnThrottled(`Load time exceeded threshold: ${duration}ms > 100ms`);
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: "performance",
          message: "Load time exceeded threshold",
          level: "warning",
          data: { duration, threshold: 100 },
        });
      }
    }
  }, []);

  const trackBundleSize = useCallback((size: number) => {
    metricsBuffer.bundleSizes.push(size);
    setMetrics((prev) => ({ ...prev, bundleSize: size }));

    // Alert if bundle size exceeds 250KB
    if (size > 250000) {
      performanceLogger.warnThrottled(`Bundle size exceeded threshold: ${size} bytes > 250KB`);
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: "performance",
          message: "Bundle size exceeded threshold",
          level: "warning",
          data: { size, threshold: 250000 },
        });
      }
    }
  }, []);

  const trackApiLatency = useCallback((endpoint: string, duration: number) => {
    const entry = { endpoint, duration, timestamp: Date.now() };
    metricsBuffer.apiLatencies.push(entry);

    const avgLatency =
      metricsBuffer.apiLatencies
        .slice(-10) // Last 10 requests
        .reduce((sum, item) => sum + item.duration, 0) / Math.min(10, metricsBuffer.apiLatencies.length);

    setMetrics((prev) => ({ ...prev, apiResponseTime: avgLatency }));

    // Alert if API latency exceeds 200ms
    if (duration > 200) {
      performanceLogger.warnThrottled(`API latency exceeded threshold: ${endpoint} ${duration}ms > 200ms`);
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: "api",
          message: "API latency exceeded threshold",
          level: "warning",
          data: { endpoint, duration, threshold: 200 },
        });
      }
    }
  }, []);

  const trackUserInteraction = useCallback((action: string, metadata?: object) => {
    const entry = { action, metadata, timestamp: Date.now() };
    metricsBuffer.userInteractions.push(entry);

    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: "user-interaction",
        message: `User ${action}`,
        level: "info",
        data: metadata,
      });
    }
  }, []);

  const trackThumbFeedback = useCallback(
    (positive: boolean, context: PerformanceContext) => {
      const feedback: UserFeedback = {
        type: positive ? "thumbs-up" : "thumbs-down",
        question: "was-chat-fast",
        timestamp: Date.now(),
        sessionId: sessionId.current,
        performanceContext: context,
      };

      metricsBuffer.feedbacks.push(feedback);

      // Track correlation between feedback and performance
      trackUserInteraction("thumb-feedback", {
        positive,
        loadTime: context.loadTime,
        apiLatency: context.apiLatency,
        networkType: context.networkType,
      });
    },
    [trackUserInteraction]
  );

  const trackUserSatisfaction = useCallback(
    (score: number, context: object) => {
      trackUserInteraction("satisfaction-score", { score, ...context });
    },
    [trackUserInteraction]
  );

  const getMetrics = useCallback((): PerformanceMetrics => {
    return {
      ...metrics,
      p75LoadTime: calculateP75(metricsBuffer.loadTimes),
      memoryUsage: (performance as unknown).memory?.usedJSHeapSize || 0,
    };
  }, [metrics]);

  const exportMetrics = useCallback(() => {
    const exportData = {
      p75LoadTime: calculateP75(metricsBuffer.loadTimes),
      region: getRegion(),
      device: getDeviceType(),
      networkType: getNetworkType(),
      timestamp: Date.now(),
      sessionId: sessionId.current,
      webVitals: metricsBuffer.webVitals,
      feedbacks: metricsBuffer.feedbacks,
    };

    // Use sendBeacon for reliable metric export
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/metrics/export", JSON.stringify(exportData));
    } else {
      fetch("/api/metrics/export", {
        method: "POST",
        body: JSON.stringify(exportData),
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch((error) => performanceLogger.error("Failed to export metrics:", error));
    }
  }, []);

  // Auto-export metrics on page unload
  useEffect(() => {
    const handleBeforeUnload = () => exportMetrics();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [exportMetrics]);

  // Initialize web vitals tracking
  useEffect(() => {
    reportWebVitals();
  }, [reportWebVitals]);

  return {
    trackLoadTime,
    trackBundleSize,
    trackApiLatency,
    trackUserInteraction,
    getMetrics,
    reportWebVitals,
    exportMetrics,
    trackThumbFeedback,
    trackUserSatisfaction,
  };
};

// Global performance monitor instance for widget
export const globalWidgetPerformanceMonitor = {
  trackLoadTime: (duration: number) => {
    metricsBuffer.loadTimes.push(duration);
  },
  trackApiLatency: (endpoint: string, duration: number) => {
    metricsBuffer.apiLatencies.push({ endpoint, duration, timestamp: Date.now() });
  },
  getP75LoadTime: () => calculateP75(metricsBuffer.loadTimes),
};

// Extend window interface for Sentry
declare global {
  interface Window {
    Sentry?: unknown;
  }
}
