/**
 * Inbox Domain Store
 *
 * Central export point for all inbox-related state management
 */

export * from "./inbox-store";

// Re-export commonly used hooks for convenience
export {
  useInboxStore,
  useMessageText,
  useIsSending,
  useIsFileUploading,
  useSelectedConversations,
  useConversationListWidth,
  useSidebarWidth,
  useShowPreferences,
  useShowTicketDialog,
  useShowAssignmentPanel,
  useShowCustomerProfile,
  useInboxActions,
  useSelectedConversationCount,
  useIsConversationSelected,
  useHasBulkSelection,
  useIsComposerDisabled,
  useAnyPanelOpen,
} from "./inbox-store";
