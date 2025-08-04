// 🔧 UPDATED TYPE MAPPER - CAMPFIRE V2
// This file maps database snake_case to unified camelCase types

import { generateUniqueVisitorName } from '@/lib/utils/nameGenerator';
import type {
  Conversation,
  Message,
  User,
  Organization,
  ConversationInsert,
  MessageInsert,
  UserInsert,
  OrganizationInsert,
  ConversationUpdate,
  MessageUpdate,
  UserUpdate,
  OrganizationUpdate,
  DbConversation,
  DbMessage,
  DbUser,
  DbOrganization
} from '@/types/unified';

// ============================================================================
// CONVERSATION MAPPERS
// ============================================================================

/**
 * Maps database conversation record (snake_case) to unified API type (camelCase)
 */
export function mapDbConversationToApi(dbConversation: DbConversation): Conversation {
  return {
    id: dbConversation.id,
    organizationId: dbConversation.organization_id,
    customerId: dbConversation.customer_id || undefined,
    customerEmail: dbConversation.customerEmail,
    customerName: dbConversation.customerName || generateUniqueVisitorName(dbConversation.id || 'anonymous'),
    customerAvatar: dbConversation.customer_avatar || undefined,
    subject: dbConversation.subject || undefined,
    status: dbConversation.status || 'open',
    priority: dbConversation.priority || 'medium',
    channel: (dbConversation.channel as unknown) || 'widget',
    assignedOperatorId: dbConversation.assigned_to_user_id || undefined,
    assignedOperatorName: undefined, // Not in DB schema
    assignedToAi: dbConversation.ai_handover_active || false,
    aiHandoverSessionId: dbConversation.ai_handover_session_id || undefined,
    createdAt: dbConversation.created_at,
    updatedAt: dbConversation.updated_at,
    lastMessageAt: dbConversation.lastMessageAt || undefined,
    lastMessageBy: undefined, // Not in DB schema
    lastMessagePreview: undefined, // Not in DB schema
    unreadCount: 0, // Calculated field
    messageCount: 0, // Calculated field
    hasAttachments: false, // Calculated field
    metadata: dbConversation.metadata || {},
    tags: [], // Not in DB schema
  };
}

/**
 * Maps API conversation insert (camelCase) to database format (snake_case)
 */
export function mapApiConversationToDbInsert(apiConversation: Partial<ConversationInsert>): DbConversation {
  const dbData: unknown = {
    organization_id: apiConversation.organization_id,
    customerEmail: apiConversation.customerEmail,
    subject: apiConversation.subject,
    status: apiConversation.status || 'open',
    priority: apiConversation.priority || 'medium',
    metadata: apiConversation.metadata || {},
  };

  // Only add optional fields if they have values
  if (apiConversation.customer_id) {
    dbData.customer_id = apiConversation.customer_id;
  }
  if (apiConversation.customerName) {
    dbData.customerName = apiConversation.customerName;
  }
  if (apiConversation.assigned_to_user_id) {
    dbData.assigned_to_user_id = apiConversation.assigned_to_user_id;
  }

  return dbData;
}

/**
 * Maps API conversation update (camelCase) to database format (snake_case)
 */
export function mapApiConversationToDbUpdate(apiUpdate: Partial<ConversationUpdate>): DbConversation {
  const dbUpdate: unknown = {};

  if (apiUpdate.subject !== undefined) dbUpdate.subject = apiUpdate.subject;
  if (apiUpdate.status !== undefined) dbUpdate.status = apiUpdate.status;
  if (apiUpdate.priority !== undefined) dbUpdate.priority = apiUpdate.priority;
  if (apiUpdate.assigned_to_user_id !== undefined) {
    dbUpdate.assigned_to_user_id = apiUpdate.assigned_to_user_id;
  }
  if (apiUpdate.metadata !== undefined) dbUpdate.metadata = apiUpdate.metadata;
  if (apiUpdate.lastMessageAt !== undefined) {
    dbUpdate.lastMessageAt = apiUpdate.lastMessageAt;
  }

  dbUpdate.updated_at = new Date().toISOString();

  return dbUpdate;
}

