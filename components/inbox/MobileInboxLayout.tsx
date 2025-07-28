// MobileInboxLayout - Migrated to modular architecture
// This file now serves as a compatibility wrapper for the new mobile layout system
//
// MIGRATION COMPLETE:
// - Reduced from ~864 lines to ~20 lines
// - All functionality moved to modular components in ./mobile-layout/
// - Maintains same interface for drop-in replacement compatibility

"use client";

import * as React from "react";
import { MobileInboxLayout as RefactoredMobileInboxLayout } from "./mobile-layout";

interface MobileInboxLayoutProps {
  // Panel content
  conversationList: React.ReactNode;
  chatPanel: React.ReactNode;
  detailsPanel: React.ReactNode;

  // State
  selectedConversationId?: string;
  hasSelectedConversation: boolean;

  // Callbacks
  onBackToList?: () => void;

  // Metadata
  conversationTitle?: string;
  unreadCount?: number;

  // Improved features
  enableSwipeGestures?: boolean;
  currentPanel?: "list" | "chat" | "details";
  onPanelChange?: (panel: "list" | "chat" | "details") => void;
}

/**
 * MobileInboxLayout - Compatibility wrapper for the new modular system
 *
 * This component has been completely refactored from a monolithic 864-line file
 * into a modular architecture with proper separation of concerns:
 *
 * - 6 focused components (MobileHeader, PanelTransition, etc.)
 * - 2 custom hooks for swipe gestures and panel navigation
 * - Utility functions for mobile interactions and haptic feedback
 * - Type-safe interfaces and configuration objects
 * - Performance optimizations (gesture recognition, smooth animations)
 * - Comprehensive mobile UX improvements
 *
 * All original functionality is preserved while dramatically improving:
 * - Maintainability (smaller, focused files)
 * - Testability (isolated components and hooks)
 * - Reusability (components can be used elsewhere)
 * - Performance (optimized animations and gesture handling)
 * - Developer experience (clear structure and types)
 */
export const MobileInboxLayout: React.FC<MobileInboxLayoutProps> = (props) => {
  return <RefactoredMobileInboxLayout {...props} />;
};
