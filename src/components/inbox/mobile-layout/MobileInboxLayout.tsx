/**
 * Refactored MobileInboxLayout Component
 *
 * Main orchestrating component for mobile inbox layout using the
 * extracted modules for clean separation of concerns.
 */

"use client";

import { useCallback, useEffect } from "react";
import { MobileHeader } from "./MobileHeader";
import { PanelWrapper, SwipeablePanelContainer } from "./PanelTransition";
import { DEFAULT_MOBILE_CONFIG, MobileInboxLayoutProps, MobileLayoutConfig } from "./types";
import { usePanelNavigation } from "./usePanelNavigation";
import { useSwipeGestures } from "./useSwipeGestures";

export function MobileInboxLayout({
  conversationList,
  chatPanel,
  detailsPanel,
  selectedConversationId,
  hasSelectedConversation,
  onBackToList,
  conversationTitle = "Chat",
  unreadCount = 0,
  enableSwipeGestures = true,
  currentPanel: externalPanel,
  onPanelChange: externalPanelChange,
}: MobileInboxLayoutProps) {
  const config: MobileLayoutConfig = DEFAULT_MOBILE_CONFIG;

  // Panel navigation hook
  const { navigationState, isTransitioning, navigateToPanel, navigateBack, canNavigateBack, getPanelTitle } =
    usePanelNavigation({
      hasSelectedConversation,
      externalPanel,
      onExternalPanelChange: externalPanelChange,
      config: config.transition,
    });

  // Swipe gestures hook
  const { swipeState, handleSwipeStart, handleSwipeProgress, handleSwipeEnd } = useSwipeGestures({
    activePanel: navigationState.activePanel,
    panelOrder: navigationState.panelOrder,
    hasSelectedConversation,
    onPanelChange: navigateToPanel,
    isTransitioning,
    config: config.swipe,
    enableHapticFeedback: config.transition.hapticFeedback,
  });

  // Handle back navigation
  const handleBackNavigation = useCallback(() => {
    if (canNavigateBack) {
      navigateBack();
    } else {
      onBackToList?.();
    }
  }, [canNavigateBack, navigateBack, onBackToList]);

  // Mock handlers for header actions (these would be passed as props in real implementation)
  const handleSearch = useCallback((query: string) => {

  }, []);

  const handleFilterChange = useCallback((filters: string[]) => {

  }, []);

  const handleRefresh = useCallback(async () => {

    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, []);

  const handleNewConversation = useCallback(() => {

  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if no input is focused
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        case "Escape":
          if (canNavigateBack) {
            e.preventDefault();
            navigateBack();
          }
          break;
        case "ArrowLeft":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            navigateBack();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigateBack, navigateBack, config.enableKeyboardShortcuts]);

  // Panel definitions
  const panels = [
    {
      key: "list" as const,
      content: <PanelWrapper>{conversationList}</PanelWrapper>,
    },
    {
      key: "chat" as const,
      content: <PanelWrapper padding={false}>{chatPanel}</PanelWrapper>,
    },
    {
      key: "details" as const,
      content: <PanelWrapper>{detailsPanel}</PanelWrapper>,
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-[var(--fl-color-background-subtle)] md:hidden">
      {/* Mobile Header */}
      <MobileHeader
        activePanel={navigationState.activePanel}
        onNavigateBack={handleBackNavigation}
        canNavigateBack={canNavigateBack}
        title={getPanelTitle(navigationState.activePanel)}
        unreadCount={unreadCount}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        onNewConversation={handleNewConversation}
        showSearch={navigationState.activePanel === "list"}
        showFilters={navigationState.activePanel === "list"}
      />

      {/* Panel Container with Swipe Support */}
      <SwipeablePanelContainer
        panels={panels}
        activePanel={navigationState.activePanel}
        isTransitioning={isTransitioning}
        enableSwipeGestures={enableSwipeGestures}
        swipeState={swipeState}
        onSwipeStart={handleSwipeStart}
        onSwipeProgress={handleSwipeProgress}
        onSwipeEnd={handleSwipeEnd}
        className="flex-1"
      />
    </div>
  );
}
