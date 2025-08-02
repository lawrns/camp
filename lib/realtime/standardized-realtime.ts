/**
 * STANDARDIZED REALTIME SYSTEM
 *
 * This is the single source of truth for all realtime communication.
 * All other realtime implementations should be deprecated and replaced with this.
 */

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "./unified-channel-standards";

// Re-export unified channels for backward compatibility
export const CHANNEL_PATTERNS = UNIFIED_CHANNELS;

// Re-export unified events for backward compatibility
export const EVENT_TYPES = UNIFIED_EVENTS;

// Enhanced Channel manager with heartbeat and reconnection
class ChannelManager {
  private channels = new Map<string, {
    channel: RealtimeChannel;
    lastUsed: number;
    subscribers: number;
    heartbeatInterval?: NodeJS.Timeout;
    reconnectAttempts: number;
  }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly IDLE_TIMEOUT = 300000; // 5 minutes
  private readonly HEARTBEAT_INTERVAL = 25000; // 25 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup() {
    const now = Date.now();
    const channelsToRemove: string[] = [];

    this.channels.forEach((info, name) => {
      if (now - info.lastUsed > this.IDLE_TIMEOUT && info.subscribers === 0) {
        channelsToRemove.push(name);
      }
    });

    channelsToRemove.forEach((name) => {
      const info = this.channels.get(name);
      if (info) {
        try {
          // Clear heartbeat interval
          if (info.heartbeatInterval) {
            clearInterval(info.heartbeatInterval);
          }

          const client = supabase.browser();
          client.removeChannel(info.channel);
          this.channels.delete(name);
          console.log(`[Realtime] Cleaned up idle channel: ${name}`);
        } catch (error) {
          console.warn(`[Realtime] Failed to cleanup channel ${name}:`, error);
        }
      }
    });
  }

  getChannel(name: string, config?: any): RealtimeChannel {
    const existing = this.channels.get(name);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.channel;
    }

    try {
      // Use appropriate client based on environment
      const client = typeof window !== 'undefined' ? supabase.browser() : supabase.admin();
      const channel = client.channel(name, {
        ...config,
        // Enhanced error handling for WebSocket connections
        config: {
          ...config?.config,
          heartbeatIntervalMs: 30000,
          rejoinAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 10000),
        }
      });

      // Add error handling for channel status changes
      channel.on('system', {}, (payload) => {
        if (payload.status === 'error' || payload.status === 'closed') {
          console.warn(`[Realtime] Channel ${name} status: ${payload.status}`);

          // Auto-cleanup failed channels
          if (payload.status === 'closed') {
            setTimeout(() => {
              this.removeChannel(name);
            }, 5000);
          }
        } else {
          console.log(`[Realtime] Channel ${name} status: ${payload.status}`);
        }
      });

      this.channels.set(name, {
        channel,
        lastUsed: Date.now(),
        subscribers: 0,
        reconnectAttempts: 0,
      });

      console.log(`[Realtime] Created new channel: ${name}`);
      return channel;
    } catch (error) {
      console.error(`[Realtime] Failed to create channel ${name}:`, error);
      throw error;
    }
  }

  addSubscriber(name: string) {
    const info = this.channels.get(name);
    if (info) {
      info.subscribers++;
      // Setup heartbeat for active channels
      this.setupHeartbeat(name);
    }
  }

  removeSubscriber(name: string) {
    const info = this.channels.get(name);
    if (info) {
      info.subscribers = Math.max(0, info.subscribers - 1);
      // Clear heartbeat if no subscribers
      if (info.subscribers === 0 && info.heartbeatInterval) {
        clearInterval(info.heartbeatInterval);
        info.heartbeatInterval = undefined;
      }
    }
  }

  private setupHeartbeat(name: string) {
    const info = this.channels.get(name);
    if (!info || info.heartbeatInterval) return;

    info.heartbeatInterval = setInterval(async () => {
      try {
        // Send a heartbeat to keep the connection alive
        await info.channel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: new Date().toISOString() }
        });
        console.log(`[Realtime] Heartbeat sent for channel: ${name}`);
      } catch (error) {
        console.warn(`[Realtime] Heartbeat failed for channel ${name}:`, error);
        // Attempt reconnection if heartbeat fails
        this.attemptReconnection(name);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private async attemptReconnection(name: string) {
    const info = this.channels.get(name);
    if (!info) return;

    if (info.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error(`[Realtime] Max reconnection attempts reached for channel: ${name}`);
      return;
    }

    info.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, info.reconnectAttempts), 10000);

    console.log(`[Realtime] Attempting reconnection ${info.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} for channel: ${name} (delay: ${delay}ms)`);

    setTimeout(async () => {
      try {
        await info.channel.subscribe();
        info.reconnectAttempts = 0; // Reset on successful reconnection
        console.log(`[Realtime] Successfully reconnected channel: ${name}`);
      } catch (error) {
        console.error(`[Realtime] Reconnection failed for channel ${name}:`, error);
      }
    }, delay);
  }

  removeChannel(name: string) {
    const info = this.channels.get(name);
    if (info) {
      try {
        const client = supabase.browser();
        client.removeChannel(info.channel);
        this.channels.delete(name);
        console.log(`[Realtime] Manually removed channel: ${name}`);
      } catch (error) {
        console.warn(`[Realtime] Failed to remove channel ${name}:`, error);
      }
    }
  }

  getStats() {
    return {
      total: this.channels.size,
      active: Array.from(this.channels.values()).filter(info => info.subscribers > 0).length,
      idle: Array.from(this.channels.values()).filter(info => info.subscribers === 0).length,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Remove all channels
    this.channels.forEach((info, name) => {
      try {
        const client = supabase.browser();
        client.removeChannel(info.channel);
      } catch (error) {
        console.warn(`[Realtime] Failed to cleanup channel ${name} during destroy:`, error);
      }
    });

    this.channels.clear();
    console.log('[Realtime] Channel manager destroyed');
  }
}

