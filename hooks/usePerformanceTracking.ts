/**
 * React Hook for Client-Side Performance Tracking
 *
 * Provides easy-to-use performance tracking for React components
 */

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface UsePerformanceTrackingOptions {
  autoTrackRender?: boolean;
  autoTrackMount?: boolean;
  organizationId?: string;
}

export function usePerformanceTracking(componentName: string, options: UsePerformanceTrackingOptions = {}) {
  const { user } = useAuth();
  const renderStartTime = useRef<number>(performance.now());
  const mountStartTime = useRef<number>(performance.now());
  const metrics = useRef<PerformanceMetric[]>([]);

  const { autoTrackRender = false, autoTrackMount = true, organizationId } = options;

  // Track component mount time
  useEffect(() => {
    if (autoTrackMount) {
      const mountTime = performance.now() - mountStartTime.current;
      trackMetric("dashboard_load_time", mountTime, {
        component: componentName,
        type: "mount",
      });
    }
  }, [autoTrackMount, componentName]);

  // Track component render time
  useEffect(() => {
    if (autoTrackRender) {
      const renderTime = performance.now() - renderStartTime.current;
      trackMetric("dashboard_load_time", renderTime, {
        component: componentName,
        type: "render",
      });
    }
    renderStartTime.current = performance.now();
  });

  const trackMetric = useCallback(
    async (metricName: string, value: number, metadata?: Record<string, any>) => {
      const metric: PerformanceMetric = {
        name: metricName,
        value,
        timestamp: new Date(),
        metadata: {
          component: componentName,
          userId: user?.id,
          organizationId: organizationId || user?.organization_id,
          ...metadata,
        },
      };

      // Store locally
      metrics.current.push(metric);

      // Send to server (async, don't block UI)
      try {
        await fetch("/api/telemetry/performance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metric),
        });
      } catch (error) {

      }
    },
    [componentName, user, organizationId]
  );

  const startTimer = useCallback(
    (metricName: string, metadata?: Record<string, any>) => {
      const startTime = performance.now();

      return {
        end: (additionalMetadata?: Record<string, any>) => {
          const duration = performance.now() - startTime;
          trackMetric(metricName, duration, { ...metadata, ...additionalMetadata });
        },
      };
    },
    [trackMetric]
  );

  const trackUserAction = useCallback(
    (action: string, duration?: number, metadata?: Record<string, any>) => {
      const metricName = getMetricNameForAction(action);
      const value = duration || 0;

      trackMetric(metricName, value, {
        action,
        userAction: true,
        ...metadata,
      });
    },
    [trackMetric]
  );

  const trackPageLoad = useCallback(
    (pageName: string) => {
      const loadTime = performance.now();
      trackMetric("dashboard_load_time", loadTime, {
        page: pageName,
        type: "pageLoad",
      });
    },
    [trackMetric]
  );

  const trackApiCall = useCallback(
    async <T>(endpoint: string, apiCall: () => Promise<T>, metadata?: Record<string, any>): Promise<T> => {
      const timer = startTimer("dashboard_load_time", {
        endpoint,
        type: "apiCall",
        ...metadata,
      });

      try {
        const result = await apiCall();
        timer.end({ success: true });
        return result;
      } catch (error) {
        timer.end({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    [startTimer]
  );

  const trackMessageSend = useCallback(
    (conversationId: string, messageId: string) => {
      trackMetric("message_send_latency", performance.now(), {
        conversationId,
        messageId,
        type: "messageSend",
      });
    },
    [trackMetric]
  );

  const trackMessageReceive = useCallback(
    (conversationId: string, messageId: string) => {
      trackMetric("message_receive_latency", performance.now(), {
        conversationId,
        messageId,
        type: "messageReceive",
      });
    },
    [trackMetric]
  );

  const trackSearchPerformance = useCallback(
    (query: string, resultCount: number, duration: number) => {
      trackMetric("search_response_time", duration, {
        query: query.substring(0, 100), // Limit query length for privacy
        resultCount,
        type: "search",
      });
    },
    [trackMetric]
  );

  const trackAIInteraction = useCallback(
    (interactionType: "response" | "confidence" | "handover", duration: number, metadata?: Record<string, any>) => {
      const metricName = interactionType === "response" ? "ai_response_time" : "ai_confidence_calculation";
      trackMetric(metricName, duration, {
        interactionType,
        ...metadata,
      });
    },
    [trackMetric]
  );

  const getMetrics = useCallback(() => {
    return [...metrics.current];
  }, []);

  const clearMetrics = useCallback(() => {
    metrics.current = [];
  }, []);

  return {
    trackMetric,
    startTimer,
    trackUserAction,
    trackPageLoad,
    trackApiCall,
    trackMessageSend,
    trackMessageReceive,
    trackSearchPerformance,
    trackAIInteraction,
    getMetrics,
    clearMetrics,
  };
}

/**
 * Map user actions to appropriate metric names
 */
function getMetricNameForAction(action: string): string {
  if (action.includes("message")) return "message_send_latency";
  if (action.includes("search")) return "search_response_time";
  if (action.includes("ai") || action.includes("handover")) return "ai_response_time";
  if (action.includes("auth") || action.includes("login")) return "authentication_time";
  if (action.includes("upload")) return "file_upload_time";
  if (action.includes("ticket")) return "ticket_creation_time";
  if (action.includes("conversation")) return "conversation_load_time";
  if (action.includes("analytics")) return "analytics_load_time";
  return "dashboard_load_time";
}

/**
 * Hook for tracking specific component performance
 */
export function useComponentPerformance(componentName: string) {
  const { trackMetric, startTimer } = usePerformanceTracking(componentName, {
    autoTrackMount: true,
    autoTrackRender: false,
  });

  const trackRender = useCallback(() => {
    const renderTime = performance.now();
    trackMetric("dashboard_load_time", renderTime, {
      type: "render",
    });
  }, [trackMetric]);

  const trackInteraction = useCallback(
    (interactionName: string) => {
      const timer = startTimer("dashboard_load_time", {
        interaction: interactionName,
      });
      return timer;
    },
    [startTimer]
  );

  return {
    trackRender,
    trackInteraction,
    trackMetric,
    startTimer,
  };
}

/**
 * Hook for tracking page-level performance
 */
export function usePagePerformance(pageName: string) {
  const { trackPageLoad, trackApiCall, getMetrics } = usePerformanceTracking(pageName, {
    autoTrackMount: true,
  });

  useEffect(() => {
    trackPageLoad(pageName);
  }, [pageName, trackPageLoad]);

  return {
    trackApiCall,
    getMetrics,
  };
}
