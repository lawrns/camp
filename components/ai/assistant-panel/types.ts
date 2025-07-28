/**
 * Types and interfaces for AI Assistant Panel
 */

export type AIStatus = "idle" | "processing" | "active" | "error" | "thinking" | "analyzing" | "ready";

export interface SuggestedResponse {
  id: string;
  content: string;
  confidence: number;
  category: "greeting" | "question" | "solution" | "empathy" | "closing";
  intent: string;
  preview: string;
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

export interface Capability {
  name: string;
  active: boolean;
}

export type TabType = "suggestions" | "insights" | "metrics";

export interface AIAssistantPanelProps {
  conversationId: string;
  organizationId: string;
  className?: string;
  onSuggestionSelect?: (suggestion: SuggestedResponse) => void;
  onHandoverRequest?: () => void;
}

export interface AIAssistantPanelContentProps extends AIAssistantPanelProps {
  conversation?: unknown;
  aiCapabilities?: unknown;
  aiStatus: AIStatus;
  confidenceLevel: number;
  sentiment?: string;
  intent?: string;
  contextRelevance?: number;
  escalationRisk?: number;
  setAiStatus: (status: AIStatus) => void;
}
