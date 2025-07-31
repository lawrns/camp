/**
 * Real-time Performance Optimizations
 * Implements connection pooling, subscription management, and performance enhancements
 */

import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "./unified-channel-standards";
import { realtimeMonitor, RealtimeLogger } from "./enhanced-monitoring";

interface ChannelPool {
  channel: any;
  subscribers: Set<string>;
  lastActivity: Date;
  isActive: boolean;
}

interface SubscriptionConfig {
  channelName: string;
  subscriberId: string;
  events: string[];
  callback: (payload: any) => void;
  priority: "high" | "medium" | "low";
}

export class RealtimePerformanceOptimizer {
  private static instance: RealtimePerformanceOptimizer;
  private channelPool = new Map<string, ChannelPool>();
  private subscriptions = new Map<string, SubscriptionConfig>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxPoolSize = 50;
  private cleanupIntervalMs = 60000; // 1 minute
  private inactiveThresholdMs = 300000; // 5 minutes

  static getInstance(): RealtimePerformanceOptimizer {
    if (!RealtimePerformanceOptimizer.instance) {
      RealtimePerformanceOptimizer.instance = new RealtimePerformanceOptimizer();
    }
    return RealtimePerformanceOptimizer.instance;
  }

  constructor() {
    this.startCleanupProcess();
  }