// ============================================================================
// MESSAGE MAPPERS
// ============================================================================

/**
 * Maps database message record (snake_case) to unified API type (camelCase)
 */
export function mapDbMessageToApi(dbMessage: DbMessage): Message {
  return {
    id: dbMessage.id,
    conversationId: dbMessage.conversation_id,
    organizationId: dbMessage.organization_id,
    content: dbMessage.content,
    senderType: dbMessage.senderType,
    senderId: dbMessage.senderId || undefined,
    senderName: undefined, // Not in DB schema
    senderEmail: undefined, // Not in DB schema
    messageType: dbMessage.message_type || 'text',
    metadata: dbMessage.metadata || {},
    aiConfidence: dbMessage.ai_confidence || undefined,
    aiSources: dbMessage.ai_sources || undefined,
    isDeleted: dbMessage.is_deleted || false,
    readStatus: undefined, // Not in DB schema
    readAt: undefined, // Not in DB schema
    deliveredAt: undefined, // Not in DB schema
    createdAt: dbMessage.created_at,
    updatedAt: dbMessage.updated_at,
  };
}

/**
 * Maps API message insert (camelCase) to database format (snake_case)
 */
export function mapApiMessageToDbInsert(apiMessage: Partial<MessageInsert>, organizationId: string): DbMessage {
  return {
    conversation_id: apiMessage.conversation_id!,
    organization_id: organizationId,
    content: apiMessage.content!,
    senderType: apiMessage.senderType!,
    senderId: apiMessage.senderId || null,
    message_type: apiMessage.message_type || 'text',
    metadata: apiMessage.metadata || null,
    ai_confidence: apiMessage.ai_confidence || null,
    ai_sources: apiMessage.ai_sources || null,
    is_deleted: apiMessage.is_deleted || false,
  };
}

/**
 * Maps API message update (camelCase) to database format (snake_case)
 */
export function mapApiMessageToDbUpdate(apiUpdate: Partial<MessageUpdate>): DbMessage {
  const dbUpdate: unknown = {};

  if (apiUpdate.content !== undefined) dbUpdate.content = apiUpdate.content;
  if (apiUpdate.metadata !== undefined) dbUpdate.metadata = apiUpdate.metadata;
  if (apiUpdate.is_deleted !== undefined) dbUpdate.is_deleted = apiUpdate.is_deleted;

  dbUpdate.updated_at = new Date().toISOString();

  return dbUpdate;
}

// ============================================================================
// USER MAPPERS
// ============================================================================

/**
 * Maps database user record (snake_case) to unified API type (camelCase)
 */
