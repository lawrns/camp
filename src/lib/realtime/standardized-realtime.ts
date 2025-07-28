/**
 * STANDARDIZED REALTIME SYSTEM
 * 
 * This is the single source of truth for all realtime communication.
 * All other realtime implementations should be deprecated and replaced with this.
 */

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Standardized channel naming convention
export const CHANNEL_PATTERNS = {
  // Organization-wide channels
  ORGANIZATION: (orgId: string) => `org:${orgId}`,
  ORGANIZATION_CONVERSATIONS: (orgId: string) => `org:${orgId}:conversations`,
  ORGANIZATION_MESSAGES: (orgId: string) => `org:${orgId}:messages`,

  // Conversation-specific channels
  CONVERSATION: (orgId: string, convId: string) => `org:${orgId}:conversation:${convId}`,
  CONVERSATION_MESSAGES: (orgId: string, convId: string) => `org:${orgId}:conversation:${convId}:messages`,
  CONVERSATION_TYPING: (orgId: string, convId: string) => `org:${orgId}:conversation:${convId}:typing`,

  // User-specific channels
  USER_PRESENCE: (orgId: string, userId: string) => `org:${orgId}:user:${userId}:presence`,
  USER_NOTIFICATIONS: (orgId: string, userId: string) => `org:${orgId}:user:${userId}:notifications`,

  // Widget channels (for customer-facing widget)
  WIDGET_CONVERSATION: (orgId: string, convId: string) => `org:${orgId}:widget:${convId}`,
} as const;

// Event types for standardized communication
export const EVENT_TYPES = {
  // Message events
  MESSAGE_CREATED: 'message_created',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',

  // Conversation events
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_UPDATED: 'conversation_updated',
  CONVERSATION_ASSIGNED: 'conversation_assigned',
  CONVERSATION_STATUS_CHANGED: 'conversation_status_changed',

  // Typing events
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Presence events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_AWAY: 'user_away',

  // Assignment events
  AGENT_ASSIGNED: 'agent_assigned',
  AI_HANDOVER: 'ai_handover',

  // System events
  SYSTEM_NOTIFICATION: 'system_notification',
  ERROR: 'error',
} as const;

// Channel manager to prevent memory leaks
class ChannelManager {
  private channels = new Map<string, { channel: RealtimeChannel; lastUsed: number; subscribers: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly IDLE_TIMEOUT = 300000; // 5 minutes

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

    const client = supabase.browser();
    const channel = client.channel(name, config);

    this.channels.set(name, {
      channel,
      lastUsed: Date.now(),
      subscribers: 0,
    });

    console.log(`[Realtime] Created new channel: ${name}`);
    return channel;
  }

  addSubscriber(name: string) {
    const info = this.channels.get(name);
    if (info) {
      info.subscribers++;
    }
  }

  removeSubscriber(name: string) {
    const info = this.channels.get(name);
    if (info) {
      info.subscribers = Math.max(0, info.subscribers - 1);
    }
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

// Standardized broadcast function
export async function broadcastToChannel(
  channelName: string,
  eventType: string,
  payload: any,
  config?: any
): Promise<boolean> {
  try {
    const channel = channelManager.getChannel(channelName, config);

    const result = await channel.send({
      type: 'broadcast',
      event: eventType,
      payload,
    });

    if (result === 'ok') {
      console.log(`[Realtime] Broadcast successful: ${channelName} -> ${eventType}`);
      return true;
    } else {
      console.warn(`[Realtime] Broadcast failed: ${channelName} -> ${eventType}`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Realtime] Broadcast error: ${channelName} -> ${eventType}`, error);
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
      CHANNEL_PATTERNS.CONVERSATION(orgId, convId),
      EVENT_TYPES.MESSAGE_CREATED,
      { message }
    ),

  // Broadcast typing indicator
  broadcastTyping: (orgId: string, convId: string, userId: string, isTyping: boolean) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.CONVERSATION_TYPING(orgId, convId),
      isTyping ? EVENT_TYPES.TYPING_START : EVENT_TYPES.TYPING_STOP,
      { userId, isTyping }
    ),

  // Broadcast conversation assignment
  broadcastAssignment: (orgId: string, convId: string, assigneeId: string, assignedBy: string) =>
    broadcastToChannel(
      CHANNEL_PATTERNS.ORGANIZATION_CONVERSATIONS(orgId),
      EVENT_TYPES.CONVERSATION_ASSIGNED,
      { conversationId: convId, assigneeId, assignedBy }
    ),

  // Subscribe to conversation messages
  subscribeToMessages: (orgId: string, convId: string, callback: (message: any) => void) =>
    subscribeToChannel(
      CHANNEL_PATTERNS.CONVERSATION(orgId, convId),
      EVENT_TYPES.MESSAGE_CREATED,
      callback
    ),

  // Subscribe to typing indicators
  subscribeToTyping: (orgId: string, convId: string, callback: (typing: any) => void) => {
    const unsubscribeStart = subscribeToChannel(
      CHANNEL_PATTERNS.CONVERSATION_TYPING(orgId, convId),
      EVENT_TYPES.TYPING_START,
      callback
    );
    const unsubscribeStop = subscribeToChannel(
      CHANNEL_PATTERNS.CONVERSATION_TYPING(orgId, convId),
      EVENT_TYPES.TYPING_STOP,
      callback
    );

    return () => {
      unsubscribeStart();
      unsubscribeStop();
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
