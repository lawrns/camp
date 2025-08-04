/**
 * Centralized type definitions for tRPC routers
 * Ensures consistency across all router implementations
 */

import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import type { AuthenticatedUser } from "@/lib/core/auth";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Base context available to all procedures
 */
export interface BaseContext {
  user: AuthenticatedUser | null;
  db: unknown; // TODO: Type this properly with drizzle db type
  headers: Headers;
  supabase: SupabaseClient | null;
  tenantContext: TenantContext | null;
}

/**
 * Context for authenticated procedures
 */
export interface AuthenticatedContext extends BaseContext {
  user: AuthenticatedUser;
  supabase: SupabaseClient;
  tenantContext: TenantContext;
}

/**
 * Tenant context for multi-tenant operations
 */
export interface TenantContext {
  user: SupabaseUser;
  organizationId: string;
  scopedClient: SupabaseClient;
}

/**
 * Mailbox context type with all required fields
 */
export interface MailboxContext {
  id: number;
  slug: string;
  name: string;
  organizationId: string;

  // Core fields
  promptUpdatedAt: Date;
  widgetHMACSecret: string;

  // RAG configuration
  rag_enabled?: boolean;
  promptPrefix?: string;
  promptSuffix?: string;

  // GitHub integration
  githubInstallationId?: string | null;
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;

  // VIP configuration
  vipThreshold?: number | null;
  vipExpectedResponseHours?: number | null;
  vipChannelId?: string | null;

  // Widget configuration
  widgetConfig?: unknown;
  preferences?: unknown;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Allow additional properties
  [key: string]: unknown;
}

/**
 * Context with mailbox
 */
export interface MailboxProcedureContext extends AuthenticatedContext {
  mailbox: MailboxContext;
  dbMailbox?: unknown; // Original database mailbox object for serialization
  validatedMailboxId?: string | null;
}

/**
 * Conversation context type
 */
export interface ConversationContext {
  id: number;
  uid: string;
  subject?: string | null;
  mailboxId: number;
  status: string;
  embedding?: number[] | null;
  organizationId: string;

  // Customer info
  customerEmail?: string | null;
  customerId?: string;
  customerName?: string | null;
  customerAvatar?: string | null;

  // Assignment
  assignedToId?: string | null;
  assignedToUserId?: string | null;
  assignedOperatorId?: string | null;

  // Metadata
  lastMessageAt?: Date | null;
  lastActiveAt: Date;
  tags?: string[];
  priority?: string | null;
  source: "email" | "chat" | "api" | "helpscout" | "slack";

  // GitHub integration
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;

  // RAG
  lastRagResponseId?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Merged conversations
  mergedIntoId?: number | null;

  // Search similarity
  similarity?: number;
}

/**
 * Context with conversation
 */
export interface ConversationProcedureContext extends MailboxProcedureContext {
  conversation: ConversationContext;
  dbConversation: unknown; // Original database conversation object for serialization
  validatedConversationId?: string | null;
}

// ============================================================================
// COMMON INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Pagination input
 */
export interface PaginationInput {
  limit: number;
  offset: number;
}

/**
 * Search input for conversations
 */
export interface ConversationSearchInput extends PaginationInput {
  query?: string;
  status?: "open" | "closed" | "spam";
  assignedTo?: string;
  assignee?: string;
}

/**
 * Search result wrapper
 */
export interface SearchResultWrapper<T> {
  results: T[];
  nextCursor: string | null;
  total?: number;
}

/**
 * Search result item
 */
export type SearchResult<T> = T & {
  similarity?: number;
};

/**
 * Common response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// DATABASE TYPE MAPPINGS
// ============================================================================

/**
 * Helper type to convert bigint columns to numbers
 */
export type BigIntToNumber<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K];
};

/**
 * Helper to handle nullable database fields
 */
export type NullableFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface TRPCErrorData {
  code: string;
  message: string;
  details?: unknown;
}
