/**
 * Structured Logging
 * Follows GUIDE.md specifications for monitoring and observability
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

export class StructuredLogger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string, environment: string = 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : undefined;

    this.log(LogLevel.ERROR, message, {
      ...context,
      ...errorContext
    });
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : undefined;

    this.log(LogLevel.FATAL, message, {
      ...context,
      ...errorContext
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        service: this.serviceName,
        environment: this.environment,
        ...context
      }
    };

    // Output structured log
    const output = JSON.stringify(logEntry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }

    // Send to external monitoring service if configured
    this.sendToMonitoring(logEntry);
  }

  /**
   * Send log to external monitoring service
   */
  private sendToMonitoring(logEntry: LogEntry): void {
    // In production, send to monitoring service like DataDog, New Relic, etc.
    if (typeof window !== 'undefined' && (window as unknown).analytics) {
      (window as unknown).analytics.track('log_entry', logEntry);
    }
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  widgetLoadTime: number;
  messagesSent: number;
  messagesReceived: number;
  aiHandovers: number;
  connectionErrors: number;
  responseTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.metrics = {
      widgetLoadTime: 0,
      messagesSent: 0,
      messagesReceived: 0,
      aiHandovers: 0,
      connectionErrors: 0,
      responseTime: 0
    };
  }

  /**
   * Record widget load time
   */
  recordWidgetLoadTime(): void {
    this.metrics.widgetLoadTime = performance.now() - this.startTime;
  }

  /**
   * Record message sent
   */
  recordMessageSent(): void {
    this.metrics.messagesSent++;
  }

  /**
   * Record message received
   */
  recordMessageReceived(): void {
    this.metrics.messagesReceived++;
  }

  /**
   * Record AI handover
   */
  recordAIHandover(): void {
    this.metrics.aiHandovers++;
  }

  /**
   * Record connection error
   */
  recordConnectionError(): void {
    this.metrics.connectionErrors++;
  }

  /**
   * Record response time
   */
  recordResponseTime(time: number): void {
    this.metrics.responseTime = time;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Report metrics to monitoring service
   */
  reportMetrics(): void {
    if (typeof window !== 'undefined' && (window as unknown).analytics) {
      (window as unknown).analytics.track('widget_metrics', this.metrics);
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.startTime = performance.now();
    this.metrics = {
      widgetLoadTime: 0,
      messagesSent: 0,
      messagesReceived: 0,
      aiHandovers: 0,
      connectionErrors: 0,
      responseTime: 0
    };
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

export class ErrorTracker {
  private logger: StructuredLogger;

  constructor(logger: StructuredLogger) {
    this.logger = logger;
  }

  /**
   * Track error with context
   */
  trackError(error: Error, context?: LogContext): void {
    this.logger.error('Application error', error, {
      ...context,
      errorType: error.constructor.name,
      errorMessage: error.message
    });
  }

  /**
   * Track API error
   */
  trackAPIError(endpoint: string, status: number, response?: unknown): void {
    this.logger.error('API error', undefined, {
      endpoint,
      status,
      response: response ? JSON.stringify(response) : undefined
    });
  }

  /**
   * Track authentication error
   */
  trackAuthError(userId?: string, reason?: string): void {
    this.logger.error('Authentication error', undefined, {
      userId,
      reason
    });
  }

  /**
   * Track performance error
   */
  trackPerformanceError(operation: string, duration: number): void {
    this.logger.error('Performance error', undefined, {
      operation,
      duration,
      threshold: 5000 // 5 second threshold
    });
  }
}

// ============================================================================
// USAGE ANALYTICS
// ============================================================================

export interface UsageEvent {
  event: string;
  userId?: string;
  organizationId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class UsageAnalytics {
  private logger: StructuredLogger;

  constructor(logger: StructuredLogger) {
    this.logger = logger;
  }

  /**
   * Track user action
   */
  trackAction(action: string, context?: LogContext): void {
    this.logger.info('User action', {
      action,
      ...context
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, context?: LogContext): void {
    this.logger.info('Feature usage', {
      feature,
      ...context
    });
  }

  /**
   * Track conversion event
   */
  trackConversion(event: string, context?: LogContext): void {
    this.logger.info('Conversion event', {
      event,
      ...context
    });
  }

  /**
   * Track engagement
   */
  trackEngagement(metric: string, value: number, context?: LogContext): void {
    this.logger.info('Engagement metric', {
      metric,
      value,
      ...context
    });
  }
}

// ============================================================================
// GLOBAL LOGGER INSTANCES
// ============================================================================

// Create global logger instances for different services
export const authLogger = new StructuredLogger('auth-service');
export const widgetLogger = new StructuredLogger('widget-service');
export const inboxLogger = new StructuredLogger('inbox-service');
export const aiLogger = new StructuredLogger('ai-service');

// Create performance monitors
export const widgetPerformanceMonitor = new PerformanceMonitor();
export const inboxPerformanceMonitor = new PerformanceMonitor();

// Create error trackers
export const authErrorTracker = new ErrorTracker(authLogger);
export const widgetErrorTracker = new ErrorTracker(widgetLogger);
export const inboxErrorTracker = new ErrorTracker(inboxLogger);

// Create usage analytics
export const widgetAnalytics = new UsageAnalytics(widgetLogger);
export const inboxAnalytics = new UsageAnalytics(inboxLogger);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create context from request
 */
export const createRequestContext = (request: Request): LogContext => {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  };
};

/**
 * Create context from response
 */
export const createResponseContext = (response: Response): LogContext => {
  return {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type')
  };
};

/**
 * Measure execution time
 */
export const measureExecutionTime = async <T>(
  operation: string,
  fn: () => Promise<T>,
  logger: StructuredLogger = widgetLogger
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    logger.info('Operation completed', {
      operation,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    logger.error('Operation failed', error as Error, {
      operation,
      duration,
      success: false
    });
    
    throw error;
  }
};

/**
 * Debounced logging for high-frequency events
 */
export const createDebouncedLogger = (
  logger: StructuredLogger,
  delay: number = 1000
) => {
  let pendingLogs: Array<{ level: LogLevel; message: string; context?: LogContext }> = [];
  let timeoutId: NodeJS.Timeout;

  const flush = () => {
    if (pendingLogs.length > 0) {
      logger.info('Batch log entries', {
        count: pendingLogs.length,
        entries: pendingLogs
      });
      pendingLogs = [];
    }
  };

  return {
    log: (level: LogLevel, message: string, context?: LogContext) => {
      pendingLogs.push({ level, message, context: context || {} });
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(flush, delay);
    },
    flush
  };
}; 