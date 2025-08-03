/**
 * Channel Manager
 * Manages real-time channels and subscriptions for the application
 */

import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export interface ChannelSubscription {
  channelName: string;
  eventType: string;
  callback: (payload: unknown) => void;
  filter?: Record<string, unknown>;
}

export interface ChannelConfig {
  organizationId: string;
  conversationId?: string;
  userId?: string;
  enablePresence?: boolean;
  enableTyping?: boolean;
}

export interface TypingEvent {
  userId: string;
  userName?: string;
  userType: "agent" | "visitor" | "ai";
  isTyping: boolean;
  timestamp: string;
}

export interface PresenceEvent {
  userId: string;
  userName?: string;
  userType: "agent" | "visitor";
  status: "online" | "offline" | "away" | "busy";
  lastSeen?: string;
}

export interface MessageEvent {
  messageId: string;
  conversationId: string;
  content: string;
  senderType: "agent" | "visitor" | "ai";
  senderId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface PostgresChangesPayload {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  schema: string;
  table: string;
}

interface RealtimePayload {
  [key: string]: unknown;
}

export class ChannelManager {
  private channels = new Map<string, RealtimeChannel>();
  private subscriptions = new Map<string, ChannelSubscription[]>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private supabaseClient?: SupabaseClient) {}

  /**
   * Create or get a channel for a conversation
   */
  getConversationChannel(config: ChannelConfig): RealtimeChannel | null {
    if (!this.supabaseClient) {
      // Warn about missing client
      return null;
    }

    const channelName = this.getChannelName(config);

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    // STEP 1 FIX: Use broadcast-only channel to prevent mismatch errors
    const channel = this.supabaseClient.channel(
      `bcast:${config.organizationId}:${config.conversationId}`,
      {
        config: {
          broadcast: { ack: false },
          presence: { ack: false },
          postgres_changes: [] // <-- disable automatic CDC
        }
      }
    );

    if (config.enablePresence) {
      channel.on("presence", { event: "sync" }, () => {
        this.handlePresenceSync(channel, config);
      });

      channel.on("presence", { event: "join" }, (payload: RealtimePayload) => {
        this.handlePresenceJoin(payload, config);
      });

      channel.on("presence", { event: "leave" }, (payload: RealtimePayload) => {
        this.handlePresenceLeave(payload, config);
      });
    }

    if (config.enableTyping) {
      channel.on("broadcast", { event: "typing" }, (payload: RealtimePayload) => {
        this.handleTypingEvent(payload, config);
      });
    }

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to specific events on a channel
   */
  subscribe(config: ChannelConfig, subscription: Omit<ChannelSubscription, "channelName">): () => void {
    const channelName = this.getChannelName(config);
    const channel = this.getConversationChannel(config);

    if (!channel) {
      return () => {}; // Return empty unsubscribe function
    }

    const fullSubscription: ChannelSubscription = {
      ...subscription,
      channelName,
    };

    const existing = this.subscriptions.get(channelName) || [];
    existing.push(fullSubscription);
    this.subscriptions.set(channelName, existing);

    // Subscribe to the channel if not already subscribed
    void channel.subscribe();

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(channelName) || [];
      const filtered = subs.filter((s) => s !== fullSubscription);

      if (filtered.length === 0) {
        this.subscriptions.delete(channelName);
        this.unsubscribeChannel(channelName);
      } else {
        this.subscriptions.set(channelName, filtered);
      }
    };
  }

