/* eslint-disable no-restricted-syntax */
/**
 * @deprecated This file is deprecated. Use @/lib/realtime/unified-channel-standards instead.
 *
 * Centralized real-time channel naming conventions
 * Ensures consistency across agent dashboard and widget communications
 *
 * This file is exempt from channel hardcoding restrictions as it defines
 * the authoritative channel naming patterns for the entire application.
 */

// Re-export from unified standards for backward compatibility
export { UNIFIED_CHANNELS as CHANNEL_PATTERNS, UNIFIED_EVENTS } from './unified-channel-standards';

export const CHANNEL_PREFIXES = {
  // Core prefixes following org-scoped pattern
  ORG: "org",
  CONV: "conv",
  USER: "user",
  PRESENCE: "presence",
  TYPING: "typing",
  DASHBOARD: "dashboard",
  NOTIFICATION: "notification",
  ACTIVITY: "activity",
  TICKET: "ticket",
  KNOWLEDGE: "knowledge",
} as const;

export const CHANNEL_EVENTS = {
  // Message events
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATE: "message:update",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_STATUS: "message:status",

  // Conversation events
  CONVERSATION_NEW: "conversation:new",
  CONVERSATION_UPDATE: "conversation:update",
  CONVERSATION_ASSIGN: "conversation:assign",
  CONVERSATION_CLOSE: "conversation:close",

  // Typing events
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Presence events
  PRESENCE_JOIN: "presence:join",
  PRESENCE_LEAVE: "presence:leave",
  PRESENCE_UPDATE: "presence:update",

  // Agent events
  AGENT_ONLINE: "agent:online",
  AGENT_OFFLINE: "agent:offline",
  AGENT_BUSY: "agent:busy",
} as const;

/**
 * Generate organization-level channel name
 */
/**
 * Generate organization-level channel name
 * Pattern: org:${organizationId}
 */
export function getOrganizationChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}`;
}

/**
 * Generate conversation-level channel name
 */
/**
 * Generate conversation-level channel name (organization-scoped)
 * Pattern: bcast:conv:${organizationId}:${conversationId}
 * STANDARDIZED: This is the ONLY format for conversation channels across widget and dashboard
 * SPECIFICATION COMPLIANT: Uses 'conv' as per 08-realtime-system.json
 */
export function getConversationChannel(organizationId: string, conversationId: string | number): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:conv:${conversationId}`;
}

/**
 * Generate user-level channel name
 */
/**
 * Generate user-level channel name (organization-scoped)
 * Pattern: org:${organizationId}:user:${userId}
 */
export function getUserChannel(organizationId: string, userId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.USER}:${userId}`;
}

/**
 * Generate presence channel name
 */
/**
 * Generate presence channel name (organization-scoped)
 * Pattern: org:${organizationId}:presence
 */
export function getPresenceChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.PRESENCE}`;
}

/**
 * Generate typing indicator channel name
 */
/**
 * Generate typing indicator channel name (organization-scoped)
 * Pattern: org:${organizationId}:typing:${conversationId}
 */
export function getTypingChannel(organizationId: string, conversationId: string | number): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.TYPING}:${conversationId}`;
}

/**
 * Generate dashboard channel name (organization-scoped)
 * Pattern: org:${organizationId}:dashboard
 */
export function getDashboardChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.DASHBOARD}`;
}

/**
 * Generate notification channel name (organization-scoped)
 * Pattern: org:${organizationId}:notification
 */
export function getNotificationChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.NOTIFICATION}`;
}

/**
 * Generate activity channel name (organization-scoped)
 * Pattern: org:${organizationId}:activity
 */
export function getActivityChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.ACTIVITY}`;
}

/**
 * Generate ticket channel name (organization-scoped)
 * Pattern: org:${organizationId}:ticket:${ticketId}
 */
export function getTicketChannel(organizationId: string, ticketId: string | number): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.TICKET}:${ticketId}`;
}

/**
 * Generate knowledge base channel name (organization-scoped)
 * Pattern: org:${organizationId}:knowledge
 */
export function getKnowledgeChannel(organizationId: string): string {
  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${CHANNEL_PREFIXES.KNOWLEDGE}`;
}

/**
 * Parse channel name to extract type and ID
 */
/**
 * Parse channel name to extract organization ID, resource type, and resource ID
 * Handles both simple and org-scoped patterns
 */
