/**
 * Enhanced Real-time Connection Monitoring Service
 * Tracks connection success/failure rates, message delivery timing, and WebSocket state transitions
 */

interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  lastConnectionTime: number | null;
  retryCount: number;
  fallbackActivated: boolean;
  totalReconnects: number;
  longestConnectionDuration: number;
  shortestConnectionDuration: number;
}

interface MessageDeliveryMetrics {
  messagesSent: number;
  messagesDelivered: number;
  averageDeliveryTime: number;
  failedDeliveries: number;
  lastDeliveryTime: number | null;
  deliveryTimeouts: number;
}

interface WebSocketStateMetrics {
  stateTransitions: Array<{
    from: string;
    to: string;
    timestamp: number;
    duration?: number;
  }>;
  currentState: string;
  timeInCurrentState: number;
  totalUptime: number;
  totalDowntime: number;
}

interface FallbackMetrics {
  fallbackActivations: number;
  fallbackDuration: number;
  pollingRequests: number;
  pollingErrors: number;
  lastFallbackActivation: number | null;
}

class RealtimeConnectionMonitor {
  private connectionMetrics: ConnectionMetrics = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    lastConnectionTime: null,
    retryCount: 0,
    fallbackActivated: false,
    totalReconnects: 0,
    longestConnectionDuration: 0,
    shortestConnectionDuration: Infinity
  };

  private messageMetrics: MessageDeliveryMetrics = {
    messagesSent: 0,
    messagesDelivered: 0,
    averageDeliveryTime: 0,
    failedDeliveries: 0,
    lastDeliveryTime: null,
    deliveryTimeouts: 0
  };

  private webSocketMetrics: WebSocketStateMetrics = {
    stateTransitions: [],
    currentState: 'disconnected',
    timeInCurrentState: 0,
    totalUptime: 0,
    totalDowntime: 0
  };

  private fallbackMetrics: FallbackMetrics = {
    fallbackActivations: 0,
    fallbackDuration: 0,
    pollingRequests: 0,
    pollingErrors: 0,
    lastFallbackActivation: null
  };

  private connectionStartTime: number | null = null;
  private stateChangeTime: number = Date.now();
  private messageDeliveryTimes = new Map<string, number>();

  /**
   * Track connection attempt start
   */
  trackConnectionAttempt(): void {
    this.connectionMetrics.connectionAttempts++;
    this.connectionStartTime = Date.now();
    this.logMetric('connection_attempt', {
      attempt: this.connectionMetrics.connectionAttempts,
      timestamp: this.connectionStartTime
    });
  }

  /**
   * Track successful connection
   */
  trackConnectionSuccess(): void {
    if (this.connectionStartTime) {
      const connectionTime = Date.now() - this.connectionStartTime;
      this.connectionMetrics.successfulConnections++;
      this.connectionMetrics.lastConnectionTime = connectionTime;
      
      // Update average connection time
      const totalConnections = this.connectionMetrics.successfulConnections;
      this.connectionMetrics.averageConnectionTime = 
        (this.connectionMetrics.averageConnectionTime * (totalConnections - 1) + connectionTime) / totalConnections;

      // Update duration records
      this.connectionMetrics.longestConnectionDuration = Math.max(
        this.connectionMetrics.longestConnectionDuration, 
        connectionTime
      );
      this.connectionMetrics.shortestConnectionDuration = Math.min(
        this.connectionMetrics.shortestConnectionDuration, 
        connectionTime
      );

      this.connectionStartTime = null;
      this.connectionMetrics.retryCount = 0; // Reset retry count on success

      this.logMetric('connection_success', {
        connectionTime,
        averageTime: this.connectionMetrics.averageConnectionTime,
        successRate: this.getConnectionSuccessRate()
      });
    }
  }

  /**
   * Track connection failure
   */
  trackConnectionFailure(error: string, willRetry: boolean = false): void {
    this.connectionMetrics.failedConnections++;
    
    if (willRetry) {
      this.connectionMetrics.retryCount++;
    }

    this.logMetric('connection_failure', {
      error,
      willRetry,
      retryCount: this.connectionMetrics.retryCount,
      failureRate: this.getConnectionFailureRate()
    });
  }

  /**
   * Track WebSocket state transition
   */
  trackStateTransition(fromState: string, toState: string): void {
    const now = Date.now();
    const duration = now - this.stateChangeTime;

    // Update time in previous state
    if (fromState === 'connected') {
      this.webSocketMetrics.totalUptime += duration;
    } else {
      this.webSocketMetrics.totalDowntime += duration;
    }

    // Record transition
    this.webSocketMetrics.stateTransitions.push({
      from: fromState,
      to: toState,
      timestamp: now,
      duration
    });

    // Keep only last 100 transitions to prevent memory bloat
    if (this.webSocketMetrics.stateTransitions.length > 100) {
      this.webSocketMetrics.stateTransitions.shift();
    }

    this.webSocketMetrics.currentState = toState;
    this.stateChangeTime = now;

    this.logMetric('state_transition', {
      from: fromState,
      to: toState,
      duration,
      uptime: this.webSocketMetrics.totalUptime,
      downtime: this.webSocketMetrics.totalDowntime
    });
  }

  /**
   * Track message sending
   */
  trackMessageSent(messageId: string): void {
    this.messageMetrics.messagesSent++;
    this.messageDeliveryTimes.set(messageId, Date.now());

    this.logMetric('message_sent', {
      messageId,
      totalSent: this.messageMetrics.messagesSent
    });
  }

  /**
   * Track message delivery
   */
  trackMessageDelivered(messageId: string): void {
    const sentTime = this.messageDeliveryTimes.get(messageId);
    if (sentTime) {
      const deliveryTime = Date.now() - sentTime;
      this.messageMetrics.messagesDelivered++;
      this.messageMetrics.lastDeliveryTime = deliveryTime;

      // Update average delivery time
      const totalDelivered = this.messageMetrics.messagesDelivered;
      this.messageMetrics.averageDeliveryTime = 
        (this.messageMetrics.averageDeliveryTime * (totalDelivered - 1) + deliveryTime) / totalDelivered;

      this.messageDeliveryTimes.delete(messageId);

      this.logMetric('message_delivered', {
        messageId,
        deliveryTime,
        averageDeliveryTime: this.messageMetrics.averageDeliveryTime,
        deliveryRate: this.getMessageDeliveryRate()
      });
    }
  }

  /**
   * Track message delivery failure
   */
  trackMessageDeliveryFailure(messageId: string, error: string): void {
    this.messageMetrics.failedDeliveries++;
    this.messageDeliveryTimes.delete(messageId);

    this.logMetric('message_delivery_failure', {
      messageId,
      error,
      failureRate: this.getMessageFailureRate()
    });
  }

  /**
   * Track fallback activation
   */
  trackFallbackActivation(): void {
    this.fallbackMetrics.fallbackActivations++;
    this.fallbackMetrics.lastFallbackActivation = Date.now();
    this.connectionMetrics.fallbackActivated = true;

    this.logMetric('fallback_activated', {
      activations: this.fallbackMetrics.fallbackActivations,
      timestamp: this.fallbackMetrics.lastFallbackActivation
    });
  }

  /**
   * Track polling request (fallback mode)
   */
  trackPollingRequest(success: boolean): void {
    this.fallbackMetrics.pollingRequests++;
    if (!success) {
      this.fallbackMetrics.pollingErrors++;
    }

    this.logMetric('polling_request', {
      success,
      totalRequests: this.fallbackMetrics.pollingRequests,
      errorRate: this.fallbackMetrics.pollingErrors / this.fallbackMetrics.pollingRequests
    });
  }

  /**
   * Get comprehensive metrics summary
   */
  getMetricsSummary() {
    return {
      connection: {
        ...this.connectionMetrics,
        successRate: this.getConnectionSuccessRate(),
        failureRate: this.getConnectionFailureRate()
      },
      messaging: {
        ...this.messageMetrics,
        deliveryRate: this.getMessageDeliveryRate(),
        failureRate: this.getMessageFailureRate()
      },
      webSocket: {
        ...this.webSocketMetrics,
        uptimePercentage: this.getUptimePercentage()
      },
      fallback: this.fallbackMetrics
    };
  }

  /**
   * Calculate connection success rate
   */
  private getConnectionSuccessRate(): number {
    const total = this.connectionMetrics.connectionAttempts;
    return total > 0 ? this.connectionMetrics.successfulConnections / total : 0;
  }

  /**
   * Calculate connection failure rate
   */
  private getConnectionFailureRate(): number {
    const total = this.connectionMetrics.connectionAttempts;
    return total > 0 ? this.connectionMetrics.failedConnections / total : 0;
  }

  /**
   * Calculate message delivery rate
   */
  private getMessageDeliveryRate(): number {
    const total = this.messageMetrics.messagesSent;
    return total > 0 ? this.messageMetrics.messagesDelivered / total : 0;
  }

  /**
   * Calculate message failure rate
   */
  private getMessageFailureRate(): number {
    const total = this.messageMetrics.messagesSent;
    return total > 0 ? this.messageMetrics.failedDeliveries / total : 0;
  }

  /**
   * Calculate uptime percentage
   */
  private getUptimePercentage(): number {
    const total = this.webSocketMetrics.totalUptime + this.webSocketMetrics.totalDowntime;
    return total > 0 ? this.webSocketMetrics.totalUptime / total : 0;
  }

  /**
   * Log metric to console and external monitoring
   */
  private logMetric(event: string, data: any): void {
    const logEntry = {
      event,
      timestamp: Date.now(),
      data
    };

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RealtimeMonitor] ${event}:`, data);
    }

    // TODO: Send to external monitoring service (Sentry, DataDog, etc.)
    // this.sendToExternalMonitoring(logEntry);
  }
}

// Singleton instance
export const realtimeConnectionMonitor = new RealtimeConnectionMonitor();
