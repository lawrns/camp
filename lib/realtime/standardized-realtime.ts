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
      // PHASE 1 FIX: Enhanced client with auth validation
      const client = typeof window !== 'undefined' ? supabase.browser() : supabase.admin();

      // PHASE 1 FIX: Validate auth before creating channel
      if (typeof window !== 'undefined') {
        console.log(`[Realtime] 🔐 Validating auth for channel: ${name}`);
        // Note: Auth validation happens in getBrowserClient()
      }

      const channel = client.channel(name, {
        ...config,
        // PHASE 1 FIX: Enhanced config for proper bindings
        config: {
          ...config?.config,
          heartbeatIntervalMs: 25000, // Reduced from 30s to prevent timeouts
          rejoinAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 10000),
          // PHASE 1 FIX: Ensure proper postgres_changes bindings
          broadcast: { self: true },
          presence: { key: 'user_id' },
        }
      });

      console.log(`[Realtime] 🏗️  Created channel: ${name} with config:`, {
        heartbeatIntervalMs: 25000,
        broadcast: { self: true },
        presence: { key: 'user_id' }
      });

      // PHASE 3 FIX: Enhanced error handling for channel status changes
      channel.on('system', {}, (payload) => {
        console.log(`[Realtime] 📊 Channel ${name} system event:`, payload);

        if (payload.status === 'error' || payload.status === 'closed') {
          console.error(`[Realtime] ❌ Channel ${name} status: ${payload.status}`);
          console.error(`[Realtime] 🔍 Error details:`, payload);

          // Auto-cleanup failed channels
          if (payload.status === 'closed') {
            console.log(`[Realtime] 🧹 Scheduling cleanup for closed channel: ${name}`);
            setTimeout(() => {
              this.removeChannel(name);
            }, 5000);
          }
        } else {
          console.log(`[Realtime] ✅ Channel ${name} status: ${payload.status}`);
        }
      });

      // PHASE 3 FIX: Add comprehensive error listeners
      channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log(`[Realtime] 📝 Postgres change on ${name}:`, payload);
      });

      channel.on('broadcast', { event: '*' }, (payload) => {
        console.log(`[Realtime] 📡 Broadcast received on ${name}:`, payload);
      });

      // PHASE 3 FIX: Add connection error handling using correct Supabase API
      // Note: Supabase channels use 'system' events for errors and closures
      // The onError/onClose methods don't exist in the current API

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

// PHASE 1 FIX: Enhanced channel subscription with comprehensive debugging
async function ensureChannelSubscription(channelName: string, config?: any): Promise<RealtimeChannel> {
  console.log(`[Realtime] 🔍 ensureChannelSubscription called for: ${channelName}`);

  const channel = channelManager.getChannel(channelName, config);
  console.log(`[Realtime] 📊 Channel state before subscription: ${channel.state}`);

  // Check if channel is already subscribed
  if (channel.state === 'joined') {
    console.log(`[Realtime] ✅ Channel ${channelName} already subscribed`);
    return channel;
  }

  console.log(`[Realtime] 🔄 Starting subscription process for: ${channelName}`);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error(`[Realtime] ⏰ Subscription timeout for ${channelName} after 5 seconds`);
      reject(new Error(`Channel subscription timeout for ${channelName} after 5 seconds`));
    }, 5000);

    // Subscribe and wait for confirmation
    console.log(`[Realtime] 📡 Calling channel.subscribe() for: ${channelName}`);
    channel.subscribe((status) => {
      console.log(`[Realtime] 📢 Subscription status update for ${channelName}: ${status}`);

      switch (status) {
        case 'SUBSCRIBED':
          clearTimeout(timeout);
          console.log(`[Realtime] ✅ Channel ${channelName} successfully subscribed`);
          resolve(channel);
          break;
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          clearTimeout(timeout);
          console.error(`[Realtime] ❌ Channel ${channelName} subscription failed: ${status}`);
          reject(new Error(`Channel subscription failed: ${status}`));
          break;
        default:
          console.log(`[Realtime] 🔄 Channel ${channelName} intermediate status: ${status}`);
          // Continue waiting for SUBSCRIBED status
      }
    });
  });
}

// PHASE 1 FIX: Enhanced broadcast function with mandatory subscription
export async function broadcastToChannel(
  channelName: string,
  eventType: string,
  payload: any,
  config?: any
): Promise<boolean> {
  console.log(`[Realtime] 🚀 Starting broadcast to ${channelName} -> ${eventType}`);

  try {
    // CRITICAL FIX: Force subscription before any broadcast attempt
    console.log(`[Realtime] 📡 Ensuring subscription for channel: ${channelName}`);
    const channel = await ensureChannelSubscription(channelName, config);

    console.log(`[Realtime] ✅ Channel subscribed, attempting broadcast...`);
    const result = await channel.send({
      type: 'broadcast',
      event: eventType,
      payload,
    });

    if (result === 'ok') {
      console.log(`[Realtime] ✅ Broadcast successful: ${channelName} -> ${eventType}`);
      return true;
    } else {
      console.error(`[Realtime] ❌ Broadcast failed: ${channelName} -> ${eventType}`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Realtime] 💥 Broadcast error: ${channelName} -> ${eventType}`, error);
    console.error(`[Realtime] 🔍 Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
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
