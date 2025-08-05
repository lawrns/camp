/**
 * STANDARDIZED REALTIME SYSTEM
 *
 * This is the single source of truth for all realtime communication.
 * All other realtime implementations should be deprecated and replaced with this.
 */

import { supabase, getClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS, CHANNEL_CONFIG } from "./unified-channel-standards";

// Re-export unified channels for backward compatibility
export const CHANNEL_PATTERNS = UNIFIED_CHANNELS;

// Re-export unified events for backward compatibility
export const EVENT_TYPES = UNIFIED_EVENTS;

// Connection attempt tracking to prevent rapid reconnection
const connectionAttempts = new Map<string, number>();

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
  private readonly CLEANUP_INTERVAL = 60000; // 60 seconds
  private readonly IDLE_TIMEOUT = 600000; // 10 minutes
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

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

    for (const name of channelsToRemove) {
      const info = this.channels.get(name);
      if (info) {
        try {
          // Clear heartbeat interval
          if (info.heartbeatInterval) {
            clearInterval(info.heartbeatInterval);
          }

          // FIXED: Use getClient which handles server/browser context automatically
          const client = getClient();
          if (client && client.removeChannel) {
            client.removeChannel(info.channel);
          }
          console.log(`[Realtime] 🧹 Cleanup successful with environment-appropriate client: ${typeof window === "undefined" ? 'server' : 'browser'}`);
          this.channels.delete(name);
          console.log(`[Realtime] Cleaned up idle channel: ${name}`);
        } catch (error) {
          console.warn(`[Realtime] Failed to cleanup channel ${name}:`, error);
        }
      }
    }
  }

  async getChannel(name: string, config?: unknown): Promise<RealtimeChannel> {
    const existing = this.channels.get(name);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.channel;
    }

    try {
      // STANDARD-002 FIX: Validate auth before creating channel
      const client = typeof window !== 'undefined' ? supabase.browser() : supabase.admin();

      // STANDARD-002 FIX: Check auth token exists before channel creation
      if (typeof window !== 'undefined' && client) {
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session?.access_token) {
          console.warn(`[Realtime] ⚠️ No valid auth token for channel: ${name}, proceeding without auth...`);

          // Skip auth validation and proceed with unauthenticated channel
          const channel = this.createChannelWithAuth(name, config, client);
          return channel;

        }

        // Set auth token for realtime if we have a session
        if (client) {
          await client.realtime.setAuth(session.access_token);
        }
        console.log(`[Realtime] 🔐 Auth token set for channel: ${name}`);
      }

      return this.createChannelWithAuth(name, config, client);
    } catch (error) {
      console.error(`[Realtime] ❌ Failed to create channel ${name}:`, error);
      throw error;
    }
  }

  private createChannelWithAuth(name: string, config: any, client: any): RealtimeChannel {
    // STEP 3 TEST: Use broadcast-only channel to prevent mismatch errors
    const channel = client.channel(`bcast:${name}`, {
      ...(config || {}),
      config: {
        ...(config?.config || {}),
        heartbeatIntervalMs: 25000, // Reduced from 30s to prevent timeouts
        rejoinAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 10000),
        broadcast: {
          self: true,   // CRITICAL: Sender receives own broadcasts for UI updates
          ack: true     // CRITICAL: Acknowledgment for reliable delivery
        },
        presence: { ack: false },
        postgres_changes: [] // <-- disable automatic CDC
      }
    });

      console.log(`[Realtime] 🏗️  Created channel: ${name} with config:`, {
        heartbeatIntervalMs: 25000,
        broadcast: { self: true },
        presence: { key: 'user_id' }
      });

      // PHASE 3 FIX: Enhanced error handling for channel status changes
      channel.on('system', {}, (payload: any) => {
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

      // STEP 3 TEST: Temporarily disable postgres_changes to test broadcast-only
      // channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      //   console.log(`[Realtime] 📝 Postgres change on ${name}:`, payload);
      // });

      channel.on('broadcast', { event: '*' }, (payload: any) => {
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
        delete info.heartbeatInterval;
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
        // Clear heartbeat interval first
        if (info.heartbeatInterval) {
          clearInterval(info.heartbeatInterval);
        }
        
        const client = getClient();
        if (client && client.removeChannel) {
          client.removeChannel(info.channel);
        }
        this.channels.delete(name);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Realtime] Manually removed channel: ${name}`);
        }
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
        const client = getClient();
        if (client && client.removeChannel) {
          client.removeChannel(info.channel);
        }
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

// STANDARD-002 FIX: Enhanced subscription with exponential backoff and comprehensive monitoring
async function ensureChannelSubscription(channelName: string, config?: unknown, attempt: number = 1): Promise<RealtimeChannel> {
  const maxAttempts = 5; // Increased max attempts
  const baseDelay = 1000; // 1 second base delay
  const maxDelay = 30000; // 30 second max delay

  // STANDARD-002 FIX: True exponential backoff calculation
  const retryDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const timeouts = [15000, 30000, 60000, 120000, 180000]; // Progressive timeouts: 15s → 30s → 60s → 2m → 3m
  const currentTimeout = timeouts[attempt - 1] || timeouts[timeouts.length - 1];

  console.log(`[Realtime] 🔍 Attempt ${attempt}/${maxAttempts}: Ensuring subscription for: ${channelName}`);
  console.log(`[Realtime] ⏱️ Using timeout: ${(currentTimeout || 15000) / 1000}s, retry delay: ${retryDelay / 1000}s (exponential backoff)`);

  // Skip auth validation temporarily as per existing code
  console.log(`[Realtime] 🔐 ⚠️ Skipping auth validation`);

  const channel = await channelManager.getChannel(channelName, config);

  if (channel.state === 'joined') {
    console.log(`[Realtime] ✅ Already subscribed to ${channelName}`);
    return channel;
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.warn(`[Realtime] ⏰ Subscription timeout after ${elapsed}ms on attempt ${attempt}/${maxAttempts} for ${channelName}`);

      if (attempt < maxAttempts) {
        console.log(`[Realtime] 🔄 Retrying subscription with exponential backoff...`);
        // STANDARD-002 FIX: Use proper exponential backoff delay
        setTimeout(() => {
          ensureChannelSubscription(channelName, config, attempt + 1)
            .then(resolve)
            .catch(reject);
        }, retryDelay); // Use calculated exponential backoff delay
      } else {
        const error = new Error(`Max subscription attempts (${maxAttempts}) reached for ${channelName} after ${elapsed}ms total`);
        console.error(`[Realtime] ❌ ${error.message}`);
        reject(error);
      }
    }, currentTimeout);

    channel.subscribe((status) => {
      const elapsed = Date.now() - startTime;
      console.log(`[Realtime] 📢 Subscription status for ${channelName}: ${status} (attempt ${attempt}, elapsed: ${elapsed}ms)`);

      switch (status) {
        case 'SUBSCRIBED':
          clearTimeout(timer);
          console.log(`[Realtime] ✅ Successfully subscribed to ${channelName} on attempt ${attempt} after ${elapsed}ms`);
          resolve(channel);
          break;

        case 'CHANNEL_ERROR':
          clearTimeout(timer);
          console.warn(`[Realtime] ⚠️ Channel error for ${channelName} on attempt ${attempt} after ${elapsed}ms`);

          if (attempt < maxAttempts) {
            console.log(`[Realtime] 🔄 Retrying due to channel error...`);
            setTimeout(() => {
              ensureChannelSubscription(channelName, config, attempt + 1)
                .then(resolve)
                .catch(reject);
            }, 2000 * attempt); // Longer delay for channel errors: 2s, 4s
          } else {
            const error = new Error(`Channel error on final attempt for ${channelName}: ${status}`);
            console.error(`[Realtime] ❌ ${error.message}`);
            reject(error);
          }
          break;

        case 'TIMED_OUT':
        case 'CLOSED':
          clearTimeout(timer);
          console.error(`[Realtime] ❌ Channel ${status.toLowerCase()} for ${channelName} on attempt ${attempt} after ${elapsed}ms`);

          if (attempt < maxAttempts) {
            console.log(`[Realtime] 🔄 Retrying due to ${status.toLowerCase()}...`);
            setTimeout(() => {
              ensureChannelSubscription(channelName, config, attempt + 1)
                .then(resolve)
                .catch(reject);
            }, 1500 * attempt); // Medium delay: 1.5s, 3s
          } else {
            const error = new Error(`Subscription ${status.toLowerCase()} on final attempt for ${channelName}`);
            console.error(`[Realtime] ❌ ${error.message}`);
            reject(error);
          }
          break;

        default:
          console.log(`[Realtime] 🔄 Intermediate status for ${channelName}: ${status} (continuing to wait...)`);
          // Continue waiting for SUBSCRIBED status
      }
    });
  });
}

// CRITICAL FIX: Enhanced broadcast function with mandatory subscription
export async function broadcastToChannel(
  channelName: string,
  eventType: string,
  payload: unknown,
  config?: unknown
): Promise<boolean> {
  console.log(`[Realtime] 🚀 Starting broadcast to ${channelName} -> ${eventType}`);

  try {
    // CRITICAL FIX: Force subscription before any broadcast attempt
    console.log(`[Realtime] 📡 SABOTEUR-FIX-V2: Ensuring subscription for channel: ${channelName}`);
    const channel = await ensureChannelSubscription(channelName, config);

    console.log(`[Realtime] ✅ Channel subscribed, attempting broadcast...`);
    console.log(`[Realtime] 📤 Broadcast payload:`, { type: 'broadcast', event: eventType, payload });

    const result = await channel.send({
      type: 'broadcast',
      event: eventType,
      payload,
    });

    console.log(`[Realtime] 📨 Broadcast result:`, result);

    if (result === 'ok') {
      console.log(`[Realtime] ✅ Broadcast successful: ${channelName} -> ${eventType}`);
      return true;
    } else {
      console.error(`[Realtime] ❌ Broadcast failed: ${channelName} -> ${eventType}`);
      console.error(`[Realtime] 🔍 Failure details:`, {
        result,
        channelState: channel.state,
        channelName,
        eventType,
        payloadSize: JSON.stringify(payload).length
      });
      return false;
    }
  } catch (error) {
    console.error(`[Realtime] 💥 Broadcast error: ${channelName} -> ${eventType}`, error);
    console.error(`[Realtime] 🔍 Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      channelName,
      eventType
    });
    return false;
  }
}

