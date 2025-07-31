/**
 * Enhanced Real-time Monitoring and Health Checks
 * Provides comprehensive monitoring for Supabase Realtime connections
 */

import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "./unified-channel-standards";

export interface ConnectionMetrics {
  connectionId: string;
  channelName: string;
  status: "connected" | "connecting" | "disconnected" | "error";
  latency: number | null;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  messagesReceived: number;
  messagesSent: number;
  broadcastsSuccessful: number;
  broadcastsFailed: number;
  uptime: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface RealtimeEvent {
  id: string;
  timestamp: Date;
  type: "connection" | "message" | "broadcast" | "error" | "heartbeat";
  channelName: string;
  eventName?: string;
  payload?: any;
  success: boolean;
  latency?: number;
  error?: string;
}

export class RealtimeMonitor {
  private static instance: RealtimeMonitor;
  private connections = new Map<string, ConnectionMetrics>();
  private events: RealtimeEvent[] = [];
  private maxEvents = 1000;
  private isEnabled = true;

  static getInstance(): RealtimeMonitor {
    if (!RealtimeMonitor.instance) {
      RealtimeMonitor.instance = new RealtimeMonitor();
    }
    return RealtimeMonitor.instance;
  }

  /**
   * Track connection establishment
   */
  trackConnection(channelName: string, connectionId: string): void {
    if (!this.isEnabled) return;

    const metrics: ConnectionMetrics = {
      connectionId,
      channelName,
      status: "connecting",
      latency: null,
      lastHeartbeat: null,
      reconnectAttempts: 0,
      messagesReceived: 0,
      messagesSent: 0,
      broadcastsSuccessful: 0,
      broadcastsFailed: 0,
      uptime: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, metrics);
    this.logEvent({
      type: "connection",
      channelName,
      success: true,
      payload: { action: "connecting" },
    });
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(
    connectionId: string,
    status: ConnectionMetrics["status"],
    latency?: number
  ): void {
    if (!this.isEnabled) return;

    const metrics = this.connections.get(connectionId);
    if (!metrics) return;

    metrics.status = status;
    metrics.lastActivity = new Date();
    
    if (latency !== undefined) {
      metrics.latency = latency;
    }

    if (status === "connected") {
      metrics.lastHeartbeat = new Date();
      metrics.reconnectAttempts = 0;
    } else if (status === "error" || status === "disconnected") {
      metrics.reconnectAttempts++;
    }

    this.logEvent({
      type: "connection",
      channelName: metrics.channelName,
      success: status === "connected",
      payload: { status, latency },
      latency,
    });
  }

  /**
   * Track message events
   */
  trackMessage(
    connectionId: string,
    direction: "sent" | "received",
    eventName: string,
    success: boolean,
    latency?: number,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const metrics = this.connections.get(connectionId);
    if (!metrics) return;

    if (direction === "sent") {
      metrics.messagesSent++;
    } else {
      metrics.messagesReceived++;
    }

    metrics.lastActivity = new Date();

    this.logEvent({
      type: "message",
      channelName: metrics.channelName,
      eventName,
      success,
      latency,
      error,
      payload: { direction },
    });
  }

  /**
   * Track broadcast events
   */
  trackBroadcast(
    connectionId: string,
    eventName: string,
    success: boolean,
    latency?: number,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const metrics = this.connections.get(connectionId);
    if (!metrics) return;

    if (success) {
      metrics.broadcastsSuccessful++;
    } else {
      metrics.broadcastsFailed++;
    }

    metrics.lastActivity = new Date();

    this.logEvent({
      type: "broadcast",
      channelName: metrics.channelName,
      eventName,
      success,
      latency,
      error,
    });
  }

  /**
   * Track heartbeat
   */
  trackHeartbeat(connectionId: string, latency: number): void {
    if (!this.isEnabled) return;

    const metrics = this.connections.get(connectionId);
    if (!metrics) return;

    metrics.lastHeartbeat = new Date();
    metrics.latency = latency;
    metrics.lastActivity = new Date();

    this.logEvent({
      type: "heartbeat",
      channelName: metrics.channelName,
      success: true,
      latency,
    });
  }

  /**
   * Get connection health summary
   */
  getConnectionHealth(): {
    totalConnections: number;
    healthyConnections: number;
    averageLatency: number;
    totalMessages: number;
    broadcastSuccessRate: number;
  } {
    const connections = Array.from(this.connections.values());
    const healthyConnections = connections.filter(c => c.status === "connected");
    const totalMessages = connections.reduce((sum, c) => sum + c.messagesReceived + c.messagesSent, 0);
    const totalBroadcasts = connections.reduce((sum, c) => sum + c.broadcastsSuccessful + c.broadcastsFailed, 0);
    const successfulBroadcasts = connections.reduce((sum, c) => sum + c.broadcastsSuccessful, 0);

    const latencies = connections
      .map(c => c.latency)
      .filter((l): l is number => l !== null);
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
      : 0;

    return {
      totalConnections: connections.length,
      healthyConnections: healthyConnections.length,
      averageLatency,
      totalMessages,
      broadcastSuccessRate: totalBroadcasts > 0 ? successfulBroadcasts / totalBroadcasts : 1,
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 50): RealtimeEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get connection details
   */
  getConnectionDetails(connectionId: string): ConnectionMetrics | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): ConnectionMetrics[] {
    return Array.from(this.connections.values());
  }

  /**
   * Clear old events to prevent memory leaks
   */
  private cleanupEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Log an event
   */
  private logEvent(event: Omit<RealtimeEvent, "id" | "timestamp">): void {
    const fullEvent: RealtimeEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event,
    };

    this.events.push(fullEvent);
    this.cleanupEvents();

    // Console logging for development
    if (process.env.NODE_ENV === "development") {
      const emoji = this.getEventEmoji(fullEvent);
      const status = fullEvent.success ? "✅" : "❌";
      console.log(
        `${emoji} [Realtime] ${status} ${fullEvent.type}:${fullEvent.eventName || "generic"} on ${fullEvent.channelName}`,
        fullEvent.latency ? `(${fullEvent.latency.toFixed(1)}ms)` : "",
        fullEvent.error ? `- ${fullEvent.error}` : ""
      );
    }
  }