/**
 * TypeScript types for channel naming system
 */

export type ChannelPrefix = (typeof CHANNEL_PREFIXES)[keyof typeof CHANNEL_PREFIXES];

export type ChannelEvent = (typeof CHANNEL_EVENTS)[keyof typeof CHANNEL_EVENTS];

export interface ChannelParts {
  organizationId: string | null;
  resourceType: string;
  resourceId: string | null;
  isOrgScoped: boolean;
}

export interface ChannelConfig {
  organizationId: string;
  resourceType: string;
  resourceId?: string | number;
  enablePresence?: boolean;
  enableTyping?: boolean;
  enableBroadcast?: boolean;
}

export interface ChannelIdentifier {
  organizationId: string;
  conversationId?: string | number;
  userId?: string;
  ticketId?: string | number;
}

export interface OrganizationChannels {
  organization: string;
  presence: string;
  dashboard: string;
  notification: string;
  activity: string;
  knowledge: string;
}

export interface ConversationChannels {
  conversation: string;
  typing: string;
}

export interface ChannelNamePatterns {
  organization: "org:${organizationId}";
  conversation: "bcast:conv:${organizationId}:${conversationId}";
  user: "org:${organizationId}:user:${userId}";
  presence: "org:${organizationId}:presence";
  typing: "org:${organizationId}:typing:${conversationId}";
  dashboard: "org:${organizationId}:dashboard";
  notification: "org:${organizationId}:notification";
  activity: "org:${organizationId}:activity";
  ticket: "org:${organizationId}:ticket:${ticketId}";
  knowledge: "org:${organizationId}:knowledge";
}

export function parseChannelName(channel: string): ChannelParts | null {
  const parts = channel.split(":");

  // Handle org-scoped pattern: org:${orgId}:${resourceType}:${resourceId}
  if (parts.length >= 3 && parts[0] === CHANNEL_PREFIXES.ORG) {
    const [, organizationId, resourceType, resourceId] = parts;
    return {
      organizationId,
      resourceType,
      resourceId: resourceId || null,
      isOrgScoped: true,
    };
  }

  // Handle simple pattern: ${resourceType}:${resourceId}
  if (parts.length === 2) {
    const [resourceType, resourceId] = parts;
    return {
      organizationId: null,
      resourceType,
      resourceId,
      isOrgScoped: false,
    };
  }

  return null;
}

/**
 * Validate if a channel name follows the expected pattern
 */
export function isValidChannelName(channel: string): boolean {
  return parseChannelName(channel) !== null;
}

/**
 * Extract organization ID from any valid channel name
 */
export function extractOrganizationId(channel: string): string | null {
  const parsed = parseChannelName(channel);
  return parsed?.organizationId || null;
}

/**
 * Extract resource ID from any valid channel name
 */
export function extractResourceId(channel: string): string | null {
  const parsed = parseChannelName(channel);
  return parsed?.resourceId || null;
}

/**
 * Check if a channel is organization-scoped
 */
export function isOrgScopedChannel(channel: string): boolean {
  const parsed = parseChannelName(channel);
  return parsed?.isOrgScoped || false;
}

/**
 * Get all channels for an organization
 */
export function getOrganizationChannels(organizationId: string): OrganizationChannels {
  return {
    organization: getOrganizationChannel(organizationId),
    presence: getPresenceChannel(organizationId),
    dashboard: getDashboardChannel(organizationId),
    notification: getNotificationChannel(organizationId),
    activity: getActivityChannel(organizationId),
    knowledge: getKnowledgeChannel(organizationId),
  };
}

/**
 * Get all channels for a conversation
 */
export function getConversationChannels(organizationId: string, conversationId: string | number): ConversationChannels {
  return {
    conversation: getConversationChannel(organizationId, conversationId),
    typing: getTypingChannel(organizationId, conversationId),
  };
}

/**
 * Generate channel name from config
 */
