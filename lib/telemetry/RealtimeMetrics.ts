/**
 * Real-time performance metrics collection and monitoring
 */

import { EventEmitter } from "events";

export interface MessageMetrics {
  messageId: string;
  timestamp: number;
  latency: number;
  size: number;
  success: boolean;
  error?: string;
}

export interface ConnectionMetrics {
  connectionId: string;
  established: number;
  duration: number;
  reconnections: number;
  state: "connected" | "disconnected" | "error";
}

export interface AggregatedMetrics {
  messagesDelivered: number;
  messagesFailed: number;
  averageLatency: number;
  p95Latency: number;
  maxLatency: number;
  activeConnections: number;
  totalConnections: number;
  reconnectionRate: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

export class RealtimeMetrics extends EventEmitter {
  private static instance: RealtimeMetrics;

  private metrics = {
    messages: new Map<string, MessageMetrics>(),
    connections: new Map<string, ConnectionMetrics>(),
    latencies: [] as number[],
    errors: [] as { timestamp: number; type: string; message: string }[],
    startTime: Date.now(),
  };

  private aggregationInterval: NodeJS.Timeout | null = null;
  private metricsWindow = 60000; // 1 minute rolling window

  private constructor() {
    super();
    this.startAggregation();
  }

  static getInstance(): RealtimeMetrics {
    if (!RealtimeMetrics.instance) {
      RealtimeMetrics.instance = new RealtimeMetrics();
    }
    return RealtimeMetrics.instance;
  }

  /**
   * Track message delivery
   */
  trackMessageDelivery(messageId: string, startTime: number, success: boolean, size: number = 0, error?: string): void {
    const latency = Date.now() - startTime;

    const metric: MessageMetrics = {
      messageId,
      timestamp: Date.now(),
      latency,
      size,
      success,
      error,
    };

    this.metrics.messages.set(messageId, metric);

    if (success) {
      this.metrics.latencies.push(latency);
      // Keep only recent latencies (last 1000)
      if (this.metrics.latencies.length > 1000) {
        this.metrics.latencies.shift();
      }
    } else {
      this.trackError("message_delivery", error || "Unknown error");
    }

    this.emit("message", metric);
  }

  /**
   * Track connection state
   */
  trackConnection(
    connectionId: string,
    state: "connected" | "disconnected" | "error",
    reconnections: number = 0
  ): void {
    const existing = this.metrics.connections.get(connectionId);

    const metric: ConnectionMetrics = {
      connectionId,
      established: existing?.established || Date.now(),
      duration: existing ? Date.now() - existing.established : 0,
      reconnections: existing ? existing.reconnections + reconnections : reconnections,
      state,
    };

    this.metrics.connections.set(connectionId, metric);
    this.emit("connection", metric);
  }

