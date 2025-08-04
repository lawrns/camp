// Import React for error boundary
import React from "react";

/**
 * Error Handling Utilities
 * Provides centralized error handling and error codes
 */

export enum ErrorCode {
  // Authentication errors
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  FORBIDDEN = "FORBIDDEN",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",

  // Resource errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONNECTION_FAILED = "CONNECTION_FAILED",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",

  // External service errors
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  API_ERROR = "API_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR",

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // File/Upload errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  UPLOAD_FAILED = "UPLOAD_FAILED",

  // Realtime errors
  REALTIME_CONNECTION_FAILED = "REALTIME_CONNECTION_FAILED",
  CHANNEL_SUBSCRIPTION_FAILED = "CHANNEL_SUBSCRIPTION_FAILED",

  // Unknown error
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  stack?: string;
}

export class CampfireError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = "CampfireError";
    this.code = code;
    this.statusCode = statusCode;

    this.context = {
      code,
      message,
      details,
      timestamp: new Date(),
    };

    if (this.stack) {
      this.context.stack = this.stack;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CampfireError);
    }
  }

  /**
   * Add context to the error
   */
  addContext(context: Partial<ErrorContext>): this {
    Object.assign(this.context, context);
    return this;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): unknown {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.context.details,
        timestamp: this.context.timestamp,
      },
    };
  }

  /**
   * Check if error is of specific type
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.CONNECTION_FAILED,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.REALTIME_CONNECTION_FAILED,
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.AUTHENTICATION_FAILED]: "Please check your login credentials and try again.",
      [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action.",
      [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: "You do not have permission to access this resource.",
      [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found.",
      [ErrorCode.NETWORK_ERROR]: "Please check your internet connection and try again.",
      [ErrorCode.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again later.",
      [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please wait a moment and try again.",
      [ErrorCode.FILE_TOO_LARGE]: "The file is too large. Please choose a smaller file.",
      [ErrorCode.INVALID_FILE_TYPE]: "Invalid file type. Please choose a supported file format.",
      [ErrorCode.AI_SERVICE_ERROR]: "AI service is temporarily unavailable. Please try again later.",
      [ErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
      [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
    } as Record<ErrorCode, string>;

    return userMessages[this.code] || this.message;
  }
}

/**
 * Create a new error with code
 */
// Legacy alias for backward compatibility
export class AppError extends CampfireError {}

/**
 * Handle error wrapper function
 */
export function handleError(error: Error): CampfireError {
  if (error instanceof CampfireError) {
    return error;
  }

  return createError(ErrorCode.UNKNOWN_ERROR, (error instanceof Error ? error.message : String(error)), 500, { originalError: error });
}

export function createError(code: ErrorCode, message: string, statusCode?: number, details?: unknown): CampfireError {
  return new CampfireError(code, message, statusCode, details);
}

/**
 * Error handler wrapper for async functions
 */
export function withErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof CampfireError) {
        throw error;
      }

      // Convert unknown errors to CampfireError
      const campfireError = createError(
        ErrorCode.UNKNOWN_ERROR,
        error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error occurred",
        500,
        { originalError: error }
      );

      throw campfireError;
    }
  };
}

/**
 * Error boundary helper for React components
 */
export function createErrorBoundary(fallbackComponent: React.ComponentType<{ error: Error; resetError: () => void }>) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Log to error reporting service
      if (typeof window !== "undefined") {
        // Send to analytics/error reporting
        logError(error, { componentStack: errorInfo.componentStack });
      }
    }

    resetError = () => {
      this.setState({ hasError: false, error: null });
    };

    override render() {
      if (this.state.hasError && this.state.error) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return this.props.children;
    }
  };
}

/**
 * Log error to external service
 */
export function logError(error: Error, context?: unknown): void {
  const errorData = {
    message: (error instanceof Error ? error.message : String(error)),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "server",
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
    context,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    return;
  }

  // In production, send to error reporting service
  try {
    // Example: send to Sentry, LogRocket, etc.
    // sentry.captureException(error, { extra: errorData });
  } catch (loggingError) {}
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = (error) => error instanceof CampfireError && error.isRetryable(),
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt or if not retryable
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Validation error helpers
 */
export function createValidationError(field: string, message: string, value?: unknown): CampfireError {
  return createError(ErrorCode.VALIDATION_ERROR, `Validation failed for field '${field}': ${message}`, 400, {
    field,
    value,
  });
}

export function createNotFoundError(resource: string, id?: string | number): CampfireError {
  const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;

  return createError(ErrorCode.RESOURCE_NOT_FOUND, message, 404, { resource, id });
}

export function createUnauthorizedError(action?: string): CampfireError {
  const message = action ? `Unauthorized to perform action: ${action}` : "Unauthorized access";

  return createError(ErrorCode.UNAUTHORIZED, message, 401, { action });
}
