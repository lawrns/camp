/**
 * Database Type Mappers
 *
 * Utilities to map between snake_case database fields and camelCase API types
 * This ensures consistency between the database schema and the API layer
 */

// Note: Using any types for now since the exact type paths may vary
// These can be updated to use proper imports when the types are standardized

// Ticket types
export interface Ticket {
  id: string;
  organizationId: string;
  mailboxId: string;
  ticketNumber?: number;
  conversationId?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  reporterId?: string;
  customerId?: string;
  dueDate?: string;
  tags?: string[];
  metadata?: any;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TicketInsert {
  organization_id: string;
  mailbox_id: string;
  conversation_id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  reporter_id?: string;
  customer_id?: string;
  due_date?: string;
  tags?: string[];
  metadata?: any;
  created_by?: string;
}

/**
 * Maps database conversation record (snake_case) to API conversation type (camelCase)
 */
export function mapDbConversationToApi(dbConversation: any): any {
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
      dbConversation.assigned_operator_id || dbConversation.assignedOperatorId || dbConversation.assigned_to_user_id || dbConversation.assigned_to || null,
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
    assigned_to: dbConversation.assigned_to_user_id || dbConversation.assigned_operator_id || dbConversation.assigned_to,
    assigned_to_ai: dbConversation.assigned_to_ai,
    assignee_id: dbConversation.assignee_id || dbConversation.assigned_operator_id,
    created_at: dbConversation.created_at,
    updated_at: dbConversation.updated_at,
    last_message_at: dbConversation.last_message_at || dbConversation.last_reply_at,
  };
}

/**
 * Maps API conversation insert (camelCase) to database format (snake_case)
 */
export function mapApiConversationToDbInsert(apiConversation: any): any {
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
export function mapApiConversationToDbUpdate(apiUpdate: any): any {
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
export function mapDbMessageToApi(dbMessage: any): any {
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
export function mapApiMessageToDbInsert(apiMessage: any, organizationId: string): any {
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
export function mapDbConversationsToApi(dbConversations: any[]): any[] {
  return dbConversations.map(mapDbConversationToApi);
}

export function mapDbMessagesToApi(dbMessages: any[]): any[] {
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

/**
 * Maps database ticket record (snake_case) to API ticket type (camelCase)
 */
export function mapDbTicketToApi(dbTicket: any): Ticket {
  return {
    id: dbTicket.id,
    organizationId: dbTicket.organization_id || dbTicket.organizationId,
    mailboxId: dbTicket.mailbox_id || dbTicket.mailboxId,
    ticketNumber: dbTicket.ticket_number || dbTicket.ticketNumber,
    conversationId: dbTicket.conversation_id || dbTicket.conversationId,
    title: dbTicket.title,
    description: dbTicket.description,
    status: dbTicket.status || "open",
    priority: dbTicket.priority || "medium",
    assigneeId: dbTicket.assignee_id || dbTicket.assigneeId,
    reporterId: dbTicket.reporter_id || dbTicket.reporterId,
    customerId: dbTicket.customer_id || dbTicket.customerId,
    dueDate: dbTicket.due_date || dbTicket.dueDate,
    tags: dbTicket.tags || [],
    metadata: dbTicket.metadata || {},
    resolvedAt: dbTicket.resolved_at || dbTicket.resolvedAt,
    closedAt: dbTicket.closed_at || dbTicket.closedAt,
    createdAt: dbTicket.created_at || dbTicket.createdAt,
    updatedAt: dbTicket.updated_at || dbTicket.updatedAt,
    createdBy: dbTicket.created_by || dbTicket.createdBy,
  };
}

/**
 * Maps API ticket insert (camelCase) to database format (snake_case)
 */
export function mapApiTicketToDbInsert(apiTicket: Partial<TicketInsert>): any {
  const dbData: any = {
    organization_id: apiTicket.organization_id,
    mailbox_id: apiTicket.mailbox_id,
    title: apiTicket.title,
    status: apiTicket.status || "open",
    priority: apiTicket.priority || "medium",
    metadata: apiTicket.metadata || {},
  };

  // Only add optional fields if they have values
  if (apiTicket.conversation_id) {
    dbData.conversation_id = apiTicket.conversation_id;
  }
  if (apiTicket.description) {
    dbData.description = apiTicket.description;
  }
  if (apiTicket.assignee_id) {
    dbData.assignee_id = apiTicket.assignee_id;
  }
  if (apiTicket.reporter_id) {
    dbData.reporter_id = apiTicket.reporter_id;
  }
  if (apiTicket.customer_id) {
    dbData.customer_id = apiTicket.customer_id;
  }
  if (apiTicket.due_date) {
    dbData.due_date = apiTicket.due_date;
  }
  if (apiTicket.tags) {
    dbData.tags = apiTicket.tags;
  }
  if (apiTicket.created_by) {
    dbData.created_by = apiTicket.created_by;
  }

  return dbData;
}

/**
 * Batch conversion utilities for tickets
 */
export function mapDbTicketsToApi(dbTickets: any[]): Ticket[] {
  return dbTickets.map(mapDbTicketToApi);
}
