"use client";

import { useEffect, useState } from "react";

export type LayoutMode = "mobile" | "tablet" | "desktop";
export type PanelState = "hidden" | "collapsed" | "expanded";

export interface ResponsiveLayoutState {
  mode: LayoutMode;
  conversationListState: PanelState;
  chatViewState: PanelState;
  detailSidebarState: PanelState;
  activePanel: "conversations" | "chat" | "details";
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Hook for managing responsive layout state across different screen sizes
 */
export function useResponsiveLayout() {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutState>({
    mode: "desktop",
    conversationListState: "expanded",
    chatViewState: "expanded",
    detailSidebarState: "expanded",
    activePanel: "chat",
  });

  // Detect screen size and update layout mode
  useEffect(() => {
    const updateLayoutMode = () => {
      const width = window.innerWidth;
      let newMode: LayoutMode;

      if (width < BREAKPOINTS.mobile) {
        newMode = "mobile";
      } else if (width < BREAKPOINTS.tablet) {
        newMode = "tablet";
      } else {
        newMode = "desktop";
      }

      setLayoutState((prev) => {
        if (prev.mode === newMode) return prev;

        // Apply responsive layout rules based on screen size
        switch (newMode) {
          case "mobile":
            return {
              ...prev,
              mode: newMode,
              conversationListState: prev.activePanel === "conversations" ? "expanded" : "hidden",
              chatViewState: prev.activePanel === "chat" ? "expanded" : "hidden",
              detailSidebarState: prev.activePanel === "details" ? "expanded" : "hidden",
            };

          case "tablet":
            return {
              ...prev,
              mode: newMode,
              conversationListState: "collapsed",
              chatViewState: "expanded",
              detailSidebarState: "collapsed",
              activePanel: "chat",
            };

          case "desktop":
            return {
              ...prev,
              mode: newMode,
              conversationListState: "expanded",
              chatViewState: "expanded",
              detailSidebarState: "expanded",
              activePanel: "chat",
            };

          default:
            return prev;
        }
      });
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);

  // Panel navigation for mobile
  const navigateToPanel = (panel: "conversations" | "chat" | "details") => {
    if (layoutState.mode === "mobile") {
      setLayoutState((prev) => ({
        ...prev,
        activePanel: panel,
        conversationListState: panel === "conversations" ? "expanded" : "hidden",
        chatViewState: panel === "chat" ? "expanded" : "hidden",
        detailSidebarState: panel === "details" ? "expanded" : "hidden",
      }));
    } else {
      setLayoutState((prev) => ({ ...prev, activePanel: panel }));
    }
  };

  // Toggle panel state (for tablet/desktop)
  const togglePanel = (panel: "conversations" | "chat" | "details") => {
    if (layoutState.mode === "mobile") {
      navigateToPanel(panel);
      return;
    }

    setLayoutState((prev) => {
      const stateKey = `${
        panel === "conversations" ? "conversationList" : panel === "chat" ? "chatView" : "detailSidebar"
      }State` as keyof ResponsiveLayoutState;

      const currentState = prev[stateKey] as PanelState;
      const newState: PanelState = currentState === "expanded" ? "collapsed" : "expanded";

      return {
        ...prev,
        [stateKey]: newState,
      };
    });
  };

  // Get CSS classes for panels based on current state
  const getPanelClasses = (panel: "conversations" | "chat" | "details") => {
    const state =
      panel === "conversations"
        ? layoutState.conversationListState
        : panel === "chat"
          ? layoutState.chatViewState
          : layoutState.detailSidebarState;

    const baseClasses = "transition-all duration-300 ease-in-out";

    switch (layoutState.mode) {
      case "mobile":
        return `${baseClasses} ${state === "expanded" ? "block" : "hidden"} w-full h-full`;

      case "tablet":
        if (panel === "conversations") {
          return `${baseClasses} ${state === "expanded" ? "w-80" : "w-16"} flex-shrink-0`;
        } else if (panel === "chat") {
          return `${baseClasses} flex-1`;
        } else {
          return `${baseClasses} ${state === "expanded" ? "w-80" : "w-0 overflow-hidden"} flex-shrink-0`;
        }

      case "desktop":
        if (panel === "conversations") {
          return `${baseClasses} ${state === "expanded" ? "w-80" : "w-16"} flex-shrink-0`;
        } else if (panel === "chat") {
          return `${baseClasses} flex-1`;
        } else {
          return `${baseClasses} ${state === "expanded" ? "w-96" : "w-16"} flex-shrink-0`;
        }

      default:
        return baseClasses;
    }
  };

  // Check if panel is visible
  const isPanelVisible = (panel: "conversations" | "chat" | "details") => {
    const state =
      panel === "conversations"
        ? layoutState.conversationListState
        : panel === "chat"
          ? layoutState.chatViewState
          : layoutState.detailSidebarState;

    return state !== "hidden";
  };

  // Check if panel is expanded
  const isPanelExpanded = (panel: "conversations" | "chat" | "details") => {
    const state =
      panel === "conversations"
        ? layoutState.conversationListState
        : panel === "chat"
          ? layoutState.chatViewState
          : layoutState.detailSidebarState;

    return state === "expanded";
  };

  return {
    layoutState,
    navigateToPanel,
    togglePanel,
    getPanelClasses,
    isPanelVisible,
    isPanelExpanded,
    isMobile: layoutState.mode === "mobile",
    isTablet: layoutState.mode === "tablet",
    isDesktop: layoutState.mode === "desktop",
  };
}