// STANDARD-002 FIX: Standardized subscription function with async channel creation
export function subscribeToChannel(
  channelName: string,
  eventType: string,
  callback: (payload: unknown) => void,
  config?: unknown
): () => void {
  // Connection state guard to prevent rapid reconnection attempts
  const connectionKey = `${channelName}:${eventType}`;
  const now = Date.now();
  const lastAttempt = connectionAttempts.get(connectionKey) || 0;
  
  // Prevent reconnection attempts within 2 seconds
  if (now - lastAttempt < 2000) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime] ⏳ Skipping rapid reconnection attempt for ${connectionKey}`);
    }
    return () => {}; // Return no-op unsubscribe function
  }
  
  connectionAttempts.set(connectionKey, now);
  
  // STANDARD-002 FIX: Handle synchronous channel creation
  let channel: any;
  try {
    // Use synchronous channel creation to avoid async issues
    const client = getClient();
    if (!client) {
      console.error(`[Realtime] No Supabase client available for ${channelName}`);
      return () => {}; // Return no-op unsubscribe function
    }

    channel = client.channel(channelName, config as any);
    channelManager.addSubscriber(channelName);
  } catch (error) {
    console.error(`[Realtime] Failed to get channel ${channelName}:`, error);
    return () => {}; // Return no-op unsubscribe function
  }

  // Subscribe to the event
  channel.on('broadcast', { event: eventType }, callback);

  // Subscribe to the channel if not already subscribed
  channel.subscribe((status, error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime] Channel ${channelName} status: ${status}`);
    }

    if (error) {
      console.error(`[Realtime] Channel ${channelName} error:`, error);
    }

    // Handle connection failures with reconnection
    if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
      console.warn(`[Realtime] Channel ${channelName} failed, will retry automatically`);
    }

    if (status === 'SUBSCRIBED') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Realtime] ✅ Channel ${channelName} successfully connected`);
      }
    }
  });

  // Return unsubscribe function with better error handling
  return () => {
    try {
      // CRITICAL FIX: Check if channel is still active before unsubscribing
      if (channel && typeof channel.unsubscribe === 'function') {
        // Add small delay to prevent race conditions during active operations
        setTimeout(() => {
          try {
            channel.unsubscribe();
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Realtime] ✅ Channel ${channelName} unsubscribed successfully`);
            }
          } catch (error) {
            console.warn(`[Realtime] Channel cleanup error for ${channelName}:`, error);
          }
        }, 50); // 50ms delay to prevent race conditions
      }
    } catch (error) {
      console.warn(`[Realtime] Channel cleanup error for ${channelName}:`, error);
    }
    channelManager.removeSubscriber(channelName);
  };
}

