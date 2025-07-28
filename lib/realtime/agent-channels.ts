/**
 * Agent-specific channel management for real-time communication
 * This module extends the standardized realtime system with agent-specific functionality
 */

import { CHANNEL_PATTERNS as BASE_PATTERNS, EVENT_TYPES as BASE_EVENTS, broadcastToChannel, subscribeToChannel } from './standardized-realtime';

// Extended channel patterns for agent functionality
export const AGENT_CHANNEL_PATTERNS = {
  ...BASE_PATTERNS,
  
  // Agent-specific channels
  AGENT_PRESENCE: (orgId: string) => `org:${orgId}:agents:presence`,
  AGENT_STATUS: (orgId: string, agentId: string) => `org:${orgId}:agent:${agentId}:status`,
  AGENT_QUEUE: (orgId: string) => `org:${orgId}:queue:status`,
  AGENT_METRICS: (orgId: string, agentId: string) => `org:${orgId}:agent:${agentId}:metrics`,
  
  // Handover channels
  HANDOVER_REQUEST: (orgId: string) => `org:${orgId}:handover:requests`,
  HANDOVER_STATUS: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:handover`,
  
  // Widget-Agent bridge channels
  WIDGET_AGENT_BRIDGE: (orgId: string, convId: string) => `org:${orgId}:bridge:${convId}`,
  
  // Customer activity channels
  CUSTOMER_ACTIVITY: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}:activity`,
} as const;

// Extended event types for agent functionality
export const AGENT_EVENT_TYPES = {
  ...BASE_EVENTS,
  
  // Agent status events
  AGENT_ONLINE: 'agent_online',
  AGENT_OFFLINE: 'agent_offline',
  AGENT_AWAY: 'agent_away',
  AGENT_BUSY: 'agent_busy',
  AGENT_AVAILABLE: 'agent_available',
  
  // Queue events
  QUEUE_JOINED: 'queue_joined',
  QUEUE_LEFT: 'queue_left',
  QUEUE_POSITION_UPDATE: 'queue_position_update',
  QUEUE_STATS_UPDATE: 'queue_stats_update',
  
  // Handover events
  HANDOVER_REQUESTED: 'handover_requested',
  HANDOVER_ACCEPTED: 'handover_accepted',
  HANDOVER_REJECTED: 'handover_rejected',
  HANDOVER_COMPLETED: 'handover_completed',
  HANDOVER_TIMEOUT: 'handover_timeout',
  
  // Customer activity events
  CUSTOMER_PAGE_VIEW: 'customer_page_view',
  CUSTOMER_IDLE: 'customer_idle',
  CUSTOMER_ACTIVE: 'customer_active',
  CUSTOMER_LEFT_SITE: 'customer_left_site',
  
  // Message status events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_FAILED: 'message_failed',
} as const;

// Agent presence states
export type AgentPresenceState = 'online' | 'away' | 'busy' | 'offline';

// Agent presence data structure
export interface AgentPresence {
  agentId: string;
  agentName: string;
  status: AgentPresenceState;
  capacity: {
    current: number;
    max: number;
  };
  lastActivity: Date;
  activeConversations: string[];
  skills?: string[];
  avatar?: string;
}

// Queue status data structure
export interface QueueStatus {
  totalWaiting: number;
  averageWaitTime: number; // in seconds
  availableAgents: number;
  busyAgents: number;
  estimatedWaitTime: number; // in seconds
  queuePosition?: number; // For specific customer
}

// Handover request data structure
export interface HandoverRequest {
  conversationId: string;
  customerId: string;
  fromAI: boolean;
  reason: string;
  confidence?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: any;
  requestedAt: Date;
}

// Customer activity data structure
export interface CustomerActivity {
  customerId: string;
  conversationId: string;
  currentPage?: string;
  lastActivity: Date;
  isActive: boolean;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  sessionDuration: number; // in seconds
}

