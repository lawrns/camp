// Feature flags configuration
export const FEATURE_FLAGS = {
  AI_CONVERSATION: true,
  RAG_SEARCH: true,
  REAL_TIME_UPDATES: true,
  ADVANCED_ANALYTICS: true,
  WIDGET_CUSTOMIZATION: true,
  TEAM_COLLABORATION: true,
  KNOWLEDGE_BASE: true,
  AUTOMATED_RESPONSES: true,
  SENTIMENT_ANALYSIS: true,
  CONVERSATION_ROUTING: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
