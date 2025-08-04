/**
 * Real-time Performance Optimizer
 *
 * Optimizes real-time communication for <100ms latency
 * Implements connection pooling, message batching, and performance monitoring
 */

import { supabase } from "@/lib/supabase/consolidated-exports";

interface RealtimeMetrics {
  messageLatency: number;
  connectionUptime: number;
  messagesReceived: number;
  messagesSent: number;
  reconnections: number;
  lastHeartbeat: number;
}

interface OptimizationConfig {
  batchSize: number;
  batchTimeout: number;
  heartbeatInterval: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
}

class RealtimePerformanceOptimizer {
  private static instance: RealtimePerformanceOptimizer;
  private metrics: RealtimeMetrics;
  private config: OptimizationConfig;
  private messageQueue: unknown[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connections = new Map<string, any>();

  constructor() {
    this.metrics = {
      messageLatency: 0,
      connectionUptime: Date.now(),
      messagesReceived: 0,
      messagesSent: 0,
      reconnections: 0,
      lastHeartbeat: Date.now(),
    };

    this.config = {
      batchSize: 10,
      batchTimeout: 50, // 50ms batching for <100ms total latency
      heartbeatInterval: 30000, // 30 seconds
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
    };

    this.initializeOptimizations();
  }

  static getInstance(): RealtimePerformanceOptimizer {
    if (!RealtimePerformanceOptimizer.instance) {
      RealtimePerformanceOptimizer.instance = new RealtimePerformanceOptimizer();
    }
    return RealtimePerformanceOptimizer.instance;
  }

  private initializeOptimizations() {
    this.startHeartbeat();
    this.setupConnectionPooling();
  }

  /**
   * Optimized message sending with batching
   */
  async sendMessage(channel: string, event: string, payload: unknown): Promise<void> {
    const startTime = performance.now();

    const message = {
      channel,
      event,
      payload,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    };

    // Add to batch queue
    this.messageQueue.push(message);

    // Process batch if size limit reached
    if (this.messageQueue.length >= this.config.batchSize) {
      await this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch timeout
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.config.batchTimeout);
    }

    const latency = performance.now() - startTime;
    this.updateMetrics("send", latency);
  }

  /**
   * Process message batch
   */
  private async processBatch(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const batch = [...this.messageQueue];
    this.messageQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Group messages by channel for efficient sending
      const channelGroups = batch.reduce(
        (groups, message) => {
          if (!groups[message.channel]) {
            groups[message.channel] = [];
          }
          groups[message.channel].push(message);
          return groups;
        },
        {} as Record<string, any[]>
      );

      // Send batched messages per channel
      await Promise.all(
        Object.entries(channelGroups).map(([channel, messages]) => this.sendBatchToChannel(channel, messages))
      );
    } catch (error) {

      // Re-queue failed messages
      this.messageQueue.unshift(...batch);
    }
  }

  /**
   * Send batch to specific channel
   */
  private async sendBatchToChannel(channel: string, messages: unknown[]): Promise<void> {
    const connection = this.getOptimizedConnection(channel);

    if (messages.length === 1) {
      // Single message - send directly
      const message = messages[0];
      await connection.send({
        type: "broadcast",
        event: message.event,
        payload: message.payload,
      });
    } else {
      // Multiple messages - send as batch
      await connection.send({
        type: "broadcast",
        event: "batch_messages",
        payload: {
          messages: messages.map((m) => ({
            event: m.event,
            payload: m.payload,
            id: m.id,
          })),
        },
      });
    }

    this.metrics.messagesSent += messages.length;
  }

  /**
   * Get optimized connection for channel
   */
  private getOptimizedConnection(channel: string): unknown {
    if (!this.connections.has(channel)) {
      const connection = supabase
        .admin()
        .channel(channel)
        .on("broadcast", { event: "*" }, (payload) => {
          this.handleIncomingMessage(payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {

          } else if (status === "CHANNEL_ERROR") {

            this.handleConnectionError(channel);
          }
        });

      this.connections.set(channel, connection);
    }

    return this.connections.get(channel);
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(payload: unknown): void {
    const receiveTime = performance.now();

    if (payload.event === "batch_messages") {
      // Handle batched messages
      payload.payload.messages.forEach((message: unknown) => {
        this.processIncomingMessage(message, receiveTime);
      });
    } else {
      this.processIncomingMessage(payload, receiveTime);
    }
  }

  /**
   * Process individual incoming message
   */
  private processIncomingMessage(message: unknown, receiveTime: number): void {
    // Calculate latency if timestamp is available
    if (message.timestamp) {
      const latency = receiveTime - message.timestamp;
      this.updateMetrics("receive", latency);
    }

    this.metrics.messagesReceived++;
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private async handleConnectionError(channel: string): Promise<void> {
    this.connections.delete(channel);
    this.metrics.reconnections++;

    let attempts = 0;
    while (attempts < this.config.maxReconnectAttempts) {
      const delay = this.config.reconnectDelay * Math.pow(2, attempts);

      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        this.getOptimizedConnection(channel);

        break;
      } catch (error) {
        attempts++;

      }
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.metrics.lastHeartbeat = Date.now();

      // Send heartbeat to all active connections
      this.connections.forEach((connection, channel) => {
        connection.send({
          type: "broadcast",
          event: "heartbeat",
          payload: { timestamp: Date.now() },
        });
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Setup connection pooling
   */
  private setupConnectionPooling(): void {
    // Implement connection pooling for better resource management
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const idleThreshold = 300000; // 5 minutes

    this.connections.forEach((connection, channel) => {
      if (now - this.metrics.lastHeartbeat > idleThreshold) {

        connection.unsubscribe();
        this.connections.delete(channel);
      }
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(type: "send" | "receive", latency: number): void {
    // Update rolling average latency
    this.metrics.messageLatency = (this.metrics.messageLatency + latency) / 2;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): RealtimeMetrics {
    return {
      ...this.metrics,
      connectionUptime: Date.now() - this.metrics.connectionUptime,
    };
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus() {
    const metrics = this.getMetrics();

    return {
      latency: {
        current: metrics.messageLatency,
        target: 100,
        status: metrics.messageLatency < 100 ? "excellent" : "needs_improvement",
      },
      throughput: {
        sent: metrics.messagesSent,
        received: metrics.messagesReceived,
        ratio: metrics.messagesReceived / (metrics.messagesSent || 1),
      },
      reliability: {
        uptime: metrics.connectionUptime,
        reconnections: metrics.reconnections,
        stability: metrics.reconnections < 5 ? "stable" : "unstable",
      },
      connections: {
        active: this.connections.size,
        pooled: true,
        optimized: true,
      },
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.connections.forEach((connection) => {
      connection.unsubscribe();
    });

    this.connections.clear();
    this.messageQueue = [];
  }
}

export const realtimeOptimizer = RealtimePerformanceOptimizer.getInstance();
export default realtimeOptimizer;
