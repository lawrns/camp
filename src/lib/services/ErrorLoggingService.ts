/**
 * Error Logging Service with Sentry Integration
 * Centralized error handling and logging for the application
 */

import * as Sentry from "@sentry/nextjs";

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    organizationId?: string;
  };
  request?: {
    url?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: "debug" | "info" | "warning" | "error" | "fatal";
}

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  level: string;
  context?: ErrorContext;
  timestamp: Date;
  fingerprint?: string[];
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private initialized = false;

  private constructor() {}

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  /**
   * Initialize Sentry with configuration
   */
  init(options: { dsn?: string; environment?: string; tracesSampleRate?: number; debug?: boolean }) {
    if (this.initialized) return;

    const dsn = options.dsn || process.env.SENTRY_DSN;
    if (!dsn) {

      return;
    }

    Sentry.init({
      dsn,
      environment: options.environment || process.env.NODE_ENV || "development",
      tracesSampleRate: options.tracesSampleRate || 0.1,
      debug: options.debug || false,

      beforeSend(event: any, hint: any) {
        // Filter out irrelevant errors
        if (event.exception) {
          const error = hint.originalException;

          // Skip network errors
          if (error instanceof Error && error.message.includes("fetch")) {
            return null;
          }

          // Skip Next.js hydration errors
          if (error instanceof Error && error.message.includes("Hydration")) {
            return null;
          }
        }

        return event;
      },

      beforeBreadcrumb(breadcrumb: any) {
        // Filter sensitive data from breadcrumbs
        if (breadcrumb.data?.url && breadcrumb.data.url.includes("/api/")) {
          // Remove sensitive query parameters
          breadcrumb.data.url = breadcrumb.data.url.replace(/([?&])(token|key|secret)=[^&]*/gi, "$1$2=***");
        }

        return breadcrumb;
      },
    });

    this.initialized = true;
  }

  /**
   * Log an error with context
   */
  logError(error: Error | string, context?: ErrorContext): string {
    const errorId = this.generateErrorId();

    try {
      if (this.initialized) {
        // Set user context
        if (context?.user) {
          const userContext: any = {
            id: context.user.id,
          };

          if (context.user.email !== undefined) {
            userContext.email = context.user.email;
          }

          Sentry.setUser(userContext);
        }

        // Set tags
        if (context?.tags) {
          Sentry.setTags(context.tags);
        }

        // Set extra context
        if (context?.extra) {
          Sentry.setExtras(context.extra);
        }

        // Set level
        const level = context?.level || "error";
        Sentry.withScope((scope: any) => {
          scope.setLevel(level);

          if (context?.request) {
            scope.setContext("request", context.request);
          }

          if (typeof error === "string") {
            Sentry.captureMessage(error, level);
          } else {
            Sentry.captureException(error);
          }
        });
      }

      // Always log locally for development
      if (process.env.NODE_ENV === "development") {

      }

      return errorId;
    } catch (loggingError) {

      return errorId;
    }
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: Omit<ErrorContext, "level">): string {
    return this.logError(message, { ...context, level: "info" });
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: Omit<ErrorContext, "level">): string {
    return this.logError(message, { ...context, level: "warning" });
  }

  /**
   * Log debug information
   */
  logDebug(message: string, context?: Omit<ErrorContext, "level">): string {
    if (process.env.NODE_ENV === "development") {
      return this.logError(message, { ...context, level: "debug" });
    }
    return "";
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    if (this.initialized) {
      const breadcrumb: any = {
        message,
        category: category || "custom",
        timestamp: Date.now() / 1000,
      };

      if (data !== undefined) {
        breadcrumb.data = data;
      }

      Sentry.addBreadcrumb(breadcrumb);
    }
  }

  /**
   * Set user context for subsequent errors
   */
  setUser(user: { id: string; email?: string; organizationId?: string }) {
    if (this.initialized) {
      const userContext: any = {
        id: user.id,
      };

      if (user.email !== undefined) {
        userContext.email = user.email;
      }

      Sentry.setUser(userContext);
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (this.initialized) {
      Sentry.setUser(null);
    }
  }

  /**
   * Performance monitoring - start transaction
   */
  startTransaction(name: string, operation?: string) {
    if (this.initialized) {
      return Sentry.startTransaction({
        name,
        op: operation || "custom",
      });
    }
    return null;
  }

  /**
   * Capture performance measurement
   */
  capturePerformance(name: string, duration: number, tags?: Record<string, string>) {
    if (this.initialized) {
      Sentry.withScope((scope: any) => {
        if (tags) {
          scope.setTags(tags);
        }
        scope.setTag("performance.name", name);
        scope.setExtra("performance.duration", duration);
        Sentry.captureMessage(`Performance: ${name} took ${duration}ms`, "info");
      });
    }
  }

  /**
   * Handle API route errors
   */
  logApiError(
    error: Error | string,
    request: {
      method?: string;
      url?: string;
      body?: any;
      headers?: Record<string, string>;
    },
    user?: { id: string; organizationId?: string }
  ): string {
    const context: ErrorContext = {
      user,
      request: {
        ...(request.method !== undefined && { method: request.method }),
        ...(request.url !== undefined && { url: request.url }),
        ...(request.headers?.["user-agent"] !== undefined && { userAgent: request.headers["user-agent"] }),
      },
      extra: {
        requestBody: request.body,
      },
      tags: {
        errorType: "api",
        endpoint: request.url || "unknown",
      },
    };

    return this.logError(error, context);
  }

  /**
   * Handle client-side errors
   */
  logClientError(
    error: Error | string,
    componentName?: string,
    user?: { id: string; organizationId?: string }
  ): string {
    const context: ErrorContext = {
      user,
      tags: {
        errorType: "client",
        component: componentName || "unknown",
      },
      extra: {
        ...(typeof window !== "undefined" && window.navigator.userAgent && { userAgent: window.navigator.userAgent }),
        ...(typeof window !== "undefined" && window.location.href && { url: window.location.href }),
      },
    };

    return this.logError(error, context);
  }

  /**
   * Get error statistics
   */
  async getErrorStats(organizationId: string, timeRange: "hour" | "day" | "week" = "day") {
    // This would typically query a database or Sentry API
    // For now, return mock data
    return {
      totalErrors: 0,
      newErrors: 0,
      resolvedErrors: 0,
      topErrors: [],
      timeRange,
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const errorLogger = ErrorLoggingService.getInstance();

// Export service class for testing
export { ErrorLoggingService };
