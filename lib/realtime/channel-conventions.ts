/**
 * @deprecated This file is deprecated. Use @/lib/realtime/unified-channel-standards instead.
 *
 * Real-time Communication Channel Conventions
 * Follows GUIDE.md specifications for Supabase Realtime patterns
 */

import { RealtimeChannel } from '@supabase/supabase-js';

// Re-export from unified standards for backward compatibility
export { UNIFIED_CHANNELS as CHANNEL_PATTERNS, UNIFIED_EVENTS } from './unified-channel-standards';

// Legacy exports for backward compatibility
export const LEGACY_CHANNEL_PATTERNS = {
  // Organization-wide channels
  ORGANIZATION_PRESENCE: (organizationId: string) => `org:${organizationId}:presence`,
  ORGANIZATION_NOTIFICATIONS: (organizationId: string) => `org:${organizationId}:notifications`,

  // Conversation-specific channels
  CONVERSATION: (organizationId: string, conversationId: string) =>
    `org:${organizationId}:conv:${conversationId}`,
  CONVERSATION_TYPING: (organizationId: string, conversationId: string) =>
    `org:${organizationId}:conv:${conversationId}:typing`,

  // Agent-specific channels
  AGENT: (organizationId: string, agentId: string) =>
    `org:${organizationId}:agent:${agentId}`,
  AGENT_STATUS: (organizationId: string, agentId: string) => 
    `org:${organizationId}:agent:${agentId}:status`,
} as const;

// ============================================================================
// EVENT TYPES
// ============================================================================

export const EVENT_TYPES = {
  // Message events
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  
  // Conversation events
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_ASSIGNED: 'conversation.assigned',
  CONVERSATION_CLOSED: 'conversation.closed',
  
  // Typing indicators
  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',
  
  // Presence
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_AWAY: 'user.away',
  
  // AI events
  AI_HANDOVER_REQUESTED: 'ai.handover_requested',
  AI_HANDOVER_COMPLETED: 'ai.handover_completed',
  AI_CONFIDENCE_UPDATE: 'ai.confidence_update',
  
  // Assignment events
  ASSIGNMENT_REQUESTED: 'assignment.requested',
  ASSIGNMENT_COMPLETED: 'assignment.completed',
  ASSIGNMENT_REJECTED: 'assignment.rejected',
} as const;

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

export const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 16000, 30000];
export const MAX_CHANNELS_PER_SESSION = 5;

// ============================================================================
// TYPING INDICATOR CONSTANTS
// ============================================================================

export const TYPING_DEBOUNCE_MS = 300;
export const TYPING_TIMEOUT_MS = 3000;
export const READ_RECEIPT_BATCH_MS = 1000;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const MESSAGE_RATE_LIMIT = {
  maxMessages: 10,
  windowMs: 60000 // 1 minute
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a standardized channel name
 */
export function createChannelName(
  type: keyof typeof CHANNEL_PATTERNS,
  organizationId: string,
  param1?: string,
  param2?: string
): string {
  const pattern = CHANNEL_PATTERNS[type];
  if (param1 && param2) {
    return (pattern as unknown)(organizationId, param1, param2);
  } else if (param1) {
    return (pattern as unknown)(organizationId, param1);
  } else {
    return (pattern as unknown)(organizationId);
  }
}

/**
 * Validate channel name format
 */
export function isValidChannelName(channelName: string): boolean {
  const patterns = [
    /^org:[^:]+:presence$/,
    /^org:[^:]+:notifications$/,
    /^org:[^:]+:conv:[^:]+$/,
    /^org:[^:]+:conv:[^:]+:typing$/,
    /^org:[^:]+:agent:[^:]+$/,
    /^org:[^:]+:agent:[^:]+:status$/,
  ];
  
  return patterns.some(pattern => pattern.test(channelName));
}

/**
 * Extract organization ID from channel name
 */
export function extractOrganizationId(channelName: string): string | null {
  const match = channelName.match(/^org:([^:]+):/);
  return match ? match[1] || null : null;
}

/**
 * Extract conversation ID from channel name
 */
export function extractConversationId(channelName: string): string | null {
  const match = channelName.match(/^org:[^:]+:conv:([^:]+)/);
  return match ? match[1] || null : null;
}

/**
 * Extract agent ID from channel name
 */
export function extractAgentId(channelName: string): string | null {
  const match = channelName.match(/^org:[^:]+:agent:([^:]+)/);
  return match ? match[1] || null : null;
}

// ============================================================================
// CHANNEL POOLING
// ============================================================================

export class ChannelPool {
  private channels = new Map<string, RealtimeChannel>();
  private maxChannels = MAX_CHANNELS_PER_SESSION;

  constructor(private supabase: unknown) {}

  /**
   * Get or create a channel
   */
  async getChannel(channelName: string): Promise<RealtimeChannel> {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    if (this.channels.size >= this.maxChannels) {
      // Remove least recently used channel
      const firstKey = this.channels.keys().next().value;
      if (firstKey) {
        const channel = this.channels.get(firstKey);
        if (channel) {
          await this.supabase.removeChannel(channel);
          this.channels.delete(firstKey);
        }
      }
    }

    const channel = this.supabase.channel(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Remove a channel from the pool
   */
  async removeChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Clean up all channels
   */
  async cleanup(): Promise<void> {
    for (const [channelName, channel] of this.channels) {
      await this.supabase.removeChannel(channel);
    }
    this.channels.clear();
  }
}

// ============================================================================
// EVENT BROADCASTING
// ============================================================================

/**
 * Broadcast event to a channel
 */
export async function broadcastToChannel(
  supabase: unknown,
  channelName: string,
  eventType: keyof typeof EVENT_TYPES,
  payload: unknown
): Promise<void> {
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: EVENT_TYPES[eventType],
      payload
    });
  } catch (error) {
    console.error('[Realtime] Broadcast failed:', error);
    throw error;
  }
}

/**
 * Subscribe to channel events
 */
export function subscribeToChannel(
  supabase: unknown,
  channelName: string,
  eventType: keyof typeof EVENT_TYPES,
  handler: (payload: unknown) => void
): () => void {
  const channel = supabase.channel(channelName);
  
  channel.on('broadcast', { event: EVENT_TYPES[eventType] }, (payload: unknown) => {
    handler(payload.payload);
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
