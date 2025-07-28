/**
 * Type definitions for conversation components
 */

import { MessageRole } from "@/types/entities/message";

export interface Conversation {
  id: number;
  emailFrom: string;
  subject: string;
  status: "open" | "closed" | "spam";
  mailboxId: number;
  assignedToClerkId?: string;
  ragEnabled: boolean;
  ragProfileId?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: {
    id: number;
    body: string;
    role: MessageRole;
    createdAt: Date;
  };
}

export interface ConversationMessage {
  id: number;
  conversationId: string;
  role: MessageRole;
  body: string;
  deliveryStatus: "sending" | "sent" | "delivered" | "read" | "error";
  reactionType?: "thumbs-up" | "thumbs-down";
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContextType {
  // State
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;

  // Actions
  selectConversation: (conversationId: string) => void;
  createConversation: (mailboxId: number, customerEmail: string, subject: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string, role?: string) => Promise<void>;
  updateConversationStatus: (conversationId: string, status: string) => Promise<void>;
  assignAgent: (conversationId: string, agentId: string) => Promise<void>;
  enableRAG: (conversationId: string, enabled: boolean, profileId?: string) => Promise<void>;
  refreshConversations: () => void;
}

// Realtime payload types
export interface RealtimePayload<T = unknown> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old?: T;
  schema: string;
  table: string;
}

// TRPC mutation types
export interface MutationError {
  message: string;
  code?: string;
  statusCode?: number;
}

// TRPC query types
export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface MutationResult<TData = unknown, TVariables = unknown> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
}
