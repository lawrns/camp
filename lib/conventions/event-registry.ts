/**
 * Campfire Analytics Event Registry
 *
 * Centralized registry of all analytics events with enforced campfire_ prefix.
 * Provides type safety and validation for analytics tracking.
 */

// Event prefix constant
export const CAMPFIRE_PREFIX = "campfire_";

// Core event categories
export enum CampfireEvents {
  // Widget Events
  WIDGET_LOADED = "campfire_widget_loaded",
  WIDGET_INITIALIZED = "campfire_widget_initialized",
  WIDGET_OPENED = "campfire_widget_opened",
  WIDGET_CLOSED = "campfire_widget_closed",
  WIDGET_MINIMIZED = "campfire_widget_minimized",
  WIDGET_MAXIMIZED = "campfire_widget_maximized",
  WIDGET_ERROR = "campfire_widget_error",

  // Conversation Events
  CONVERSATION_STARTED = "campfire_conversation_started",
  CONVERSATION_ENDED = "campfire_conversation_ended",
  CONVERSATION_RESUMED = "campfire_conversation_resumed",
  CONVERSATION_ARCHIVED = "campfire_conversation_archived",
  CONVERSATION_UNARCHIVED = "campfire_conversation_unarchived",
  CONVERSATION_ASSIGNED = "campfire_conversation_assigned",
  CONVERSATION_UNASSIGNED = "campfire_conversation_unassigned",

  // Message Events
  MESSAGE_SENT = "campfire_message_sent",
  MESSAGE_RECEIVED = "campfire_message_received",
  MESSAGE_DELIVERED = "campfire_message_delivered",
  MESSAGE_READ = "campfire_message_read",
  MESSAGE_FAILED = "campfire_message_failed",
  MESSAGE_RETRIED = "campfire_message_retried",
  MESSAGE_EDITED = "campfire_message_edited",
  MESSAGE_DELETED = "campfire_message_deleted",

  // AI Events
  AI_RESPONSE_GENERATED = "campfire_ai_response_generated",
  AI_RESPONSE_ACCEPTED = "campfire_ai_response_accepted",
  AI_RESPONSE_REJECTED = "campfire_ai_response_rejected",
  AI_RESPONSE_MODIFIED = "campfire_ai_response_modified",
  AI_SUGGESTION_SHOWN = "campfire_ai_suggestion_shown",
  AI_SUGGESTION_CLICKED = "campfire_ai_suggestion_clicked",
  AI_KNOWLEDGE_BASE_QUERIED = "campfire_ai_knowledge_base_queried",
  AI_EMBEDDING_GENERATED = "campfire_ai_embedding_generated",

  // Handover Events
  HANDOVER_INITIATED = "campfire_handover_initiated",
  HANDOVER_ACCEPTED = "campfire_handover_accepted",
  HANDOVER_REJECTED = "campfire_handover_rejected",
  HANDOVER_COMPLETED = "campfire_handover_completed",
  HANDOVER_CANCELLED = "campfire_handover_cancelled",
  HANDOVER_TIMEOUT = "campfire_handover_timeout",

  // User Events
  USER_AUTHENTICATED = "campfire_user_authenticated",
  USER_LOGGED_OUT = "campfire_user_logged_out",
  USER_PROFILE_UPDATED = "campfire_user_profile_updated",
  USER_PREFERENCES_CHANGED = "campfire_user_preferences_changed",
  USER_INVITED = "campfire_user_invited",
  USER_ACTIVATED = "campfire_user_activated",
  USER_DEACTIVATED = "campfire_user_deactivated",

  // Organization Events
  ORG_CREATED = "campfire_org_created",
  ORG_UPDATED = "campfire_org_updated",
  ORG_DELETED = "campfire_org_deleted",
  ORG_SETTINGS_CHANGED = "campfire_org_settings_changed",
  ORG_MEMBER_ADDED = "campfire_org_member_added",
  ORG_MEMBER_REMOVED = "campfire_org_member_removed",
  ORG_MEMBER_ROLE_CHANGED = "campfire_org_member_role_changed",

