/**
 * CHANNEL MONITORING & DEBUGGING SYSTEM
 * 
 * Comprehensive logging, monitoring, and debugging tools for channel communications
 * with performance metrics, error tracking, and real-time diagnostics.
 */

import { UNIFIED_CHANNELS, UNIFIED_EVENTS, extractOrgId, extractResourceType } from './unified-channel-standards';
import { ChannelEventValidator } from './channel-validation';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface ChannelMetrics {
  channelName: string;
  totalEvents: number;
  eventsByType: Record<string, number>;
  averageLatency: number;
  errorCount: number;
  lastActivity: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  subscriptionCount: number;
}

export interface ChannelEvent {
  id: string;
  channelName: string;
  eventName: string;
  payload: unknown;
  timestamp: string;
  latency?: number;
  source: 'incoming' | 'outgoing';
  status: 'success' | 'error' | 'warning';
  error?: string;
  organizationId?: string;
  resourceType?: string;
}

export interface PerformanceMetrics {
  totalChannels: number;
  activeConnections: number;
  totalEvents: number;
  averageLatency: number;
  errorRate: number;
  throughput: number; // events per second
  memoryUsage: number;
  uptime: number;
}

// ============================================================================
// CHANNEL MONITOR
// ============================================================================

export class ChannelMonitor {
  private metrics: Map<string, ChannelMetrics> = new Map();
  private events: ChannelEvent[] = [];
  private validator: ChannelEventValidator;
  private startTime: number = Date.now();
  private maxEventHistory: number = 1000;
  private isEnabled: boolean = true;

  constructor(validator?: ChannelEventValidator, maxEventHistory: number = 1000) {
    this.validator = validator || new ChannelEventValidator();
    this.maxEventHistory = maxEventHistory;
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Record channel event
   */
  recordEvent(
    channelName: string,
    eventName: string,
    payload: unknown,
    source: 'incoming' | 'outgoing',
    latency?: number,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Validate event
    const validation = this.validator.validateChannelEvent(channelName, eventName, payload);
    const status = error ? 'error' : validation.errors.length > 0 ? 'warning' : 'success';

    // Create event record
    const event: ChannelEvent = {
      id: eventId,
      channelName,
      eventName,
      payload: this.sanitizePayload(payload),
      timestamp,
      latency,
      source,
      status,
      error: error || validation.errors.join(', ') || undefined,
      organizationId: extractOrgId(channelName) || undefined,
      resourceType: extractResourceType(channelName) || undefined,
    };

    // Add to event history
    this.events.push(event);
    if (this.events.length > this.maxEventHistory) {
      this.events.shift();
    }

    // Update metrics
    this.updateMetrics(channelName, eventName, latency, status === 'error');

    // Log if error or warning
    if (status !== 'success') {
      console.warn('[ChannelMonitor]', {
        channelName,
        eventName,
        status,
        error: event.error,
        validation: validation.errors.length > 0 ? validation : undefined,
      });
    }
  }

  /**
   * Update channel metrics
   */
  private updateMetrics(channelName: string, eventName: string, latency?: number, isError: boolean = false): void {
    let metrics = this.metrics.get(channelName);
    
    if (!metrics) {
      metrics = {
        channelName,
        totalEvents: 0,
        eventsByType: {},
        averageLatency: 0,
        errorCount: 0,
        lastActivity: new Date().toISOString(),
        connectionStatus: 'connected',
        subscriptionCount: 1,
      };
      this.metrics.set(channelName, metrics);
    }

    // Update counters
    metrics.totalEvents++;
    metrics.eventsByType[eventName] = (metrics.eventsByType[eventName] || 0) + 1;
    metrics.lastActivity = new Date().toISOString();

    if (isError) {
      metrics.errorCount++;
    }

    // Update latency (rolling average)
    if (latency !== undefined) {
      metrics.averageLatency = (metrics.averageLatency + latency) / 2;
    }
  }

  /**
   * Get metrics for specific channel
   */
  getChannelMetrics(channelName: string): ChannelMetrics | undefined {
    return this.metrics.get(channelName);
  }

  /**
   * Get all channel metrics
   */
  getAllMetrics(): ChannelMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50, channelName?: string): ChannelEvent[] {
    let events = this.events;
    
    if (channelName) {
      events = events.filter(e => e.channelName === channelName);
    }
    
    return events.slice(-limit).reverse();
  }

  /**
   * Get events by organization
   */
  getEventsByOrganization(organizationId: string, limit: number = 50): ChannelEvent[] {
    return this.events
      .filter(e => e.organizationId === organizationId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const totalEvents = this.events.length;
    const errorEvents = this.events.filter(e => e.status === 'error').length;
    const uptime = Date.now() - this.startTime;
    
    const latencies = this.events
      .filter(e => e.latency !== undefined)
      .map(e => e.latency!);
    
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;

    return {
      totalChannels: this.metrics.size,
      activeConnections: Array.from(this.metrics.values())
        .filter(m => m.connectionStatus === 'connected').length,
      totalEvents,
      averageLatency,
      errorRate: totalEvents > 0 ? errorEvents / totalEvents : 0,
      throughput: totalEvents / (uptime / 1000), // events per second
      memoryUsage: this.estimateMemoryUsage(),
      uptime,
    };
  }

  /**
   * Get channel health status
   */
  getChannelHealth(channelName: string): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.metrics.get(channelName);
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!metrics) {
      return {
        status: 'critical',
        issues: ['Channel not found in metrics'],
        recommendations: ['Verify channel name and ensure it is being used'],
      };
    }

