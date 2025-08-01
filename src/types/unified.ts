// 🔧 UNIFIED TYPE DEFINITIONS - CAMPFIRE V2
// This file centralizes all type definitions to eliminate snake_case violations

import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

// ============================================================================
// CORE ENTITY TYPES (CamelCase)
// ============================================================================

export interface Conversation {
  id: string;
  organizationId: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerAvatar?: string;
  subject?: string;
  status: 'open' | 'pending' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'widget' | 'email' | 'chat' | 'phone';
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  assignedToAi?: boolean;
  aiHandoverSessionId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  messageCount: number;
  hasAttachments: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  organizationId: string;
  content: string;
  senderType: 'user' | 'system' | 'agent' | 'bot' | 'visitor' | 'customer' | 'ai' | 'rag';
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'notification' | 'action' | 'automated';
  metadata?: Record<string, any>;
  aiConfidence?: number;
  aiSources?: any[];
  isDeleted?: boolean;
  readStatus?: 'sent' | 'delivered' | 'read';
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  organizationId?: string;
  role: 'visitor' | 'agent' | 'admin' | 'owner';
  status: 'active' | 'inactive';
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  realTimeTypingEnabled: boolean;
  autoAssignEnabled: boolean;
  ragEnabled: boolean;
  aiHandoverEnabled: boolean;
  widgetEnabled: boolean;
  notificationSettings?: Record<string, any>;
  businessHours?: Record<string, any>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ConversationCreateRequest {
  customerEmail: string;
  customerName?: string;
  subject?: string;
  initialMessage?: string;
  metadata?: Record<string, any>;
}

export interface ConversationUpdateRequest {
  status?: Conversation['status'];
  priority?: Conversation['priority'];
  assignedOperatorId?: string;
  metadata?: Record<string, any>;
  lastMessageAt?: string;
  lastMessagePreview?: string;
}

export interface MessageCreateRequest {
  content: string;
  senderType: Message['senderType'];
  senderName?: string;
  senderEmail?: string;
  messageType?: Message['messageType'];
  metadata?: Record<string, any>;
}

export interface MessageUpdateRequest {
  content?: string;
  metadata?: Record<string, any>;
  isDeleted?: boolean;
}

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface TypingIndicator {
  id: string;
  conversationId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeenAt: string;
}

// ============================================================================
// AI & RAG TYPES
// ============================================================================

export interface AISession {
  id: string;
  conversationId: string;
  organizationId: string;
  persona?: string;
  confidenceThreshold?: number;
  sessionMetadata?: Record<string, any>;
  status: 'active' | 'completed' | 'expired' | 'failed';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIHandover {
  id: string;
  conversationId: string;
  organizationId: string;
  status: 'ai_active' | 'requesting_agent' | 'agent_notified' | 'agent_joining' | 'agent_active' | 'handover_complete' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  sourceUrl?: string;
  embedding?: number[];
  chunkIndex?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANALYTICS & METRICS TYPES
// ============================================================================

export interface ConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  aiHandoverRate: number;
  resolutionRate: number;
}

export interface MessageMetrics {
  totalMessages: number;
  messagesByType: Record<string, number>;
  averageMessageLength: number;
  responseTimeDistribution: Record<string, number>;
}

// ============================================================================
// WIDGET TYPES
// ============================================================================

export interface WidgetConfig {
  organizationId: string;
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  welcomeMessage?: string;
  enabled: boolean;
}

export interface WidgetMessage {
  conversationId: string;
  content: string;
  senderType: 'visitor' | 'agent';
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ConversationStatus = Conversation['status'];
export type MessageSenderType = Message['senderType'];
export type MessageType = Message['messageType'];
export type UserRole = User['role'];
export type Priority = Conversation['priority'];

// ============================================================================
// DATABASE MAPPING TYPES
// ============================================================================

// Raw database types (snake_case) for internal use only
export type DbConversation = Tables<'conversations'>;
export type DbMessage = Tables<'messages'>;
export type DbUser = Tables<'profiles'>;
export type DbOrganization = Tables<'organizations'>;

// Insert types for database operations
export type ConversationInsert = TablesInsert<'conversations'>;
export type MessageInsert = TablesInsert<'messages'>;
export type UserInsert = TablesInsert<'profiles'>;
export type OrganizationInsert = TablesInsert<'organizations'>;

// Update types for database operations
export type ConversationUpdate = TablesUpdate<'conversations'>;
export type MessageUpdate = TablesUpdate<'messages'>;
export type UserUpdate = TablesUpdate<'profiles'>;
export type OrganizationUpdate = TablesUpdate<'organizations'>;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isConversation(obj: any): obj is Conversation {
  return obj && typeof obj.id === 'string' && typeof obj.customerEmail === 'string';
}

export function isMessage(obj: any): obj is Message {
  return obj && typeof obj.id === 'string' && typeof obj.conversationId === 'string';
}

export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Conversation,
  Message,
  User,
  Organization,
  OrganizationSettings,
  ConversationCreateRequest,
  ConversationUpdateRequest,
  MessageCreateRequest,
  MessageUpdateRequest,
  TypingIndicator,
  PresenceUpdate,
  AISession,
  AIHandover,
  KnowledgeDocument,
  ConversationMetrics,
  MessageMetrics,
  WidgetConfig,
  WidgetMessage,
  ConversationStatus,
  MessageSenderType,
  MessageType,
  UserRole,
  Priority,
  DbConversation,
  DbMessage,
  DbUser,
  DbOrganization,
  ConversationInsert,
  MessageInsert,
  UserInsert,
  OrganizationInsert,
  ConversationUpdate,
  MessageUpdate,
  UserUpdate,
  OrganizationUpdate,
}; 