  // Knowledge Base Events
  KB_ARTICLE_CREATED = "campfire_kb_article_created",
  KB_ARTICLE_UPDATED = "campfire_kb_article_updated",
  KB_ARTICLE_DELETED = "campfire_kb_article_deleted",
  KB_ARTICLE_VIEWED = "campfire_kb_article_viewed",
  KB_SEARCH_PERFORMED = "campfire_kb_search_performed",
  KB_SEARCH_RESULT_CLICKED = "campfire_kb_search_result_clicked",

  // Integration Events
  INTEGRATION_CONNECTED = "campfire_integration_connected",
  INTEGRATION_DISCONNECTED = "campfire_integration_disconnected",
  INTEGRATION_ERROR = "campfire_integration_error",
  INTEGRATION_SYNC_STARTED = "campfire_integration_sync_started",
  INTEGRATION_SYNC_COMPLETED = "campfire_integration_sync_completed",
  INTEGRATION_SYNC_FAILED = "campfire_integration_sync_failed",

  // Performance Events
  PAGE_LOAD_TIME = "campfire_page_load_time",
  API_RESPONSE_TIME = "campfire_api_response_time",
  WIDGET_RENDER_TIME = "campfire_widget_render_time",
  AI_RESPONSE_TIME = "campfire_ai_response_time",

  // Error Events
  ERROR_OCCURRED = "campfire_error_occurred",
  ERROR_BOUNDARY_TRIGGERED = "campfire_error_boundary_triggered",
  API_ERROR = "campfire_api_error",
  NETWORK_ERROR = "campfire_network_error",
  VALIDATION_ERROR = "campfire_validation_error",

  // Feature Usage Events
  FEATURE_ENABLED = "campfire_feature_enabled",
  FEATURE_DISABLED = "campfire_feature_disabled",
  FEATURE_USED = "campfire_feature_used",
  EXPERIMENT_VIEWED = "campfire_experiment_viewed",
  EXPERIMENT_CONVERTED = "campfire_experiment_converted",
}

// Event data type definitions
export interface CampfireEventData {
  // Common properties for all events
  organizationId?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  source?: "widget" | "dashboard" | "api" | "system";
  version?: string;
  environment?: "development" | "staging" | "production";

  // Event-specific properties
  conversationId?: string;
  messageId?: string;
  handoverId?: string;
  articleId?: string;
  integrationId?: string;
  featureFlag?: string;
  experimentId?: string;
  errorCode?: string;
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

// Widget-specific event data
export interface WidgetEventData extends CampfireEventData {
  widgetId?: string;
  widgetVersion?: string;
  embedType?: "iframe" | "script" | "react";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: "light" | "dark" | "auto";
  language?: string;
}

// Conversation-specific event data
export interface ConversationEventData extends CampfireEventData {
  conversationId: string;
  participantCount?: number;
  messageCount?: number;
  duration?: number;
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  channel?: "widget" | "email" | "slack" | "api";
}

// Message-specific event data
export interface MessageEventData extends CampfireEventData {
  messageId: string;
  conversationId: string;
  messageType?: "text" | "image" | "file" | "system";
  messageLength?: number;
  attachmentCount?: number;
  isAiGenerated?: boolean;
  sentiment?: "positive" | "neutral" | "negative";
}

// AI-specific event data
export interface AIEventData extends CampfireEventData {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  responseTime?: number;
  confidence?: number;
  knowledgeBaseHits?: number;
  contextLength?: number;
}

// Handover-specific event data
export interface HandoverEventData extends CampfireEventData {
  handoverId: string;
  conversationId: string;
  fromUserId?: string;
  toUserId?: string;
  reason?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  estimatedWaitTime?: number;
  actualWaitTime?: number;
}

// Performance-specific event data
export interface PerformanceEventData extends CampfireEventData {
  metric: string;
  value: number;
  unit: "ms" | "seconds" | "bytes" | "count";
  threshold?: number;
  isSlowPerformance?: boolean;
  userAgent?: string;
  connectionType?: string;
}

// Error-specific event data
export interface ErrorEventData extends CampfireEventData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  severity?: "low" | "medium" | "high" | "critical";
  component?: string;
  action?: string;
  userAgent?: string;
  url?: string;
}

