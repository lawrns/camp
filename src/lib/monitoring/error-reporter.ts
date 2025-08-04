/**
 * Enhanced Error Reporter
 * Provides structured error reporting with context and user feedback collection
 */

import * as Sentry from "@sentry/nextjs";

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
}

export interface UserFeedback {
  name?: string;
  email?: string;
  comments: string;
  rating?: number;
  category?: "bug" | "feature" | "performance" | "ui" | "other";
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count" | "percentage";
  threshold?: number;
  context?: Record<string, any>;
}

class ErrorReporter {
  private static instance: ErrorReporter;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Report an error with enhanced context
   */
  public reportError(
    error: Error | string,
    context: ErrorContext = {},
    level: "error" | "warning" | "info" | "fatal" = "error"
  ): string {
    const eventId = Sentry.captureException(error, {
      level,
      tags: {
        feature: context.feature || "unknown",
        action: context.action || "unknown",
        user_id: context.userId,
        organization_id: context.organizationId,
      },
      contexts: {
        error_context: {
          url: context.url || (typeof window !== "undefined" ? window.location.href : undefined),
          userAgent: context.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
          timestamp: context.timestamp || new Date(),
          metadata: context.metadata,
        },
      },
      user:
        context.userId || context.organizationId
          ? {
              ...(context.userId && { id: context.userId }),
              ...(context.organizationId && { organization_id: context.organizationId }),
            }
          : undefined,
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {

    }

    return eventId;
  }

  /**
   * Report performance metrics
   */
  public reportPerformance(metric: PerformanceMetric): void {
    Sentry.addBreadcrumb({
      category: "performance",
      message: `${metric.name}: ${metric.value}${metric.unit}`,
      level: "info",
      data: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        threshold: metric.threshold,
        context: metric.context,
        is_threshold_exceeded: metric.threshold ? metric.value > metric.threshold : false,
      },
    });

    // Report as custom metric to Sentry
    Sentry.setMeasurement(metric.name, metric.value, metric.unit);

    // Alert if threshold exceeded
    if (metric.threshold && metric.value > metric.threshold) {
      this.reportError(
        new Error(`Performance threshold exceeded: ${metric.name}`),
        {
          feature: "performance",
          action: "threshold_exceeded",
          metadata: {
            metric_name: metric.name,
            actual_value: metric.value,
            threshold: metric.threshold,
            unit: metric.unit,
          },
        },
        "warning"
      );
    }
  }

  /**
   * Collect user feedback for errors
   */
  public collectUserFeedback(eventId: string, feedback: UserFeedback): void {
    Sentry.captureUserFeedback({
      event_id: eventId,
      name: feedback.name || "Anonymous",
      email: feedback.email || "no-email@example.com",
      comments: feedback.comments,
    });

    // Add additional feedback context
    Sentry.addBreadcrumb({
      category: "user_feedback",
      message: "User provided feedback",
      level: "info",
      data: {
        event_id: eventId,
        rating: feedback.rating,
        category: feedback.category,
        has_contact_info: !!(feedback.name || feedback.email),
      },
    });
  }

  /**
   * Set user context for all subsequent events
   */
  public setUserContext(context: {
    id?: string;
    email?: string;
    organizationId?: string;
    role?: string;
    plan?: string;
  }): void {
    const userContext: unknown = {};
    if (context.id !== undefined) userContext.id = context.id;
    if (context.email !== undefined) userContext.email = context.email;
    if (context.organizationId !== undefined) userContext.organization_id = context.organizationId;
    if (context.role !== undefined) userContext.role = context.role;
    if (context.plan !== undefined) userContext.plan = context.plan;

    Sentry.setUser(userContext);

    Sentry.setTag("organization_id", context.organizationId || "unknown");
    Sentry.setTag("user_role", context.role || "unknown");
    Sentry.setTag("user_plan", context.plan || "unknown");
  }

  /**
   * Clear user context (e.g., on logout)
   */
  public clearUserContext(): void {
    Sentry.setUser(null);
    Sentry.setTag("organization_id", null);
    Sentry.setTag("user_role", null);
    Sentry.setTag("user_plan", null);
  }

  /**
   * Add breadcrumb for user actions
   */
  public addBreadcrumb(
    message: string,
    category: string = "user_action",
    level: "debug" | "info" | "warning" | "error" = "info",
    data?: Record<string, any>
  ): void {
    const breadcrumb: unknown = {
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    };

    if (data !== undefined) {
      breadcrumb.data = data;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Start a performance transaction
   */
  public startTransaction(name: string, operation: string = "navigation"): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Report API errors with request/response context
   */
  public reportAPIError(
    error: Error,
    request: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
    },
    response?: {
      status: number;
      statusText: string;
      headers?: Record<string, string>;
      body?: unknown;
    }
  ): string {
    return this.reportError(error, {
      feature: "api",
      action: `${request.method} ${request.url}`,
      metadata: {
        request: {
          method: request.method,
          url: request.url,
          headers: this.sanitizeHeaders(request.headers),
          body: this.sanitizeRequestBody(request.body),
        },
        response: response
          ? {
              status: response.status,
              statusText: response.statusText,
              headers: this.sanitizeHeaders(response.headers),
              body: this.sanitizeResponseBody(response.body),
            }
          : undefined,
      },
    });
  }

  /**
   * Report real-time connection errors
   */
  public reportRealtimeError(
    error: Error,
    connectionInfo: {
      type: "websocket" | "sse" | "polling";
      url: string;
      state: string;
      reconnectAttempts?: number;
    }
  ): string {
    return this.reportError(error, {
      feature: "realtime",
      action: "connection_error",
      metadata: {
        connection_type: connectionInfo.type,
        connection_url: connectionInfo.url,
        connection_state: connectionInfo.state,
        reconnect_attempts: connectionInfo.reconnectAttempts,
      },
    });
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    if (typeof window !== "undefined") {
      // Handle React error boundaries
      window.addEventListener("error", (event) => {
        this.reportError(event.error || new Error(event.message), {
          feature: "global",
          action: "uncaught_error",
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      // Handle unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        this.reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
          feature: "global",
          action: "unhandled_rejection",
        });
      });
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized = { ...headers };
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: unknown): unknown {
    if (!body) return undefined;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return "[UNPARSEABLE]";
      }
    }

    const sanitized = { ...body };
    const sensitiveFields = ["password", "token", "secret", "api_key", "apiKey", "credit_card", "ssn"];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  /**
   * Sanitize response body to remove sensitive information
   */
  private sanitizeResponseBody(body: unknown): unknown {
    if (!body) return undefined;

    // Limit response body size to prevent large payloads
    const bodyString = typeof body === "string" ? body : JSON.stringify(body);
    if (bodyString.length > 10000) {
      return "[RESPONSE_TOO_LARGE]";
    }

    return body;
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Export types
export type { ErrorContext, UserFeedback, PerformanceMetric };
