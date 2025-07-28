/**
 * Database Type Mappers
 *
 * Utilities to map between snake_case database fields and camelCase API types
 * This ensures consistency between the database schema and the API layer
 */

import type { Conversation, ConversationInsert, ConversationUpdate } from "@/types/entities/conversation";
import type { Message, MessageInsert } from "@/types/entities/message";

/**
 * Maps database conversation record (snake_case) to API conversation type (camelCase)
 */
export function mapDbConversationToApi(dbConversation: any): Conversation {
  return {
    id: dbConversation.id,
    organizationId: dbConversation.organization_id || dbConversation.organizationId,
    customerId: dbConversation.customer_id || dbConversation.customerId || "",
    customerName:
      dbConversation.customer_name || dbConversation.customerName || dbConversation.customer_display_name || null,
    customerEmail: dbConversation.customer_email || dbConversation.customerEmail || null,
    customerAvatar: dbConversation.customer_avatar || dbConversation.customerAvatar || null,
    subject: dbConversation.subject || null,
    status: dbConversation.status || "open",
    priority: dbConversation.priority || "medium",
    channel: dbConversation.channel || dbConversation.source || "chat",
    assignedOperatorId:
      dbConversation.assigned_operator_id || dbConversation.assignedOperatorId || dbConversation.assigned_to_id || null,
    assignedOperatorName: dbConversation.assigned_operator_name || dbConversation.assignedOperatorName || null,
    createdAt: dbConversation.created_at || dbConversation.createdAt,
    updatedAt: dbConversation.updated_at || dbConversation.updatedAt,
    lastMessageAt:
      dbConversation.last_message_at || dbConversation.lastMessageAt || dbConversation.last_reply_at || null,
    lastMessageBy: dbConversation.last_message_by || dbConversation.lastMessageBy || null,
    lastMessagePreview: dbConversation.last_message_preview || dbConversation.lastMessagePreview || null,
    unreadCount: dbConversation.unread_count || dbConversation.unreadCount || 0,
    messageCount: dbConversation.message_count || dbConversation.messageCount || 0,
    hasAttachments: dbConversation.has_attachments || dbConversation.hasAttachments || false,
    metadata: dbConversation.metadata || dbConversation.custom_fields || {},

    // Include snake_case versions for backward compatibility
    organization_id: dbConversation.organization_id,
    customer_id: dbConversation.customer_id,
    customer_name: dbConversation.customer_name || dbConversation.customer_display_name,
    customer_email: dbConversation.customer_email,
    assigned_to: dbConversation.assigned_to_id || dbConversation.assigned_to_user_id,
    assigned_to_ai: dbConversation.assigned_to_ai,
    assignee_id: dbConversation.assignee_id,
    created_at: dbConversation.created_at,
    updated_at: dbConversation.updated_at,
    last_message_at: dbConversation.last_message_at || dbConversation.last_reply_at,
  };
}

/**
 * Maps API conversation insert (camelCase) to database format (snake_case)
 */
export function mapApiConversationToDbInsert(apiConversation: Partial<ConversationInsert>): any {
  // Only include fields that actually exist in the database schema
  const dbData: any = {
    organization_id: apiConversation.organization_id,
    customer_email: apiConversation.customer_email,
    subject: apiConversation.subject,
    status: apiConversation.status || "open",
    priority: apiConversation.priority || "medium",
    metadata: apiConversation.metadata || {},
  };

  // Only add optional fields if they have values
  if (apiConversation.customer_id) {
    dbData.customer_id = apiConversation.customer_id;
  }
  if (apiConversation.customer_name) {
    dbData.customer_name = apiConversation.customer_name;
  }
  if (apiConversation.assigned_operator_id) {
    dbData.assigned_operator_id = apiConversation.assigned_operator_id;
  }

  return dbData;
}

/**
 * Maps API conversation update (camelCase) to database format (snake_case)
 */
