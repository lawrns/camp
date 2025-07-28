/**
 * Lean real-time client for minimal overhead connections
 */

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface LeanClientConfig {
  organizationId: string;
  userId?: string;
  enablePresence?: boolean;
  enableTyping?: boolean;
  heartbeatInterval?: number;
}

interface ChannelSubscription {
  channel: RealtimeChannel;
  handlers: Map<string, Function[]>;
  isActive: boolean;
}

export class LeanRealtimeClient {
  private supabase: SupabaseClient;
  private config: LeanClientConfig;
  private subscriptions = new Map<string, ChannelSubscription>();
  private connectionState: "connecting" | "connected" | "disconnected" | "error" = "disconnected";
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  public onConnectionChange?: (state: string) => void;
  public onError?: (error: any) => void;

  constructor(config: LeanClientConfig) {
    this.config = {
      enablePresence: true,
      enableTyping: true,
      heartbeatInterval: 30000, // 30 seconds
      ...config,
    };

    this.supabase = supabase.browser();
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    // Monitor Supabase connection status
    this.supabase.realtime.onOpen(() => {
      this.connectionState = "connected";
      this.reconnectAttempts = 0;
      this.onConnectionChange?.("connected");
      this.startHeartbeat();
    });

    this.supabase.realtime.onClose(() => {
      this.connectionState = "disconnected";
      this.onConnectionChange?.("disconnected");
      this.stopHeartbeat();
      this.handleReconnect();
    });

    this.supabase.realtime.onError((error: any) => {
      this.connectionState = "error";
      this.onError?.(error);
      this.onConnectionChange?.("error");
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      // Send heartbeat to keep connection alive
      this.sendHeartbeat();
    }, this.config.heartbeatInterval!);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(): void {
    // Simple heartbeat - just check if connection is still alive
    try {
      if (this.connectionState === "connected") {
        // Supabase handles heartbeat internally
        console.debug("[LeanClient] Heartbeat sent");
      }
    } catch (error) {}
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  private async reconnect(): Promise<void> {
    try {
      this.connectionState = "connecting";
      this.onConnectionChange?.("connecting");

      // Recreate all subscriptions
      for (const [channelName, subscription] of this.subscriptions.entries()) {
        if (subscription.isActive) {
          await this.resubscribeChannel(channelName, subscription);
        }
      }
    } catch (error) {
      this.handleReconnect();
    }
  }

  private async resubscribeChannel(channelName: string, subscription: ChannelSubscription): Promise<void> {
    try {
      // Unsubscribe old channel
      subscription.channel.unsubscribe();

      // Create new channel
      const newChannel = this.supabase.channel(channelName);

      // Re-add all handlers
      for (const [event, handlers] of subscription.handlers.entries()) {
        handlers.forEach((handler) => {
          newChannel.on(event as any, handler);
        });
      }

      // Subscribe
      await newChannel.subscribe();

      // Update subscription
      subscription.channel = newChannel;
    } catch (error) {}
  }

  async subscribe(channelName: string, event: string, handler: Function): Promise<void> {
    try {
      let subscription = this.subscriptions.get(channelName);

      if (!subscription) {
        // Create new subscription
        const channel = this.supabase.channel(channelName);
        subscription = {
          channel,
          handlers: new Map(),
          isActive: true,
        };
        this.subscriptions.set(channelName, subscription);
      }

      // Add handler
      if (!subscription.handlers.has(event)) {
        subscription.handlers.set(event, []);
      }
      subscription.handlers.get(event)!.push(handler);

      // Add to channel
      subscription.channel.on(event as any, handler);

      // Subscribe if not already subscribed
      if (subscription.isActive) {
        await subscription.channel.subscribe();
      }
    } catch (error) {
      this.onError?.(error);
    }
  }

  async unsubscribe(channelName: string, event?: string, handler?: Function): Promise<void> {
    const subscription = this.subscriptions.get(channelName);
    if (!subscription) return;

    try {
      if (event && handler) {
        // Remove specific handler
        const handlers = subscription.handlers.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      } else if (event) {
        // Remove all handlers for event
        subscription.handlers.delete(event);
      } else {
        // Remove entire subscription
        subscription.channel.unsubscribe();
        subscription.isActive = false;
        this.subscriptions.delete(channelName);
      }
    } catch (error) {}
  }

  async send(channelName: string, event: string, payload: any): Promise<void> {
    const subscription = this.subscriptions.get(channelName);
    if (!subscription) {
      throw new Error(`No subscription found for channel: ${channelName}`);
    }

    try {
      await subscription.channel.send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (error) {
      throw error;
    }
  }

  // Utility methods for common patterns
  async subscribeToConversation(
    conversationId: string,
    handlers: {
      onMessage?: (message: any) => void;
      onTyping?: (typing: any) => void;
      onPresence?: (presence: any) => void;
    }
  ): Promise<void> {
    const channelName = `org:${this.config.organizationId}:conversation:${conversationId}`;

    if (handlers.onMessage) {
      await this.subscribe(channelName, "message", handlers.onMessage);
    }

    if (handlers.onTyping && this.config.enableTyping) {
      await this.subscribe(channelName, "typing", handlers.onTyping);
    }

    if (handlers.onPresence && this.config.enablePresence) {
      await this.subscribe(channelName, "presence", handlers.onPresence);
    }
  }

  async unsubscribeFromConversation(conversationId: string): Promise<void> {
    const channelName = `org:${this.config.organizationId}:conversation:${conversationId}`;
    await this.unsubscribe(channelName);
  }

  async sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.config.enableTyping) return;

    const channelName = `org:${this.config.organizationId}:conversation:${conversationId}`;
    await this.send(channelName, "typing", {
      userId: this.config.userId,
      isTyping,
      timestamp: Date.now(),
    });
  }

  async sendPresence(conversationId: string, status: "online" | "away" | "offline"): Promise<void> {
    if (!this.config.enablePresence) return;

    const channelName = `org:${this.config.organizationId}:conversation:${conversationId}`;
    await this.send(channelName, "presence", {
      userId: this.config.userId,
      status,
      timestamp: Date.now(),
    });
  }

  // Get connection info
  getConnectionState(): string {
    return this.connectionState;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter((key) => this.subscriptions.get(key)?.isActive);
  }

  // Cleanup
  disconnect(): void {
    this.stopHeartbeat();

    for (const subscription of this.subscriptions.values()) {
      try {
        subscription.channel.unsubscribe();
      } catch (error) {}
    }

    this.subscriptions.clear();
    this.connectionState = "disconnected";
    this.onConnectionChange?.("disconnected");
  }

  // Statistics
  getStats() {
    return {
      connectionState: this.connectionState,
      subscriptionCount: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts,
      config: this.config,
      activeSubscriptions: this.getActiveSubscriptions(),
    };
  }
}

// Factory function
export function createLeanClient(config: LeanClientConfig): LeanRealtimeClient {
  return new LeanRealtimeClient(config);
}
