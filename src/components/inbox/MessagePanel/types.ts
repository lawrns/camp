/**
 * Type definitions for MessagePanel components
 * @deprecated Use centralized types from @/types/entities/message instead
 */

// Re-export centralized types
export type {
  Message,
  MessageAttachment,
  CustomerData,
  MessageMetadata,
  MessageStatus,
  SenderType,
  DeliveryStatus,
  OptimisticMessage,
  DatabaseMessage,
  transformDatabaseMessage,
  transformToDatabase,
} from "@/types/entities/message";

// Legacy aliases for backward compatibility
export type Attachment = import("@/types/entities/message").MessageAttachment;

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

export interface Agent extends User {
  role: "agent" | "operator";
  isOnline?: boolean;
  status?: "available" | "busy" | "away";
}

export interface Conversation {
  id: string;
  customer_id: string;
  customer?: import("@/types/entities/message").CustomerData;
  status: ConversationStatus;
  channel: "email" | "chat" | "phone" | "social";
  subject?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  assigned_agent?: User;
  tags?: string[];
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  metadata?: Record<string, any>;
}

// Use centralized CustomerData type instead
export type Customer = import("@/types/entities/message").CustomerData;

export type ConversationStatus = "open" | "pending" | "resolved" | "closed" | "spam";

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

export interface MessagePanelState {
  messages: import("@/types/entities/message").Message[];
  isLoadingMessages: boolean;
  messageError: Error | null;
  typingUsers: TypingUser[];
  messageText: string;
  isSending: boolean;
  isFileUploading: boolean;
}

export interface MessagePanelActions {
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
  onStatusChange: (status: ConversationStatus, reason?: string) => void;
  onConvertToTicket: () => void;
  onAssignConversation: () => void;
  onMessageObserve?: (element: HTMLElement | null) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export interface MessagePanelProps extends MessagePanelState, MessagePanelActions {
  conversation: Conversation | null;
  customerData: Customer | null;
  isLoading: boolean;
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSending: boolean;
  isFileUploading?: boolean;
  placeholder?: string;
  conversationId?: string;
  lastCustomerMessage?: string;
  showAISuggestions?: boolean;
  className?: string;
}

export interface Tag {
  id: string;
  label: string;
  value: string;
  type: "mention" | "tag";
}

export interface AISuggestion {
  id: string;
  text: string;
  confidence: number;
  reasoning?: string;
}
