// AI Assistant Types
export interface AIAssistantPanelProps {
  conversationId: string;
  organizationId: string;
  className?: string;
  onSuggestionSelect?: (suggestion: SuggestedResponse) => void;
  onHandoverRequest?: () => void;
}

export interface SuggestedResponse {
  id: string;
  text: string;
  confidence: number;
  category: "greeting" | "question" | "solution" | "empathy" | "closing";
  intent: string;
  preview: string;
  reasoning?: string;
  metrics?: {
    responseTime?: number;
    relevanceScore?: number;
    sentimentImpact?: number;
  };
}

export interface AIMetrics {
  confidence: number;
  responseTime: number;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  intent: string;
  entities: string[];
  contextRelevance: number;
  escalationRisk: number;
}

export interface SentimentDataPoint {
  time: string;
  score: number;
  label: string;
}

export type AIStatus = "idle" | "thinking" | "analyzing" | "ready" | "error";

export interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "active" | "inactive" | "processing" | "error";
  performance?: number;
  lastUpdated?: Date;
  metrics?: {
    accuracy?: number;
    speed?: number;
    usage?: number;
  };
}

export interface AIInsight {
  id: string;
  type: "sentiment" | "intent" | "entity" | "metric";
  title: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  description?: string;
  timestamp: Date;
}

export interface AIHandoverState {
  isAIActive: boolean;
  confidence: number;
  currentHandler: "ai" | "human";
  handoverReason?: string;
  handoverTimestamp?: Date;
  sessionId: string;
  conversationContext?: Record<string, any>;
}

export interface AIResponseMetrics {
  generationTime: number;
  tokensUsed: number;
  modelUsed: string;
  temperature: number;
  maxTokens: number;
  confidenceBreakdown: {
    language: number;
    context: number;
    intent: number;
    overall: number;
  };
}

export interface ConversationAnalytics {
  totalMessages: number;
  avgResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  escalationRate: number;
  topIntents: Array<{
    intent: string;
    count: number;
    percentage: number;
  }>;
  sentimentTrend: Array<{
    timestamp: Date;
    score: number;
  }>;
}

export interface AIPersona {
  id: string;
  name: string;
  description: string;
  traits: string[];
  tone: "professional" | "friendly" | "casual" | "technical";
  specializations: string[];
  avatar?: string;
}

export interface AIConfiguration {
  enabled: boolean;
  autoHandover: boolean;
  confidenceThreshold: number;
  responseTimeout: number;
  maxRetries: number;
  personas: AIPersona[];
  activePersonaId: string;
  capabilities: string[];
  knowledgeBaseIds: string[];
}
