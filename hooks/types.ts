/**
 * Type definitions for hooks
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { MessageRole } from "@/db/schema/conversationMessages";
import type { Conversation, Message } from "@/types/entities";

// Re-export centralized types
export type { Message, Conversation, TypingIndicator } from "@/types/entities";

export interface VisitorTypingEvent {
  is_typing: boolean;
  content?: string;
  user_id?: string;
  user_name?: string;
  sender_type?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages?: Message[];
}

export interface WebSocketSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeMessagePayload {
  eventType: string;
  new: Message;
  old?: Message;
  errors?: unknown[];
}

export interface TypingPayload {
  is_typing: boolean;
  content?: string;
  user_id?: string;
  user_name?: string;
  sender_type?: string;
}

export interface WebSocketRef {
  url?: string;
  readyState?: number;
  send?: (data: string | ArrayBuffer | Blob) => void;
  close?: () => void;
}

export interface WebSocketMessage {
  type: string;
  event?: string;
  data?: unknown;
  error?: string;
}
