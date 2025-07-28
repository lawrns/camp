import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

const supabase = createClientComponentClient();

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: number;
}

export interface MessageUpdate {
  conversationId: string;
  messageId: string;
  content: string;
  timestamp: number;
  userId: string;
  type: 'message' | 'system' | 'handoff';
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
}

export interface ConversationUpdate {
  conversationId: string;
  status: 'active' | 'closed' | 'handoff' | 'waiting';
  assignedAgent?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Subscribe to typing indicators for a conversation
   */
  subscribeToTyping(
    conversationId: string,
    callback: (payload: TypingIndicator) => void
  ): RealtimeChannel {
    const channelName = `typing:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        callback(payload.payload as TypingIndicator);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<RealtimeChannelSendResponse> {
    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName) || 
      this.subscribeToTyping(conversationId, () => {});

    const payload: TypingIndicator = {
      userId,
      userName,
      isTyping,
      timestamp: Date.now()
    };

    // Clear existing timeout for this user
    const timeoutKey = `${conversationId}:${userId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
    }

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.sendTypingIndicator(conversationId, userId, userName, false);
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);
      this.typingTimeouts.set(timeoutKey, timeout);
    }

    return channel.send({
      type: 'broadcast',
      event: 'typing',
      payload
    });
  }

  /**
   * Subscribe to real-time messages for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (payload: MessageUpdate) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const message = payload.new as any;
          callback({
            conversationId: message.conversation_id,
            messageId: message.id,
            content: message.content,
            timestamp: new Date(message.created_at).getTime(),
            userId: message.user_id,
            type: message.type || 'message'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const message = payload.new as any;
          callback({
            conversationId: message.conversation_id,
            messageId: message.id,
            content: message.content,
            timestamp: new Date(message.updated_at || message.created_at).getTime(),
            userId: message.user_id,
            type: message.type || 'message'
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to conversation status updates
   */
  subscribeToConversationUpdates(
    conversationId: string,
    callback: (payload: ConversationUpdate) => void
  ): RealtimeChannel {
    const channelName = `conversation:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          const conversation = payload.new as any;
          callback({
            conversationId: conversation.id,
            status: conversation.status,
            assignedAgent: conversation.assigned_agent_id,
            priority: conversation.priority
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to agent presence updates
   */
  subscribeToPresence(
    organizationId: string,
    callback: (payload: PresenceUpdate[]) => void
  ): RealtimeChannel {
    const channelName = `presence:${organizationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: 'user_presence'
        }
      }
    })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presenceUpdates: PresenceUpdate[] = [];
        
        Object.keys(state).forEach(userId => {
          const presence = state[userId][0] as any;
          presenceUpdates.push({
            userId,
            status: presence.status,
            lastSeen: presence.lastSeen
          });
        });
        
        callback(presenceUpdates);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const updates = newPresences.map((presence: any) => ({
          userId: key,
          status: presence.status,
          lastSeen: presence.lastSeen
        }));
        callback(updates);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const updates = leftPresences.map((presence: any) => ({
          userId: key,
          status: 'offline' as const,
          lastSeen: Date.now()
        }));
        callback(updates);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Update user presence
   */
  async updatePresence(
    organizationId: string,
    userId: string,
    status: 'online' | 'away' | 'offline'
  ): Promise<RealtimeChannelSendResponse> {
    const channelName = `presence:${organizationId}`;
    const channel = this.channels.get(channelName) || 
      this.subscribeToPresence(organizationId, () => {});

    return channel.track({
      userId,
      status,
      lastSeen: Date.now()
    });
  }

  /**
   * Subscribe to handoff notifications
   */
  subscribeToHandoffs(
    agentId: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `handoffs:${agentId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'handoffs',
          filter: `assigned_agent_id=eq.${agentId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'handoffs',
          filter: `assigned_agent_id=eq.${agentId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.keys()).map(
      channelName => this.unsubscribe(channelName)
    );
    
    await Promise.all(unsubscribePromises);
    
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Convenience functions
export function subscribeToTyping(
  conversationId: string,
  callback: (payload: TypingIndicator) => void
): RealtimeChannel {
  return realtimeManager.subscribeToTyping(conversationId, callback);
}

export function sendTypingIndicator(
  conversationId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): Promise<RealtimeChannelSendResponse> {
  return realtimeManager.sendTypingIndicator(conversationId, userId, userName, isTyping);
}

export function subscribeToMessages(
  conversationId: string,
  callback: (payload: MessageUpdate) => void
): RealtimeChannel {
  return realtimeManager.subscribeToMessages(conversationId, callback);
}

export function subscribeToConversationUpdates(
  conversationId: string,
  callback: (payload: ConversationUpdate) => void
): RealtimeChannel {
  return realtimeManager.subscribeToConversationUpdates(conversationId, callback);
}

export function subscribeToPresence(
  organizationId: string,
  callback: (payload: PresenceUpdate[]) => void
): RealtimeChannel {
  return realtimeManager.subscribeToPresence(organizationId, callback);
}

export function updatePresence(
  organizationId: string,
  userId: string,
  status: 'online' | 'away' | 'offline'
): Promise<RealtimeChannelSendResponse> {
  return realtimeManager.updatePresence(organizationId, userId, status);
}

export function subscribeToHandoffs(
  agentId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return realtimeManager.subscribeToHandoffs(agentId, callback);
}