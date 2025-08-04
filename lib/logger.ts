/**
 * Application Logger
 * Provides structured logging with different levels and transports
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

export interface LogTransport {
  log(entry: LogEntry): void | Promise<void>;
}

/**
 * Console transport for development
 */
class ConsoleTransport implements LogTransport {
  private colors = {
    [LogLevel.DEBUG]: "\x1b[36m", // Cyan
    [LogLevel.INFO]: "\x1b[32m", // Green
    [LogLevel.WARN]: "\x1b[33m", // Yellow
    [LogLevel.ERROR]: "\x1b[31m", // Red
    [LogLevel.FATAL]: "\x1b[35m", // Magenta
  };

  private reset = "\x1b[0m";

  log(entry: LogEntry): void {
    const color = this.colors[entry.level];
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();

    let message = `${color}[${timestamp}] [${levelName}]${this.reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      message += `\n${entry.error.stack || entry.error.message}`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:

        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:

        break;
    }
  }
}

/**
 * Remote transport for production (e.g., to a logging service)
 */
class RemoteTransport implements LogTransport {
  private endpoint: string;
  private buffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 100;
  private timer?: NodeJS.Timeout;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.startFlushTimer();
  }

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // Re-add entries to buffer on failure
      this.buffer.unshift(...entries);

    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush().catch(console.error);
  }
}

/**
 * Main Logger class
 */
class Logger {
  private level: LogLevel;
  private transports: LogTransport[] = [];
  private context: LogContext = {};

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;

    // Set up transports based on environment
    if (typeof window === "undefined") {
      // Server-side
      this.transports.push(new ConsoleTransport());

      if (process.env.LOG_ENDPOINT) {
        this.transports.push(new RemoteTransport(process.env.LOG_ENDPOINT));
      }
    } else {
      // Client-side
      if (process.env.NODE_ENV === "development") {
        this.transports.push(new ConsoleTransport());
      }

      if (process.env.NEXT_PUBLIC_LOG_ENDPOINT) {
        this.transports.push(new RemoteTransport(process.env.NEXT_PUBLIC_LOG_ENDPOINT));
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
    };

    if (error !== undefined) {
      entry.error = error;
    }

    this.transports.forEach((transport) => {
      try {
        transport.log(entry);
      } catch (error) {

      }
    });
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, context, error);
    } else {
      this.log(LogLevel.ERROR, message, error);
    }
  }

  fatal(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.log(LogLevel.FATAL, message, context, error);
    } else {
      this.log(LogLevel.FATAL, message, error);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.level);
    childLogger.transports = this.transports;
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Measure and log operation duration
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { duration });
    };
  }

  /**
   * Log API request/response
   */
  logRequest(method: string, url: string, status?: number, duration?: number, error?: Error): void {
    const context: LogContext = {
      method,
      url,
      status,
      duration,
    };

    if (error) {
      this.error("API request failed", error, context);
    } else if (status && status >= 400) {
      this.warn("API request error", context);
    } else {
      this.info("API request", context);
    }
  }
}

/**
 * Get log level from environment
 */
function getLogLevelFromEnv(): LogLevel {
  const level = process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL;

  switch (level?.toUpperCase()) {
    case "DEBUG":
      return LogLevel.DEBUG;
    case "INFO":
      return LogLevel.INFO;
    case "WARN":
      return LogLevel.WARN;
    case "ERROR":
      return LogLevel.ERROR;
    case "FATAL":
      return LogLevel.FATAL;
    default:
      return process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO;
  }
}

// Create default logger instance
const logger = new Logger(getLogLevelFromEnv());

// Export logger instance and types
export { logger, Logger };

/**
 * Convenience export for common logging patterns
 */
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | LogContext, context?: LogContext) => logger.error(message, error, context),
  fatal: (message: string, error?: Error | LogContext, context?: LogContext) => logger.fatal(message, error, context),
};

/**
 * Logger configuration utilities
 */
export function onlyCriticalErrors(): void {
  logger.setLevel(LogLevel.ERROR);
}

export function suppressAllLogs(): void {
  logger.setLevel((LogLevel.FATAL + 1) as LogLevel); // Suppress all logs
}

// Export default instance
export default logger;
