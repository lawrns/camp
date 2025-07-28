/**
 * Service Interface Definitions
 *
 * Defines contracts for core services without implementation dependencies.
 * This allows modules to depend on interfaces rather than concrete implementations,
 * breaking circular dependencies.
 */

import type { User } from "@/lib/supabase/types";

// ============================================================================
// Authentication Service Interface
// ============================================================================

export interface IAuthService {
  getUser(): Promise<User | null>;
  getUserWithOrg(): Promise<{ user: User; orgId: string } | null>;
  validateSession(sessionId: string): Promise<boolean>;
  createSession(userId: string): Promise<string>;
  destroySession(sessionId: string): Promise<void>;
}

// ============================================================================
// Realtime Service Interface
// ============================================================================

export interface IRealtimeChannel {
  subscribe(): void;
  unsubscribe(): void;
  send(event: string, payload: any): void;
  on(event: string, callback: (payload: any) => void): void;
}

export interface IRealtimeService {
  createChannel(name: string, orgId: string): IRealtimeChannel;
  subscribeToConversation(conversationId: string, callbacks: RealtimeCallbacks): IRealtimeChannel;
  cleanup(): void;
}

export interface RealtimeCallbacks {
  onMessage?: (message: any) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onPresence?: (users: string[]) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// AI Service Interface
// ============================================================================

export interface IAIService {
  generateResponse(query: string, context: AIContext): Promise<AIResponse>;
  calculateConfidence(response: string, context: AIContext): Promise<number>;
  shouldEscalate(confidence: number, context: AIContext): boolean;
}

export interface AIContext {
  organizationId: string;
  conversationId: string;
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>;
  knowledgeBase?: string[];
  customerInfo?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  shouldEscalate: boolean;
  escalationReason?: string;
}

// ============================================================================
// Message Service Interface
// ============================================================================

export interface IMessageService {
  sendMessage(conversationId: string, content: string, sender: MessageSender): Promise<string>;
  getMessage(messageId: string): Promise<Message | null>;
  getConversationMessages(conversationId: string, options?: MessageQueryOptions): Promise<Message[]>;
  updateMessage(messageId: string, updates: Partial<Message>): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
}

export interface MessageSender {
  id: string;
  type: "user" | "agent" | "ai";
  name?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  metadata?: Record<string, any>;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface MessageQueryOptions {
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
  includeMeta?: boolean;
}

// ============================================================================
// Conversation Service Interface
// ============================================================================

export interface IConversationService {
  createConversation(orgId: string, customerId: string, options?: ConversationOptions): Promise<number>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void>;
  assignConversation(conversationId: string, agentId: string): Promise<void>;
  closeConversation(conversationId: string, reason?: string): Promise<void>;
}

export interface Conversation {
  id: number;
  organizationId: string;
  customerId: string;
  assignedAgentId?: string;
  status: "open" | "assigned" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

export interface ConversationOptions {
  priority?: Conversation["priority"];
  tags?: string[];
  metadata?: Record<string, any>;
  autoAssign?: boolean;
}

// ============================================================================
// RAG Service Interface
// ============================================================================

export interface IRAGService {
  search(query: string, orgId: string, options?: RAGSearchOptions): Promise<RAGSearchResult[]>;
  ingestDocument(document: Document, orgId: string): Promise<void>;
  updateDocument(documentId: string, updates: Partial<Document>): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
}

export interface RAGSearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  filters?: Record<string, any>;
}

export interface RAGSearchResult {
  content: string;
  score: number;
  documentId: string;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  organizationId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Database Service Interface
// ============================================================================

export interface ISupabaseService {
  // Auth operations
  auth: {
    getUser(): Promise<{ data: { user: User | null }; error: any }>;
    signOut(): Promise<{ error: any }>;
  };

  // Database operations
  from(table: string): SupabaseQueryBuilder;

  // Realtime operations
  channel(name: string): IRealtimeChannel;
}

export interface SupabaseQueryBuilder {
  select(columns?: string): SupabaseQueryBuilder;
  insert(data: any): SupabaseQueryBuilder;
  update(data: any): SupabaseQueryBuilder;
  delete(): SupabaseQueryBuilder;
  eq(column: string, value: any): SupabaseQueryBuilder;
  neq(column: string, value: any): SupabaseQueryBuilder;
  in(column: string, values: any[]): SupabaseQueryBuilder;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder;
  limit(count: number): SupabaseQueryBuilder;
  single(): Promise<{ data: any; error: any }>;
  then(callback: (result: { data: any; error: any }) => any): Promise<any>;
}

// ============================================================================
// Event Service Interface
// ============================================================================

export interface IEventService {
  emit<T>(event: string, data: T): Promise<void>;
  on<T>(event: string, callback: (data: T) => void): { unsubscribe(): void };
  once<T>(event: string, callback: (data: T) => void): { unsubscribe(): void };
  off(event: string): void;
}

// ============================================================================
// Service Factory Types
// ============================================================================

export type ServiceFactory<T> = () => T;

export interface ServiceDefinition<T> {
  instance?: T;
  factory?: ServiceFactory<T>;
  singleton?: boolean;
}

// ============================================================================
// Dependency Injection Container Interface
// ============================================================================

export interface IContainer {
  register<T>(name: string, instance: T): void;
  registerFactory<T>(name: string, factory: ServiceFactory<T>, singleton?: boolean): void;
  get<T>(name: string): T;
  has(name: string): boolean;
  clear(): void;
}
