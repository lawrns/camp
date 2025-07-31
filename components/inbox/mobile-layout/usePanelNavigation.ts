/**
 * usePanelNavigation Hook
 * 
 * Manages panel navigation state and transitions for mobile inbox layout
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelNavigationState, MobileLayoutConfig } from "./types";

interface UsePanelNavigationProps {
  hasSelectedConversation: boolean;
  externalPanel?: "list" | "chat" | "details";
  onExternalPanelChange?: (panel: "list" | "chat" | "details") => void;
  config: MobileLayoutConfig["transition"];
}

export function usePanelNavigation({
  hasSelectedConversation,
  externalPanel,
  onExternalPanelChange,
  config,
}: UsePanelNavigationProps) {
  // Internal state
  const [internalPanel, setInternalPanel] = useState<"list" | "chat" | "details">("list");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [panelHistory, setPanelHistory] = useState<("list" | "chat" | "details")[]>(["list"]);

  // Determine active panel (external takes precedence)
  const activePanel = externalPanel || internalPanel;

  // Panel order based on conversation state
  const panelOrder = useMemo(() => {
    if (hasSelectedConversation) {
      return ["list", "chat", "details"] as const;
    }
    return ["list"] as const;
  }, [hasSelectedConversation]);

  // Can navigate back
  const canNavigateBack = useMemo(() => {
    if (externalPanel) {
      // External control - check if we can go back
      return panelHistory.length > 1;
    }
    return activePanel !== "list";
  }, [activePanel, externalPanel, panelHistory]);

  // Navigate to panel
  const navigateToPanel = useCallback(
    (panel: "list" | "chat" | "details") => {
      if (externalPanel && onExternalPanelChange) {
        onExternalPanelChange(panel);
        return;
      }

      setIsTransitioning(true);
      setInternalPanel(panel);
      
      // Update history
      setPanelHistory(prev => {
        const newHistory = [...prev];
        if (!newHistory.includes(panel)) {
          newHistory.push(panel);
        }
        return newHistory;
      });

      // Haptic feedback
      if (config.hapticFeedback && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      // End transition after animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, config.duration);
    },
    [externalPanel, onExternalPanelChange, config]
  );

  // Navigate back
  const navigateBack = useCallback(() => {
    if (externalPanel && onExternalPanelChange) {
      const currentIndex = panelHistory.indexOf(activePanel);
      if (currentIndex > 0) {
        const previousPanel = panelHistory[currentIndex - 1];
        onExternalPanelChange(previousPanel);
      }
      return;
    }

    const currentIndex = panelHistory.indexOf(activePanel);
    if (currentIndex > 0) {
      const previousPanel = panelHistory[currentIndex - 1];
      navigateToPanel(previousPanel);
    }
  }, [activePanel, externalPanel, onExternalPanelChange, panelHistory, navigateToPanel]);

  // Auto-navigate to chat when conversation is selected
  useEffect(() => {
    if (hasSelectedConversation && activePanel === "list") {
      navigateToPanel("chat");
    }
  }, [hasSelectedConversation, activePanel, navigateToPanel]);

  // Get panel title
  const getPanelTitle = useCallback((panel: "list" | "chat" | "details") => {
    switch (panel) {
      case "list":
        return "Conversations";
      case "chat":
        return "Chat";
      case "details":
        return "Details";
      default:
        return "Inbox";
    }
  }, []);

  // Navigation state
  const navigationState: PanelNavigationState = {
    activePanel,
    panelOrder,
    isTransitioning,
    canNavigateBack,
  };

  return {
    navigationState,
    isTransitioning,
    navigateToPanel,
    navigateBack,
    canNavigateBack,
    getPanelTitle,
  };
} 