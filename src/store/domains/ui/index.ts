/**
 * UI Store Domain Exports
 *
 * Central export point for all UI store functionality
 */

export * from "./ui-store";

// Re-export commonly used hooks for convenience
export {
  useUIStore,
  useUIState,
  useUIActions,
  useSidebarState,
  useDrawerState,
  useLoadingState,
  useNotifications,
  useSearch,
  useConversationSelection,
  useMessageScroll,
} from "./ui-store";

// Re-export types
export type { UIState, UIActions, UIStore, UINotification, ViewType, FilterType } from "./ui-store";
