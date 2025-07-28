/**
 * Centralized Agent type definitions
 * Single source of truth for all agent-related types
 */

import type { UserRole, UserStatus } from "./user";

export type AgentStatus = "online" | "away" | "busy" | "offline";
export type AgentAvailability = "available" | "busy" | "unavailable";
export type ExpertiseLevel = "beginner" | "intermediate" | "expert";

export interface AgentMetrics {
  averageResponseTime?: number; // in seconds
  averageResolutionTime?: number; // in minutes
  satisfactionScore?: number; // 0-100
  totalConversations?: number;
  resolvedConversations?: number;
  escalatedConversations?: number;
}

export interface AgentWorkload {
  current: number;
  maximum: number;
  percentage: number; // 0-100
  activeConversations: number;
  queuedConversations?: number;
}

/**
 * Core Agent interface
 * Represents a support agent or AI agent
 */
export interface Agent {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
  status: AgentStatus;
  availability?: AgentAvailability;
  role: UserRole | "agent" | "admin";

  // Workload management
  workload?: AgentWorkload;
  currentLoad?: number; // Deprecated - use workload.current
  maxLoad?: number; // Deprecated - use workload.maximum
  currentConversations?: number; // Deprecated - use workload.activeConversations

  // Skills and expertise
  expertise?: string[];
  specialties?: string[];
  languages?: string[];
  skills?: Array<{
    name: string;
    level: ExpertiseLevel;
  }>;

  // Performance metrics
  metrics?: AgentMetrics;
  averageResponseTime?: string; // Deprecated - use metrics.averageResponseTime

  // Organizational data
  organizationId?: string;
  teamId?: string;
  departmentId?: string;

  // Timestamps
  lastSeenAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Metadata
  metadata?: Record<string, any>;
}

// Note: AI/RAG agents have been migrated to the unified Operator model
// See types/entities/operator.ts for the new unified model

/**
 * Agent assignment preferences
 */
export interface AgentAssignmentPreferences {
  autoAssign?: boolean;
  preferredChannels?: string[];
  preferredTopics?: string[];
  preferredCustomerTypes?: string[];
  maxConcurrentChats?: number;
  workingHours?: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }>;
  };
}

/**
 * Agent for selection/assignment UI
 */
export interface AgentOption {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: AgentStatus;
  workloadPercentage?: number;
  isRecommended?: boolean;
  matchScore?: number; // 0-100
  matchReasons?: string[];
}

/**
 * Agent handoff/transfer data
 */
export interface AgentHandoff {
  fromAgentId: string;
  toAgentId: string;
  conversationId: string;
  reason?: string;
  notes?: string;
  context?: string;
  urgency?: "low" | "medium" | "high" | "urgent";
  handoffType?: "manual" | "auto" | "escalation" | "shift-change";
  timestamp: string | Date;
}

/**
 * Database agent record
 */
export interface AgentRecord {
  id: string;
  user_id: string;
  organization_id: string;
  status: AgentStatus;
  // Note: is_ai field has been removed in favor of unified operator model
  max_concurrent_chats?: number;
  current_chat_count?: number;
  expertise?: string[];
  languages?: string[];
  metrics?: AgentMetrics;
  preferences?: AgentAssignmentPreferences;
  created_at: string;
  updated_at: string;
  last_seen_at?: string;
  metadata?: Record<string, any>;
}
