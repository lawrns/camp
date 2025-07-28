/**
 * RAG Service Retry Mechanism
 *
 * Implements exponential backoff with jitter for reliable RAG operations
 */

import { isRetryableError, RAGError } from "./errors";

export interface RAGRetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterEnabled: boolean;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RAGRetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitterEnabled: true,
  retryableErrors: ["SEARCH_FAILED", "VECTOR_SEARCH_ERROR", "AI_RESPONSE_FAILED", "SERVICE_UNAVAILABLE", "TIMEOUT"],
};

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve: unknown) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RAGRetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt - 1);
  const delayWithCap = Math.min(exponentialDelay, config.maxDelayMs);

  if (!config.jitterEnabled) {
    return delayWithCap;
  }

  // Add jitter: ±25% of the calculated delay
  const jitterFactor = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
  return Math.floor(delayWithCap * jitterFactor);
}

/**
 * Check if error should be retried based on configuration
 */
function shouldRetryError(error: unknown, config: RAGRetryConfig): boolean {
  if (!isRetryableError(error)) {
    return false;
  }

  if (error instanceof RAGError) {
    return config.retryableErrors.includes(error.code);
  }

  return false;
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RAGRetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = "RAG operation"
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();

      // Log successful retry if it wasn't the first attempt
      if (attempt > 1) {
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Don't retry if error is not retryable
      if (!shouldRetryError(error, config)) {
        break;
      }

      const delay = calculateDelay(attempt, config);

      await sleep(delay);
    }
  }

  // If we get here, all attempts failed

  throw lastError;
}

/**
 * Create a retryable wrapper for any async function
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: RAGRetryConfig = DEFAULT_RETRY_CONFIG,
  operationName?: string
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const name = operationName || fn.name || "anonymous operation";
    return retryWithBackoff(() => fn(...args), config, name);
  };
}

/**
 * Circuit breaker implementation for preventing cascade failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName: string = "operation"): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeMs) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      } else {
        this.state = "HALF_OPEN";
      }
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = "OPEN";
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = "CLOSED";
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Global circuit breaker instance for RAG operations
 */
export const ragCircuitBreaker = new CircuitBreaker(5, 60000);

/**
 * Wrapper that combines retry logic with circuit breaker
 */
export async function retryWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  config: RAGRetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = "RAG operation"
): Promise<T> {
  return ragCircuitBreaker.execute(() => retryWithBackoff(operation, config, operationName), operationName);
}
