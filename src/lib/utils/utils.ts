import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Extended Tailwind merge configuration with custom class groups.
 * Adds support for additional font sizes and other custom utilities.
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-xxs",
        "text-xs",
        "text-sm",
        "text-base",
        "text-lg",
        "text-xl",
        "text-2xl",
        "text-3xl",
        "text-4xl",
        "text-5xl",
      ],
    },
  },
});

/**
 * Combines clsx and tailwind-merge for optimal class name handling.
 *
 * @param inputs - Class values to be processed
 * @returns Merged and optimized class string
 */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

/**
 * Creates a strongly typed custom event dispatcher
 * @param eventName The name of the custom event
 * @returns A function that dispatches the custom event with type-safe details
 */
export const createEvent = <T>(eventName: string) => {
  return (detail: T) => {
    if (typeof document !== "undefined") {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    }
  };
};

/**
 * Create a debounced function
 * @param func Function to debounce
 * @param wait Wait time in ms
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Create a throttled function
 * @param func Function to throttle
 * @param limit Time limit in ms
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Options for retrying
 */
export async function retryable<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number; backoffMultiplier?: number } = {}
) {
  const { maxAttempts = 3, delay = 1000, backoffMultiplier = 2 } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// Re-export utility functions from other modules
// TODO: Add back when files and avatar utilities are available
