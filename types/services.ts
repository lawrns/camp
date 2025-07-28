/**
 * Service Types
 * Types for various service classes and utilities
 */

// Model Registry Service
interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  costPerToken: number;
  enabled: boolean;
}

interface ModelUpdates {
  name?: string;
  enabled?: boolean;
  costPerToken?: number;
  capabilities?: string[];
}

export class ModelRegistry {
  static getActiveModels(): Promise<AIModel[]> {
    throw new Error("Not implemented");
  }

  static getModel(modelId: string): Promise<AIModel | null> {
    throw new Error("Not implemented");
  }

  static updateModel(modelId: string, updates: ModelUpdates): Promise<AIModel> {
    throw new Error("Not implemented");
  }
}

// Conversation State Analyzer
interface ConversationAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  topics: string[];
  intent: string;
  confidence: number;
}

interface ConversationMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: "user" | "agent" | "system";
}

interface Conversation {
  id: string;
  status: string;
  startedAt: Date;
  organizationId: string;
}

export class ConversationStateAnalyzer {
  async analyze(conversation: Conversation, messages: ConversationMessage[]): Promise<ConversationAnalysis> {
    throw new Error("Not implemented");
  }
}

// Resolution Detector
interface ResolutionCheck {
  isResolved: boolean;
  confidence: number;
  suggestedActions: string[];
  lastActivity: Date;
}

export class ResolutionDetector {
  async checkResolution(conversation: Conversation, messages: ConversationMessage[]): Promise<ResolutionCheck> {
    throw new Error("Not implemented");
  }
}

// Cost Management Service Types - implementation is in /lib/ai/cost-management-service.ts
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface CostBreakdown {
  totalCost: number;
  modelCosts: Record<string, number>;
  tokenUsage: Record<string, number>;
  conversationCount: number;
}

export interface InvoicePeriod {
  year: number;
  month: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  period: InvoicePeriod;
  totalAmount: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  generatedAt: Date;
}

// Redis client type
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  mget(keys: string[]): Promise<(string | null)[]>;
  mset(pairs: Record<string, string>): Promise<void>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
}