// Agent channel helpers
export const AgentChannelHelpers = {
  // Broadcast agent presence update
  broadcastPresence: async (orgId: string, presence: AgentPresence) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.AGENT_PRESENCE(orgId),
      AGENT_EVENT_TYPES.AGENT_ONLINE,
      presence
    );
  },
  
  // Broadcast agent status change
  broadcastAgentStatus: async (orgId: string, agentId: string, status: AgentPresenceState) => {
    const eventType = status === 'online' ? AGENT_EVENT_TYPES.AGENT_ONLINE :
                     status === 'offline' ? AGENT_EVENT_TYPES.AGENT_OFFLINE :
                     status === 'away' ? AGENT_EVENT_TYPES.AGENT_AWAY :
                     status === 'busy' ? AGENT_EVENT_TYPES.AGENT_BUSY :
                     AGENT_EVENT_TYPES.AGENT_AVAILABLE;
    
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.AGENT_STATUS(orgId, agentId),
      eventType,
      { agentId, status, timestamp: new Date() }
    );
  },
  
  // Broadcast queue update
  broadcastQueueUpdate: async (orgId: string, queueStatus: QueueStatus) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.AGENT_QUEUE(orgId),
      AGENT_EVENT_TYPES.QUEUE_STATS_UPDATE,
      queueStatus
    );
  },
  
  // Request handover from AI to agent
  requestHandover: async (orgId: string, request: HandoverRequest) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.HANDOVER_REQUEST(orgId),
      AGENT_EVENT_TYPES.HANDOVER_REQUESTED,
      request
    );
  },
  
  // Accept handover request
  acceptHandover: async (orgId: string, conversationId: string, agentId: string) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.HANDOVER_STATUS(orgId, conversationId),
      AGENT_EVENT_TYPES.HANDOVER_ACCEPTED,
      { conversationId, agentId, acceptedAt: new Date() }
    );
  },
  
  // Broadcast customer activity
  broadcastCustomerActivity: async (orgId: string, conversationId: string, activity: CustomerActivity) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.CUSTOMER_ACTIVITY(orgId, conversationId),
      activity.isActive ? AGENT_EVENT_TYPES.CUSTOMER_ACTIVE : AGENT_EVENT_TYPES.CUSTOMER_IDLE,
      activity
    );
  },
  
  // Subscribe to agent presence updates
  subscribeToAgentPresence: (orgId: string, callback: (presence: AgentPresence) => void) => {
    return subscribeToChannel(
      AGENT_CHANNEL_PATTERNS.AGENT_PRESENCE(orgId),
      AGENT_EVENT_TYPES.AGENT_ONLINE,
      callback
    );
  },
  
  // Subscribe to queue updates
  subscribeToQueueUpdates: (orgId: string, callback: (status: QueueStatus) => void) => {
    return subscribeToChannel(
      AGENT_CHANNEL_PATTERNS.AGENT_QUEUE(orgId),
      AGENT_EVENT_TYPES.QUEUE_STATS_UPDATE,
      callback
    );
  },
  
  // Subscribe to handover requests
  subscribeToHandoverRequests: (orgId: string, callback: (request: HandoverRequest) => void) => {
    return subscribeToChannel(
      AGENT_CHANNEL_PATTERNS.HANDOVER_REQUEST(orgId),
      AGENT_EVENT_TYPES.HANDOVER_REQUESTED,
      callback
    );
  },
  
  // Subscribe to customer activity for a conversation
  subscribeToCustomerActivity: (orgId: string, conversationId: string, callback: (activity: CustomerActivity) => void) => {
    const unsubscribeActive = subscribeToChannel(
      AGENT_CHANNEL_PATTERNS.CUSTOMER_ACTIVITY(orgId, conversationId),
      AGENT_EVENT_TYPES.CUSTOMER_ACTIVE,
      callback
    );
    
    const unsubscribeIdle = subscribeToChannel(
      AGENT_CHANNEL_PATTERNS.CUSTOMER_ACTIVITY(orgId, conversationId),
      AGENT_EVENT_TYPES.CUSTOMER_IDLE,
      callback
    );
    
    return () => {
      unsubscribeActive();
      unsubscribeIdle();
    };
  },
};

// Message acknowledgment helpers
export const MessageAcknowledgmentHelpers = {
  // Send message delivery acknowledgment
  acknowledgeDelivery: async (orgId: string, conversationId: string, messageId: string) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.WIDGET_AGENT_BRIDGE(orgId, conversationId),
      AGENT_EVENT_TYPES.MESSAGE_DELIVERED,
      { messageId, deliveredAt: new Date() }
    );
  },
  
  // Send message read acknowledgment
  acknowledgeRead: async (orgId: string, conversationId: string, messageId: string, readBy: string) => {
    return broadcastToChannel(
      AGENT_CHANNEL_PATTERNS.WIDGET_AGENT_BRIDGE(orgId, conversationId),
      AGENT_EVENT_TYPES.MESSAGE_READ,
      { messageId, readBy, readAt: new Date() }
    );
  },
};

export default {
  AGENT_CHANNEL_PATTERNS,
  AGENT_EVENT_TYPES,
  AgentChannelHelpers,
  MessageAcknowledgmentHelpers,
};
