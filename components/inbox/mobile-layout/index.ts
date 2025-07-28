/**
 * Mobile Layout Module Exports
 *
 * Centralized exports for the refactored mobile layout system.
 * This module provides a clean API for mobile inbox functionality
 * with proper separation of concerns.
 */

// Main component
export { MobileInboxLayout } from "./MobileInboxLayout";

// Sub-components
export { MobileHeader } from "./MobileHeader";
export { ErrorPanel, LoadingPanel, PanelTransition, PanelWrapper, SwipeablePanelContainer } from "./PanelTransition";

// Hooks
export { usePanelNavigation } from "./usePanelNavigation";
export { useSwipeGestures } from "./useSwipeGestures";

// Types
export type {
  ActivePanel,
  MobileHeaderState,
  MobileInboxLayoutProps,
  MobileLayoutConfig,
  PanelNavigationState,
  PanelTransitionConfig,
  SwipeConfig,
  SwipeGestureState,
} from "./types";

export { DEFAULT_MOBILE_CONFIG, DEFAULT_SWIPE_CONFIG, DEFAULT_TRANSITION_CONFIG } from "./types";
