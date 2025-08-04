/**
 * Widget Console Logging System
 * Professional debugging without UI pollution
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "performance";

interface LogContext {
  organizationId?: string;
  conversationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  timestamp?: string;
  sessionId?: string;
}

interface PerformanceMetrics {
  loadTime?: number;
  messageLatency?: number;
  connectionUptime?: number;
  channelCount?: number;
  memoryUsage?: number;
  fps?: number;
}

class WidgetLogger {
  private isDevelopment: boolean;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.sessionId = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.startTime = performance.now();

    if (this.isDevelopment) {

    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const uptime = Math.round(performance.now() - this.startTime);

    let emoji = "";
    switch (level) {
      case "debug":
        emoji = "🔧";
        break;
      case "info":
        emoji = "ℹ️";
        break;
      case "warn":
        emoji = "⚠️";
        break;
      case "error":
        emoji = "❌";
        break;
      case "performance":
        emoji = "📊";
        break;
    }

    return `${emoji} [${level.toUpperCase()}] ${message} (+${uptime}ms)`;
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === "error" || level === "warn") return true;

    // Only log debug/info/performance in development
    return this.isDevelopment;
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    const logData = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      uptime: Math.round(performance.now() - this.startTime),
      ...context,
      ...(data && { data }),
    };

    switch (level) {
      case "debug":
        console.debug(formattedMessage, logData);
        break;
      case "info":
        console.info(formattedMessage, logData);
        break;
      case "warn":

        break;
      case "error":

        break;
      case "performance":

        break;
    }
  }

  // Connection logging
  connectionEstablished(context: LogContext): void {
    this.log("info", "Real-time connection established", context);
  }

  connectionLost(context: LogContext, reason?: string): void {
    this.log("warn", `Connection lost${reason ? `: ${reason}` : ""}`, context);
  }

  connectionReconnecting(context: LogContext, attempt: number): void {
    this.log("info", `Reconnecting (attempt ${attempt})`, context);
  }

  // Message logging
  messageSent(context: LogContext, messageData: unknown): void {
    this.log("info", "Message sent", context, {
      messageLength: messageData.content?.length || 0,
      hasAttachments: !!messageData.attachments?.length,
    });
  }

  messageReceived(context: LogContext, messageData: unknown): void {
    this.log("info", "Message received", context, {
      sender: messageData.senderType,
      messageLength: messageData.content?.length || 0,
    });
  }

  messageError(context: LogContext, error: Error): void {
    this.log("error", "Message error", context, {
      error: error.message,
      stack: error.stack,
    });
  }

  // Performance logging
  performanceMetrics(context: LogContext, metrics: PerformanceMetrics): void {
    this.log("performance", "Performance metrics", context, metrics);
  }

  loadTimeTracked(context: LogContext, loadTime: number): void {
    const status = loadTime < 100 ? "EXCELLENT" : loadTime < 300 ? "GOOD" : "POOR";
    this.log("performance", `Load time: ${loadTime}ms (${status})`, context);
  }

  latencyTracked(context: LogContext, latency: number, endpoint?: string): void {
    const status = latency < 100 ? "EXCELLENT" : latency < 300 ? "GOOD" : "POOR";
    this.log("performance", `Latency: ${latency}ms (${status})${endpoint ? ` - ${endpoint}` : ""}`, context);
  }

  // Channel management logging
  channelCreated(context: LogContext, channelName: string): void {
    this.log("debug", `Channel created: ${channelName}`, context);
  }

  channelReused(context: LogContext, channelName: string, refCount: number): void {
    this.log("debug", `Channel reused: ${channelName} (refs: ${refCount})`, context);
  }

  channelReleased(context: LogContext, channelName: string, refCount: number): void {
    this.log("debug", `Channel released: ${channelName} (refs: ${refCount})`, context);
  }

  channelStats(context: LogContext, stats: { total: number; active: number }): void {
    const status = stats.total >= 4 ? "HIGH" : stats.total >= 2 ? "MEDIUM" : "LOW";
    this.log("debug", `Channel stats: ${stats.active}/${stats.total} active (${status})`, context);
  }

  // Widget lifecycle logging
  widgetInitialized(context: LogContext): void {
    this.log("info", "Widget initialized", context);
  }

  widgetOpened(context: LogContext): void {
    this.log("info", "Widget opened", context);
  }

  widgetClosed(context: LogContext): void {
    this.log("info", "Widget closed", context);
  }

  // AI integration logging
  aiProcessing(context: LogContext, confidence?: number): void {
    this.log("info", `AI processing${confidence ? ` (confidence: ${confidence})` : ""}`, context);
  }

  aiHandover(context: LogContext, reason: string): void {
    this.log("info", `AI handover: ${reason}`, context);
  }

  // Error logging
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(
      "error",
      message,
      context,
      error
        ? {
            error: error.message,
            stack: error.stack,
          }
        : undefined
    );
  }

  // Warning logging
  warn(message: string, context?: LogContext, data?: unknown): void {
    this.log("warn", message, context, data);
  }

  // Info logging
  info(message: string, context?: LogContext, data?: unknown): void {
    this.log("info", message, context, data);
  }

  // Debug logging
  debug(message: string, context?: LogContext, data?: unknown): void {
    this.log("debug", message, context, data);
  }

  // Performance summary
  getPerformanceSummary(): void {
    if (!this.isDevelopment) return;

    const uptime = Math.round(performance.now() - this.startTime);
    const memory = (performance as unknown).memory;

    console.group("📊 Widget Performance Summary");



    if (memory) {

    }

    console.groupEnd();
  }
}

// Singleton instance
export const widgetLogger = new WidgetLogger();

// Convenience exports
export const logConnection = {
  established: (context: LogContext) => widgetLogger.connectionEstablished(context),
  lost: (context: LogContext, reason?: string) => widgetLogger.connectionLost(context, reason),
  reconnecting: (context: LogContext, attempt: number) => widgetLogger.connectionReconnecting(context, attempt),
};

export const logMessage = {
  sent: (context: LogContext, data: unknown) => widgetLogger.messageSent(context, data),
  received: (context: LogContext, data: unknown) => widgetLogger.messageReceived(context, data),
  error: (context: LogContext, error: Error) => widgetLogger.messageError(context, error),
};

export const logPerformance = {
  metrics: (context: LogContext, metrics: PerformanceMetrics) => widgetLogger.performanceMetrics(context, metrics),
  loadTime: (context: LogContext, time: number) => widgetLogger.loadTimeTracked(context, time),
  latency: (context: LogContext, time: number, endpoint?: string) =>
    widgetLogger.latencyTracked(context, time, endpoint),
};

export const logChannel = {
  created: (context: LogContext, name: string) => widgetLogger.channelCreated(context, name),
  reused: (context: LogContext, name: string, refs: number) => widgetLogger.channelReused(context, name, refs),
  released: (context: LogContext, name: string, refs: number) => widgetLogger.channelReleased(context, name, refs),
  stats: (context: LogContext, stats: { total: number; active: number }) => widgetLogger.channelStats(context, stats),
};

export const logWidget = {
  initialized: (context: LogContext) => widgetLogger.widgetInitialized(context),
  opened: (context: LogContext) => widgetLogger.widgetOpened(context),
  closed: (context: LogContext) => widgetLogger.widgetClosed(context),
};

export const logAI = {
  processing: (context: LogContext, confidence?: number) => widgetLogger.aiProcessing(context, confidence),
  handover: (context: LogContext, reason: string) => widgetLogger.aiHandover(context, reason),
};

export default widgetLogger;