  private getEventEmoji(event: RealtimeEvent): string {
    switch (event.type) {
      case "connection": return "🔌";
      case "message": return "💬";
      case "broadcast": return "📡";
      case "heartbeat": return "💓";
      case "error": return "💥";
      default: return "📊";
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.connections.clear();
    this.events = [];
  }
}

// Export singleton instance
export const realtimeMonitor = RealtimeMonitor.getInstance();

/**
 * Enhanced logging utilities
 */
export const RealtimeLogger = {
  /**
   * Log connection events
   */
  connection: (channelName: string, status: string, details?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔌 [Realtime] Connection ${status} for ${channelName}`, details);
    }
  },

  /**
   * Log message events
   */
  message: (channelName: string, direction: "sent" | "received", content?: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`💬 [Realtime] Message ${direction} on ${channelName}`, content?.substring(0, 50));
    }
  },

  /**
   * Log broadcast events
   */
  broadcast: (channelName: string, eventName: string, success: boolean, error?: string) => {
    if (process.env.NODE_ENV === "development") {
      const status = success ? "✅" : "❌";
      console.log(`📡 [Realtime] ${status} Broadcast ${eventName} on ${channelName}`, error);
    }
  },

  /**
   * Log errors
   */
  error: (context: string, error: any) => {
    console.error(`💥 [Realtime] Error in ${context}:`, error);
  },

  /**
   * Log performance metrics
   */
  performance: (operation: string, duration: number, details?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`⚡ [Realtime] ${operation} took ${duration.toFixed(1)}ms`, details);
    }
  },
};
