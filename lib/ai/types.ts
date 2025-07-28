// Import for local use
import type { ConfidenceMetrics, TuningResult } from "./threshold-tuning";

/**
 * AI Service Types - Centralized Type Definitions
 *
 * This file consolidates all AI-related types to fix integration issues
 * and ensure proper type exports across the codebase.
 */

// Re-export types from confidence analytics
export type {
  ConfidenceMetric,
  ConfidenceAnalysis,
  ConfidenceTrend,
  ConfidenceThreshold,
  ConfidenceReport,
} from "./confidence-analytics";

// Re-export types from threshold tuning
export type { ThresholdConfig, ConfidenceMetrics, TuningResult, PredictionSample } from "./threshold-tuning";

// Re-export types from knowledge profile manager
export type {
  KnowledgeProfile,
  ExpertiseArea,
  ProfileMetrics,
  KnowledgeQuery,
  QueryResult,
} from "./knowledge-profile-manager";

// Re-export types from RAG handler
export type { RAGDocument, RAGChunk, RAGQuery, RAGResponse, RAGResult, RAGProcessingConfig } from "./rag-handler";

// Re-export types from UnifiedRAGService
export type { UnifiedRAGInput, UnifiedRAGResponse } from "./rag/UnifiedRAGService";

// Re-export types from ai-handover
export interface HandoverRequest {
  conversationId: string;
  reason?: string;
  context?: Record<string, any>;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface HandoverResponse {
  handoverId: string;
  status: "initiated" | "in_progress" | "completed" | "failed";
  assignedAgent?: {
    id: string;
    name: string;
    role: string;
  } | null;
  estimatedWaitTime?: number;
  queuePosition?: number;
}

export interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  suggestions?: string[];
  needsHandover?: boolean;
  handoverReason?: string;
}

// Re-export types from AutonomousAIService
export interface AutonomousProcessingRequest {
  conversationId: string;
  organizationId: string;
  messageId: string;
  messageContent: string;
  visitorEmail?: string;
  visitorName?: string;
  conversationHistory?: {
    content: string;
    sender_type: string;
    created_at: string;
  }[];
  metadata?: Record<string, any>;
}

export interface AutonomousProcessingResult {
  success: boolean;
  response?: string;
  confidence: number;
  escalated: boolean;
  toolsUsed: string[];
  processingTime: number;
  error?: string;
  sessionId: string;
  escalationReason?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  confidence: number;
}

// Conversation context type for AI operations
export interface ConversationContext {
  conversationId: string;
  organizationId: string;
  messages: Array<{
    content: string;
    sender_type: "visitor" | "agent" | "ai";
    created_at: string;
  }>;
  customerProfile?: {
    name?: string;
    email?: string;
    previousInteractions?: number;
  };
}

// AI Configuration types
export interface AIConfiguration {
  model: string;
  temperature: number;
  maxTokens: number;
  confidenceThreshold: number;
  handoverThreshold: number;
  enableRAG: boolean;
  enableHumanLikeMode: boolean;
  systemPrompt?: string;
}

// AI Session types
export interface AISession {
  id: string;
  conversationId: string;
  organizationId: string;
  startTime: Date;
  endTime?: Date;
  messagesProcessed: number;
  averageConfidence: number;
  handedOver: boolean;
  toolsUsed: string[];
  metadata?: Record<string, any>;
}

// Knowledge base quality types
export interface KnowledgeBaseQuality {
  quality: {
    overall: number;
    completeness: number;
    accuracy: number;
    freshness: number;
  };
  overallScore: number;
  metrics: {
    totalProfiles: number;
    activeProfiles: number;
    domainCoverage: number;
    averageConfidence: number;
    coverage: number;
    freshness: number;
    relevance: number;
    completeness: number;
    duplication: number;
  };
  recommendations: Array<{
    type: string;
    priority: string;
    description: string;
  }>;
  gaps: string[];
}

// Analytics types
export interface ConfidenceAnalyticsMetrics {
  count: number;
  average: number;
  min: number;
  max: number;
  lowConfidenceCount: number;
  distribution: Record<string, number>;
  timeRange?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ConfidenceTrendData {
  period: string;
  confidence: number;
  escalated: boolean;
  processingTime: number;
  sourcesUsed: number;
  count: number;
}

// Profile analytics types
export interface ProfilePerformanceMetrics {
  profileId: string;
  period: string;
  queries: {
    total: number;
    successful: number;
    failed: number;
  };
  performance: {
    averageResponseTime: number;
    averageConfidence: number;
    successRate: number;
  };
  usage: {
    totalTokens: number;
    avgTokensPerQuery: number;
    peakUsageHour: number;
  };
  domains: Array<{
    domain: string;
    queries: number;
    confidence: number;
  }>;
  trends: {
    queryGrowth: number;
    confidenceChange: number;
    usageChange: number;
  };
  lastUpdated: Date;
}

// Recommendation types
export interface ProfileRecommendation {
  type: "performance" | "coverage" | "maintenance" | "expertise" | "optimization";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  impact: "high" | "medium" | "low";
  details?: unknown;
}

// Auto-tuning configuration
export interface AutoTuningConfig {
  enabled: boolean;
  minSamplesRequired: number;
  updateFrequency: string;
  targetMetric: string;
  lastUpdated: string;
  currentThreshold: number;
}

// Tuning session types
export interface TuningSession {
  sessionId: string;
  organizationId: string;
  startTime: string;
  currentMetrics: ConfidenceMetrics;
  targetImprovement: number;
  status: "active" | "completed" | "failed";
  estimatedDuration: string;
  recommendations: TuningResult;
}

// Export all service instances as types
export type ConfidenceAnalyticsService = import("./confidence-analytics").ConfidenceAnalytics;
export type ThresholdTunerService = import("./threshold-tuning").ThresholdTuner;
export type KnowledgeProfileManagerService = import("./knowledge-profile-manager").KnowledgeProfileManager;
export type RAGHandlerService = import("./rag-handler").RAGHandler;
export type UnifiedRAGServiceType = import("./rag/UnifiedRAGService").UnifiedRAGService;
