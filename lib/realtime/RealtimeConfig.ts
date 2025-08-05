/**
 * Realtime Configuration and Optimization
 * 
 * Provides centralized configuration for:
 * - Selective realtime triggers
 * - Burst buffering (300ms)
 * - Performance optimization
 * - Mobile-specific settings
 * - Memory management
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const REALTIME_CONFIG = {
  // Burst buffering settings
  BURST_BUFFER_TIMEOUT: 300, // 300ms to reduce UI flicker
  BURST_BUFFER_SIZE: 10, // Max messages per burst
  
  // Performance settings
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 25000, // 25s to prevent 30s timeout
  CONNECTION_TIMEOUT: 15000, // 15s connection timeout
  
  // Memory management
  MAX_STORED_MESSAGES: 1000,
  MAX_STORED_TYPING: 50,
  MAX_STORED_PRESENCE: 100,
  CLEANUP_INTERVAL: 60000, // 1 minute
  MEMORY_CLEANUP_INTERVAL: 300000, // 5 minutes
  
  // Mobile optimizations
  MOBILE_HEARTBEAT_INTERVAL: 30000, // 30s for mobile
  MOBILE_BURST_BUFFER_TIMEOUT: 500, // 500ms for mobile
  REDUCED_MOTION_BUFFER_TIMEOUT: 1000, // 1s for reduced motion
  
  // Channel naming
  CHANNEL_PREFIX: 'org',
  CONVERSATION_CHANNEL_PATTERN: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}`,
  ORGANIZATION_CHANNEL_PATTERN: (orgId: string) => `org:${orgId}`,
  TYPING_CHANNEL_PATTERN: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:typing`,
  
  // Events
  EVENTS: {
    MESSAGE: 'message',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    PRESENCE_SYNC: 'presence_sync',
    PRESENCE_JOIN: 'presence_join',
    PRESENCE_LEAVE: 'presence_leave',
    HEARTBEAT: 'heartbeat',
    AI_HANDOVER: 'ai_handover',
    AGENT_ASSIGNED: 'agent_assigned',
    CONVERSATION_CLOSED: 'conversation_closed',
  },
} as const;

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export function detectEnvironment() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isReducedMotion: false,
      supportsPerformanceAPI: false,
    };
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsPerformanceAPI = 'performance' in window && 'memory' in performance;

  return {
    isMobile,
    isReducedMotion,
    supportsPerformanceAPI,
  };
}

// ============================================================================
// ADAPTIVE CONFIGURATION
// ============================================================================

export function getAdaptiveConfig() {
  const env = detectEnvironment();
  
  return {
    heartbeatInterval: env.isMobile 
      ? REALTIME_CONFIG.MOBILE_HEARTBEAT_INTERVAL 
      : REALTIME_CONFIG.HEARTBEAT_INTERVAL,
    
    burstBufferTimeout: env.isReducedMotion 
      ? REALTIME_CONFIG.REDUCED_MOTION_BUFFER_TIMEOUT
      : env.isMobile 
        ? REALTIME_CONFIG.MOBILE_BURST_BUFFER_TIMEOUT
        : REALTIME_CONFIG.BURST_BUFFER_TIMEOUT,
    
    burstBufferSize: env.isMobile 
      ? Math.floor(REALTIME_CONFIG.BURST_BUFFER_SIZE * 0.7) // Reduce for mobile
      : REALTIME_CONFIG.BURST_BUFFER_SIZE,
    
    enableMemoryMonitoring: env.supportsPerformanceAPI,
    enableMobileOptimizations: env.isMobile,
    enableReducedMotion: env.isReducedMotion,
  };
}

// ============================================================================
// CHANNEL CONFIGURATION
// ============================================================================

export interface ChannelConfig {
  organizationId: string;
  conversationId?: string;
  enablePresence?: boolean;
  enableBroadcast?: boolean;
  enablePostgresChanges?: boolean;
  presenceKey?: string;
}

export function createChannelConfig(config: ChannelConfig) {
  const adaptiveConfig = getAdaptiveConfig();
  
  return {
    config: {
      presence: config.enablePresence !== false ? {
        key: config.presenceKey || `user-${Date.now()}`,
      } : undefined,
      
      broadcast: config.enableBroadcast !== false ? {
        ack: false, // Disable acknowledgments for performance
        self: true, // Include own messages
      } : undefined,
      
      postgres_changes: config.enablePostgresChanges ? [] : undefined,
    },
    
    // Performance settings
    heartbeatIntervalMs: adaptiveConfig.heartbeatInterval,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
    timeout: REALTIME_CONFIG.CONNECTION_TIMEOUT,
  };
}

// ============================================================================
// BURST BUFFERING IMPLEMENTATION
// ============================================================================

export class BurstBuffer<T> {
  private buffer: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly maxSize: number;
  private readonly timeoutMs: number;
  private readonly flushCallback: (items: T[]) => void;

  constructor(
    maxSize: number,
    timeoutMs: number,
    flushCallback: (items: T[]) => void
  ) {
    this.maxSize = maxSize;
    this.timeoutMs = timeoutMs;
    this.flushCallback = flushCallback;
  }

  add(item: T): void {
    this.buffer.push(item);

    // Flush if buffer is full
    if (this.buffer.length >= this.maxSize) {
      this.flush();
      return;
    }

    // Set timeout if not already set
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.timeoutMs);
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const items = [...this.buffer];
    this.buffer = [];

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.flushCallback(items);
  }

  clear(): void {
    this.buffer = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  get size(): number {
    return this.buffer.length;
  }
}

// ============================================================================
// SELECTIVE REALTIME MANAGER
// ============================================================================

export class SelectiveRealtimeManager {
  private enabledTables: Set<string> = new Set();
  private burstBuffers: Map<string, BurstBuffer<any>> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  constructor() {
    // Enable core tables by default
    this.enabledTables.add('messages');
    this.enabledTables.add('conversations');
    this.enabledTables.add('typing_indicators');
    this.enabledTables.add('widget_typing_indicators');
    this.enabledTables.add('realtime_conversations');
  }

  enableTable(tableName: string): void {
    this.enabledTables.add(tableName);
  }

  disableTable(tableName: string): void {
    this.enabledTables.delete(tableName);
  }

  isTableEnabled(tableName: string): boolean {
    return this.enabledTables.has(tableName);
  }

  getEnabledTables(): string[] {
    return Array.from(this.enabledTables);
  }

  createBurstBuffer<T>(
    key: string,
    flushCallback: (items: T[]) => void,
    customConfig?: { maxSize?: number; timeoutMs?: number }
  ): BurstBuffer<T> {
    const adaptiveConfig = getAdaptiveConfig();
    const config = {
      maxSize: customConfig?.maxSize || adaptiveConfig.burstBufferSize,
      timeoutMs: customConfig?.timeoutMs || adaptiveConfig.burstBufferTimeout,
    };

    const buffer = new BurstBuffer<T>(
      config.maxSize,
      config.timeoutMs,
      flushCallback
    );

    this.burstBuffers.set(key, buffer);
    return buffer;
  }

  getBurstBuffer<T>(key: string): BurstBuffer<T> | undefined {
    return this.burstBuffers.get(key);
  }

  clearBurstBuffer(key: string): void {
    const buffer = this.burstBuffers.get(key);
    if (buffer) {
      buffer.clear();
      this.burstBuffers.delete(key);
    }
  }

  clearAllBurstBuffers(): void {
    this.burstBuffers.forEach(buffer => buffer.clear());
    this.burstBuffers.clear();
  }

  recordMetric(key: string, value: number): void {
    this.performanceMetrics.set(key, value);
  }

  getMetric(key: string): number | undefined {
    return this.performanceMetrics.get(key);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.performanceMetrics);
  }

  // Database optimization queries
  async optimizeRealtimeQueries(organizationId: string): Promise<void> {
    const client = supabase.browser();
    
    try {
      // Record start time
      const startTime = Date.now();
      
      // Cleanup old typing indicators
      await client.rpc('cleanup_old_typing_indicators');
      
      // Record performance metric
      const cleanupTime = Date.now() - startTime;
      this.recordMetric('cleanup_time_ms', cleanupTime);
      
      // Record memory usage if available
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        this.recordMetric('memory_usage_mb', performance.memory.usedJSHeapSize / (1024 * 1024));
      }
      
    } catch (error) {
      console.error('[SelectiveRealtimeManager] Optimization failed:', error);
    }
  }

  // Performance monitoring
  async recordRealtimeMetric(
    organizationId: string,
    metricType: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const client = supabase.browser();
    
    try {
      await client.from('realtime_performance_metrics').insert({
        organization_id: organizationId,
        metric_type: metricType,
        metric_value: value,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('[SelectiveRealtimeManager] Failed to record metric:', error);
    }
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

export const selectiveRealtimeManager = new SelectiveRealtimeManager();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createOptimizedChannel(
  organizationId: string,
  conversationId?: string,
  options?: Partial<ChannelConfig>
) {
  const client = supabase.browser();
  const channelName = conversationId 
    ? REALTIME_CONFIG.CONVERSATION_CHANNEL_PATTERN(organizationId, conversationId)
    : REALTIME_CONFIG.ORGANIZATION_CHANNEL_PATTERN(organizationId);

  const config = createChannelConfig({
    organizationId,
    conversationId,
    ...options,
  });

  return client.channel(channelName, config);
}

export function getChannelName(organizationId: string, conversationId?: string): string {
  return conversationId 
    ? REALTIME_CONFIG.CONVERSATION_CHANNEL_PATTERN(organizationId, conversationId)
    : REALTIME_CONFIG.ORGANIZATION_CHANNEL_PATTERN(organizationId);
}

export function isRealtimeEvent(event: string): boolean {
  return Object.values(REALTIME_CONFIG.EVENTS).includes(event as any);
}

export function validateRealtimePayload(payload: any): boolean {
  return payload && 
         typeof payload === 'object' && 
         'timestamp' in payload &&
         'organizationId' in payload;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Set up periodic optimization
  setInterval(() => {
    const orgId = process.env.NEXT_PUBLIC_ORGANIZATION_ID;
    if (orgId) {
      selectiveRealtimeManager.optimizeRealtimeQueries(orgId);
    }
  }, REALTIME_CONFIG.CLEANUP_INTERVAL);
}

export default {
  REALTIME_CONFIG,
  detectEnvironment,
  getAdaptiveConfig,
  createChannelConfig,
  BurstBuffer,
  SelectiveRealtimeManager,
  selectiveRealtimeManager,
  createOptimizedChannel,
  getChannelName,
  isRealtimeEvent,
  validateRealtimePayload,
};
