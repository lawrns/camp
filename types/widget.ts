/**
 * Widget-specific type definitions
 * Central location for all widget-related types to ensure consistency
 */

import type { Message, MessageAttachment } from "./entities/message";
import type { WidgetSettings } from "./widget-settings";

/**
 * Widget session data
 */
export interface WidgetSession {
  mailboxSlug: string;
  organizationId: string;
  visitorId: string;
  sessionId: string;
  email?: string;
  isAnonymous: boolean;
  isWhitelabel: boolean;
  theme?: unknown;
  title?: string;
  domain?: string;
  embedId?: string;
  expirationMs?: number;
}

/**
 * Widget API configuration
 */
export interface WidgetAPIConfig {
  apiUrl: string;
  organizationId: string;
  visitorId: string;
  sessionId?: string;
}

/**
 * Widget conversation type
 */
export interface WidgetConversation {
  id: string; // Standardized to string for consistency
  organizationId: string;
  visitorId: string;
  sessionId?: string;
  status: "active" | "closed" | "resolved";
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    currentUrl?: string;
    browser?: string;
    os?: string;
    device?: string;
  };
}

/**
 * Widget message format for API communication
 * This ensures consistency between client and server
 */
export interface WidgetMessagePayload {
  conversationId: string; // Standardized to string for consistency
  content: string;
  type?: "text" | "file" | "image";
  senderId: string;
  senderType: "visitor" | "operator" | "ai"; // "visitor" standardized instead of "customer"
  attachments?: MessageAttachment[] | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Widget message response from API
 */
export interface WidgetMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

/**
 * Widget realtime configuration
 */
export interface WidgetRealtimeConfig {
  realtimeToken: string;
  organizationId: string;
  sessionId: string;
  channels: {
    conversation: string;
    typing: string;
    presence: string;
  };
}

/**
 * Widget typing indicator
 */
export interface WidgetTypingIndicator {
  userId: string;
  userName?: string;
  conversationId: string; // Standardized to string for consistency
  isTyping: boolean;
  content?: string;
  timestamp: number;
  senderType?: "visitor" | "operator" | "ai";
}

/**
 * Widget initialization response
 */
export interface WidgetInitResponse {
  token: string;
  session: WidgetSession;
  settings: WidgetSettings;
  conversation?: WidgetConversation;
  realtimeConfig?: WidgetRealtimeConfig;
}

/**
 * Widget embed configuration
 */
export interface WidgetEmbedConfig {
  mailboxSlug: string;
  apiHost?: string;
  position?: "bottom-right" | "bottom-left";
  theme?: "light" | "dark" | "auto";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  autoOpen?: boolean;
  openDelay?: number;
  enableSounds?: boolean;
  locale?: string;
}

/**
 * Widget API response wrapper
 */
export interface WidgetAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Widget conversation create response
 */
export interface WidgetConversationCreateResponse extends WidgetAPIResponse {
  data?: {
    conversation: WidgetConversation;
    token?: string;
  };
}

/**
 * Widget settings response
 */
export interface WidgetSettingsResponse extends WidgetAPIResponse {
  data?: {
    settings: WidgetSettings;
  };
}

/**
 * Type guards for widget types
 */
export function isWidgetMessage(message: unknown): message is Message & { visitorId?: string; sessionId?: string } {
  return (
    message &&
    typeof message.id === "string" &&
    typeof message.content === "string" &&
    (message.senderType === "visitor" || message.senderType === "operator" || message.senderType === "ai")
  );
}

export function isWidgetTypingIndicator(data: unknown): data is WidgetTypingIndicator {
  return (
    data &&
    typeof data.userId === "string" &&
    typeof data.conversationId === "string" && // Updated to string
    typeof data.isTyping === "boolean" &&
    typeof data.timestamp === "number"
  );
}

/**
 * Utility function to convert between widget and regular message types
 */
export function convertToWidgetMessage(message: Message): WidgetMessagePayload {
  return {
    conversationId: message.conversationId?.toString() || "",
    content: message.content,
    type: "text",
    senderId: message.senderId || "",
    senderType: message.senderType === "customer" ? "visitor" : (message.senderType as unknown),
    attachments: message.attachments,
    metadata: message.metadata,
  };
}

/**
 * Utility function to convert widget message to regular message type
 */
export function convertFromWidgetMessage(widgetMessage: WidgetMessagePayload, messageId: string): Partial<Message> {
  return {
    id: messageId,
    conversationId: widgetMessage.conversationId,
    content: widgetMessage.content,
    senderId: widgetMessage.senderId,
    senderType: widgetMessage.senderType === "visitor" ? "customer" : widgetMessage.senderType as "agent" | "ai" | "system",
    attachments: widgetMessage.attachments ?? undefined,
    metadata: widgetMessage.metadata ?? undefined,
  };
}