export function mapDbUserToApi(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    avatarUrl: dbUser.avatar_url || undefined,
    organizationId: dbUser.organization_id || undefined,
    role: dbUser.role,
    status: 'active', // Not in DB schema
    lastSeenAt: undefined, // Not in DB schema
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

/**
 * Maps API user insert (camelCase) to database format (snake_case)
 */
export function mapApiUserToDbInsert(apiUser: Partial<UserInsert>): DbUser {
  return {
    user_id: apiUser.user_id!,
    email: apiUser.email!,
    fullName: apiUser.fullName!,
    avatar_url: apiUser.avatar_url || null,
    organization_id: apiUser.organization_id || null,
    role: apiUser.role || 'visitor',
  };
}

/**
 * Maps API user update (camelCase) to database format (snake_case)
 */
export function mapApiUserToDbUpdate(apiUpdate: Partial<UserUpdate>): DbUser {
  const dbUpdate: unknown = {};

  if (apiUpdate.email !== undefined) dbUpdate.email = apiUpdate.email;
  if (apiUpdate.fullName !== undefined) dbUpdate.fullName = apiUpdate.fullName;
  if (apiUpdate.avatar_url !== undefined) dbUpdate.avatar_url = apiUpdate.avatar_url;
  if (apiUpdate.organization_id !== undefined) dbUpdate.organization_id = apiUpdate.organization_id;
  if (apiUpdate.role !== undefined) dbUpdate.role = apiUpdate.role;

  dbUpdate.updated_at = new Date().toISOString();

  return dbUpdate;
}

// ============================================================================
// ORGANIZATION MAPPERS
// ============================================================================

/**
 * Maps database organization record (snake_case) to unified API type (camelCase)
 */
export function mapDbOrganizationToApi(dbOrg: DbOrganization): Organization {
  return {
    id: dbOrg.id,
    name: dbOrg.name,
    slug: dbOrg.slug,
    description: dbOrg.description || undefined,
    settings: undefined, // Not in DB schema
    createdAt: dbOrg.created_at,
    updatedAt: dbOrg.updated_at,
  };
}

/**
 * Maps API organization insert (camelCase) to database format (snake_case)
 */
export function mapApiOrganizationToDbInsert(apiOrg: Partial<OrganizationInsert>): DbOrganization {
  return {
    name: apiOrg.name!,
    slug: apiOrg.slug!,
    description: apiOrg.description || null,
  };
}

/**
 * Maps API organization update (camelCase) to database format (snake_case)
 */
export function mapApiOrganizationToDbUpdate(apiUpdate: Partial<OrganizationUpdate>): DbOrganization {
  const dbUpdate: unknown = {};

  if (apiUpdate.name !== undefined) dbUpdate.name = apiUpdate.name;
  if (apiUpdate.slug !== undefined) dbUpdate.slug = apiUpdate.slug;
  if (apiUpdate.description !== undefined) dbUpdate.description = apiUpdate.description;

  dbUpdate.updated_at = new Date().toISOString();

  return dbUpdate;
}

// ============================================================================
// BATCH MAPPERS
// ============================================================================

/**
 * Maps array of database conversations to API format
 */
export function mapDbConversationsToApi(dbConversations: DbConversation[]): Conversation[] {
  return dbConversations.map(mapDbConversationToApi);
}

/**
 * Maps array of database messages to API format
 */
export function mapDbMessagesToApi(dbMessages: DbMessage[]): Message[] {
  return dbMessages.map(mapDbMessageToApi);
}

/**
 * Maps array of database users to API format
 */
export function mapDbUsersToApi(dbUsers: DbUser[]): User[] {
  return dbUsers.map(mapDbUserToApi);
}

/**
 * Maps array of database organizations to API format
 */
export function mapDbOrganizationsToApi(dbOrgs: DbOrganization[]): Organization[] {
  return dbOrgs.map(mapDbOrganizationToApi);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes query parameters to handle both camelCase and snake_case
 */
export function normalizeQueryParams(params: unknown): unknown {
  const normalized: unknown = {};
  
  for (const [key, value] of Object.entries(params)) {
    // Convert camelCase to snake_case for database queries
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    normalized[snakeKey] = value;
  }
  
  return normalized;
}

/**
 * Validates that a conversation object has required fields
 */
export function validateConversation(conversation: unknown): conversation is Conversation {
  return (
    conversation &&
    typeof conversation.id === 'string' &&
    typeof conversation.customerEmail === 'string' &&
    typeof conversation.customerName === 'string'
  );
}

/**
 * Validates that a message object has required fields
 */
export function validateMessage(message: unknown): message is Message {
  return (
    message &&
    typeof message.id === 'string' &&
    typeof message.conversationId === 'string' &&
    typeof message.content === 'string'
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  mapDbConversationToApi,
  mapApiConversationToDbInsert,
  mapApiConversationToDbUpdate,
  mapDbMessageToApi,
  mapApiMessageToDbInsert,
  mapApiMessageToDbUpdate,
  mapDbUserToApi,
  mapApiUserToDbInsert,
  mapApiUserToDbUpdate,
  mapDbOrganizationToApi,
  mapApiOrganizationToDbInsert,
  mapApiOrganizationToDbUpdate,
  mapDbConversationsToApi,
  mapDbMessagesToApi,
  mapDbUsersToApi,
  mapDbOrganizationsToApi,
  normalizeQueryParams,
  validateConversation,
  validateMessage,
};
