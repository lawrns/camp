/**
 * Common API Types
 * Shared types for API routes and responses
 */

import type { User } from "@supabase/supabase-js";

// Authentication context types
export interface AuthContext {
  user: User;
  organizationId?: string;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  timestamp: string;
}

// Common query parameter types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TimeRangeParams {
  startDate?: string;
  endDate?: string;
  timeRange?: "1h" | "24h" | "7d" | "30d";
}

// Model Registry types
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  config?: Record<string, any>;
  isActive?: boolean;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description?: string;
  variants: ABTestVariant[];
  status: "draft" | "active" | "completed";
  startDate?: string;
  endDate?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  modelId: string;
  config?: Record<string, any>;
}

// Conversation state types
export interface ConversationState {
  requiresHumanHandoff: boolean;
  confidence: number;
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  urgency: "low" | "medium" | "high";
  customerSatisfaction?: number;
}

// Resolution detection types
export interface ResolutionStatus {
  isResolved: boolean;
  confidence: number;
  reason?: string;
  resolutionType?: "automated" | "human" | "escalated";
}

// Cost management types
export interface CostMetrics {
  totalCost: number;
  tokensUsed: number;
  requestCount: number;
  averageCostPerRequest: number;
}

// Safety system types
export interface SafetyMetrics {
  metrics: {
    totalViolations: number;
    blockedRequests: number;
    escalatedSafety: number;
  };
  violations: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

// RAG optimization types
export interface RAGMetrics {
  cacheHitRate: number;
  optimizationsApplied: number;
  performanceImprovement: number;
  costSavings: number;
}
