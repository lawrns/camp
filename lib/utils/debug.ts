/**
 * Debug utility for tree-shakable logging
 * Console.logs are automatically removed in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = isDevelopment || process.env.NEXT_PUBLIC_DEBUG === 'true';

export interface DebugLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

/**
 * Create a debug logger with a namespace
 * Logs are automatically stripped in production builds
 */
export function createDebugLogger(namespace: string): DebugLogger {
  const prefix = `[${namespace}]`;

  return {
    log: (...args: unknown[]) => {
      if (isDebugEnabled) {
        console.log(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (isDebugEnabled) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      // Always log errors, even in production
      console.error(prefix, ...args);
    },
    info: (...args: unknown[]) => {
      if (isDebugEnabled) {
        console.info(prefix, ...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (isDebugEnabled) {
        console.debug(prefix, ...args);
      }
    },
    group: (label: string) => {
      if (isDebugEnabled) {
        console.group(`${prefix} ${label}`);
      }
    },
    groupEnd: () => {
      if (isDebugEnabled) {
        console.groupEnd();
      }
    },
    time: (label: string) => {
      if (isDebugEnabled) {
        console.time(`${prefix} ${label}`);
      }
    },
    timeEnd: (label: string) => {
      if (isDebugEnabled) {
        console.timeEnd(`${prefix} ${label}`);
      }
    },
  };
}

/**
 * Default debug logger for general use
 */
export const debug = createDebugLogger('App');

/**
 * Specialized loggers for different parts of the application
 */
export const realtimeDebug = createDebugLogger('Realtime');
export const apiDebug = createDebugLogger('API');
export const uiDebug = createDebugLogger('UI');
export const authDebug = createDebugLogger('Auth');
export const conversationDebug = createDebugLogger('Conversations');
export const messageDebug = createDebugLogger('Messages');
export const widgetDebug = createDebugLogger('Widget');

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private timers = new Map<string, number>();
  private logger: DebugLogger;

  constructor(namespace: string = 'Performance') {
    this.logger = createDebugLogger(namespace);
  }

  start(label: string): void {
    this.timers.set(label, performance.now());
    this.logger.time(label);
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.logger.warn(`Timer "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    this.logger.timeEnd(label);
    this.logger.log(`${label} took ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Global performance timer instance
 */
export const performanceTimer = new PerformanceTimer();

/**
 * Conditional logging based on feature flags
 */
export function logIf(condition: boolean, logger: DebugLogger, ...args: unknown[]): void {
  if (condition) {
    logger.log(...args);
  }
}

/**
 * Log with stack trace (development only)
 */
export function logWithTrace(logger: DebugLogger, ...args: unknown[]): void {
  if (isDebugEnabled) {
    logger.log(...args);
    console.trace();
  }
}

/**
 * Structured logging for better debugging
 */
export interface LogContext {
  userId?: string;
  organizationId?: string;
  conversationId?: string;
  messageId?: string;
  action?: string;
  component?: string;
  [key: string]: unknown;
}

export function logWithContext(
  logger: DebugLogger,
  message: string,
  context: LogContext = {}
): void {
  if (isDebugEnabled) {
    logger.log(message, context);
  }
}

/**
 * Error logging with context
 */
export function logError(
  error: Error | unknown,
  context: LogContext = {},
  logger: DebugLogger = debug
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error('Error occurred:', {
    message: errorMessage,
    stack: errorStack,
    ...context,
  });
}

/**
 * API request/response logging
 */
export function logApiCall(
  method: string,
  url: string,
  status?: number,
  duration?: number,
  context: LogContext = {}
): void {
  apiDebug.log(`${method} ${url}`, {
    status,
    duration: duration ? `${duration.toFixed(2)}ms` : undefined,
    ...context,
  });
}

/**
 * Real-time event logging
 */
export function logRealtimeEvent(
  event: string,
  channel: string,
  payload?: unknown,
  context: LogContext = {}
): void {
  realtimeDebug.log(`Event: ${event}`, {
    channel,
    payload,
    ...context,
  });
}