    // Check error rate
    const errorRate = metrics.errorCount / metrics.totalEvents;
    if (errorRate > 0.1) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      recommendations.push('Review error logs and fix validation issues');
    }

    // Check latency
    if (metrics.averageLatency > 1000) {
      issues.push(`High latency: ${metrics.averageLatency.toFixed(0)}ms`);
      recommendations.push('Optimize payload size and check network conditions');
    }

    // Check activity
    const lastActivity = new Date(metrics.lastActivity);
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    if (timeSinceActivity > 300000) { // 5 minutes
      issues.push('No recent activity');
      recommendations.push('Verify channel is still in use');
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'warning' : 'critical';

    return { status, issues, recommendations };
  }

  /**
   * Clear old events and metrics
   */
  cleanup(olderThanMs: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - olderThanMs;
    
    // Remove old events
    this.events = this.events.filter(e => new Date(e.timestamp).getTime() > cutoff);
    
    // Remove inactive channels
    for (const [channelName, metrics] of this.metrics.entries()) {
      const lastActivity = new Date(metrics.lastActivity).getTime();
      if (lastActivity < cutoff) {
        this.metrics.delete(channelName);
      }
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    channels: ChannelMetrics[];
    events: ChannelEvent[];
    performance: PerformanceMetrics;
    timestamp: string;
  } {
    return {
      channels: this.getAllMetrics(),
      events: this.getRecentEvents(100),
      performance: this.getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sanitize payload for logging
   */
  private sanitizePayload(payload: unknown): unknown {
    if (!payload) return payload;
    
    const sanitized = { ...payload };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    const eventsSize = JSON.stringify(this.events).length;
    const metricsSize = JSON.stringify(Array.from(this.metrics.values())).length;
    return eventsSize + metricsSize;
  }
}

// ============================================================================
// DEBUGGING UTILITIES
// ============================================================================

export class ChannelDebugger {
  private monitor: ChannelMonitor;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient, monitor?: ChannelMonitor) {
    this.supabase = supabase;
    this.monitor = monitor || new ChannelMonitor();
  }

  /**
   * Debug specific channel
   */
  async debugChannel(channelName: string, duration: number = 30000): Promise<{
    metrics: ChannelMetrics | undefined;
    events: ChannelEvent[];
    health: ReturnType<ChannelMonitor['getChannelHealth']>;
    testResults: unknown;
  }> {
    console.log(`[ChannelDebugger] Starting debug session for ${channelName} (${duration}ms)`);
    
    const startTime = Date.now();
    const channel = this.supabase.channel(channelName);
    
    // Set up monitoring
    channel.on('system', {}, (payload) => {
      this.monitor.recordEvent(channelName, 'system', payload, 'incoming');
    });
    
    channel.on('broadcast', { event: '*' }, (payload) => {
      this.monitor.recordEvent(channelName, payload.event, payload.payload, 'incoming');
    });
    
    await channel.subscribe();
    
    // Wait for debug duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    await channel.unsubscribe();
    
    const metrics = this.monitor.getChannelMetrics(channelName);
    const events = this.monitor.getRecentEvents(50, channelName);
    const health = this.monitor.getChannelHealth(channelName);
    
    console.log(`[ChannelDebugger] Debug session completed for ${channelName}`);
    console.log('Metrics:', metrics);
    console.log('Health:', health);
    console.log('Recent Events:', events.length);
    
    return {
      metrics,
      events,
      health,
      testResults: {
        duration: Date.now() - startTime,
        eventsRecorded: events.length,
      },
    };
  }

  /**
   * Test channel connectivity
   */
  async testChannelConnectivity(channelName: string): Promise<boolean> {
    try {
      const channel = this.supabase.channel(channelName);
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);
        
        channel.on('system', {}, (payload) => {
          if (payload.status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve(true);
          }
        });
        
        channel.subscribe();
      });
    } catch {
      return false;
    }
  }
}

// ============================================================================
// GLOBAL MONITOR INSTANCE
// ============================================================================

export const globalChannelMonitor = new ChannelMonitor();

/**
 * Initialize global monitoring
 */
export function initializeChannelMonitoring(supabase: SupabaseClient): void {
  // Set up global event listeners if needed
  console.log('[ChannelMonitoring] Global monitoring initialized');
  
  // Cleanup old data every hour
  setInterval(() => {
    globalChannelMonitor.cleanup();
  }, 3600000);
}
