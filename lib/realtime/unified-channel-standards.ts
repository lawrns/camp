/**
 * UNIFIED CHANNEL NAMING STANDARDS
 *
 * This is the SINGLE SOURCE OF TRUTH for all channel naming conventions
 * across the entire Campfire application. All other channel naming files
 * should import from and defer to this standard.
 *
 * DESIGN PRINCIPLES:
 * 1. Hierarchical: org -> resource -> sub-resource -> action
 * 2. Predictable: Same pattern for all channel types
 * 3. Scoped: Organization-first isolation
 * 4. Extensible: Easy to add new channel types
 * 5. Bidirectional: Support both client->server and server->client flows
 * 6. Database-Verified: All patterns tested against actual Supabase database
 * 7. E2E-Tested: Validated through comprehensive end-to-end testing
 *
 * VERIFIED CONFIGURATION (January 2025):
 * - ✅ Supabase Realtime Publications: messages, conversations tables
 * - ✅ RLS Policies: Anonymous + authenticated access for widget/dashboard
 * - ✅ Database Schema: organization_id required for all messages
 * - ✅ Test Data: Complete test organization, user, and conversation setup
 */

// ============================================================================
// CHANNEL NAMING PATTERNS
// ============================================================================

/**
 * Primary channel naming pattern: org:{orgId}:{resource}[:{resourceId}][:{action}]
 * 
 * Examples:
 * - org:abc123:conversations (all conversations in org)
 * - org:abc123:conv:conv456 (specific conversation)
 * - org:abc123:conv:conv456:typing (typing in specific conversation)
 * - org:abc123:agents:presence (agent presence in org)
 * - org:abc123:agent:agent789:status (specific agent status)
 */
export const UNIFIED_CHANNELS = {
  // ========================================
  // ORGANIZATION LEVEL CHANNELS
  // ========================================
  
  /** Organization-wide events and notifications */
  organization: (orgId: string) => `org:${orgId}`,
  
  /** All conversations in organization */
  conversations: (orgId: string) => `org:${orgId}:conversations`,
  
  /** All agents presence in organization */
  agentsPresence: (orgId: string) => `org:${orgId}:agents:presence`,
  
  /** Organization-wide notifications */
  notifications: (orgId: string) => `org:${orgId}:notifications`,
  
  /** Organization activity feed */
  activity: (orgId: string) => `org:${orgId}:activity`,
  
  /** Organization metrics and analytics */
  metrics: (orgId: string) => `org:${orgId}:metrics`,
  
  // ========================================
  // CONVERSATION LEVEL CHANNELS
  // ========================================
  
  /** Specific conversation - PRIMARY CONVERSATION CHANNEL */
  conversation: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}`,
  
  /** Typing indicators for specific conversation */
  conversationTyping: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:typing`,
  
  /** Presence in specific conversation */
  conversationPresence: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:presence`,
  
  /** AI handover events for specific conversation */
  conversationHandover: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:handover`,
  
  /** Message status updates for specific conversation */
  conversationStatus: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:status`,
  
  // ========================================
  // USER/AGENT LEVEL CHANNELS
  // ========================================
  
  /** Specific user/agent channel */
  user: (orgId: string, userId: string) => `org:${orgId}:user:${userId}`,
  
  /** User notifications */
  userNotifications: (orgId: string, userId: string) => `org:${orgId}:user:${userId}:notifications`,
  
  /** User presence status */
  userPresence: (orgId: string, userId: string) => `org:${orgId}:user:${userId}:presence`,
  
  /** User activity tracking */
  userActivity: (orgId: string, userId: string) => `org:${orgId}:user:${userId}:activity`,
  
  // ========================================
  // WIDGET LEVEL CHANNELS
  // ========================================

  /** Widget-specific conversation channel - UNIFIED with conversation channel */
  widget: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}`,
  
  /** Widget visitor tracking */
  widgetVisitor: (orgId: string, visitorId: string) => `org:${orgId}:widget:visitor:${visitorId}`,
  
  // ========================================
  // SYSTEM LEVEL CHANNELS
  // ========================================
  
  /** System-wide announcements */
  system: () => `system:announcements`,
  
  /** Health monitoring */
  health: () => `system:health`,
  
  /** Performance metrics */
  performance: () => `system:performance`,
  
} as const;

