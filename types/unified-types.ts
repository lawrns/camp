/**
 * Unified Type Definitions
 * 
 * This file provides a single source of truth for all entity types,
 * properly mapping between snake_case database fields and camelCase API types.
 * 
 * Generated from actual Supabase schema on 2025-01-01
 */

import { Database } from './supabase-generated';

// Extract database types
export type DatabaseConversation = Database['public']['Tables']['conversations']['Row'];
export type DatabaseMessage = Database['public']['Tables']['messages']['Row'];
export type DatabaseOrganization = Database['public']['Tables']['organizations']['Row'];
export type DatabaseTag = Database['public']['Tables']['tags']['Row'];
export type DatabaseConversationTag = Database['public']['Tables']['conversation_tags']['Row'];
export type DatabaseConversationNote = Database['public']['Tables']['conversation_notes']['Row'];
export type DatabaseConversationHistory = Database['public']['Tables']['conversation_history']['Row'];

// Extract enum types
export type ConversationPriority = Database['public']['Enums']['conversation_priority'];
export type ConversationStatus = Database['public']['Enums']['conversation_status'];

// Conversation types with proper camelCase mapping
export interface Conversation {
  // Primary fields (camelCase for API)
  id: string;
  organizationId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  subject?: string | null;
  status: ConversationStatus;
  priority?: ConversationPriority | null;
  channel?: string | null;
  
  // Assignment fields
  assignedOperatorId?: string | null; // Maps to assigned_to_user_id
  agentId?: string | null;
  assignedAt?: string | null;
  
  // AI fields
  aiHandoverActive?: boolean | null;
  aiPersona?: string | null;
  aiConfidenceScore?: number | null;
  ragEnabled?: boolean | null;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string | null;
  lastMessageAt?: string | null;
  closedAt?: string | null;
  
  // Metadata
  metadata?: Record<string, any> | null;
  customer?: Record<string, any> | null;
  tags?: string[] | null;
  
  // Customer context
  customerBrowser?: string | null;
  customerDeviceType?: string | null;
  customerIp?: unknown | null;
  customerOs?: string | null;
  customerOnline?: boolean | null;
  customerVerified?: boolean | null;
  
  // Legacy snake_case fields for backward compatibility
  organization_id?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  assigned_to_user_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
  last_message_at?: string | null;
}

// Message types with proper camelCase mapping
export interface Message {
  // Primary fields (camelCase for API) - All IDs are UUIDs (strings)
  id: string;
  conversationId: string;
  organizationId: string;
  content: string;
  
  // Sender information
  senderType: 'customer' | 'operator' | 'agent' | 'system' | 'visitor' | 'ai_assistant';
  senderId?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  operatorId?: string | null;
  
  // Message metadata
  role?: 'user' | 'assistant' | 'system' | 'tool' | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  source?: 'email' | 'chat' | 'api' | 'helpscout' | 'slack' | null;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string | null;
  readAt?: string | null;
  
  // Content and metadata
  metadata?: Record<string, any> | null;
  isDeleted?: boolean | null;
  typingDurationMs?: number | null;
  
  // Legacy snake_case fields for backward compatibility
  conversation_id?: string;
  organization_id?: string;
  sender_type?: 'customer' | 'operator' | 'agent' | 'system' | 'visitor' | 'ai_assistant';
  sender_id?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  operator_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
  read_at?: string | null;
}

// Widget-specific message type
export interface WidgetMessage extends Message {
  // Widget-specific fields
  visitorId?: string;
  sessionId?: string;
  widgetId?: string;
}

// Organization type
export interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  domain?: string | null;
  settings?: Record<string, any> | null;
  createdAt: string;
  updatedAt?: string | null;

  // Legacy fields
  created_at?: string;
  updated_at?: string | null;
}

// Tag type
export interface Tag {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: string;
  updatedAt?: string | null;

  // Legacy fields
  organization_id?: string;
  created_at?: string;
  updated_at?: string | null;
}

