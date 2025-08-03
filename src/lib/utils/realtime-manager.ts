/**
 * Realtime Connection Manager
 *
 * Centralized management of Supabase Realtime connections to prevent
 * channel conflicts and connection issues.
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/browser";

interface ChannelConfig {
  name: string;
  channel: RealtimeChannel;
  createdAt: number;
  lastActivity: number;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private channels: Map<string, ChannelConfig> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start cleanup interval to remove stale channels
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleChannels();
    }, 30000); // Every 30 seconds
  }

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  /**
   * Create or get existing channel with proper naming and configuration
   */
  getChannel(
    type: "conversations" | "messages" | "widget",
    organizationId: string,
    conversationId?: string
  ): RealtimeChannel {
    // Generate consistent channel name
    const channelName = this.generateChannelName(type, organizationId, conversationId);

    // Check if channel already exists
    const existing = this.channels.get(channelName);
    if (existing) {
      existing.lastActivity = Date.now();

      return existing.channel;
    }

    // Create new channel with proper configuration
    const client = supabase.browser();
    const channel = client.channel(channelName, {
      config: {
        presence: {
          key: `${type}_${Date.now()}`,
        },
        broadcast: {
          self: true,
          ack: false, // Disable acknowledgments for better performance
        },
      },
    });

    // Store channel reference
    this.channels.set(channelName, {
      name: channelName,
      channel,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    return channel;
  }

  /**
   * Remove channel and clean up resources
   */
  removeChannel(channelName: string): void {
    const channelConfig = this.channels.get(channelName);
    if (channelConfig) {
      try {
        channelConfig.channel.unsubscribe();
        supabase.browser().removeChannel(channelConfig.channel);
        this.channels.delete(channelName);

      } catch (error) {

      }
    }
  }

  /**
   * Generate consistent channel names
   */
  private generateChannelName(
    type: "conversations" | "messages" | "widget",
    organizationId: string,
    conversationId?: string
  ): string {
    switch (type) {
      case "conversations":
        return `bcast:conversations:${organizationId}`;
      case "messages":
        return `cf-org-conv-bcast-${organizationId}-${conversationId}`;
      case "widget":
        return `cf-org-widget-bcast-${organizationId}-${conversationId}`;
      default:
        return `cf-org-${type}-bcast-${organizationId}`;
    }
  }

  /**
   * Clean up stale channels (older than 5 minutes with no activity)
   */
  private cleanupStaleChannels(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [name, config] of this.channels.entries()) {
      if (now - config.lastActivity > staleThreshold) {

        this.removeChannel(name);
      }
    }
  }

  /**
   * Get channel statistics for debugging
   */
  getStats(): {
    totalChannels: number;
    channelsByType: Record<string, number>;
    oldestChannel: string | null;
    newestChannel: string | null;
  } {
    const stats = {
      totalChannels: this.channels.size,
      channelsByType: {} as Record<string, number>,
      oldestChannel: null as string | null,
      newestChannel: null as string | null,
    };

    let oldest = Infinity;
    let newest = 0;

    for (const [name, config] of this.channels.entries()) {
      // Count by type
      const type = name.split(":")[2] || "unknown";
      stats.channelsByType[type] = (stats.channelsByType[type] || 0) + 1;

      // Track oldest and newest
      if (config.createdAt < oldest) {
        oldest = config.createdAt;
        stats.oldestChannel = name;
      }
      if (config.createdAt > newest) {
        newest = config.createdAt;
        stats.newestChannel = name;
      }
    }

    return stats;
  }

  /**
   * Cleanup all channels (for component unmount)
   */
  cleanup(): void {

    for (const [name] of this.channels.entries()) {
      this.removeChannel(name);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance();

/**
 * Hook for easier channel management in React components
 */
export function useRealtimeChannel(
  type: "conversations" | "messages" | "widget",
  organizationId: string,
  conversationId?: string
) {
  const channelName = `cf-org-${type}-bcast-${organizationId}${conversationId ? `-${conversationId}` : ""}`;

  const getChannel = () => {
    return realtimeManager.getChannel(type, organizationId, conversationId);
  };

  const cleanup = () => {
    realtimeManager.removeChannel(channelName);
  };

  return { getChannel, cleanup, channelName };
}

/**
 * Enhanced subscription helper with better error handling
 */
export function subscribeWithRetry(
  channel: RealtimeChannel,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<boolean> {
  return new Promise((resolve) => {
    let retries = 0;

    const attemptSubscription = () => {
      channel.subscribe((status, error) => {

        if (status === "SUBSCRIBED") {

          resolve(true);
        } else if (status === "CHANNEL_ERROR") {

          if (retries < maxRetries) {
            retries++;
            setTimeout(attemptSubscription, retryDelay * retries);
          } else {

            resolve(false);
          }
        } else if (status === "CLOSED") {

          resolve(false);
        }
      });
    };

    attemptSubscription();
  });
}
