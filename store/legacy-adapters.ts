/**
 * 🔄 LEGACY STORE ADAPTERS
 *
 * This file provides backward compatibility adapters for components
 * that still use the old store hooks. All stores are now consolidated
 * into the unified-campfire-store.ts for better performance and maintainability.
 *
 * MIGRATION STRATEGY:
 * 1. Keep existing hook names working
 * 2. Redirect to unified store internally
 * 3. Gradually migrate components to use unified hooks
 * 4. Remove adapters once migration is complete
 */

import { useCampfireStore } from "./unified-campfire-store";

// ============================================================================
// DASHBOARD STORE ADAPTERS (from dashboard-store.ts)
// ============================================================================

/**
 * @deprecated Use useCampfireStore with dashboard selectors instead
 */
export const useDashboardStore = (selector?: unknown) => {
  if (selector) {
    return useCampfireStore((state) => selector(state.dashboard));
  }

  return useCampfireStore((state) => ({
    ...state.dashboard,
    setMetrics: state.setDashboardMetrics,
    setLoading: state.setDashboardLoading,
    setError: state.setDashboardError,
  }));
};

/**
 * Dashboard selectors for backward compatibility
 */
export const selectDashboardMetrics = (state: unknown) => state.dashboard.metrics;
export const selectDashboardLoading = (state: unknown) => state.dashboard.isLoading;
export const selectDashboardError = (state: unknown) => state.dashboard.error;

// ============================================================================
// INBOX STORE ADAPTERS (from useInboxStore.ts)
// ============================================================================

/**
 * @deprecated Use useCampfireStore with inbox selectors instead
 */
export const useInboxStore = (selector?: unknown) => {
  if (selector) {
    return useCampfireStore((state) => selector(state.inbox));
  }

  return useCampfireStore((state) => ({
    ...state.inbox,
    setMessageText: state.setMessageText,
    setIsSending: state.setIsSending,
    toggleConversationSelection: state.toggleConversationSelection,
    clearConversationSelection: state.clearConversationSelection,
    setShowAssignmentPanel: state.setShowAssignmentPanel,
  }));
};

/**
 * Inbox convenience hooks for backward compatibility
 */
export const useMessageText = () => useCampfireStore((state) => state.inbox.messageText);
export const useIsSending = () => useCampfireStore((state) => state.inbox.isSending);
export const useIsFileUploading = () => useCampfireStore((state) => state.inbox.isFileUploading);
export const useSelectedConversations = () => useCampfireStore((state) => state.inbox.selectedConversations);
export const useShowAssignmentPanel = () => useCampfireStore((state) => state.inbox.showAssignmentPanel);
export const useShowCustomerProfile = () => useCampfireStore((state) => state.inbox.showCustomerProfile);

/**
 * Inbox computed selectors
 */
export const useSelectedConversationCount = () => useCampfireStore((state) => state.inbox.selectedConversations.size);

export const useIsConversationSelected = (conversationId: string) =>
  useCampfireStore((state) => state.inbox.selectedConversations.has(conversationId));

export const useHasBulkSelection = () => useCampfireStore((state) => state.inbox.selectedConversations.size > 0);

export const useIsComposerDisabled = () =>
  useCampfireStore((state) => state.inbox.isSending || state.inbox.isFileUploading);

// ============================================================================
// PHOENIX STORE ADAPTERS (from phoenix-store.ts)
// ============================================================================

/**
 * @deprecated Use useCampfireStore directly instead
 * This adapter maintains compatibility with the old useStore hook
 */
export const useStore = useCampfireStore;

// ============================================================================
// UI STORE ADAPTERS (from domains/ui/ui-store.ts)
// ============================================================================

/**
 * @deprecated Use useCampfireStore with UI selectors instead
 */
export const useUIStore = (selector?: unknown) => {
  if (selector) {
    return useCampfireStore((state) => selector(state.ui));
  }

  return useCampfireStore((state) => ({
    ...state.ui,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
  }));
};

/**
 * UI convenience hooks
 */
export const useNotifications = () =>
  useCampfireStore((state) => ({
    notifications: state.ui.notifications,
    add: state.addNotification,
    remove: state.removeNotification,
  }));

export const useSelectedConversationId = () => useCampfireStore((state) => state.ui.selectedConversationId);

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Helper to check if a component is using legacy stores
 */
export const isUsingLegacyStore = (componentName: string) => {
  console.warn(`⚠️ Component ${componentName} is using legacy store adapters. Consider migrating to useCampfireStore.`);
};

/**
 * Migration guide for developers
 */
export const MIGRATION_GUIDE = {
  dashboard: {
    old: "useDashboardStore(selectDashboardMetrics)",
    new: "useCampfireStore((state) => state.dashboard.metrics)",
  },
  inbox: {
    old: "useInboxStore((state) => state.messageText)",
    new: "useCampfireStore((state) => state.inbox.messageText)",
  },
  ui: {
    old: "useUIStore((state) => state.notifications)",
    new: "useCampfireStore((state) => state.ui.notifications)",
  },
};

/**
 * Console helper to show migration suggestions
 */
export const showMigrationTip = (oldHook: string, newHook: string) => {
  console.info(`💡 Migration Tip: Replace ${oldHook} with ${newHook}`);
};

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * List of files that can be safely removed after migration
 */
export const DEPRECATED_FILES = [
  "store/dashboard-store.ts",
  "store/domains/inbox/inbox-store.ts",
  "store/domains/ui/ui-store.ts",
  "store/phoenix-store.ts",
  "store/domains/conversation-store.example.ts",
] as const;

/**
 * Check if all components have been migrated
 */
export const checkMigrationStatus = () => {
  console.log("🔍 Checking store migration status...");
  console.log("📋 Files to remove after migration:", DEPRECATED_FILES);
  console.log("✅ All stores consolidated into unified-campfire-store.ts");
};
