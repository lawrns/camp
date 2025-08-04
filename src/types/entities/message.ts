/**
 * Centralized Message type definitions
 * Single source of truth for all message-related types
 */

export type MessageRole = "user" | "assistant" | "system" | "tool";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed" | "pending";
export type SenderType = "customer" | "operator" | "agent" | "system" | "visitor" | "ai_assistant";
export type ContentType = "text" | "html" | "markdown";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

export interface MessageMetadata {
  handoffReason?: string;
  errorDetails?: string;
  typingDurationMs?: number;
  confidence?: number;
  reasoning?: string;
  tool?: {
    toolName: string;
    parameters: Record<string, unknown>;
    result?: unknown;
  };
  [key: string]: unknown;
}

export interface MessageAttachment {
  id: string;
  messageId?: string;
  url: string;
  filename: string;
  name?: string; // Alias for filename
  mimeType: string;
  size: number;
  contentType?: string;
  type?: string; // Alias for mimeType
  createdAt?: string | Date;
}

/**
 * Core Message interface
 * Used across the entire application
 */
export interface Message {
  id: number; // Changed from string to number to match database schema
  conversationId: number; // Changed from string to number to match database schema
  content: string;
  senderType: SenderType;
  senderId?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  operatorId?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | undefined;
  readAt?: string | Date | null;
  status?: MessageStatus | undefined;
  deliveryStatus?: DeliveryStatus | undefined;
  contentType?: ContentType | undefined;
  role?: MessageRole | undefined;
  source?: "email" | "chat" | "api" | "helpscout" | "slack" | undefined;
  attachments?: MessageAttachment[] | undefined;
  metadata?: MessageMetadata | undefined;
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  senderAvatarUrl?: string;

  // Database compatibility fields
  organizationId?: string;
  organization_id?: string;
  inReplyToId?: number | null; // Changed from string to number
  responseToId?: number | null; // Changed from string to number
  validatedMailboxId?: string;
  gmailThreadId?: string;
  gmailMessageId?: string;
  cleanedUpText?: string;
  isPrompt?: boolean;
  body?: string;
  clerkUserId?: string;
  embedding?: number[];
  embeddingText?: string;

  // Additional compatibility fields
  created_at?: string | Date;
  updated_at?: string | Date;
  deliveryMetadata?: Record<string, any>;
  sourceData?: Record<string, any>;
  summary?: string[];

  // Legacy support fields - snake_case variants
  sender_type?: SenderType;
  sender_name?: string;
  sender_email?: string;
  sender_avatar_url?: string;
  conversation_id?: number; // Changed from string to number
  read_at?: string | Date | null;
  delivery_status?: DeliveryStatus;
  read_status?: string;

  // Optimistic update fields
  temp_id?: string;
  is_optimistic?: boolean;
  error?: string;

  // Alternative field names for compatibility
  text?: string; // Use content instead
  author?: string; // Use senderId instead
  ts?: string; // Use createdAt instead

  // AI-specific fields
  confidence_score?: number;
}

/**
 * Message type for real-time updates
 */
export interface RealtimeMessage extends Message {
  eventType?: "created" | "updated" | "deleted";
  previousStatus?: MessageStatus;
}

/**
 * Optimistic message for UI updates
 */
export interface OptimisticMessage extends Message {
  temp_id: string;
  is_optimistic: true;
  error?: string;
  isPending?: boolean;
  timestamp?: Date;
}

/**
 * Message type for typing indicators
 */
export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
  content?: string;
  timestamp: Date;
  senderType?: SenderType;
}

/**
 * Message type for visitor/widget context
 * Extends base Message with widget-specific fields
 */
export interface WidgetMessage extends Omit<Message, "role"> {
  // Widget-specific fields
  visitorId?: string;
  sessionId?: string;
  widgetId?: string;

  // Override role to be widget-specific (optional - can use base Message roles)
  role?: "visitor" | "operator" | "system" | "assistant" | "user";
}

/**
 * Customer data interface for message context
 */
