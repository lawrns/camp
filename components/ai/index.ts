// Improved AI Assistant Components
export { AIAssistantPanel } from "./AIAssistantPanel";
export { AIHandoverPanel } from "./AIHandoverPanel";
export { AISessionManager } from "./AISessionManager";
export { ConfidenceMonitoringDashboard } from "./ConfidenceMonitoringDashboard";
export { AIReplySuggestions } from "./AIReplySuggestions";
export { SuggestedReplies } from "./SuggestedReplies";
export { ConfidenceIndicator } from "./ConfidenceIndicator";
export { HandoverTransitionAnimation } from "./HandoverTransitionAnimation";
export { AIStatusDashboard } from "./AIStatusDashboard";
export { KnowledgeProfileManager } from "./KnowledgeProfileManager";
export { AIInsightsDashboard } from "./AIInsightsDashboard";
export { AIProcessingTerminal } from "./AIProcessingTerminal";
export { AITrainingInterface } from "./AITrainingInterface";

// New Improved Components
export { AIResponsePreviewCard, AIResponsePreviewGrid } from "./AIResponsePreviewCard";
export { AICapabilityIndicators, AI_CAPABILITIES, AIStatusIndicator } from "./AICapabilityIndicators";
export { AIInsightsPanel } from "./AIInsightsPanel";

// Handover Components
export * from "./handover";

// Types
export type {
  AIAssistantPanelProps,
  SuggestedResponse,
  AIMetrics,
  SentimentDataPoint,
  AIStatus,
  AICapability,
  AIInsight,
  AIHandoverState,
  AIResponseMetrics,
  ConversationAnalytics,
  AIPersona,
  AIConfiguration,
} from "./types";