export function generateChannelName(config: ChannelConfig): string {
  const { organizationId, resourceType, resourceId } = config;

  if (resourceId) {
    return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${resourceType}:${resourceId}`;
  }

  return `${CHANNEL_PREFIXES.ORG}:${organizationId}:${resourceType}`;
}

/**
 * Create channel identifier from parts
 */
export function createChannelIdentifier(parts: Partial<ChannelIdentifier>): ChannelIdentifier {
  if (!parts.organizationId) {
    throw new Error("Organization ID is required for channel identifier");
  }

  return {
    organizationId: parts.organizationId,
    conversationId: parts.conversationId,
    userId: parts.userId,
    ticketId: parts.ticketId,
  };
}

/**
 * Channel pattern constants for documentation and validation
 */
export const CHANNEL_PATTERNS = {
  ORGANIZATION: "org:${organizationId}",
  CONVERSATION: "bcast:conv:${organizationId}:${conversationId}",
  USER: "org:${organizationId}:user:${userId}",
  PRESENCE: "org:${organizationId}:presence",
  TYPING: "org:${organizationId}:typing:${conversationId}",
  DASHBOARD: "org:${organizationId}:dashboard",
  NOTIFICATION: "org:${organizationId}:notification",
  ACTIVITY: "org:${organizationId}:activity",
  TICKET: "org:${organizationId}:ticket:${ticketId}",
  KNOWLEDGE: "org:${organizationId}:knowledge",
} as const;

/**
 * Legacy channel name generators for backward compatibility
 * @deprecated Use org-scoped functions instead
 */
export const LegacyChannels = {
  /**
   * @deprecated Use getConversationChannel(organizationId, conversationId) instead
   */
  generateConversationChannel: (orgId: string, conversationId: string): string => {
    return `${orgId}:conversation:${conversationId}`;
  },

  /**
   * @deprecated Use getOrganizationChannel(organizationId) instead
   */
  generateOrganizationChannel: (orgId: string): string => {
    return `${orgId}:organization`;
  },

  /**
   * @deprecated Use getTypingChannel(organizationId, conversationId) instead
   */
  generateTypingChannel: (orgId: string, conversationId: string): string => {
    return `${orgId}:typing:${conversationId}`;
  },

  /**
   * @deprecated Use getDashboardChannel(organizationId) instead
   */
  generateDashboardChannel: (orgId: string): string => {
    return `${orgId}:dashboard`;
  },
} as const;

/**
 * Migration helper to convert legacy channel names to org-scoped format
 */
export function migrateLegacyChannelName(legacyChannel: string, organizationId: string): string {
  const parts = legacyChannel.split(":");

  if (parts.length === 2) {
    const [orgId, resourceType] = parts;

    if (resourceType === "organization") {
      return getOrganizationChannel(organizationId);
    } else if (resourceType === "dashboard") {
      return getDashboardChannel(organizationId);
    }
  }

  if (parts.length === 3) {
    const [orgId, resourceType, resourceId] = parts;

    if (resourceType === "conversation") {
      return getConversationChannel(organizationId, resourceId);
    } else if (resourceType === "typing") {
      return getTypingChannel(organizationId, resourceId);
    }
  }

  // Return original if no migration pattern matches
  return legacyChannel;
}

/**
 * Batch create multiple channel names from identifier
 */
export function createChannelBatch(
  identifier: ChannelIdentifier
): Partial<OrganizationChannels & ConversationChannels> {
  const channels: Partial<OrganizationChannels & ConversationChannels> = {
    organization: getOrganizationChannel(identifier.organizationId),
    presence: getPresenceChannel(identifier.organizationId),
    dashboard: getDashboardChannel(identifier.organizationId),
    notification: getNotificationChannel(identifier.organizationId),
    activity: getActivityChannel(identifier.organizationId),
    knowledge: getKnowledgeChannel(identifier.organizationId),
  };

  if (identifier.conversationId) {
    channels.conversation = getConversationChannel(identifier.organizationId, identifier.conversationId);
    channels.typing = getTypingChannel(identifier.organizationId, identifier.conversationId);
  }

  return channels;
}

/**
 * Standard payload structure for real-time events
 */
export interface RealtimePayload<T = unknown> {
  event: string;
  organizationId: string;
  conversationId?: string | number;
  userId?: string;
  timestamp: string;
  data: T;
}

/**
 * Create standardized payload for real-time events
 */
export function createRealtimePayload<T>(
  event: string,
  organizationId: string,
  data: T,
  options?: {
    conversationId?: string | number;
    userId?: string;
  }
): RealtimePayload<T> {
  return {
    event,
    organizationId,
    conversationId: options?.conversationId,
    userId: options?.userId,
    timestamp: new Date().toISOString(),
    data,
  };
}
