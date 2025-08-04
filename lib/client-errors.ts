/**
 * Client-side Error Types and Handlers
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (context !== undefined) {
      this.context = context;
    }

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common application errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, any>) {
    super(message, "AUTHENTICATION_ERROR", 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", context?: Record<string, any>) {
    super(message, "AUTHORIZATION_ERROR", 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, "NOT_FOUND", 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CONFLICT", 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests. Please try again later.", "RATE_LIMIT", 429, true, { retryAfter });
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network error occurred", context?: Record<string, any>) {
    super(message, "NETWORK_ERROR", 0, true, context);
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, "TIMEOUT", 408, true, { operation, timeout });
  }
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Convert unknown errors to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("fetch")) {
      return new NetworkError(error.message);
    }

    if (error.message.includes("timeout")) {
      return new TimeoutError("Request", 30000);
    }

    // Generic error
    return new AppError(error.message, "UNKNOWN_ERROR", 500, true, { originalError: error.name });
  }

  // Handle non-Error objects
  if (typeof error === "string") {
    return new AppError(error);
  }

  if (typeof error === "object" && error !== null) {
    const errorObj = error as unknown;
    return new AppError(
      errorObj.message || "An error occurred",
      errorObj.code || "UNKNOWN_ERROR",
      errorObj.statusCode || 500,
      true,
      errorObj
    );
  }

  return new AppError("An unknown error occurred");
}

/**
 * Error logging function
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      errorContext: error.context,
    }),
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {

  }

  // In production, you would send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (typeof window !== "undefined" && (window as unknown).Sentry) {
    (window as unknown).Sentry.captureException(error, {
      extra: errorInfo,
    });
  }
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case "AUTHENTICATION_ERROR":
        return "Please sign in to continue.";
      case "AUTHORIZATION_ERROR":
        return "You don't have permission to perform this action.";
      case "NOT_FOUND":
        return "The requested resource could not be found.";
      case "VALIDATION_ERROR":
        return error.message; // Validation errors are usually user-friendly
      case "RATE_LIMIT":
        return "You're making too many requests. Please slow down.";
      case "NETWORK_ERROR":
        return "Unable to connect. Please check your internet connection.";
      case "TIMEOUT":
        return "The operation took too long. Please try again.";
      default:
        return "Something went wrong. Please try again later.";
    }
  }

  // Generic error message
  return "An unexpected error occurred. Please try again.";
}

/**
 * Retry configuration for failed operations
 */
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: "linear" | "exponential";
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: "exponential",
  shouldRetry: (error) => {
    if (error instanceof AppError) {
      // Don't retry client errors (4xx)
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return false;
      }
      // Retry server errors and network errors
      return error.code === "NETWORK_ERROR" || error.statusCode >= 500;
    }
    return true;
  },
};

/**
 * Component error handler
 */
export const handleComponentError = (error: Error, componentName: string) => {
  logError(error, { componentName });

  return {
    message: error.message,
    stack: error.stack,
    componentName,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Retry a failed operation
 */
export async function retryOperation<T>(operation: () => Promise<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (
        attempt === finalConfig.maxAttempts ||
        (finalConfig.shouldRetry && !finalConfig.shouldRetry(lastError, attempt))
      ) {
        throw lastError;
      }

      const delay =
        finalConfig.backoff === "exponential"
          ? finalConfig.delay * Math.pow(2, attempt - 1)
          : finalConfig.delay * attempt;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}
