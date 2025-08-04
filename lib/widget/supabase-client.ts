import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { WidgetSupabaseConfig } from "@/types/widget-config";

/**
 * Widget-specific Supabase client
 * This client uses the public anon key and is safe for client-side usage
 */
export class WidgetSupabaseClient {
  private client: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private config: WidgetSupabaseConfig | null = null;

  /**
   * Initialize the Supabase client with widget configuration
   */
  initialize(config: WidgetSupabaseConfig): void {
    if (this.client) {
      // Already initialized - silent return in production
      return;
    }

    if (!config.url || !config.anonKey) {
      // Missing configuration - silent return in production
      return;
    }

    this.config = config;
    this.client = supabase.browser();
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient | null {
    if (!this.client) {
      // Client not initialized - silent handling in production
    }
    return this.client;
  }

  /**
   * Subscribe to a conversation channel
   */
  subscribeToConversation(
    conversationId: string,
    callbacks: {
      onMessage?: (payload: unknown) => void;
      onTyping?: (payload: unknown) => void;
      onPresence?: (payload: unknown) => void;
      onStatusChange?: (status: string) => void;
    }
  ): RealtimeChannel | null {
    if (!this.client || !this.config) {
      // Client not initialized - silent return in production
      return null;
    }

    const channelName = `${this.config.realtimeConfig.channels.conversation}:${conversationId}`;

    // Check if already subscribed
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.client.channel(channelName);

    // Subscribe to database changes
    if (callbacks.onMessage && this.config.realtimeConfig.events.includes("messages")) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        callbacks.onMessage
      );
    }

    // Subscribe to broadcast events
    if (callbacks.onTyping && this.config.realtimeConfig.events.includes("typing")) {
      channel.on("broadcast", { event: "typing" }, callbacks.onTyping);
    }

    // Subscribe to presence
    if (callbacks.onPresence && this.config.realtimeConfig.events.includes("presence")) {
      channel.on("presence", { event: "sync" }, callbacks.onPresence);
    }

    // Handle connection status
    if (callbacks.onStatusChange) {
      channel.subscribe((status: unknown) => {
        callbacks.onStatusChange!(status);
      });
    } else {
      channel.subscribe();
    }

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to global widget events
   */
  subscribeToGlobal(
    workspaceId: string,
    callbacks: {
      onAnnouncement?: (payload: unknown) => void;
      onStatusUpdate?: (payload: unknown) => void;
    }
  ): RealtimeChannel | null {
    if (!this.client || !this.config) {
      // Client not initialized - silent return in production
      return null;
    }

    const channelName = this.config.realtimeConfig.channels.global;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.client.channel(channelName);

    if (callbacks.onAnnouncement) {
      channel.on("broadcast", { event: "announcement" }, callbacks.onAnnouncement);
    }

    if (callbacks.onStatusUpdate) {
      channel.on("broadcast", { event: "status_update" }, callbacks.onStatusUpdate);
    }

    channel.subscribe();
    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    const channelName = `${this.config?.realtimeConfig.channels.conversation}:${conversationId}`;
    const channel = this.channels.get(channelName);

    if (!channel) {
      // Not subscribed - silent return in production
      return;
    }

    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        isTyping,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Update presence status
   */
  async updatePresence(conversationId: string, status: "online" | "away" | "offline"): Promise<void> {
    const channelName = `${this.config?.realtimeConfig.channels.conversation}:${conversationId}`;
    const channel = this.channels.get(channelName);

    if (!channel) {
      // Not subscribed - silent return in production
      return;
    }

    await channel.track({
      status,
      lastSeen: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels and cleanup
   */
  cleanup(): void {
    // Unsubscribe from all channels
    for (const [name, channel] of this.channels) {
      channel.unsubscribe();
    }
    this.channels.clear();

    // Remove all channels from client
    if (this.client) {
      this.client.removeAllChannels();
    }

    // Reset state
    this.client = null;
    this.config = null;
  }
}

// Export singleton instance for widget usage
export const widgetSupabase = new WidgetSupabaseClient();
