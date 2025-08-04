/**
 * Centralized Conversation type definitions
 * Single source of truth for all conversation-related types
 */

import type { Customer } from "./customer";
import type { Message } from "./message";

export type ConversationStatus = "open" | "closed" | "pending" | "resolved" | "spam";
export type ConversationPriority = "low" | "medium" | "high" | "urgent" | "critical";
export type ConversationChannel = "email" | "chat" | "sms" | "social" | "slack" | "voice";

export interface ConversationMetadata {
  source?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  [key: string]: unknown;
}

/**
 * Core Conversation interface
 * Used across the entire application
 */
export interface Conversation {
  id: number; // Changed from string to number to match database schema
  organizationId: string;
  customerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerAvatar?: string | null;
  subject?: string | null;
  status: ConversationStatus;
  priority?: ConversationPriority;
  channel?: ConversationChannel;
  assignedOperatorId?: string | null;
  assignedOperatorName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastMessageAt?: string | Date | null;
  lastMessageBy?: "customer" | "operator";
  lastMessagePreview?: string | null;
  unreadCount?: number;
  messageCount?: number;
  hasAttachments?: boolean;
  tags?: string[]; // Direct tags support (matches database schema)
  // RAG functionality is now handled transparently through operators
  metadata?: ConversationMetadata;

  // Legacy support - these should be migrated
  organization_id?: string; // Use organizationId instead
  customer_id?: string; // Use customerId instead
  customer_name?: string; // Use customerName instead
  customer_email?: string; // Use customerEmail instead
  assigned_to?: string; // Use assignedOperatorId instead
  created_at?: string; // Use createdAt instead
  updated_at?: string; // Use updatedAt instead
  last_message_at?: string; // Use lastMessageAt instead
  // rag_enabled removed - handled through operators
  preview?: string; // Use lastMessagePreview instead

  // AI metrics
  aiMetrics?: {
    confidence?: number;
    sentiment?: string;
    intent?: string;
  };
}

/**
 * Conversation with populated relations
 */
export interface ConversationWithRelations extends Conversation {
  messages?: Message[];
  customer?: Customer;
  assignedOperator?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status?: string;
  };
}

/**
 * Conversation list item (optimized for list views)
 */
export interface ConversationListItem {
  id: string;
  customerName: string | null;
  customerEmail: string;
  customerAvatar?: string | null;
  subject?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | Date | null;
  status: ConversationStatus;
  priority?: ConversationPriority;
  channel?: ConversationChannel;
  unreadCount: number;
  hasAttachments?: boolean;
  assignedOperatorName?: string | null;
  tags?: string[];
}

/**
 * Database insert type
 */
export interface ConversationInsert {
  organization_id: string;
  customer_id?: string;
  customer_name?: string | null;
  customerEmail: string;
  subject?: string | null;
  status?: ConversationStatus;
  priority?: ConversationPriority;
  channel?: ConversationChannel;
  assigned_operator_id?: string | null;
  metadata?: ConversationMetadata;
}

/**
 * Database update type
 */
export interface ConversationUpdate {
  subject?: string | null;
  status?: ConversationStatus;
  priority?: ConversationPriority;
  assigned_operator_id?: string | null;
  metadata?: ConversationMetadata;
  last_message_at?: string;
  last_message_preview?: string;
}

/**
 * Conversation assignment data
 */
export interface ConversationAssignment {
  conversationId: string;
  fromOperatorId?: string | null;
  toOperatorId: string;
  reason?: string;
  notes?: string;
  assignedAt: string | Date;
  assignedBy: string;
}
