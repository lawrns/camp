/**
 * Centralized Operator type definitions
 * Single source of truth for all operator-related types
 * Unified model for all support operators without AI/bot distinctions
 */

export type OperatorStatus = "online" | "away" | "busy" | "offline";

/**
 * Typing characteristics for natural behavior
 */
export interface TypingCharacteristics {
  typingSpeedWpm: number; // 40-70 WPM
  typingVariance: number; // 0.10-0.20
  typingAccuracy: number; // 0.95-0.99
}

/**
 * Operator workload information
 */
export interface OperatorWorkload {
  activeConversations: number;
  responseTimeMs: number;
}

/**
 * Core Operator interface
 * Represents all support operators in the system
 */
export interface Operator {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatarUrl: string;

  // Status and presence
  isOnline: boolean;
  status?: OperatorStatus;
  lastSeenAt?: string | Date;

  // Typing characteristics (for natural behavior)
  typingCharacteristics?: TypingCharacteristics;

  // Workload
  workload?: OperatorWorkload;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Typing indicator for real-time updates
 */
export interface TypingIndicator {
  id: string;
  conversationId: string;
  operatorId: string;

  // Character-by-character preview
  previewText: string;
  currentPosition: number;
  isTyping: boolean;

  // Timing
  startedTypingAt?: string | Date;
  lastCharacterAt?: string | Date;

  // Natural pause tracking
  pauseType?: "thinking" | "sentence_end" | "comma" | "word_break";
  pauseStartedAt?: string | Date;

  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Operator presence for real-time status
 */
export interface OperatorPresence {
  id: string;
  operatorId: string;
  status: OperatorStatus;
  lastHeartbeat: string | Date;
  activeConversations: number;
  responseTimeMs: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database operator record
 */
export interface OperatorRecord {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  avatar_url: string;
  typing_speed_wpm: number;
  typing_variance: number;
  typing_accuracy: number;
  is_online: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database typing indicator record
 */
export interface TypingIndicatorRecord {
  id: string;
  conversation_id: string;
  operator_id: string;
  preview_text: string;
  current_position: number;
  is_typing: boolean;
  started_typing_at?: string;
  last_character_at?: string;
  pause_type?: "thinking" | "sentence_end" | "comma" | "word_break";
  pause_started_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database operator presence record
 */
export interface OperatorPresenceRecord {
  id: string;
  operator_id: string;
  status: OperatorStatus;
  last_heartbeat: string;
  active_conversations: number;
  response_time_ms: number;
  created_at: string;
  updated_at: string;
}

/**
 * Operator for selection/assignment UI
 */
export interface OperatorOption {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: OperatorStatus;
  workloadPercentage?: number;
  isRecommended?: boolean;
  matchScore?: number;
}

/**
 * Operator assignment data
 */
export interface OperatorAssignment {
  conversationId: string;
  fromOperatorId?: string | null;
  toOperatorId: string;
  reason?: string;
  notes?: string;
  assignedAt: string | Date;
  assignedBy: string;
}
