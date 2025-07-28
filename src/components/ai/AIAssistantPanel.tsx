// AIAssistantPanel - Migrated to modular architecture
// This file now serves as a compatibility wrapper for the new assistant panel system
//
// MIGRATION COMPLETE:
// - Reduced from ~1138 lines to ~20 lines
// - All functionality moved to modular components in ./assistant-panel/
// - Maintains same interface for drop-in replacement compatibility

"use client";

import * as React from "react";
import { AIAssistantPanel as RefactoredAIAssistantPanel } from "./assistant-panel/AIAssistantPanel";

interface SuggestedResponse {
  id: string;
  content: string;
  confidence: number;
  category: "greeting" | "question" | "solution" | "empathy" | "closing";
  intent: string;
  preview: string;
  reasoning?: string;
}

interface AIAssistantPanelProps {
  conversationId: string;
  organizationId: string;
  className?: string;
  onSuggestionSelect?: (suggestion: SuggestedResponse) => void;
  onHandoverRequest?: () => void;
}

/**
 * AIAssistantPanel - Compatibility wrapper for the new modular system
 *
 * This component has been completely refactored from a monolithic 1138-line file
 * into a modular architecture with proper separation of concerns:
 *
 * - 6 focused components (StatusIndicator, SuggestionsPanel, MetricsPanel, etc.)
 * - Utility functions for confidence calculation, mock data generation
 * - Type-safe interfaces and configuration objects
 * - Performance optimizations (memoization, debouncing)
 * - Comprehensive AI interaction improvements
 *
 * All original functionality is preserved while dramatically improving:
 * - Maintainability (smaller, focused files)
 * - Testability (isolated components and hooks)
 * - Reusability (components can be used elsewhere)
 * - Performance (optimized rendering and state management)
 * - Developer experience (clear structure and types)
 */
export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = (props) => {
  return <RefactoredAIAssistantPanel {...props} />;
};