export function mapApiConversationToDbUpdate(apiUpdate: Partial<ConversationUpdate>): any {
  const dbUpdate: any = {};

  if (apiUpdate.subject !== undefined) dbUpdate.subject = apiUpdate.subject;
  if (apiUpdate.status !== undefined) dbUpdate.status = apiUpdate.status;
  if (apiUpdate.priority !== undefined) dbUpdate.priority = apiUpdate.priority;
  if (apiUpdate.assigned_operator_id !== undefined) {
    dbUpdate.assigned_operator_id = apiUpdate.assigned_operator_id;
    dbUpdate.assigned_to_id = apiUpdate.assigned_operator_id;
  }
  if (apiUpdate.metadata !== undefined) dbUpdate.metadata = apiUpdate.metadata;
  if (apiUpdate.last_message_at !== undefined) {
    dbUpdate.last_message_at = apiUpdate.last_message_at;
    dbUpdate.last_reply_at = apiUpdate.last_message_at;
  }
  if (apiUpdate.last_message_preview !== undefined) {
    dbUpdate.last_message_preview = apiUpdate.last_message_preview;
  }

  dbUpdate.updated_at = new Date().toISOString();

  return dbUpdate;
}

/**
 * Maps database message record (snake_case) to API message type (camelCase)
 */
export function mapDbMessageToApi(dbMessage: any): Message {
  return {
    id: dbMessage.id,
    conversationId: dbMessage.conversation_id || dbMessage.conversationId,
    content: dbMessage.content || dbMessage.encrypted_content || "",
    senderType: dbMessage.sender_type || dbMessage.senderType,
    senderId: dbMessage.sender_id || dbMessage.senderId || dbMessage.sender_email || "",
    senderName: dbMessage.sender_name || dbMessage.senderName || null,
    senderEmail: dbMessage.sender_email || dbMessage.senderEmail || null,
    createdAt: dbMessage.created_at || dbMessage.createdAt,
    updatedAt: dbMessage.updated_at || dbMessage.updatedAt,
    metadata: dbMessage.metadata || {},
    attachments: dbMessage.attachments || [],
    status: dbMessage.status || dbMessage.delivery_status || "delivered",
    inReplyToId: dbMessage.reply_to_id || dbMessage.replyToId || dbMessage.in_reply_to_id || null,
    isDeleted: dbMessage.is_deleted || dbMessage.isDeleted || false,
    // editedAt field removed - not in Message type
    // readBy and reactions fields removed - not in Message type

    // Legacy support
    conversation_id: dbMessage.conversation_id,
    sender_type: dbMessage.sender_type,
    // sender_id field removed - not in Message type
    created_at: dbMessage.created_at,
  };
}

/**
 * Maps API message insert (camelCase) to database format (snake_case)
 */
export function mapApiMessageToDbInsert(apiMessage: Partial<MessageInsert>, organizationId: string): any {
  return {
    organization_id: organizationId,
    conversation_id: apiMessage.conversation_id,
    content: apiMessage.content,
    encrypted_content: apiMessage.content, // If encryption is enabled
    sender_type: apiMessage.sender_type || "customer",
    sender_id: apiMessage.sender_id,
    sender_name: apiMessage.sender_name,
    operator_id: apiMessage.operator_id,
    typing_duration_ms: apiMessage.typing_duration_ms,
    metadata: apiMessage.metadata || {},
    status: apiMessage.status,
    role: apiMessage.sender_type && apiMessage.sender_type === "agent" ? "assistant" : "user",
    source: "api",
    delivery_status: "delivered",
  };
}

/**
 * Batch conversion utilities
 */
export function mapDbConversationsToApi(dbConversations: any[]): Conversation[] {
  return dbConversations.map(mapDbConversationToApi);
}

export function mapDbMessagesToApi(dbMessages: any[]): Message[] {
  return dbMessages.map(mapDbMessageToApi);
}

/**
 * Helper to handle both snake_case and camelCase in query parameters
 */
export function normalizeQueryParams(params: any): any {
  const normalized: any = {};

  // Handle common query parameters
  normalized.organizationId = params.organization_id || params.organizationId;
  normalized.customerId = params.customer_id || params.customerId;
  normalized.conversationId = params.conversation_id || params.conversationId;
  normalized.status = params.status;
  normalized.priority = params.priority;
  normalized.assignedTo = params.assigned_to || params.assignedTo || params.assigned_operator_id;
  normalized.limit = params.limit ? parseInt(params.limit, 10) : 50;
  normalized.offset = params.offset ? parseInt(params.offset, 10) : 0;
  normalized.search = params.search || params.q;
  normalized.startDate = params.start_date || params.startDate;
  normalized.endDate = params.end_date || params.endDate;

  return normalized;
}
