import { env } from "./env-config";

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 999,
};

interface LoggerOptions {
  prefix?: string;
  showTimestamp?: boolean;
  showStackTrace?: boolean;
}

class Logger {
  private level: number;
  private isDevelopment: boolean;
  private isProduction: boolean;
  private options: LoggerOptions;

  constructor(level?: LogLevel, options: LoggerOptions = {}) {
    // Environment detection
    this.isDevelopment = env.NODE_ENV === "development";
    this.isProduction = env.NODE_ENV === "production";

    // Set log level based on environment if not explicitly provided
    const effectiveLevel = level || this.getEnvironmentLogLevel();
    this.level = LOG_LEVELS[effectiveLevel] ?? LOG_LEVELS.info;

    // Set default options
    this.options = {
      prefix: "",
      showTimestamp: this.isDevelopment,
      showStackTrace: this.isDevelopment,
      ...options,
    };
  }

  private getEnvironmentLogLevel(): LogLevel {
    // Check for explicit environment variable
    const envLevel = env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
    if (envLevel && envLevel in LOG_LEVELS) {
      return envLevel;
    }

    // Default based on environment
    if (this.isProduction) {
      return "error"; // Only errors in production
    } else if (this.isDevelopment) {
      return "debug"; // All logs in development
    } else {
      return "info"; // Default for other environments
    }
  }

  private formatMessage(level: string, args: unknown[]): unknown[] {
    const formatted: unknown[] = [];

    if (this.options.showTimestamp) {
      formatted.push(`[${new Date().toISOString()}]`);
    }

    formatted.push(`[${level.toUpperCase()}]`);

    if (this.options.prefix) {
      formatted.push(`[${this.options.prefix}]`);
    }

    formatted.push(...args);

    return formatted;
  }

  debug(...args: unknown[]) {
    if (this.level <= LOG_LEVELS.debug) {
      console.debug(...this.formatMessage("debug", args));
    }
  }

  info(...args: unknown[]) {
    if (this.level <= LOG_LEVELS.info) {
      console.info(...this.formatMessage("info", args));
    }
  }

  warn(...args: unknown[]) {
    if (this.level <= LOG_LEVELS.warn) {

    }
  }

  error(...args: unknown[]) {
    if (this.level <= LOG_LEVELS.error) {
      const formatted = this.formatMessage("error", args);
      if (this.options.showStackTrace) {
        formatted.push("\nStack:", new Error().stack);
      }

    }
  }

  // Throttled logging to prevent spam
  private logCounts: Map<string, number> = new Map();
  private lastLogTime: Map<string, number> = new Map();
  private readonly THROTTLE_MS = 5000; // 5 seconds
  private readonly MAX_SAME_LOG = 3;

  private shouldThrottle(message: string): boolean {
    const now = Date.now();
    const lastTime = this.lastLogTime.get(message) || 0;
    const count = this.logCounts.get(message) || 0;

    // Reset count if enough time has passed
    if (now - lastTime > this.THROTTLE_MS) {
      this.logCounts.set(message, 0);
    }

    // Don't log if we've hit the limit
    if (count >= this.MAX_SAME_LOG) {
      return true;
    }

    // Update counters
    this.logCounts.set(message, count + 1);
    this.lastLogTime.set(message, now);

    return false;
  }

  // Throttled versions for high-frequency logs
  debugThrottled(message: string, ...args: unknown[]) {
    if (this.shouldThrottle(message)) return;
    this.debug(message, ...args);
  }

  infoThrottled(message: string, ...args: unknown[]) {
    if (this.shouldThrottle(message)) return;
    this.info(message, ...args);
  }

  warnThrottled(message: string, ...args: unknown[]) {
    if (this.shouldThrottle(message)) return;
    this.warn(message, ...args);
  }

  // One-time logging for initialization messages
  once(level: LogLevel, key: string, message: string, ...args: unknown[]) {
    const storageKey = `widget_logged_${key}`;

    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      return; // Already logged this session
    }

    this[level](message, ...args);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
  }

  // Create a child logger with a specific prefix
  createChild(prefix: string, options?: Partial<LoggerOptions>): Logger {
    return new Logger(undefined, {
      ...this.options,
      ...options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix,
    });
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export factory functions for module-specific loggers
export const createLogger = (prefix: string, options?: LoggerOptions) => {
  return logger.createChild(prefix, options);
};

// Convenience exports for specific modules
export const conversationLogger = createLogger("Conversations");
export const messageLogger = createLogger("Messages");
export const authLogger = createLogger("Auth");
export const widgetLogger = createLogger("Widget");
export const performanceLogger = createLogger("Performance");
export const realtimeLogger = createLogger("Realtime");
