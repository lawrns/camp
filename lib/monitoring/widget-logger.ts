/**
 * Widget monitoring and logging utilities
 * Provides structured logging for widget events and performance tracking
 */

export interface WidgetEvent {
  type: string;
  data: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
}

export interface WidgetMetrics {
  loadTime?: number;
  interactionCount?: number;
  errorCount?: number;
  messagesSent?: number;
  faqViews?: number;
  helpViews?: number;
}

class WidgetLogger {
  private sessionId: string;
  private events: WidgetEvent[] = [];
  private metrics: WidgetMetrics = {};
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMetrics();
  }

  private generateSessionId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): void {
    this.metrics = {
      loadTime: 0,
      interactionCount: 0,
      errorCount: 0,
      messagesSent: 0,
      faqViews: 0,
      helpViews: 0,
    };
  }

  /**
   * Log a widget event
   */
  logEvent(type: string, data: Record<string, any> = {}, userId?: string): void {
    if (!this.isEnabled) return;

    const event: WidgetEvent = {
      type,
      data: {
        ...data,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId,
    };

    this.events.push(event);
    this.updateMetrics(type, data);

    // Send to analytics service (if available)
    this.sendToAnalytics(event);

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Widget Event] ${type}:`, data);
    }
  }

  /**
   * Log widget error
   */
  logError(error: Error | string, context: Record<string, any> = {}): void {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    this.logEvent('widget_error', errorData);
    this.metrics.errorCount = (this.metrics.errorCount || 0) + 1;
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.logEvent('widget_performance', {
      metric,
      value,
      unit,
    });

    // Update specific metrics
    if (metric === 'load_time') {
      this.metrics.loadTime = value;
    }
  }

  /**
   * Log user interaction
   */
  logInteraction(action: string, target: string, data: Record<string, any> = {}): void {
    this.logEvent('widget_interaction', {
      action,
      target,
      ...data,
    });

    this.metrics.interactionCount = (this.metrics.interactionCount || 0) + 1;
  }

  /**
   * Update internal metrics based on event type
   */
  private updateMetrics(type: string, data: Record<string, any>): void {
    switch (type) {
      case 'message_sent':
        this.metrics.messagesSent = (this.metrics.messagesSent || 0) + 1;
        break;
      case 'faq_viewed':
        this.metrics.faqViews = (this.metrics.faqViews || 0) + 1;
        break;
      case 'help_viewed':
        this.metrics.helpViews = (this.metrics.helpViews || 0) + 1;
        break;
    }
  }

  /**
   * Send event to analytics service
   */
  private async sendToAnalytics(event: WidgetEvent): Promise<void> {
    try {
      // In production, this would send to your analytics service
      // For now, we'll use a simple endpoint or localStorage
      
      if (typeof window !== 'undefined' && window.gtag) {
        // Google Analytics 4
        window.gtag('event', event.type, {
          custom_parameter_1: event.data,
          session_id: this.sessionId,
        });
      }

      // Store in localStorage for debugging
      const storedEvents = JSON.parse(localStorage.getItem('widget_events') || '[]');
      storedEvents.push(event);
      
      // Keep only last 100 events
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100);
      }
      
      localStorage.setItem('widget_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  /**
   * Get current session metrics
   */
  getMetrics(): WidgetMetrics {
    return { ...this.metrics };
  }

  /**
   * Get session events
   */
  getEvents(): WidgetEvent[] {
    return [...this.events];
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.events = [];
    this.initializeMetrics();
    this.sessionId = this.generateSessionId();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Export session data for debugging
   */
  exportSessionData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      metrics: this.metrics,
      events: this.events,
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

// Global logger instance
const widgetLogger = new WidgetLogger();

// Convenience functions
export const logWidgetEvent = (type: string, data?: Record<string, any>, userId?: string) => {
  widgetLogger.logEvent(type, data, userId);
};

export const logWidgetError = (error: Error | string, context?: Record<string, any>) => {
  widgetLogger.logError(error, context);
};

export const logWidgetPerformance = (metric: string, value: number, unit?: string) => {
  widgetLogger.logPerformance(metric, value, unit);
};

export const logWidgetInteraction = (action: string, target: string, data?: Record<string, any>) => {
  widgetLogger.logInteraction(action, target, data);
};

export const getWidgetMetrics = () => widgetLogger.getMetrics();
export const getWidgetEvents = () => widgetLogger.getEvents();
export const clearWidgetSession = () => widgetLogger.clearSession();
export const setWidgetLoggingEnabled = (enabled: boolean) => widgetLogger.setEnabled(enabled);
export const exportWidgetSessionData = () => widgetLogger.exportSessionData();

// Performance monitoring helpers
export const measureWidgetPerformance = <T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> => {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        logWidgetPerformance(name, duration);
      });
    } else {
      const duration = performance.now() - start;
      logWidgetPerformance(name, duration);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    logWidgetPerformance(name, duration);
    logWidgetError(error as Error, { context: name });
    throw error;
  }
};

// Widget lifecycle tracking
export const trackWidgetLifecycle = () => {
  // Track widget load
  logWidgetEvent('widget_loaded', {
    loadTime: performance.now(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    logWidgetEvent('widget_visibility_change', {
      hidden: document.hidden,
    });
  });

  // Track page unload
  window.addEventListener('beforeunload', () => {
    logWidgetEvent('widget_unloaded', {
      sessionDuration: performance.now(),
      metrics: getWidgetMetrics(),
    });
  });
};

// Initialize lifecycle tracking
if (typeof window !== 'undefined') {
  trackWidgetLifecycle();
}
