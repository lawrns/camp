import type { Agent, Conversation, Message } from "@/types/entities";
import { MessageMetadata, MessageRole, MessageStatus } from "@/types/entities/message";

/**
 * Type definitions for chat components
 * @deprecated Use centralized types from @/types/entities instead
 */

// Re-export centralized types for backwards compatibility
export type { Customer, Message, Conversation, Agent } from "@/types/entities";

// Legacy Operator type - use Agent instead
export type Operator = Agent;

export interface ChatAppState {
  messages: Message[];
  conversations: Conversation[];
  operators: Agent[];
  selectedConversationId: number | null;
  isRealtimeConnected: boolean;
}

export interface ChatAppContextValue extends ChatAppState {
  sendMessage: (text: string, conversationId: string, authorId: string) => void;
  createTicket: (conversationId: string, subject: string, priority: "low" | "medium" | "high" | "urgent") => void;
  getImageUrl: (id: string, type: "operator" | "customer") => string;
  findOperator: (id: string) => Agent | null;
  setState: React.Dispatch<React.SetStateAction<ChatAppState>>;
  connectRealtime: () => void;
}