// Singleton channel manager
export const channelManager = new ChannelManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    channelManager.destroy();
  });
}

// Helper function to ensure channel subscription before operations
async function ensureChannelSubscription(channelName: string, config?: any): Promise<RealtimeChannel> {
  const channel = channelManager.getChannel(channelName, config);

  // Check if channel is already subscribed
  if (channel.state === 'joined') {
    return channel;
  }

  console.log(`[Realtime] Ensuring subscription for channel: ${channelName}`);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Channel subscription timeout for ${channelName} after 5 seconds`));
    }, 5000);

    // Subscribe and wait for confirmation
    channel.subscribe((status) => {
      clearTimeout(timeout);

      switch (status) {
        case 'SUBSCRIBED':
          console.log(`[Realtime] ✅ Channel ${channelName} successfully subscribed`);
          resolve(channel);
          break;
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          console.error(`[Realtime] ❌ Channel ${channelName} subscription failed: ${status}`);
          reject(new Error(`Channel subscription failed: ${status}`));
          break;
        default:
          console.log(`[Realtime] Channel ${channelName} status: ${status}`);
          // Continue waiting for SUBSCRIBED status
      }
    });
  });
}

// Standardized broadcast function with proper subscription handling
export async function broadcastToChannel(
  channelName: string,
  eventType: string,
  payload: any,
  config?: any
): Promise<boolean> {
  try {
    // PHASE 1 FIX: Ensure channel is properly subscribed before broadcasting
    const channel = await ensureChannelSubscription(channelName, config);

    const result = await channel.send({
      type: 'broadcast',
      event: eventType,
      payload,
    });

    if (result === 'ok') {
      console.log(`[Realtime] ✅ Broadcast successful: ${channelName} -> ${eventType}`);
      return true;
    } else {
      console.warn(`[Realtime] ❌ Broadcast failed: ${channelName} -> ${eventType}`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Realtime] 💥 Broadcast error: ${channelName} -> ${eventType}`, error);
    return false;
  }
}

// Standardized subscription function
export function subscribeToChannel(
  channelName: string,
  eventType: string,
  callback: (payload: any) => void,
  config?: any
): () => void {
  const channel = channelManager.getChannel(channelName, config);
  channelManager.addSubscriber(channelName);

  // Subscribe to the event
  channel.on('broadcast', { event: eventType }, callback);

  // Subscribe to the channel if not already subscribed
  channel.subscribe((status) => {
    console.log(`[Realtime] Channel ${channelName} status: ${status}`);
  });

  // Return unsubscribe function
  return () => {
    try {
      // For Supabase RealtimeChannel, use unsubscribe() method
      channel.unsubscribe();
    } catch (error) {
      console.warn(`[Realtime] Channel cleanup error for ${channelName}:`, error);
    }
    channelManager.removeSubscriber(channelName);
  };
}

// Convenience functions for common operations
export const RealtimeHelpers = {
  // Broadcast message to conversation
  broadcastMessage: (orgId: string, convId: string, message: any) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.conversation(orgId, convId),
      EVENT_TYPES.MESSAGE_CREATED,
      { message }
    ),

  // Broadcast typing status
  broadcastTyping: (orgId: string, convId: string, userId: string, isTyping: boolean) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.conversationTyping(orgId, convId),
      isTyping ? EVENT_TYPES.TYPING_START : EVENT_TYPES.TYPING_STOP,
      { userId, isTyping }
    ),

  // Broadcast conversation assignment
  broadcastAssignment: (orgId: string, convId: string, assigneeId: string, assignedBy: string) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.conversations(orgId),
      EVENT_TYPES.CONVERSATION_ASSIGNED,
      { conversationId: convId, assigneeId, assignedBy }
    ),

  // Subscribe to conversation messages
  subscribeToMessages: (orgId: string, convId: string, callback: (message: any) => void) =>
    subscribeToChannel(
      CHANNEL_PATTERNS.conversation(orgId, convId),
      EVENT_TYPES.MESSAGE_CREATED,
      callback
    ),

  // Subscribe to typing events
  subscribeToTyping: (orgId: string, convId: string, callback: (typing: any) => void) => {
    const startUnsubscriber = subscribeToChannel(
      CHANNEL_PATTERNS.conversationTyping(orgId, convId),
      EVENT_TYPES.TYPING_START,
      callback
    );
    const stopUnsubscriber = subscribeToChannel(
      CHANNEL_PATTERNS.conversationTyping(orgId, convId),
      EVENT_TYPES.TYPING_STOP,
      callback
    );

    return () => {
      startUnsubscriber();
      stopUnsubscriber();
    };
  },
};

export default {
  CHANNEL_PATTERNS,
  EVENT_TYPES,
  channelManager,
  broadcastToChannel,
  subscribeToChannel,
  RealtimeHelpers,
};
