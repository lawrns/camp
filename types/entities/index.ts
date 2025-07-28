/**
 * Centralized Entity Types
 *
 * This is the single source of truth for all domain entity types.
 * Import types from this module instead of defining them locally.
 *
 * @example
 * import { Message, Conversation, User, Agent, Customer } from '@/types/entities';
 */

// Import types for interfaces and type guards
import type { Agent, AgentOption } from "./agent";
import type { Conversation, ConversationListItem } from "./conversation";
import type { Customer, CustomerListItem as CustomerListItemType } from "./customer";
import type { Message, SenderType } from "./message";
import type { Operator, OperatorOption } from "./operator";

// Message types
export type {
  Message,
  MessageRole,
  MessageStatus,
  SenderType,
  ContentType,
  MessageMetadata,
  MessageAttachment,
  RealtimeMessage,
  TypingIndicator,
  WidgetMessage,
  MessageInsert,
  MessageUpdate,
} from "./message";

// Conversation types
export type {
  Conversation,
  ConversationStatus,
  ConversationPriority,
  ConversationChannel,
  ConversationMetadata,
  ConversationWithRelations,
  ConversationListItem,
  ConversationInsert,
  ConversationUpdate,
  ConversationAssignment,
} from "./conversation";

// User types
export type {
  User,
  UserRole,
  UserStatus,
  UserProfile,
  AppUser,
  AuthState,
  AuthError,
  UserPreferences,
  ProfileRecord,
  OrganizationMember,
  UserSession,
} from "./user";

// Agent types (legacy - prefer Operator types)
export type {
  Agent,
  AgentStatus,
  AgentAvailability,
  ExpertiseLevel,
  AgentMetrics,
  AgentWorkload,
  AgentAssignmentPreferences,
  AgentOption,
  AgentHandoff,
  AgentRecord,
} from "./agent";

// Operator types (new unified model)
export type {
  Operator,
  OperatorStatus,
  OperatorWorkload,
  OperatorPresence,
  OperatorOption,
  OperatorAssignment,
  OperatorRecord,
  OperatorPresenceRecord,
  TypingIndicator as OperatorTypingIndicator,
  TypingIndicatorRecord,
  TypingCharacteristics,
} from "./operator";

// Customer types
export type {
  Customer,
  CustomerStatus,
  CustomerChannel,
  CustomerMetadata,
  CustomerPreferences,
  CustomerMetrics,
  CustomerProfile,
  CustomerNote,
  CustomerAttachment,
  CustomerListItem,
  CustomerRecord,
  CustomerSession,
} from "./customer";

// Re-export commonly used combinations
export interface ChatContext {
  conversation: Conversation;
  messages: Message[];
  customer: Customer;
  operator?: Operator;
  agent?: Agent; // Legacy support
}

export interface InboxItem {
  conversation: ConversationListItem;
  lastMessage?: Message;
  customer: CustomerListItemType;
  assignedOperator?: OperatorOption;
  assignedAgent?: AgentOption; // Legacy support
}

// Type guards
export const isCustomerMessage = (message: Message): boolean => {
  return message.senderType === "customer" || message.senderType === "visitor";
};

export const isOperatorMessage = (message: Message): boolean => {
  return message.senderType === "operator" || message.senderType === "agent";
};

// Legacy support
export const isAgentMessage = isOperatorMessage;

export const isSystemMessage = (message: Message): boolean => {
  return message.senderType === "system";
};

// Utility types for backwards compatibility
export type LegacyMessage = Message & {
  sender_type?: SenderType;
  conversation_id?: string;
  created_at?: string;
};

export type LegacyConversation = Conversation & {
  organization_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  assigned_to?: string; // Maps to assignedOperatorId
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
};