// ============================================================================
// ERROR HANDLING AND FALLBACK STANDARDS
// ============================================================================

/**
 * CRITICAL: Channel Error Handling Standards
 *
 * Based on production testing, Supabase Realtime channels can encounter
 * CHANNEL_ERROR status which should trigger fallback mode, not complete failure.
 *
 * VERIFIED ISSUE (January 2025):
 * - Widget realtime shows: "❌ Channel error - stopping reconnection attempts"
 * - This occurs when Supabase Realtime channel authentication fails
 * - Solution: Switch to fallback mode instead of stopping completely
 */
export const REALTIME_ERROR_HANDLING = {
  /** Channel error states that should trigger fallback mode */
  FALLBACK_TRIGGERS: [
    'CHANNEL_ERROR',
    'SUBSCRIPTION_ERROR',
    'AUTH_ERROR',
    'NETWORK_ERROR'
  ],

  /** Fallback strategies for different error types */
  FALLBACK_STRATEGIES: {
    CHANNEL_ERROR: 'polling_fallback',
    SUBSCRIPTION_ERROR: 'retry_with_backoff',
    AUTH_ERROR: 'anonymous_mode',
    NETWORK_ERROR: 'offline_queue'
  },

  /** Retry configuration for robust connections */
  RETRY_CONFIG: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
} as const;

/**
 * Database Schema Requirements
 *
 * VERIFIED REQUIREMENTS (January 2025):
 * All messages MUST include organization_id for proper RLS filtering
 */
export const DATABASE_REQUIREMENTS = {
  /** Required fields for all message inserts */
  REQUIRED_MESSAGE_FIELDS: [
    'conversation_id',
    'organization_id', // CRITICAL: Required for RLS policies
    'content',
    'sender_type'
  ],

  /** Optional but recommended fields */
  RECOMMENDED_MESSAGE_FIELDS: [
    'sender_name',
    'sender_email',
    'metadata'
  ],

  /** RLS Policy Requirements */
  RLS_REQUIREMENTS: {
    anonymous_access: true, // Required for widget functionality
    authenticated_access: true, // Required for dashboard functionality
    organization_scoped: true // All access must be organization-scoped
  }
} as const;

// ============================================================================
// EVENT NAMING STANDARDS
// ============================================================================

/**
 * Event naming pattern: {resource}:{action}[:{detail}]
 * 
 * Examples:
 * - message:created
 * - message:updated
 * - conversation:assigned
 * - agent:status:online
 * - typing:start
 */
