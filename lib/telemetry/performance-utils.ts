/**
 * Performance Tracking Utilities
 *
 * Easy-to-use helpers for tracking performance across the application
 */

import { PerformanceTracker } from "./PerformanceTracker";

const tracker = PerformanceTracker.getInstance();

/**
 * Decorator for tracking function performance
 */
export function trackPerformance(metricName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const trackingId = tracker.startTracking(metricName, {
        function: `${target.constructor.name}.${propertyName}`,
        args: args.length,
      });

      try {
        const result = await method.apply(this, args);
        await tracker.completeTracking(trackingId);
        return result;
      } catch (error) {
        await tracker.completeTracking(trackingId, undefined, undefined, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    };
  };
}

/**
 * Higher-order function for tracking async function performance
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string,
  organizationId?: string,
  userId?: string
): T {
  return (async (...args: any[]) => {
    const trackingId = tracker.startTracking(metricName, {
      function: fn.name,
      args: args.length,
    });

    try {
      const result = await fn(...args);
      await tracker.completeTracking(trackingId, organizationId, userId);
      return result;
    } catch (error) {
      await tracker.completeTracking(trackingId, organizationId, userId, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }) as T;
}

/**
 * Simple performance timer for manual tracking
 */
export class PerformanceTimer {
  private startTime: number;
  private metricName: string;
  private organizationId?: string;
  private userId?: string;
  private metadata?: Record<string, any>;

  constructor(metricName: string, organizationId?: string, userId?: string, metadata?: Record<string, any>) {
    this.metricName = metricName;
    this.organizationId = organizationId;
    this.userId = userId;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  async end(additionalMetadata?: Record<string, any>): Promise<void> {
    const duration = performance.now() - this.startTime;
    await tracker.recordMetric(this.metricName, duration, this.organizationId, this.userId, {
      ...this.metadata,
      ...additionalMetadata,
    });
  }
}

/**
 * Track database query performance
 */
export async function trackDatabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  organizationId?: string
): Promise<T> {
  const timer = new PerformanceTimer("database_query_time", organizationId, undefined, {
    query: queryName,
  });

  try {
    const result = await queryFn();
    await timer.end({ success: true });
    return result;
  } catch (error) {
    await timer.end({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Track API endpoint performance
 */
export async function trackApiEndpoint<T>(
  endpoint: string,
  method: string,
  handlerFn: () => Promise<T>,
  organizationId?: string,
  userId?: string
): Promise<T> {
  const metricName = endpoint.includes("/widget/")
    ? "widget_message_latency"
    : endpoint.includes("/auth/")
      ? "authentication_time"
      : endpoint.includes("/ai/")
        ? "ai_response_time"
        : endpoint.includes("/search")
          ? "search_response_time"
          : "dashboard_load_time";

  const timer = new PerformanceTimer(metricName, organizationId, userId, {
    endpoint,
    method,
  });

  try {
    const result = await handlerFn();
    await timer.end({ success: true });
    return result;
  } catch (error) {
    await timer.end({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Track real-time message performance
 */
export async function trackMessageLatency(
  messageType: "send" | "receive",
  organizationId: string,
  conversationId: string,
  messageId: string
): Promise<void> {
  const metricName = messageType === "send" ? "message_send_latency" : "message_receive_latency";

  await tracker.recordMetric(metricName, performance.now(), organizationId, undefined, {
    conversationId,
    messageId,
    messageType,
  });
}

/**
 * Track notification delivery performance
 */
export async function trackNotificationLatency(
  notificationType: string,
  organizationId: string,
  userId: string,
  deliveryTime: number
): Promise<void> {
  await tracker.recordMetric("notification_latency", deliveryTime, organizationId, userId, {
    notificationType,
  });
}

/**
 * Track widget performance
 */
export async function trackWidgetPerformance(
  action: "load" | "message" | "handover",
  organizationId: string,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  const metricName = action === "load" ? "widget_load_time" : "widget_message_latency";

  await tracker.recordMetric(metricName, duration, organizationId, undefined, {
    action,
    ...metadata,
  });
}

/**
 * Track AI performance
 */
export async function trackAIPerformance(
  operation: "response" | "confidence",
  organizationId: string,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  const metricName = operation === "response" ? "ai_response_time" : "ai_confidence_calculation";

  await tracker.recordMetric(metricName, duration, organizationId, undefined, {
    operation,
    ...metadata,
  });
}

/**
 * Track file upload performance
 */
export async function trackFileUpload(
  organizationId: string,
  fileSize: number,
  duration: number,
  success: boolean
): Promise<void> {
  await tracker.recordMetric("file_upload_time", duration, organizationId, undefined, {
    fileSize,
    success,
    throughput: success ? fileSize / (duration / 1000) : 0, // bytes per second
  });
}

/**
 * Get performance metrics for dashboard
 */
export function getPerformanceMetrics() {
  return tracker.getPerformanceSummary();
}

/**
 * Get category-specific performance metrics
 */
export function getCategoryMetrics(category: string) {
  return tracker.getPerformanceSummary(category as any);
}

/**
 * Export the tracker instance for advanced usage
 */
export { tracker as performanceTracker };