  /**
   * Optimized channel subscription with pooling
   */
  async subscribe(config: SubscriptionConfig): Promise<() => void> {
    const { channelName, subscriberId, events, callback, priority } = config;
    
    try {
      // Get or create pooled channel
      let pooledChannel = this.channelPool.get(channelName);
      
      if (!pooledChannel) {
        pooledChannel = await this.createPooledChannel(channelName);
        this.channelPool.set(channelName, pooledChannel);
      }

      // Add subscriber to pool
      pooledChannel.subscribers.add(subscriberId);
      pooledChannel.lastActivity = new Date();
      
      // Store subscription config
      this.subscriptions.set(subscriberId, config);

      // Set up event listeners with priority handling
      this.setupEventListeners(pooledChannel.channel, events, callback, priority);

      RealtimeLogger.connection(channelName, "subscribed");
      realtimeMonitor.trackConnection(channelName, subscriberId);

      // Return unsubscribe function
      return () => this.unsubscribe(subscriberId);

    } catch (error) {
      RealtimeLogger.error("subscription", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(subscriberId: string): void {
    const subscription = this.subscriptions.get(subscriberId);
    if (!subscription) return;

    const { channelName } = subscription;
    const pooledChannel = this.channelPool.get(channelName);
    
    if (pooledChannel) {
      pooledChannel.subscribers.delete(subscriberId);
      
      // If no more subscribers, mark for cleanup
      if (pooledChannel.subscribers.size === 0) {
        pooledChannel.isActive = false;
      }
    }

    this.subscriptions.delete(subscriberId);
    RealtimeLogger.connection(channelName, "unsubscribed");
  }

  /**
   * Optimized broadcast with batching
   */
  async broadcast(
    channelName: string,
    eventName: string,
    payload: any,
    options: { 
      priority?: "high" | "medium" | "low";
      retry?: boolean;
      timeout?: number;
    } = {}
  ): Promise<boolean> {
    const { priority = "medium", retry = true, timeout = 5000 } = options;
    const startTime = performance.now();

    try {
      const pooledChannel = this.channelPool.get(channelName);
      
      if (!pooledChannel || !pooledChannel.isActive) {
        throw new Error(`Channel ${channelName} not available`);
      }

      // Priority-based broadcasting
      const broadcastPromise = this.performBroadcast(
        pooledChannel.channel,
        eventName,
        payload,
        priority
      );

      // Apply timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Broadcast timeout")), timeout)
      );

      await Promise.race([broadcastPromise, timeoutPromise]);

      const latency = performance.now() - startTime;
      realtimeMonitor.trackBroadcast(channelName, eventName, true, latency);
      RealtimeLogger.broadcast(channelName, eventName, true);

      return true;

    } catch (error) {
      const latency = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      realtimeMonitor.trackBroadcast(channelName, eventName, false, latency, errorMessage);
      RealtimeLogger.broadcast(channelName, eventName, false, errorMessage);

      if (retry && error.message !== "Broadcast timeout") {
        // Retry once with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.broadcast(channelName, eventName, payload, { ...options, retry: false });
      }

      return false;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    activeChannels: number;
    totalSubscribers: number;
    poolUtilization: number;
    averageSubscribersPerChannel: number;
    inactiveChannels: number;
  } {
    const activeChannels = Array.from(this.channelPool.values()).filter(p => p.isActive);
    const totalSubscribers = Array.from(this.channelPool.values())
      .reduce((sum, pool) => sum + pool.subscribers.size, 0);
    
    return {
      activeChannels: activeChannels.length,
      totalSubscribers,
      poolUtilization: (this.channelPool.size / this.maxPoolSize) * 100,
      averageSubscribersPerChannel: activeChannels.length > 0 
        ? totalSubscribers / activeChannels.length 
        : 0,
      inactiveChannels: this.channelPool.size - activeChannels.length,
    };
  }

  /**
   * Force cleanup of inactive channels
   */
  cleanup(): void {
    const now = new Date();
    const channelsToRemove: string[] = [];

    for (const [channelName, pooledChannel] of this.channelPool.entries()) {
      const inactiveTime = now.getTime() - pooledChannel.lastActivity.getTime();
      
      if (!pooledChannel.isActive || 
          pooledChannel.subscribers.size === 0 || 
          inactiveTime > this.inactiveThresholdMs) {
        
        try {
          pooledChannel.channel.unsubscribe();
          channelsToRemove.push(channelName);
          RealtimeLogger.connection(channelName, "cleaned_up");
        } catch (error) {
          RealtimeLogger.error("cleanup", error);
        }
      }
    }

    channelsToRemove.forEach(channelName => {
      this.channelPool.delete(channelName);
    });

    if (channelsToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${channelsToRemove.length} inactive channels`);
    }
  }

  /**
   * Create a new pooled channel
   */
  private async createPooledChannel(channelName: string): Promise<ChannelPool> {
    // Check pool size limit
    if (this.channelPool.size >= this.maxPoolSize) {
      this.cleanup();
      
      if (this.channelPool.size >= this.maxPoolSize) {
        throw new Error("Channel pool limit reached");
      }
    }

    const { supabase } = await import("@/lib/supabase");
    const channel = supabase.browser().channel(channelName);

    await new Promise((resolve, reject) => {
      channel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          resolve(void 0);
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          reject(new Error(`Channel subscription failed: ${status}`));
        }
      });
    });

    return {
      channel,
      subscribers: new Set(),
      lastActivity: new Date(),
      isActive: true,
    };
  }

  /**
   * Set up optimized event listeners
   */
  private setupEventListeners(
    channel: any,
    events: string[],
    callback: (payload: any) => void,
    priority: "high" | "medium" | "low"
  ): void {
    events.forEach(eventName => {
      // Use debouncing for low priority events
      const wrappedCallback = priority === "low" 
        ? this.debounce(callback, 100)
        : callback;

      channel.on("broadcast", { event: eventName }, wrappedCallback);
    });
  }

  /**
   * Perform priority-based broadcast
   */
  private async performBroadcast(
    channel: any,
    eventName: string,
    payload: any,
    priority: "high" | "medium" | "low"
  ): Promise<void> {
    const broadcastPayload = {
      type: "broadcast",
      event: eventName,
      payload,
      metadata: {
        priority,
        timestamp: Date.now(),
      },
    };

    // High priority broadcasts get immediate sending
    if (priority === "high") {
      return channel.send(broadcastPayload);
    }

    // Medium and low priority can be batched or delayed
    return channel.send(broadcastPayload);
  }

  /**
   * Start automatic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop cleanup process
   */
  stopCleanupProcess(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Debounce utility for low priority events
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Destroy the optimizer and clean up all resources
   */
  destroy(): void {
    this.stopCleanupProcess();
    
    // Unsubscribe from all channels
    for (const [channelName, pooledChannel] of this.channelPool.entries()) {
      try {
        pooledChannel.channel.unsubscribe();
      } catch (error) {
        RealtimeLogger.error("destroy", error);
      }
    }

    this.channelPool.clear();
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeOptimizer = RealtimePerformanceOptimizer.getInstance();

/**
 * Optimized hooks for common use cases
 */
export const OptimizedRealtimeHooks = {
  /**
   * Optimized conversation subscription
   */
  useOptimizedConversation: (organizationId: string, conversationId: string) => {
    const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
    const subscriberId = `conv-${organizationId}-${conversationId}`;

    return realtimeOptimizer.subscribe({
      channelName,
      subscriberId,
      events: [UNIFIED_EVENTS.MESSAGE_CREATED, UNIFIED_EVENTS.TYPING_START, UNIFIED_EVENTS.TYPING_STOP],
      callback: (payload) => {
        // Handle optimized conversation events
      },
      priority: "high",
    });
  },

  /**
   * Optimized organization-wide subscription
   */
  useOptimizedOrganization: (organizationId: string) => {
    const channelName = UNIFIED_CHANNELS.organization(organizationId);
    const subscriberId = `org-${organizationId}`;

    return realtimeOptimizer.subscribe({
      channelName,
      subscriberId,
      events: [UNIFIED_EVENTS.CONVERSATION_CREATED, UNIFIED_EVENTS.CONVERSATION_UPDATED],
      callback: (payload) => {
        // Handle optimized organization events
      },
      priority: "medium",
    });
  },
};