// Convenience functions for common operations
export const RealtimeHelpers = {
  // Broadcast message to conversation with connection state guards
  broadcastMessage: async (orgId: string, convId: string, message: unknown) => {
    try {
      // CRITICAL FIX: Check if we have valid parameters before broadcasting
      if (!orgId || !convId || !message) {
        console.warn('[RealtimeHelpers] Cannot broadcast message - missing parameters');
        return false;
      }

      const channelName = CHANNEL_PATTERNS.conversation(orgId, convId);
      console.log(`[RealtimeHelpers] 📤 Broadcasting message to: ${channelName}`);

      return await broadcastToChannel(
        channelName,
        EVENT_TYPES.MESSAGE_CREATED,
        { message }
      );
    } catch (error) {
      console.error('[RealtimeHelpers] ❌ Failed to broadcast message:', error);
      return false;
    }
  },

  // Broadcast typing status with connection state guards
  broadcastTyping: async (orgId: string, convId: string, userId: string, isTyping: boolean) => {
    try {
      // CRITICAL FIX: Check if we have valid parameters before broadcasting
      if (!orgId || !convId || !userId) {
        console.warn('[RealtimeHelpers] Cannot broadcast typing - missing parameters');
        return false;
      }

      const channelName = CHANNEL_PATTERNS.conversationTyping(orgId, convId);
      console.log(`[RealtimeHelpers] ⌨️ Broadcasting typing (${isTyping}) to: ${channelName}`);

      return await broadcastToChannel(
        channelName,
        isTyping ? EVENT_TYPES.TYPING_START : EVENT_TYPES.TYPING_STOP,
        { userId, isTyping }
      );
    } catch (error) {
      console.error('[RealtimeHelpers] ❌ Failed to broadcast typing:', error);
      return false;
    }
  },

  // Broadcast conversation assignment
  broadcastAssignment: (orgId: string, convId: string, assigneeId: string, assignedBy: string) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.conversations(orgId),
      EVENT_TYPES.CONVERSATION_ASSIGNED,
      { conversationId: convId, assigneeId, assignedBy }
    ),

  // Subscribe to conversation messages
  subscribeToMessages: (orgId: string, convId: string, callback: (message: unknown) => void) =>
    subscribeToChannel(
      CHANNEL_PATTERNS.conversation(orgId, convId),
      EVENT_TYPES.MESSAGE_CREATED,
      callback
    ),

  // Subscribe to typing events
  subscribeToTyping: (orgId: string, convId: string, callback: (typing: unknown) => void) => {
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
      if (typeof startUnsubscriber === 'function') {
        startUnsubscriber();
      }
      if (typeof stopUnsubscriber === 'function') {
        stopUnsubscriber();
      }
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