export interface CustomerData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
  avatar_url?: string;
  location?: {
    city?: string;
    country?: string;
    region?: string;
    timezone?: string;
  };
  location_info?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  localTime?: string;
  company?: string;
  role?: string;
  phone?: string;
  lastSeen?: string;
  last_active_at?: string;
  firstSeen?: string;
  sessions?: number;
  browser?: string;
  os?: string;
  deviceType?: "desktop" | "mobile" | "tablet" | "unknown";
  ipAddress?: string;
  customAttributes?: Record<string, string>;
  tags?: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  displayName?: string;
  initials?: string;
  fallbackGradient?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
  metadata?: Record<string, any>;
  verification_status?: "verified" | "unverified" | "pending";
  browser_info?: {
    userAgent?: string;
    language?: string;
    platform?: string;
    cookieEnabled?: boolean;
  };
  engagement_metrics?: {
    total_messages?: number;
    avg_response_time?: number;
    satisfaction_score?: number;
    last_feedback_at?: string;
  };
}

/**
 * Database Message type (snake_case from database schema)
 */
export interface DatabaseMessage {
  id: number; // Changed from string to number to match database schema
  organization_id: string;
  conversation_id: number; // Changed from string to number to match database schema
  content: string;
  sender_name?: string | null;
  sender_email?: string | null;
  senderType: SenderType;
  role?: MessageRole;
  source?: "email" | "chat" | "api" | "helpscout" | "slack";
  in_reply_to_id?: number | null; // Changed from string to number
  response_to_id?: number | null; // Changed from string to number
  is_deleted?: boolean;
  deleted_at?: string | Date | null;
  validated_mailbox_id?: string;
  gmail_thread_id?: string;
  gmail_message_id?: string;
  cleaned_up_text?: string;
  is_prompt?: boolean;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  summary?: string[];
  embedding?: number[];
  embedding_text?: string;
  delivery_status?: DeliveryStatus;
  delivery_metadata?: Record<string, any>;
  source_data?: Record<string, any>;
  body?: string;
  clerk_user_id?: string;
  status?: MessageStatus;
  created_at: string | Date;
  updated_at?: string | Date;
}

/**
 * Transform database message to app message
 */
export function transformDatabaseMessage(dbMessage: DatabaseMessage): Message {
  const message: Message = {
    id: dbMessage.id,
    conversationId: dbMessage.conversation_id,
    content: dbMessage.content,
    senderType: dbMessage.senderType,
    senderName: dbMessage.senderName ?? null,
    senderEmail: dbMessage.senderEmail ?? null,
    createdAt: dbMessage.created_at,
    organizationId: dbMessage.organization_id,
    // Required legacy fields
    senderType: dbMessage.senderType,
    conversation_id: dbMessage.conversation_id,
    created_at: dbMessage.created_at,
    organization_id: dbMessage.organization_id,
  };

  // Optional fields - only add if defined
  if (dbMessage.role !== undefined) message.role = dbMessage.role;
  if (dbMessage.source !== undefined) message.source = dbMessage.source;
  if (dbMessage.updated_at !== undefined) message.updatedAt = dbMessage.updated_at;
  if (dbMessage.status !== undefined) message.status = dbMessage.status;
  if (dbMessage.delivery_status !== undefined) message.deliveryStatus = dbMessage.delivery_status;
  if (dbMessage.metadata !== undefined) message.metadata = dbMessage.metadata;
  if (dbMessage.attachments !== undefined) message.attachments = dbMessage.attachments;
  if (dbMessage.is_deleted !== undefined) message.isDeleted = dbMessage.is_deleted;
  if (dbMessage.deleted_at !== undefined) message.deletedAt = dbMessage.deleted_at;
  if (dbMessage.in_reply_to_id !== undefined) message.inReplyToId = dbMessage.in_reply_to_id;
  if (dbMessage.response_to_id !== undefined) message.responseToId = dbMessage.response_to_id;
  if (dbMessage.validated_mailbox_id !== undefined) message.validatedMailboxId = dbMessage.validated_mailbox_id;
  if (dbMessage.gmail_thread_id !== undefined) message.gmailThreadId = dbMessage.gmail_thread_id;
  if (dbMessage.gmail_message_id !== undefined) message.gmailMessageId = dbMessage.gmail_message_id;
  if (dbMessage.cleaned_up_text !== undefined) message.cleanedUpText = dbMessage.cleaned_up_text;
  if (dbMessage.is_prompt !== undefined) message.isPrompt = dbMessage.is_prompt;
  if (dbMessage.body !== undefined) message.body = dbMessage.body;
  if (dbMessage.clerk_user_id !== undefined) message.clerkUserId = dbMessage.clerk_user_id;
  if (dbMessage.embedding !== undefined) message.embedding = dbMessage.embedding;
  if (dbMessage.embedding_text !== undefined) message.embeddingText = dbMessage.embedding_text;
  if (dbMessage.delivery_metadata !== undefined) message.deliveryMetadata = dbMessage.delivery_metadata;
  if (dbMessage.source_data !== undefined) message.sourceData = dbMessage.source_data;
  if (dbMessage.summary !== undefined) message.summary = dbMessage.summary;

  // Legacy fields - only add if defined and not null
  if (dbMessage.senderName !== undefined && dbMessage.senderName !== null)
    message.senderName = dbMessage.senderName;
  if (dbMessage.senderEmail !== undefined && dbMessage.senderEmail !== null)
    message.senderEmail = dbMessage.senderEmail;
  if (dbMessage.updated_at !== undefined) message.updated_at = dbMessage.updated_at;
  if (dbMessage.delivery_status !== undefined) message.delivery_status = dbMessage.delivery_status;

  return message;
}

