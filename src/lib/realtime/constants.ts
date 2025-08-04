/**
 * Unified Real-Time Event Constants
 * Ensures widget and agent use the same event names
 */

export const REALTIME_EVENTS = {
  // Message Events
  MESSAGE_CREATED: "message_created",
  NEW_MESSAGE: "new_message", // Legacy support
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETED: "message_deleted",
  MESSAGE_STATUS_UPDATE: "message_status_update",

  // Typing Events
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  TYPING: "typing", // Legacy support

  // Conversation Events
  CONVERSATION_UPDATED: "conversation_updated",
  CONVERSATION_STATUS_CHANGED: "conversation_status_changed",

  // AI Events
  AI_ACTIVATED: "ai_activated",
  AI_RESPONSE_COMPLETE: "ai_response_complete",
  AI_HANDOVER_REQUIRED: "human_takeover_required",

  // Presence Events
  AGENT_JOINED: "agent_joined",
  AGENT_LEFT: "agent_left",
  VISITOR_ACTIVE: "visitor_active",

  // Read Receipts
  READ_RECEIPT: "read_receipt",
} as const;

export type RealtimeEventType = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Channel Name Generators
 */
export const CHANNELS = {
  organization: (orgId: string) => `org:${orgId}`,
  conversation: (orgId: string, convId: string) => `bcast:conv:${orgId}:${convId}`,
  widget: (orgId: string, convId: string) => `org:${orgId}:widget:${convId}`,
  typing: (orgId: string, convId: string) => `bcast:typing:${orgId}:${convId}`,
} as const;

/**
 * Standardized Message Payload
 */
export interface RealtimeMessagePayload {
  id: string;
  conversation_id: string;
  organization_id: string;
  content: string;
  senderType: "customer" | "visitor" | "agent" | "ai" | "system";
  sender_id?: string;
  sender_name?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Standardized Event Payload
 */
export interface RealtimeEventPayload<T = any> {
  event: RealtimeEventType;
  payload: T;
  organizationId: string;
  conversationId?: string;
  timestamp: string;
  source?: "widget" | "agent" | "system";
}