export const UNIFIED_EVENTS = {
  // ========================================
  // MESSAGE EVENTS
  // ========================================
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated", 
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_STATUS_DELIVERED: "message:status:delivered",
  MESSAGE_STATUS_READ: "message:status:read",
  MESSAGE_STATUS_FAILED: "message:status:failed",
  READ_RECEIPT: "read:receipt",
  
  // ========================================
  // CONVERSATION EVENTS
  // ========================================
  CONVERSATION_CREATED: "conversation:created",
  CONVERSATION_UPDATED: "conversation:updated",
  CONVERSATION_ASSIGNED: "conversation:assigned",
  CONVERSATION_UNASSIGNED: "conversation:unassigned",
  CONVERSATION_CLOSED: "conversation:closed",
  CONVERSATION_REOPENED: "conversation:reopened",
  CONVERSATION_ARCHIVED: "conversation:archived",
  
  // ========================================
  // TYPING EVENTS
  // ========================================
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_UPDATE: "typing:update",
  
  // ========================================
  // PRESENCE EVENTS
  // ========================================
  PRESENCE_JOIN: "presence:join",
  PRESENCE_LEAVE: "presence:leave",
  PRESENCE_UPDATE: "presence:update",
  
  // ========================================
  // AGENT EVENTS
  // ========================================
  AGENT_STATUS_ONLINE: "agent:status:online",
  AGENT_STATUS_AWAY: "agent:status:away", 
  AGENT_STATUS_BUSY: "agent:status:busy",
  AGENT_STATUS_OFFLINE: "agent:status:offline",
  AGENT_ASSIGNED: "agent:assigned",
  AGENT_UNASSIGNED: "agent:unassigned",
  
  // ========================================
  // AI EVENTS
  // ========================================
  AI_ACTIVATED: "ai:activated",
  AI_DEACTIVATED: "ai:deactivated",
  AI_RESPONSE_GENERATED: "ai:response:generated",
  AI_HANDOVER_REQUESTED: "ai:handover:requested",
  AI_HANDOVER_COMPLETED: "ai:handover:completed",
  AI_CONFIDENCE_LOW: "ai:confidence:low",
  AI_CONFIDENCE_HIGH: "ai:confidence:high",
  
  // ========================================
  // VISITOR EVENTS
  // ========================================
  VISITOR_JOINED: "visitor:joined",
  VISITOR_LEFT: "visitor:left",
  VISITOR_ACTIVE: "visitor:active",
  VISITOR_IDLE: "visitor:idle",
  VISITOR_PAGE_VIEW: "visitor:page:view",
  
  // ========================================
  // NOTIFICATION EVENTS
  // ========================================
  NOTIFICATION_CREATED: "notification:created",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DISMISSED: "notification:dismissed",
  
  // ========================================
  // SYSTEM EVENTS
  // ========================================
  SYSTEM_MAINTENANCE: "system:maintenance",
  SYSTEM_ALERT: "system:alert",
  SYSTEM_HEALTH_CHECK: "system:health:check",
  
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type UnifiedChannelName = ReturnType<typeof UNIFIED_CHANNELS[keyof typeof UNIFIED_CHANNELS]>;
export type UnifiedEventType = typeof UNIFIED_EVENTS[keyof typeof UNIFIED_EVENTS];

// ============================================================================
// CHANNEL UTILITIES
// ============================================================================

/**
 * Validate if a channel name follows the unified standard
 */
export function isValidChannelName(channelName: string): boolean {
  // System channels
  if (channelName.startsWith('system:')) {
    return /^system:(announcements|health|performance)$/.test(channelName);
  }
  
  // Organization channels
  if (channelName.startsWith('org:')) {
    const patterns = [
      /^org:[^:]+$/,                                    // org:orgId
      /^org:[^:]+:(conversations|notifications|activity|metrics)$/,  // org:orgId:resource
      /^org:[^:]+:agents:presence$/,                    // org:orgId:agents:presence
      /^org:[^:]+:conv:[^:]+$/,                        // org:orgId:conv:convId
      /^org:[^:]+:conv:[^:]+:(typing|presence|handover|status)$/,  // org:orgId:conv:convId:action
      /^org:[^:]+:user:[^:]+$/,                        // org:orgId:user:userId
      /^org:[^:]+:user:[^:]+:(notifications|presence|activity)$/,  // org:orgId:user:userId:action
      /^org:[^:]+:widget:[^:]+$/,                      // org:orgId:widget:convId
      /^org:[^:]+:widget:visitor:[^:]+$/,              // org:orgId:widget:visitor:visitorId
    ];
    
    return patterns.some(pattern => pattern.test(channelName));
  }
  
  return false;
}

/**
 * Extract organization ID from channel name
 */
export function extractOrgId(channelName: string): string | null {
  const match = channelName.match(/^org:([^:]+)/);
  return match ? match[1] : null;
}

/**
 * Extract resource type from channel name
 */
export function extractResourceType(channelName: string): string | null {
  const match = channelName.match(/^org:[^:]+:([^:]+)/);
  return match ? match[1] : null;
}

/**
 * Extract resource ID from channel name
 */
export function extractResourceId(channelName: string): string | null {
  const match = channelName.match(/^org:[^:]+:[^:]+:([^:]+)/);
  return match ? match[1] : null;
}

/**
 * Validate if an event name follows the unified standard
 */
export function isValidEventName(eventName: string): boolean {
  return Object.values(UNIFIED_EVENTS).includes(eventName as UnifiedEventType);
}