// Event validation
export function isValidEventName(eventName: string): boolean {
  return Object.values(CampfireEvents).includes(eventName as CampfireEvents);
}

export function validateEventName(eventName: string): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  if (!eventName) {
    return {
      isValid: false,
      error: "Event name is required",
    };
  }

  if (!eventName.startsWith("campfire_")) {
    return {
      isValid: false,
      error: 'Event name must start with "campfire_" prefix',
      suggestion: `campfire_${eventName}`,
    };
  }

  if (!isValidEventName(eventName)) {
    return {
      isValid: false,
      error: "Event name is not registered in CampfireEvents enum",
      suggestion: "Add the event to CampfireEvents enum or use an existing event",
    };
  }

  return { isValid: true };
}

// Event categorization
export function getEventCategory(eventName: CampfireEvents): string {
  if (eventName.includes("widget")) return "widget";
  if (eventName.includes("conversation")) return "conversation";
  if (eventName.includes("message")) return "message";
  if (eventName.includes("ai_")) return "ai";
  if (eventName.includes("handover")) return "handover";
  if (eventName.includes("user")) return "user";
  if (eventName.includes("org")) return "organization";
  if (eventName.includes("kb_")) return "knowledge_base";
  if (eventName.includes("integration")) return "integration";
  if (eventName.includes("error")) return "error";
  if (eventName.includes("feature") || eventName.includes("experiment")) return "feature";
  if (eventName.includes("time") || eventName.includes("performance")) return "performance";
  return "other";
}

// Event priority for monitoring
export function getEventPriority(eventName: CampfireEvents): "low" | "medium" | "high" | "critical" {
  const criticalEvents = [
    CampfireEvents.ERROR_OCCURRED,
    CampfireEvents.API_ERROR,
    CampfireEvents.NETWORK_ERROR,
    CampfireEvents.ERROR_BOUNDARY_TRIGGERED,
  ];

  const highEvents = [
    CampfireEvents.CONVERSATION_STARTED,
    CampfireEvents.HANDOVER_INITIATED,
    CampfireEvents.USER_AUTHENTICATED,
    CampfireEvents.INTEGRATION_ERROR,
  ];

  const mediumEvents = [
    CampfireEvents.MESSAGE_SENT,
    CampfireEvents.AI_RESPONSE_GENERATED,
    CampfireEvents.WIDGET_LOADED,
  ];

  if (criticalEvents.includes(eventName)) return "critical";
  if (highEvents.includes(eventName)) return "high";
  if (mediumEvents.includes(eventName)) return "medium";
  return "low";
}

// Legacy event migration mapping
export const LEGACY_EVENT_MAPPING: Record<string, CampfireEvents> = {
  conversation_started: CampfireEvents.CONVERSATION_STARTED,
  message_sent: CampfireEvents.MESSAGE_SENT,
  handover_initiated: CampfireEvents.HANDOVER_INITIATED,
  widget_loaded: CampfireEvents.WIDGET_LOADED,
  ai_response_generated: CampfireEvents.AI_RESPONSE_GENERATED,
  user_authenticated: CampfireEvents.USER_AUTHENTICATED,
  error_occurred: CampfireEvents.ERROR_OCCURRED,
  page_load_time: CampfireEvents.PAGE_LOAD_TIME,
  api_response_time: CampfireEvents.API_RESPONSE_TIME,
  feature_used: CampfireEvents.FEATURE_USED,
  integration_connected: CampfireEvents.INTEGRATION_CONNECTED,
  kb_search_performed: CampfireEvents.KB_SEARCH_PERFORMED,
  org_created: CampfireEvents.ORG_CREATED,
  user_invited: CampfireEvents.USER_INVITED,
  conversation_ended: CampfireEvents.CONVERSATION_ENDED,
  message_received: CampfireEvents.MESSAGE_RECEIVED,
  handover_completed: CampfireEvents.HANDOVER_COMPLETED,
  widget_opened: CampfireEvents.WIDGET_OPENED,
  ai_suggestion_shown: CampfireEvents.AI_SUGGESTION_SHOWN,
};

export function migrateLegacyEventName(legacyName: string): CampfireEvents | null {
  return LEGACY_EVENT_MAPPING[legacyName] || null;
}
