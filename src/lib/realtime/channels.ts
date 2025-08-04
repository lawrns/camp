/**
 * Realtime Channels Management
 * Provides channel factory and management for realtime features
 */

import type { RealtimeChannel } from "@/lib/supabase";

export interface ChannelConfig {
  name: string;
  organizationId: string;
  resourceType: "conversation" | "presence" | "typing" | "notification" | "activity";
  resourceId?: string | number;
  private?: boolean;
}

export interface ChannelMetadata {
  createdAt: Date;
  lastActivity: Date;
  subscriberCount: number;
  messageCount: number;
}

export interface ChannelSubscription {
  id: string;
  channel: RealtimeChannel;
  config: ChannelConfig;
  metadata: ChannelMetadata;
  isActive: boolean;
}

/**
 * Channel Factory for creating and managing realtime channels
 */
export class ChannelFactory {
  private channels = new Map<string, ChannelSubscription>();
  private client: unknown = null; // Supabase client

  constructor(supabaseClient: unknown) {
    this.client = supabaseClient;
  }

  /**
   * Create a channel name following the pattern: org:${orgId}:${type}:${id}
   */
  static createChannelName(config: ChannelConfig): string {
    const { organizationId, resourceType, resourceId } = config;

    if (resourceId) {
      return `org:${organizationId}:${resourceType}:${resourceId}`;
    }

    return `org:${organizationId}:${resourceType}`;
  }

  /**
   * Parse a channel name back to its components
   */
  static parseChannelName(channelName: string): Partial<ChannelConfig> | null {
    const parts = channelName.split(":");

    if (parts.length < 3 || parts[0] !== "org") {
      return null;
    }

    const [, organizationId, resourceType, resourceId] = parts;

    const config: Partial<ChannelConfig> = {
      resourceType: resourceType as ChannelConfig["resourceType"],
    };

    if (organizationId) {
      config.organizationId = organizationId;
    }

    if (resourceId) {
      config.resourceId = resourceId;
    }

    return config;
  }

  /**
   * Create or get existing channel
   */
  createChannel(config: ChannelConfig): ChannelSubscription {
    const channelName = ChannelFactory.createChannelName(config);

    // Return existing channel if already created
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    // Create new channel
    const channel = this.client.channel(channelName);

    const subscription: ChannelSubscription = {
      id: channelName,
      channel,
      config: { ...config, name: channelName },
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        subscriberCount: 0,
        messageCount: 0,
      },
      isActive: false,
    };

    this.channels.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to channel events
   */
  subscribe(
    channelName: string,
    eventType: "broadcast" | "presence" | "postgres_changes",
    callback: (payload: unknown) => void,
    options: unknown = {}
  ): ChannelSubscription | null {
    const subscription = this.channels.get(channelName);

    if (!subscription) {
      return null;
    }

    // Set up event listener
    subscription.channel.on(eventType, options, (payload: unknown) => {
      subscription.metadata.lastActivity = new Date();
      subscription.metadata.messageCount++;
      callback(payload);
    });

    // Subscribe to channel
    subscription.channel.subscribe((status: string) => {
      subscription.isActive = status === "SUBSCRIBED";

      if (status === "SUBSCRIBED") {
        subscription.metadata.subscriberCount++;
      } else if (status === "CLOSED") {
        subscription.metadata.subscriberCount = Math.max(0, subscription.metadata.subscriberCount - 1);
      }
    });

    return subscription;
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channelName: string): boolean {
    const subscription = this.channels.get(channelName);

    if (!subscription) {
      return false;
    }

    subscription.channel.unsubscribe();
    subscription.isActive = false;
    this.channels.delete(channelName);

    return true;
  }

  /**
   * Broadcast message to channel
   */
  broadcast(channelName: string, event: string, payload: unknown): boolean {
    const subscription = this.channels.get(channelName);

    if (!subscription || !subscription.isActive) {
      return false;
    }

    subscription.channel.send({
      type: "broadcast",
      event,
      payload,
    });

    subscription.metadata.lastActivity = new Date();
    subscription.metadata.messageCount++;

    return true;
  }

  /**
   * Track presence in channel
   */
  trackPresence(channelName: string, presenceData: unknown): boolean {
    const subscription = this.channels.get(channelName);

    if (!subscription || !subscription.isActive) {
      return false;
    }

    subscription.channel.track(presenceData);
    subscription.metadata.lastActivity = new Date();

    return true;
  }

  /**
   * Get channel subscription
   */
  getChannel(channelName: string): ChannelSubscription | null {
    return this.channels.get(channelName) || null;
  }

  /**
   * Get all channels
   */
  getAllChannels(): ChannelSubscription[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get channels by organization
   */
  getChannelsByOrganization(organizationId: string): ChannelSubscription[] {
    return this.getAllChannels().filter((sub) => sub.config.organizationId === organizationId);
  }

  /**
   * Get channels by resource type
   */
  getChannelsByType(resourceType: ChannelConfig["resourceType"]): ChannelSubscription[] {
    return this.getAllChannels().filter((sub) => sub.config.resourceType === resourceType);
  }

  /**
   * Clean up inactive channels
   */
  cleanup(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    for (const [channelName, subscription] of this.channels) {
      if (!subscription.isActive && subscription.metadata.lastActivity < cutoff) {
        this.unsubscribe(channelName);
      }
    }
  }

  /**
   * Get channel statistics
   */
  getStats(): {
    totalChannels: number;
    activeChannels: number;
    totalMessages: number;
    totalSubscribers: number;
  } {
    const channels = this.getAllChannels();

    return {
      totalChannels: channels.length,
      activeChannels: channels.filter((c) => c.isActive).length,
      totalMessages: channels.reduce((sum, c) => sum + c.metadata.messageCount, 0),
      totalSubscribers: channels.reduce((sum, c) => sum + c.metadata.subscriberCount, 0),
    };
  }

  /**
   * Destroy all channels
   */
  destroy(): void {
    for (const channelName of this.channels.keys()) {
      this.unsubscribe(channelName);
    }
    this.channels.clear();
  }
}

// Global factory instance
let globalChannelFactory: ChannelFactory | null = null;

/**
 * Get or create global channel factory
 */
export function getChannelFactory(supabaseClient?: unknown): ChannelFactory {
  if (!globalChannelFactory && supabaseClient) {
    globalChannelFactory = new ChannelFactory(supabaseClient);
  }

  if (!globalChannelFactory) {
    throw new Error("ChannelFactory not initialized. Provide a Supabase client.");
  }

  return globalChannelFactory;
}

/**
 * Helper functions for common channel operations
 */
export const ChannelHelpers = {
  /**
   * Create conversation channel
   */
  createConversationChannel(organizationId: string, conversationId: string): ChannelConfig {
    return {
      name: "",
      organizationId,
      resourceType: "conversation",
      resourceId: conversationId,
    };
  },

  /**
   * Create presence channel
   */
  createPresenceChannel(organizationId: string): ChannelConfig {
    return {
      name: "",
      organizationId,
      resourceType: "presence",
    };
  },

  /**
   * Create typing channel
   */
  createTypingChannel(organizationId: string, conversationId: string): ChannelConfig {
    return {
      name: "",
      organizationId,
      resourceType: "typing",
      resourceId: conversationId,
    };
  },

  /**
   * Create notification channel
   */
  createNotificationChannel(organizationId: string): ChannelConfig {
    return {
      name: "",
      organizationId,
      resourceType: "notification",
      private: true,
    };
  },
};
