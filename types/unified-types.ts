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

// Conversation types with proper camelCase mapping
export interface Conversation {
  // Primary fields (camelCase for API)
  id: string;
  organizationId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  subject?: string | null;
  status: string;
  priority?: string | null;
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

// Type conversion utilities
export function convertDatabaseConversationToApi(dbConv: DatabaseConversation): Conversation {
  return {
    // Primary fields
    id: dbConv.id,
    organizationId: dbConv.organization_id,
    customerId: dbConv.customer_id,
    customerName: dbConv.customer_name,
    customerEmail: dbConv.customer_email,
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
    lastMessageAt: dbConv.last_message_at,
    closedAt: dbConv.closed_at,
    
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
    customer_name: dbConv.customer_name,
    customer_email: dbConv.customer_email,
    assigned_to_user_id: dbConv.assigned_to_user_id,
    created_at: dbConv.created_at,
    updated_at: dbConv.updated_at,
    last_message_at: dbConv.last_message_at,
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
    senderType: dbMsg.sender_type as Message['senderType'],
    senderId: dbMsg.sender_id,
    senderName: dbMsg.sender_name,
    senderEmail: dbMsg.sender_email,
    operatorId: dbMsg.operator_id,
    
    // Message metadata
    role: dbMsg.role as Message['role'],
    source: dbMsg.source as Message['source'],
    
    // Timestamps
    createdAt: dbMsg.created_at || new Date().toISOString(),
    updatedAt: dbMsg.updated_at,
    readAt: dbMsg.read_at,
    
    // Content and metadata
    metadata: dbMsg.metadata as Record<string, any> | null,
    isDeleted: dbMsg.is_deleted,
    typingDurationMs: dbMsg.typing_duration_ms,
    
    // Legacy fields
    conversation_id: dbMsg.conversation_id,
    organization_id: dbMsg.organization_id,
    sender_type: dbMsg.sender_type as Message['sender_type'],
    sender_id: dbMsg.sender_id,
    sender_name: dbMsg.sender_name,
    sender_email: dbMsg.sender_email,
    operator_id: dbMsg.operator_id,
    created_at: dbMsg.created_at,
    updated_at: dbMsg.updated_at,
    read_at: dbMsg.read_at,
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
export function isDatabaseConversation(obj: any): obj is DatabaseConversation {
  return obj && typeof obj.id === 'string' && typeof obj.organization_id === 'string';
}

export function isDatabaseMessage(obj: any): obj is DatabaseMessage {
  return obj && typeof obj.id === 'string' && typeof obj.conversation_id === 'string';
}

// Export database types for direct use
export type { DatabaseConversation, DatabaseMessage, DatabaseOrganization };

// Re-export the generated database type
export type { Database } from './supabase-generated';
