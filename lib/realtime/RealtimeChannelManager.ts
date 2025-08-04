// Unified Real-time Channel Manager for Campfire v2
// Manages Supabase real-time channels for bidirectional widget-dashboard communication

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

interface ChannelConfig {
  organizationId: string;
  conversationId: string;
  source: 'widget' | 'dashboard';
  userId?: string;
}

interface MessageEvent {
  id: string;
  conversationId: string;
  organizationId: string;
  content: string;
  senderType: 'visitor' | 'agent' | 'ai';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface TypingEvent {
  conversationId: string;
  organizationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

interface PresenceEvent {
  conversationId: string;
  organizationId: string;
  userId: string;
  userName: string;
  status: 'online' | 'offline';
  timestamp: string;
}

export class RealtimeChannelManager {
  private supabase: unknown;
  private channels: Map<string, RealtimeChannel> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private heartbeatInterval = 25000; // 25 seconds to prevent idle timeouts

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  /**
   * Create a standardized channel name for organization-conversation communication
   */
  private getChannelName(organizationId: string, conversationId: string): string {
    return `org:${organizationId}:conv:${conversationId}`;
  }

  /**
   * Subscribe to a conversation channel with proper error handling and heartbeat
   */
  async subscribeToConversation(
    config: ChannelConfig,
    callbacks: {
      onMessage?: (message: MessageEvent) => void;
      onTyping?: (typing: TypingEvent) => void;
      onPresence?: (presence: PresenceEvent) => void;
      onError?: (error: unknown) => void;
      onConnected?: () => void;
      onDisconnected?: () => void;
    }
  ): Promise<string> {
    const channelName = this.getChannelName(config.organizationId, config.conversationId);
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      await this.unsubscribeFromConversation(config.organizationId, config.conversationId);
    }

    try {
      const channel = this.supabase.channel(channelName, {
        config: {
          presence: {
            key: config.userId || `${config.source}-${Date.now()}`,
          },
        },
      });

      // Message events
      if (callbacks.onMessage) {
        channel.on('broadcast', { event: 'message' }, (payload: unknown) => {
          console.log(`[RealtimeChannelManager] Message received on ${channelName}:`, payload);
          callbacks.onMessage!(payload.payload as MessageEvent);
        });
      }

      // Typing events
      if (callbacks.onTyping) {
        channel.on('broadcast', { event: 'typing' }, (payload: unknown) => {
          console.log(`[RealtimeChannelManager] Typing event on ${channelName}:`, payload);
          callbacks.onTyping!(payload.payload as TypingEvent);
        });
      }

      // Presence events
      if (callbacks.onPresence) {
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log(`[RealtimeChannelManager] Presence sync on ${channelName}:`, state);
          
          Object.entries(state).forEach(([key, presences]) => {
            presences.forEach((presence: unknown) => {
              callbacks.onPresence!({
                conversationId: config.conversationId,
                organizationId: config.organizationId,
                userId: presence.userId || key,
                userName: presence.userName || 'Unknown',
                status: 'online',
                timestamp: new Date().toISOString(),
              });
            });
          });
        });

        channel.on('presence', { event: 'join' }, ({ key, newPresences }: unknown) => {
          console.log(`[RealtimeChannelManager] User joined ${channelName}:`, key, newPresences);
          newPresences.forEach((presence: unknown) => {
            callbacks.onPresence!({
              conversationId: config.conversationId,
              organizationId: config.organizationId,
              userId: presence.userId || key,
              userName: presence.userName || 'Unknown',
              status: 'online',
              timestamp: new Date().toISOString(),
            });
          });
        });

        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: unknown) => {
          console.log(`[RealtimeChannelManager] User left ${channelName}:`, key, leftPresences);
          leftPresences.forEach((presence: unknown) => {
            callbacks.onPresence!({
              conversationId: config.conversationId,
              organizationId: config.organizationId,
              userId: presence.userId || key,
              userName: presence.userName || 'Unknown',
              status: 'offline',
              timestamp: new Date().toISOString(),
            });
          });
        });
      }

      // Subscribe to the channel
      const subscriptionResult = await new Promise<string>((resolve, reject) => {
        channel.subscribe((status: string) => {
          console.log(`[RealtimeChannelManager] Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            callbacks.onConnected?.();
            resolve(channelName);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            callbacks.onError?.(new Error(`Channel subscription failed: ${status}`));
            reject(new Error(`Channel subscription failed: ${status}`));
          } else if (status === 'CLOSED') {
            callbacks.onDisconnected?.();
          }
        });
      });

      // Store the channel
      this.channels.set(channelName, channel);
      this.reconnectAttempts.set(channelName, 0);

      // Set up heartbeat to prevent idle timeouts
      this.setupHeartbeat(channelName, config);

      // Track presence if userId is provided
      if (config.userId) {
        await channel.track({
          userId: config.userId,
          userName: config.source === 'widget' ? 'Customer' : 'Agent',
          source: config.source,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[RealtimeChannelManager] Successfully subscribed to ${channelName}`);
      return subscriptionResult;

    } catch (error) {
      console.error(`[RealtimeChannelManager] Failed to subscribe to ${channelName}:`, error);
      callbacks.onError?.(error);
      throw error;
    }
  }

  /**
   * Send a message to a conversation channel
   */
  async sendMessage(
    organizationId: string,
    conversationId: string,
    message: Omit<MessageEvent, 'conversationId' | 'organizationId'>
  ): Promise<boolean> {
    const channelName = this.getChannelName(organizationId, conversationId);
    const channel = this.channels.get(channelName);

    if (!channel) {
      console.error(`[RealtimeChannelManager] Channel ${channelName} not found`);
      return false;
    }

    try {
      const fullMessage: MessageEvent = {
        ...message,
        conversationId,
        organizationId,
      };

      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: fullMessage,
      });

      console.log(`[RealtimeChannelManager] Message sent to ${channelName}:`, fullMessage);
      return true;
    } catch (error) {
      console.error(`[RealtimeChannelManager] Failed to send message to ${channelName}:`, error);
      return false;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTyping(
    organizationId: string,
    conversationId: string,
    typing: Omit<TypingEvent, 'conversationId' | 'organizationId'>
  ): Promise<boolean> {
    const channelName = this.getChannelName(organizationId, conversationId);
    const channel = this.channels.get(channelName);

    if (!channel) {
      console.error(`[RealtimeChannelManager] Channel ${channelName} not found`);
      return false;
    }

    try {
      const fullTyping: TypingEvent = {
        ...typing,
        conversationId,
        organizationId,
      };

      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: fullTyping,
      });

      return true;
    } catch (error) {
      console.error(`[RealtimeChannelManager] Failed to send typing to ${channelName}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe from a conversation channel
   */
  async unsubscribeFromConversation(organizationId: string, conversationId: string): Promise<void> {
    const channelName = this.getChannelName(organizationId, conversationId);
    const channel = this.channels.get(channelName);

    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      
      // Clear heartbeat
      const heartbeat = this.heartbeatIntervals.get(channelName);
      if (heartbeat) {
        clearInterval(heartbeat);
        this.heartbeatIntervals.delete(channelName);
      }

      this.reconnectAttempts.delete(channelName);
      console.log(`[RealtimeChannelManager] Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Set up heartbeat to prevent idle timeouts
   */
  private setupHeartbeat(channelName: string, config: ChannelConfig): void {
    const interval = setInterval(async () => {
      const channel = this.channels.get(channelName);
      if (channel && config.userId) {
        try {
          await channel.track({
            userId: config.userId,
            userName: config.source === 'widget' ? 'Customer' : 'Agent',
            source: config.source,
            timestamp: new Date().toISOString(),
            heartbeat: true,
          });
        } catch (error) {
          console.warn(`[RealtimeChannelManager] Heartbeat failed for ${channelName}:`, error);
        }
      }
    }, this.heartbeatInterval);

    this.heartbeatIntervals.set(channelName, interval);
  }

  /**
   * Get connection status for a channel
   */
  getChannelStatus(organizationId: string, conversationId: string): string | null {
    const channelName = this.getChannelName(organizationId, conversationId);
    const channel = this.channels.get(channelName);
    return channel?.state || null;
  }

  /**
   * Cleanup all channels
   */
  async cleanup(): Promise<void> {
    console.log('[RealtimeChannelManager] Cleaning up all channels');
    
    for (const [channelName, channel] of this.channels) {
      await this.supabase.removeChannel(channel);
      
      const heartbeat = this.heartbeatIntervals.get(channelName);
      if (heartbeat) {
        clearInterval(heartbeat);
      }
    }

    this.channels.clear();
    this.heartbeatIntervals.clear();
    this.reconnectAttempts.clear();
  }
}