  /**
   * Track errors
   */
  trackError(type: string, message: string): void {
    const error = {
      timestamp: Date.now(),
      type,
      message,
    };

    this.metrics.errors.push(error);

    // Keep only recent errors (last 100)
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    this.emit("error", error);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(): AggregatedMetrics {
    const now = Date.now();
    const windowStart = now - this.metricsWindow;

    // Filter recent messages
    const recentMessages = Array.from(this.metrics.messages.values()).filter((m: unknown) => m.timestamp > windowStart);

    const successfulMessages = recentMessages.filter((m: unknown) => m.success);
    const failedMessages = recentMessages.filter((m: unknown) => !m.success);

    // Calculate latency statistics
    const sortedLatencies = [...this.metrics.latencies].sort((a, b) => a - b);
    const averageLatency =
      sortedLatencies.length > 0 ? sortedLatencies.reduce((a: unknown, b: unknown) => a + b, 0) / sortedLatencies.length : 0;
    const p95Latency = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0 : 0;
    const maxLatency = sortedLatencies.length > 0 ? Math.max(...sortedLatencies) : 0;

    // Connection statistics
    const connections = Array.from(this.metrics.connections.values());
    const activeConnections = connections.filter((c: unknown) => c.state === "connected").length;
    const totalReconnections = connections.reduce((sum: unknown, c: unknown) => sum + c.reconnections, 0);
    const reconnectionRate = connections.length > 0 ? totalReconnections / connections.length : 0;

    // Error rate
    const recentErrors = this.metrics.errors.filter((e: unknown) => e.timestamp > windowStart);
    const errorRate = recentMessages.length > 0 ? (failedMessages.length / recentMessages.length) * 100 : 0;

    // Throughput (messages per second)
    const duration = (now - this.metrics.startTime) / 1000;
    const throughput = successfulMessages.length / Math.min(duration, this.metricsWindow / 1000);

    return {
      messagesDelivered: successfulMessages.length,
      messagesFailed: failedMessages.length,
      averageLatency: Math.round(averageLatency),
      p95Latency: Math.round(p95Latency || 0),
      maxLatency,
      activeConnections,
      totalConnections: connections.length,
      reconnectionRate: Math.round(reconnectionRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get metrics for monitoring dashboard
   */
  getMetricsForDashboard() {
    const aggregated = this.getAggregatedMetrics();
    const recentErrors = this.metrics.errors.slice(-10);

    return {
      summary: aggregated,
      recentErrors,
      latencyHistogram: this.getLatencyHistogram(),
      connectionStates: this.getConnectionStates(),
      throughputHistory: this.getThroughputHistory(),
    };
  }

  /**
   * Get latency histogram data
   */
  private getLatencyHistogram(): { bucket: string; count: number }[] {
    const buckets = [0, 50, 100, 200, 500, 1000, 2000, 5000];
    const histogram: { [key: string]: number } = {};

    buckets.forEach((bucket, i) => {
      const nextBucket = buckets[i + 1] || Infinity;
      const label = nextBucket === Infinity ? `${bucket}+ms` : `${bucket}-${nextBucket}ms`;
      histogram[label] = 0;
    });

    this.metrics.latencies.forEach((latency: unknown) => {
      for (let i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        if (bucket === undefined) continue;
        const nextBucket = buckets[i + 1] || Infinity;

        if (latency >= bucket && latency < nextBucket) {
          const label = nextBucket === Infinity ? `${bucket}+ms` : `${bucket}-${nextBucket}ms`;
          if (histogram[label] !== undefined) histogram[label]++;
          break;
        }
      }
    });

    return Object.entries(histogram).map(([bucket, count]) => ({ bucket, count }));
  }

  /**
   * Get connection state distribution
   */
  private getConnectionStates(): { state: string; count: number }[] {
    const states: { [key: string]: number } = {
      connected: 0,
      disconnected: 0,
      error: 0,
    };

    this.metrics.connections.forEach((conn: unknown) => {
      if (states[conn.state] !== undefined) states[conn.state]!++;
    });

    return Object.entries(states).map(([state, count]) => ({ state, count }));
  }

  /**
   * Get throughput history (last 10 minutes)
   */
  private getThroughputHistory(): { timestamp: number; throughput: number }[] {
    const history: { timestamp: number; throughput: number }[] = [];
    const now = Date.now();
    const bucketSize = 60000; // 1 minute buckets

    for (let i = 9; i >= 0; i--) {
      const bucketEnd = now - i * bucketSize;
      const bucketStart = bucketEnd - bucketSize;

      const messagesInBucket = Array.from(this.metrics.messages.values()).filter(
        (m) => m.timestamp >= bucketStart && m.timestamp < bucketEnd && m.success
      ).length;

      history.push({
        timestamp: bucketEnd,
        throughput: messagesInBucket / 60, // messages per second
      });
    }

    return history;
  }

  /**
   * Start metrics aggregation
   */
  private startAggregation(): void {
    // Emit aggregated metrics every 10 seconds
    this.aggregationInterval = setInterval(() => {
      this.emit("aggregated", this.getAggregatedMetrics());
    }, 10000);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const data = {
      startTime: new Date(this.metrics.startTime).toISOString(),
      exportTime: new Date().toISOString(),
      summary: this.getAggregatedMetrics(),
      messages: Array.from(this.metrics.messages.values()),
      connections: Array.from(this.metrics.connections.values()),
      errors: this.metrics.errors,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.messages.clear();
    this.metrics.connections.clear();
    this.metrics.latencies = [];
    this.metrics.errors = [];
    this.metrics.startTime = Date.now();
    this.emit("reset");
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
    this.removeAllListeners();
  }
}