/**
 * Transform app message to database insert
 */
export function transformToDatabase(message: Partial<Message>): Partial<DatabaseMessage> {
  const result: Partial<DatabaseMessage> = {};

  // Handle required fields with proper type narrowing
  const conversationId = message.conversationId ?? message.conversation_id;
  if (conversationId !== undefined) {
    result.conversation_id = conversationId;
  }
  if (message.content !== undefined) {
    result.content = message.content;
  }
  const senderType = message.senderType ?? message.senderType;
  if (senderType !== undefined) {
    result.senderType = senderType;
  }
  const senderName = message.senderName ?? message.senderName;
  if (senderName !== undefined) {
    result.senderName = senderName;
  }
  const senderEmail = message.senderEmail ?? message.senderEmail;
  if (senderEmail !== undefined) {
    result.senderEmail = senderEmail;
  }
  if (message.role !== undefined) {
    result.role = message.role;
  }
  if (message.source !== undefined) {
    result.source = message.source;
  }
  if (message.metadata !== undefined) {
    result.metadata = message.metadata;
  }
  if (message.status !== undefined) {
    result.status = message.status;
  }
  const deliveryStatus = message.deliveryStatus ?? message.delivery_status;
  if (deliveryStatus !== undefined) {
    result.delivery_status = deliveryStatus;
  }
  const organizationId = message.organizationId ?? message.organization_id;
  if (organizationId !== undefined) {
    result.organization_id = organizationId;
  }
  if (message.inReplyToId !== undefined) {
    result.in_reply_to_id = message.inReplyToId;
  }
  if (message.responseToId !== undefined) {
    result.response_to_id = message.responseToId;
  }
  if (message.isDeleted !== undefined) {
    result.is_deleted = message.isDeleted;
  }
  if (message.deletedAt !== undefined) {
    result.deleted_at = message.deletedAt;
  }
  if (message.validatedMailboxId !== undefined) {
    result.validated_mailbox_id = message.validatedMailboxId;
  }
  if (message.gmailThreadId !== undefined) {
    result.gmail_thread_id = message.gmailThreadId;
  }
  if (message.gmailMessageId !== undefined) {
    result.gmail_message_id = message.gmailMessageId;
  }
  if (message.cleanedUpText !== undefined) {
    result.cleaned_up_text = message.cleanedUpText;
  }
  if (message.isPrompt !== undefined) {
    result.is_prompt = message.isPrompt;
  }
  if (message.body !== undefined) {
    result.body = message.body;
  }
  if (message.clerkUserId !== undefined) {
    result.clerk_user_id = message.clerkUserId;
  }
  if (message.embedding !== undefined) {
    result.embedding = message.embedding;
  }
  if (message.embeddingText !== undefined) {
    result.embedding_text = message.embeddingText;
  }
  if (message.deliveryMetadata !== undefined) {
    result.delivery_metadata = message.deliveryMetadata;
  }
  if (message.sourceData !== undefined) {
    result.source_data = message.sourceData;
  }
  if (message.summary !== undefined) {
    result.summary = message.summary;
  }
  if (message.attachments !== undefined) {
    result.attachments = message.attachments;
  }

  return result;
}

/**
 * Database insert type
 */
export interface MessageInsert {
  conversation_id: number; // Changed from string to number to match database schema
  content: string;
  senderType: SenderType;
  sender_id?: string | null;
  sender_name?: string | null;
  operator_id?: string | null;
  typing_duration_ms?: number;
  metadata?: MessageMetadata;
  status?: MessageStatus;
}

/**
 * Database update type
 */
export interface MessageUpdate {
  content?: string;
  status?: MessageStatus;
  metadata?: MessageMetadata;
  read_at?: string | null;
}