// Conversation Tag junction type
export interface ConversationTag {
  id: string;
  conversationId: string;
  tagId: string;
  createdAt: string;

  // Legacy fields
  conversation_id?: string;
  tag_id?: string;
  created_at?: string;
}

// Conversation Note type
export interface ConversationNote {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string | null;

  // Legacy fields
  conversation_id?: string;
  author_id?: string;
  is_private?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

// Conversation History type for audit trail
export interface ConversationHistory {
  id: string;
  conversationId: string;
  userId: string;
  action: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;

  // Legacy fields
  conversation_id?: string;
  user_id?: string;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  created_at?: string;
}

// Type conversion utilities
export function convertDatabaseConversationToApi(dbConv: DatabaseConversation): Conversation {
  return {
    // Primary fields
    id: dbConv.id,
    organizationId: dbConv.organization_id,
    customerId: dbConv.customer_id,
    customerName: dbConv.customerName,
    customerEmail: dbConv.customerEmail,
    subject: dbConv.subject,
    status: dbConv.status || 'open',
    priority: dbConv.priority,
    channel: dbConv.channel,
    
    // Assignment
    assignedOperatorId: dbConv.assigned_to_user_id,
    agentId: dbConv.agent_id,
    assignedAt: dbConv.assigned_at,
    
    // AI fields
    aiHandoverActive: dbConv.ai_handover_active,
    aiPersona: dbConv.ai_persona,
    aiConfidenceScore: dbConv.ai_confidence_score,
    ragEnabled: dbConv.rag_enabled,
    
    // Timestamps
    createdAt: dbConv.created_at || new Date().toISOString(),
    updatedAt: dbConv.updated_at,
    lastMessageAt: dbConv.lastMessageAt,
    closedAt: dbConv.closedAt,
    
    // Metadata
    metadata: dbConv.metadata as Record<string, any> | null,
    customer: dbConv.customer as Record<string, any> | null,
    tags: dbConv.tags,
    
    // Customer context
    customerBrowser: dbConv.customer_browser,
    customerDeviceType: dbConv.customer_device_type,
    customerIp: dbConv.customer_ip,
    customerOs: dbConv.customer_os,
    customerOnline: dbConv.customer_online,
    customerVerified: dbConv.customer_verified,
    
    // Legacy fields for backward compatibility
    organization_id: dbConv.organization_id,
    customer_id: dbConv.customer_id,
    customerName: dbConv.customerName,
    customerEmail: dbConv.customerEmail,
    assigned_to_user_id: dbConv.assigned_to_user_id,
    created_at: dbConv.created_at,
    updated_at: dbConv.updated_at,
    lastMessageAt: dbConv.lastMessageAt,
  };
}

export function convertDatabaseMessageToApi(dbMsg: DatabaseMessage): Message {
  return {
    // Primary fields
    id: dbMsg.id,
    conversationId: dbMsg.conversation_id,
    organizationId: dbMsg.organization_id,
    content: dbMsg.content || '',
    
    // Sender information
    senderType: dbMsg.senderType as Message['senderType'],
    senderId: dbMsg.senderId,
    senderName: dbMsg.senderName,
    senderEmail: dbMsg.senderEmail,
    operatorId: dbMsg.agent_id, // Use agent_id instead of operator_id
    
    // Message metadata - using available fields
    role: undefined, // Not available in database schema
    source: undefined, // Not available in database schema
    status: dbMsg.status as Message['status'],
    
    // Timestamps
    createdAt: dbMsg.created_at || new Date().toISOString(),
    updatedAt: dbMsg.updated_at,
    readAt: undefined, // Not available in database schema
    
    // Content and metadata
    metadata: dbMsg.metadata ? (dbMsg.metadata as Record<string, any>) : null,
    isDeleted: dbMsg.is_deleted,
    typingDurationMs: undefined, // Not available in database schema
    
    // Legacy fields
    conversation_id: dbMsg.conversation_id,
    organization_id: dbMsg.organization_id,
    senderType: dbMsg.senderType as Message['sender_type'],
    senderId: dbMsg.senderId,
    senderName: dbMsg.senderName,
    senderEmail: dbMsg.senderEmail,
    operator_id: dbMsg.agent_id, // Use agent_id instead of operator_id
    created_at: dbMsg.created_at,
    updated_at: dbMsg.updated_at,
    read_at: undefined, // Not available in database schema
  };
}

// Batch conversion utilities
export function convertDatabaseConversationsToApi(dbConversations: DatabaseConversation[]): Conversation[] {
  return dbConversations.map(convertDatabaseConversationToApi);
}

export function convertDatabaseMessagesToApi(dbMessages: DatabaseMessage[]): Message[] {
  return dbMessages.map(convertDatabaseMessageToApi);
}

// Type guards
export function isDatabaseConversation(obj: unknown): obj is DatabaseConversation {
  return obj && typeof obj.id === 'string' && typeof obj.organization_id === 'string';
}

export function isDatabaseMessage(obj: unknown): obj is DatabaseMessage {
  return obj && typeof obj.id === 'string' && typeof obj.conversation_id === 'string';
}

// Database types are already exported above

// Conversion utilities for new types
export function convertDatabaseTagToApi(dbTag: DatabaseTag): Tag {
  return {
    id: dbTag.id,
    name: dbTag.name,
    color: dbTag.color,
    organizationId: dbTag.organization_id,
    createdAt: dbTag.created_at || new Date().toISOString(),
    updatedAt: dbTag.updated_at,

    // Legacy fields
    organization_id: dbTag.organization_id,
    created_at: dbTag.created_at,
    updated_at: dbTag.updated_at,
  };
}

export function convertDatabaseConversationNoteToApi(dbNote: DatabaseConversationNote): ConversationNote {
  return {
    id: dbNote.id,
    conversationId: dbNote.conversation_id,
    authorId: dbNote.author_id,
    content: dbNote.content,
    isPrivate: dbNote.is_private || false,
    createdAt: dbNote.created_at || new Date().toISOString(),
    updatedAt: dbNote.updated_at,

    // Legacy fields
    conversation_id: dbNote.conversation_id,
    author_id: dbNote.author_id,
    is_private: dbNote.is_private,
    created_at: dbNote.created_at,
    updated_at: dbNote.updated_at,
  };
}

export function convertDatabaseConversationHistoryToApi(dbHistory: DatabaseConversationHistory): ConversationHistory {
  return {
    id: dbHistory.id,
    conversationId: dbHistory.conversation_id,
    userId: dbHistory.user_id,
    action: dbHistory.action,
    oldValue: dbHistory.old_value ? (dbHistory.old_value as Record<string, any>) : null,
    newValue: dbHistory.new_value ? (dbHistory.new_value as Record<string, any>) : null,
    metadata: dbHistory.metadata ? (dbHistory.metadata as Record<string, any>) : null,
    createdAt: dbHistory.created_at || new Date().toISOString(),

    // Legacy fields
    conversation_id: dbHistory.conversation_id,
    user_id: dbHistory.user_id,
    old_value: dbHistory.old_value ? (dbHistory.old_value as Record<string, any>) : null,
    new_value: dbHistory.new_value ? (dbHistory.new_value as Record<string, any>) : null,
    created_at: dbHistory.created_at,
  };
}

// Batch conversion utilities for new types
export function convertDatabaseTagsToApi(dbTags: DatabaseTag[]): Tag[] {
  return dbTags.map(convertDatabaseTagToApi);
}

export function convertDatabaseConversationNotesToApi(dbNotes: DatabaseConversationNote[]): ConversationNote[] {
  return dbNotes.map(convertDatabaseConversationNoteToApi);
}

export function convertDatabaseConversationHistoriesToApi(dbHistories: DatabaseConversationHistory[]): ConversationHistory[] {
  return dbHistories.map(convertDatabaseConversationHistoryToApi);
}

// Re-export the generated database type
export type { Database } from './supabase-generated';
