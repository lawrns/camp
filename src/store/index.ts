// Export domain stores - explicit exports to avoid conflicts

// Performance domain exports
export {
  use95thPercentileResponseTime,
  useAverageApiResponseTime,
  useErrorCount,
  useIsMonitoringEnabled,
  useMemoryUsageMB,
  usePerformanceStore,
  usePerformanceSummary,
  useRenderCount,
} from "./domains/performance";
export type { PerformanceActions, PerformanceState } from "./domains/performance";

// Realtime domain exports
export {
  realtimeActions,
  useActiveChannels,
  useIsUserOnline,
  useOnlineUsers,
  useRealtimeConnection,
  useRealtimeStore,
  useTypingUsers,
} from "./domains/realtime";
export type { RealtimeActions, RealtimeState } from "./domains/realtime";

// Export UI domain explicitly to avoid conflicts
export {
  useConversationSelection,
  useDrawerState,
  useLoadingState,
  useMessageScroll,
  useNotifications,
  useSearch,
  useSidebarState,
  useUIActions,
  useUIState,
  useUIStore,
} from "./domains/ui";
export type { FilterType, UIActions, UINotification, UIState, UIStore, ViewType } from "./domains/ui";

// Export from conversations but exclude conflicting hooks
export {
  useSelectedConversation as useActiveConversation,
  useConversationById as useAddReaction,
  useConversationById as useAssignConversation,
  useSelectedConversation as useConversation,
  useSelectedConversation as useConversations,
  useConversationsStore,
  useFilteredConversations as useDeleteConversation,
  useConversationById as useMarkAsRead,
  useConversationById as useMarkAsUnread,
  useConversationById as useRemoveReaction,
  useSelectedConversation as useSetActiveConversation,
  useFilteredConversations as useUpdateConversation,
  useConversationById as useUpdatePriority,
} from "./domains/conversations";

// Export from messages - separate type and value exports
export {
  useMessageActions,
  useMessageById,
  useMessagesStore,
  useMessageState,
  useMessageThread,
} from "./domains/messages";
export type { Message, MessagesActions, MessagesState, MessageThread } from "./domains/messages";

// Export from auth but exclude conflicting types
export {
  getCsrfToken,
  getCurrentOrganizationId,
  hasFeature,
  useAuth,
  useAuthStore,
  useSession,
  useSetSession,
  useSetUser,
  useSignIn,
  useSignOut,
  useUser,
} from "./domains/auth";

// Export from organization - separate type and value exports
export {
  useCurrentOrganization,
  useOrganizationActions,
  useOrganizationState,
  useOrganizationStore,
} from "./domains/organization";
export type { Organization, OrganizationActions, OrganizationState } from "./domains/organization";

// Export utilities - separate type and value exports
export { eventBus } from "./event-bus";
export type { EventHandler, EventTypes } from "./event-bus";

export { persistenceConfig } from "./persistence-config";
export type { PersistenceConfig, StorageAdapter } from "./persistence-config";

// CONSOLIDATED: Main unified store export
export { useCampfireStore } from "./unified-campfire-store";

// LEGACY ADAPTERS: Backward compatibility for existing components (excluding conflicting exports)
export {
  checkMigrationStatus,
  DEPRECATED_FILES,
  isUsingLegacyStore,
  MIGRATION_GUIDE,
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardMetrics,
  showMigrationTip,
  useHasBulkSelection,
  useIsComposerDisabled,
  useIsConversationSelected,
  useIsFileUploading,
  useIsSending,
  useMessageText,
  useSelectedConversationCount,
  useSelectedConversationId,
  useSelectedConversations,
  useShowAssignmentPanel,
  useShowCustomerProfile,
} from "./legacy-adapters";

// DIRECT EXPORTS: Import these directly from their source files to avoid conflicts
export { useDashboardStore } from "./dashboard-store";
export { useInboxStore } from "./useInboxStore";

// DEPRECATED: useStore export maintained for compatibility but will be removed
// Components should migrate to useCampfireStore from unified-campfire-store.ts
export { useStore } from "./legacy-adapters"; // Redirects to useCampfireStore