  /**
   * Send typing indicator
   */
  sendTyping(config: ChannelConfig, isTyping: boolean): void {
    const channel = this.getConversationChannel(config);
    if (!channel || !config.userId) return;

    const typingEvent: TypingEvent = {
      userId: config.userId,
      userType: "agent", // Default, should be passed in config
      isTyping,
      timestamp: new Date().toISOString(),
    };

    void channel.send({
      type: "broadcast",
      event: "typing",
      payload: typingEvent,
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeoutKey = `${config.organizationId}-${config.conversationId}-${config.userId}`;

      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.sendTyping(config, false);
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  /**
   * Update presence status
   */
  updatePresence(config: ChannelConfig, status: PresenceEvent["status"]): void {
    const channel = this.getConversationChannel(config);
    if (!channel || !config.userId) return;

    const presenceEvent: PresenceEvent = {
      userId: config.userId,
      userType: "agent", // Default, should be passed in config
      status,
      lastSeen: new Date().toISOString(),
    };

    void channel.track(presenceEvent);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    // Find and remove subscription by ID
    // This is a placeholder - proper implementation needed
    for (const [channelName, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((sub) => !sub.channelName.includes(subscriptionId));
      if (filtered.length !== subs.length) {
        if (filtered.length === 0) {
          this.unsubscribeChannel(channelName);
        } else {
          this.subscriptions.set(channelName, filtered);
        }
        break;
      }
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      void channel.unsubscribe();
      this.channels.delete(channelName);
    }
    this.subscriptions.delete(channelName);
  }

  /**
   * Cleanup all channels
   */
  cleanup(): void {
    for (const [channelName, channel] of this.channels) {
      void channel.unsubscribe();
    }

    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.channels.clear();
    this.subscriptions.clear();
    this.typingTimeouts.clear();
  }

  /**
   * Get channel name for configuration
   */
  private getChannelName(config: ChannelConfig): string {
    const parts = ["org", config.organizationId];

    if (config.conversationId) {
      parts.push("conv", config.conversationId);
    }

    return parts.join(":");
  }

  /**
   * Handle message events
   */
  private handleMessageEvent(payload: PostgresChangesPayload, config: ChannelConfig): void {
    const subscriptions = this.subscriptions.get(this.getChannelName(config)) || [];

    for (const sub of subscriptions) {
      if (sub.eventType === "message" || sub.eventType === "*") {
        sub.callback(payload);
      }
    }
  }

  /**
   * Handle presence sync
   */
  private handlePresenceSync(channel: RealtimeChannel, config: ChannelConfig): void {
    const subscriptions = this.subscriptions.get(this.getChannelName(config)) || [];
    const presences = channel.presenceState();

    for (const sub of subscriptions) {
      if (sub.eventType === "presence" || sub.eventType === "*") {
        sub.callback({ type: "sync", presences });
      }
    }
  }

  /**
   * Handle presence join
   */
  private handlePresenceJoin(payload: RealtimePayload, config: ChannelConfig): void {
    const subscriptions = this.subscriptions.get(this.getChannelName(config)) || [];

    for (const sub of subscriptions) {
      if (sub.eventType === "presence" || sub.eventType === "*") {
        sub.callback({ type: "join", ...payload });
      }
    }
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(payload: RealtimePayload, config: ChannelConfig): void {
    const subscriptions = this.subscriptions.get(this.getChannelName(config)) || [];

    for (const sub of subscriptions) {
      if (sub.eventType === "presence" || sub.eventType === "*") {
        sub.callback({ type: "leave", ...payload });
      }
    }
  }

  /**
   * Handle typing events
   */
  private handleTypingEvent(payload: RealtimePayload, config: ChannelConfig): void {
    const subscriptions = this.subscriptions.get(this.getChannelName(config)) || [];

    for (const sub of subscriptions) {
      if (sub.eventType === "typing" || sub.eventType === "*") {
        sub.callback(payload);
      }
    }
  }

  /**
   * Subscribe to presence events for typing indicators
   */
  async subscribeToPresence(
    organizationId: string,
    userId: string,
    callback: (event: unknown) => void
  ): Promise<string> {
    const config: ChannelConfig = {
      organizationId,
      userId,
      enablePresence: true,
      enableTyping: true,
    };

    const channel = this.getConversationChannel(config);
    if (!channel) {
      throw new Error("Failed to create channel for presence subscription");
    }

    const subscriptionId = `presence_${organizationId}_${userId}_${Date.now()}`;
    const channelName = this.getChannelName(config);

    // Add subscription to tracking
    const existingSubs = this.subscriptions.get(channelName) || [];
    existingSubs.push({
      channelName,
      eventType: "presence",
      callback,
    });
    this.subscriptions.set(channelName, existingSubs);

    // Subscribe to the channel
    void channel.subscribe();

    return subscriptionId;
  }
}

// Export singleton instance
export const channelManager = new ChannelManager();

// Export function to initialize with supabase client
export function initializeChannelManager(supabaseClient: SupabaseClient): ChannelManager {
  return new ChannelManager(supabaseClient);
}
