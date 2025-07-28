/**
 * Custom hook for inbox performance monitoring
 * Provides performance tracking and optimization utilities
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { inboxPerformanceMonitor } from "@/lib/performance/inbox-performance-monitor";
import { reactPerformanceMonitor } from "@/lib/performance/react-performance-monitor";
import { webVitalsMonitor } from "@/lib/performance/web-vitals-monitor";

interface UseInboxPerformanceOptions {
  enableWebVitals?: boolean;
  enableReactProfiling?: boolean;
  enableInboxMetrics?: boolean;
  reportingInterval?: number;
}

export function useInboxPerformanceMonitoring(options: UseInboxPerformanceOptions = {}) {
  const {
    enableWebVitals = true,
    enableReactProfiling = true,
    enableInboxMetrics = true,
    reportingInterval = 30000, // 30 seconds
  } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const measurementRefs = useRef<Map<string, number>>(new Map());
  const frameRequestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // Initialize monitors
    if (enableWebVitals) {
      webVitalsMonitor.initialize();
    }

    setIsMonitoring(true);

    // Set up reporting interval
    const reportingIntervalId = setInterval(() => {
      if (process.env.NODE_ENV === "development") {
      }
    }, reportingInterval);

    return () => {
      clearInterval(reportingIntervalId);
      setIsMonitoring(false);
    };
  }, [enableWebVitals, enableReactProfiling, enableInboxMetrics, reportingInterval]);

  /**
   * Start measuring a performance metric
   */
  const startMeasure = useCallback(
    (measureName: string) => {
      measurementRefs.current.set(measureName, performance.now());

      if (enableInboxMetrics) {
        inboxPerformanceMonitor.startMeasure(measureName);
      }
    },
    [enableInboxMetrics]
  );

  /**
   * End measuring a performance metric
   */
  const endMeasure = useCallback(
    (measureName: string): number => {
      const startTime = measurementRefs.current.get(measureName);
      if (!startTime) return 0;

      const duration = performance.now() - startTime;
      measurementRefs.current.delete(measureName);

      if (enableInboxMetrics) {
        inboxPerformanceMonitor.endMeasure(measureName);
      }

      return duration;
    },
    [enableInboxMetrics]
  );

  /**
   * Measure conversation switch performance
   */
  const measureConversationSwitch = useCallback(
    (conversationId: string) => {
      const measureName = `conversation-switch-${conversationId}`;
      startMeasure(measureName);

      return () => {
        const duration = endMeasure(measureName);
        if (process.env.NODE_ENV === "development" && duration > 200) {
        }
      };
    },
    [startMeasure, endMeasure]
  );

  /**
   * Measure message load performance
   */
  const measureMessageLoad = useCallback(
    (conversationId: string) => {
      const measureName = `message-load-${conversationId}`;
      startMeasure(measureName);

      return () => {
        const duration = endMeasure(measureName);
        if (process.env.NODE_ENV === "development" && duration > 500) {
        }
      };
    },
    [startMeasure, endMeasure]
  );

  /**
   * Measure search performance
   */
  const measureSearch = useCallback(
    (query: string) => {
      const measureName = `search-response-${query}`;
      startMeasure(measureName);

      return () => {
        const duration = endMeasure(measureName);
        if (process.env.NODE_ENV === "development" && duration > 300) {
        }
      };
    },
    [startMeasure, endMeasure]
  );

  /**
   * Track input latency
   */
  const trackInputLatency = useCallback(
    (event: React.ChangeEvent | React.KeyboardEvent) => {
      const latency = performance.now() - event.timeStamp;

      if (enableInboxMetrics) {
        inboxPerformanceMonitor.recordInputLatency(latency);
      }

      if (process.env.NODE_ENV === "development" && latency > 50) {
      }
    },
    [enableInboxMetrics]
  );

  /**
   * Track message delivery time
   */
  const trackMessageDelivery = useCallback(
    (startTime: number) => {
      const deliveryTime = performance.now() - startTime;

      if (enableInboxMetrics) {
        inboxPerformanceMonitor.recordMessageDeliveryTime(deliveryTime);
      }

      if (process.env.NODE_ENV === "development" && deliveryTime > 1000) {
      }
    },
    [enableInboxMetrics]
  );

  /**
   * Track realtime latency
   */
  const trackRealtimeLatency = useCallback(
    (latency: number) => {
      if (enableInboxMetrics) {
        inboxPerformanceMonitor.recordRealtimeLatency(latency);
      }

      if (process.env.NODE_ENV === "development" && latency > 100) {
      }
    },
    [enableInboxMetrics]
  );

  /**
   * Observe message element for render performance
   */
  const observeMessageElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !enableInboxMetrics) return;

      inboxPerformanceMonitor.observeMessage(element);
    },
    [enableInboxMetrics]
  );

  /**
   * Track scroll performance
   */
  const trackScrollPerformance = useCallback(() => {
    const measureFrame = (currentTime: number) => {
      if (lastFrameTimeRef.current) {
        const frameDuration = currentTime - lastFrameTimeRef.current;
        const fps = 1000 / frameDuration;

        if (enableInboxMetrics) {
          inboxPerformanceMonitor.recordScrollPerformance(fps);
        }
      }

      lastFrameTimeRef.current = currentTime;
      frameRequestRef.current = requestAnimationFrame(measureFrame);
    };

    frameRequestRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [enableInboxMetrics]);

  /**
   * Update memory usage metrics
   */
  const updateMemoryUsage = useCallback(
    (conversationCount: number, messageCount: number) => {
      if (enableInboxMetrics) {
        inboxPerformanceMonitor.updateMemoryUsage(conversationCount, messageCount);
      }
    },
    [enableInboxMetrics]
  );

  /**
   * Get React Profiler callback
   */
  const getProfilerCallback = useCallback(() => {
    if (!enableReactProfiling) return undefined;
    return reactPerformanceMonitor.onRender;
  }, [enableReactProfiling]);

  /**
   * Get performance summary
   */
  const getPerformanceSummary = useCallback(() => {
    return {
      webVitals: enableWebVitals ? webVitalsMonitor.getMetrics() : null,
      webVitalsScore: enableWebVitals ? webVitalsMonitor.getPerformanceScore() : null,
      reactMetrics: enableReactProfiling ? reactPerformanceMonitor.getMetrics() : null,
      reactRecommendations: enableReactProfiling ? reactPerformanceMonitor.getRecommendations() : [],
      inboxMetrics: enableInboxMetrics ? inboxPerformanceMonitor.getPerformanceSummary() : null,
      inboxBudgets: enableInboxMetrics ? inboxPerformanceMonitor.getPerformanceBudgets() : [],
    };
  }, [enableWebVitals, enableReactProfiling, enableInboxMetrics]);

  return {
    isMonitoring,
    startMeasure,
    endMeasure,
    measureConversationSwitch,
    measureMessageLoad,
    measureSearch,
    trackInputLatency,
    trackMessageDelivery,
    trackRealtimeLatency,
    observeMessageElement,
    trackScrollPerformance,
    updateMemoryUsage,
    getProfilerCallback,
    getPerformanceSummary,
  };
}
