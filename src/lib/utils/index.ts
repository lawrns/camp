import { randomInRange } from "./random";
import { sleep } from "./sleep";

// Export the cn function for class name merging - THIS IS ACTIVELY USED
export { cn } from "./utils";

// Export formatTimeAgo - THIS IS ACTIVELY USED
export { formatTimeAgo } from "./date";

// Export retryable function - THIS IS ACTIVELY USED
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs?: number;
  /** Exponential factor for backoff calculation */
  factor?: number;
  /** Whether to add jitter to retry delays */
  jitter?: boolean;
  /** Callback called before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  factor: 2,
  jitter: true,
  onRetry: () => {},
};

/**
 * Calculates the delay for a retry attempt
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const { initialDelayMs, maxDelayMs, factor, jitter } = options;

  // Calculate exponential backoff
  let delay = initialDelayMs * Math.pow(factor, attempt);

  // Apply jitter if enabled
  if (jitter) {
    delay = randomInRange(0, delay);
  }

  // Ensure delay doesn't exceed maximum
  return Math.min(delay, maxDelayMs);
}

/**
 * Creates a retryable version of an async function
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(fn: T, options: RetryOptions = {}): T {
  const mergedOptions: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };

  return (async (...args: any[]) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= mergedOptions.maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if we've reached max retries
        if (attempt >= mergedOptions.maxRetries) break;

        // Calculate delay and call onRetry callback
        const delay = calculateDelay(attempt, mergedOptions);
        mergedOptions.onRetry(error as Error, attempt + 1, delay);

        // Wait before retrying
        await sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }) as unknown as T;
}

// NOTE: Removed 60+ unused exports including:
// - All avatar utilities (genWaveAvatar, getAvatarPath, etc.)
// - All name generator utilities (generateName, getDisplayName, etc.)
// - All database type mappers
// - All unused date formatting functions
// - All unused random/sleep utilities
// - All logger exports
// - All accessibility exports
// - All conversationId utilities
// These can still be imported directly from their source files if needed
