/**
 * Inbox Domain Store
 *
 * Manages all inbox-specific state including:
 * - Message composition
 * - File upload state
 * - Bulk conversation selection
 * - Panel visibility and sizing
 */

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { customStorage } from "../../persistence-config";

// Inbox state interface
export interface InboxState {
  // Message composition
  messageText: string;
  isSending: boolean;
  isFileUploading: boolean;

  // Bulk actions
  selectedConversations: Set<string>;

  // Panel sizing
  conversationListWidth: number;
  sidebarWidth: number;

  // Panel visibility
  showPreferences: boolean;
  showTicketDialog: boolean;
  showAssignmentPanel: boolean;
  showCustomerProfile: boolean;
}

// Inbox actions interface
export interface InboxActions {
  // Message composition actions
  setMessageText: (text: string) => void;
  setIsSending: (sending: boolean) => void;
  setIsFileUploading: (uploading: boolean) => void;
  clearMessage: () => void;

  // Bulk selection actions
  setSelectedConversations: (conversations: Set<string>) => void;
  addSelectedConversation: (conversationId: string) => void;
  removeSelectedConversation: (conversationId: string) => void;
  clearSelectedConversations: () => void;
  toggleConversationSelection: (conversationId: string) => void;
  selectAllConversations: (conversationIds: string[]) => void;

  // Panel sizing actions
  setConversationListWidth: (width: number) => void;
  setSidebarWidth: (width: number) => void;

  // Panel visibility actions
  setShowPreferences: (show: boolean) => void;
  setShowTicketDialog: (show: boolean) => void;
  setShowAssignmentPanel: (show: boolean) => void;
  setShowCustomerProfile: (show: boolean) => void;
  togglePreferences: () => void;
  toggleTicketDialog: () => void;
  toggleAssignmentPanel: () => void;
  toggleCustomerProfile: () => void;

  // Utility actions
  resetInboxState: () => void;
  clearAllPanels: () => void;
}

// Initial state
const initialState: InboxState = {
  // Message composition
  messageText: "",
  isSending: false,
  isFileUploading: false,

  // Bulk actions
  selectedConversations: new Set(),

  // Panel sizing
  conversationListWidth: 320,
  sidebarWidth: 320,

  // Panel visibility
  showPreferences: false,
  showTicketDialog: false,
  showAssignmentPanel: false,
  showCustomerProfile: false,
};

// Create the inbox store
export const useInboxStore = create<InboxState & InboxActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Message composition actions
          setMessageText: (text) =>
            set((draft) => {
              draft.messageText = text;
            }),

          setIsSending: (sending) =>
            set((draft) => {
              draft.isSending = sending;
            }),

          setIsFileUploading: (uploading) =>
            set((draft) => {
              draft.isFileUploading = uploading;
            }),

          clearMessage: () =>
            set((draft) => {
              draft.messageText = "";
            }),

          // Bulk selection actions
          setSelectedConversations: (conversations) =>
            set((draft) => {
              draft.selectedConversations = conversations;
            }),

          addSelectedConversation: (conversationId) =>
            set((draft) => {
              draft.selectedConversations.add(conversationId);
            }),

          removeSelectedConversation: (conversationId) =>
            set((draft) => {
              draft.selectedConversations.delete(conversationId);
            }),

          clearSelectedConversations: () =>
            set((draft) => {
              draft.selectedConversations.clear();
            }),

          toggleConversationSelection: (conversationId) =>
            set((draft) => {
              if (draft.selectedConversations.has(conversationId)) {
                draft.selectedConversations.delete(conversationId);
              } else {
                draft.selectedConversations.add(conversationId);
              }
            }),

          selectAllConversations: (conversationIds) =>
            set((draft) => {
              draft.selectedConversations = new Set(conversationIds);
            }),

          // Panel sizing actions
          setConversationListWidth: (width) =>
            set((draft) => {
              // Ensure minimum width
              draft.conversationListWidth = Math.max(280, Math.min(600, width));
            }),

          setSidebarWidth: (width) =>
            set((draft) => {
              // Ensure minimum width
              draft.sidebarWidth = Math.max(280, Math.min(600, width));
            }),

          // Panel visibility actions
          setShowPreferences: (show) =>
            set((draft) => {
              draft.showPreferences = show;
            }),

          setShowTicketDialog: (show) =>
            set((draft) => {
              draft.showTicketDialog = show;
            }),

          setShowAssignmentPanel: (show) =>
            set((draft) => {
              draft.showAssignmentPanel = show;
            }),

          setShowCustomerProfile: (show) =>
            set((draft) => {
              draft.showCustomerProfile = show;
            }),

          togglePreferences: () =>
            set((draft) => {
              draft.showPreferences = !draft.showPreferences;
            }),

          toggleTicketDialog: () =>
            set((draft) => {
              draft.showTicketDialog = !draft.showTicketDialog;
            }),

          toggleAssignmentPanel: () =>
            set((draft) => {
              draft.showAssignmentPanel = !draft.showAssignmentPanel;
            }),

          toggleCustomerProfile: () =>
            set((draft) => {
              draft.showCustomerProfile = !draft.showCustomerProfile;
            }),

          // Utility actions
          resetInboxState: () =>
            set(() => ({
              ...initialState,
              // Preserve panel sizing preferences
              conversationListWidth: get().conversationListWidth,
              sidebarWidth: get().sidebarWidth,
            })),

          clearAllPanels: () =>
            set((draft) => {
              draft.showPreferences = false;
              draft.showTicketDialog = false;
              draft.showAssignmentPanel = false;
              draft.showCustomerProfile = false;
            }),
        }))
      ),
      {
        name: "inbox-store",
        storage: customStorage as any,
        partialize: (state) =>
          ({
            // Only persist panel sizing preferences
            conversationListWidth: state.conversationListWidth,
            sidebarWidth: state.sidebarWidth,
          }) as any,
      }
    ),
    {
      name: "Inbox Store",
    }
  )
);

// Typed hooks for inbox-specific functionality
export const useMessageText = () => useInboxStore((state) => state.messageText);
export const useIsSending = () => useInboxStore((state) => state.isSending);
export const useIsFileUploading = () => useInboxStore((state) => state.isFileUploading);
export const useSelectedConversations = () => useInboxStore((state) => state.selectedConversations);
export const useConversationListWidth = () => useInboxStore((state) => state.conversationListWidth);
export const useSidebarWidth = () => useInboxStore((state) => state.sidebarWidth);
export const useShowPreferences = () => useInboxStore((state) => state.showPreferences);
export const useShowTicketDialog = () => useInboxStore((state) => state.showTicketDialog);
export const useShowAssignmentPanel = () => useInboxStore((state) => state.showAssignmentPanel);
export const useShowCustomerProfile = () => useInboxStore((state) => state.showCustomerProfile);

// Action hooks
export const useInboxActions = () => {
  const setMessageText = useInboxStore((state) => state.setMessageText);
  const setIsSending = useInboxStore((state) => state.setIsSending);
  const setIsFileUploading = useInboxStore((state) => state.setIsFileUploading);
  const clearMessage = useInboxStore((state) => state.clearMessage);
  const setSelectedConversations = useInboxStore((state) => state.setSelectedConversations);
  const addSelectedConversation = useInboxStore((state) => state.addSelectedConversation);
  const removeSelectedConversation = useInboxStore((state) => state.removeSelectedConversation);
  const clearSelectedConversations = useInboxStore((state) => state.clearSelectedConversations);
  const toggleConversationSelection = useInboxStore((state) => state.toggleConversationSelection);
  const selectAllConversations = useInboxStore((state) => state.selectAllConversations);
  const setConversationListWidth = useInboxStore((state) => state.setConversationListWidth);
  const setSidebarWidth = useInboxStore((state) => state.setSidebarWidth);
  const setShowPreferences = useInboxStore((state) => state.setShowPreferences);
  const setShowTicketDialog = useInboxStore((state) => state.setShowTicketDialog);
  const setShowAssignmentPanel = useInboxStore((state) => state.setShowAssignmentPanel);
  const setShowCustomerProfile = useInboxStore((state) => state.setShowCustomerProfile);
  const togglePreferences = useInboxStore((state) => state.togglePreferences);
  const toggleTicketDialog = useInboxStore((state) => state.toggleTicketDialog);
  const toggleAssignmentPanel = useInboxStore((state) => state.toggleAssignmentPanel);
  const toggleCustomerProfile = useInboxStore((state) => state.toggleCustomerProfile);
  const resetInboxState = useInboxStore((state) => state.resetInboxState);
  const clearAllPanels = useInboxStore((state) => state.clearAllPanels);

  return {
    setMessageText,
    setIsSending,
    setIsFileUploading,
    clearMessage,
    setSelectedConversations,
    addSelectedConversation,
    removeSelectedConversation,
    clearSelectedConversations,
    toggleConversationSelection,
    selectAllConversations,
    setConversationListWidth,
    setSidebarWidth,
    setShowPreferences,
    setShowTicketDialog,
    setShowAssignmentPanel,
    setShowCustomerProfile,
    togglePreferences,
    toggleTicketDialog,
    toggleAssignmentPanel,
    toggleCustomerProfile,
    resetInboxState,
    clearAllPanels,
  };
};

// Selectors for computed values
export const useSelectedConversationCount = () => useInboxStore((state) => state.selectedConversations.size);

export const useIsConversationSelected = (conversationId: string) =>
  useInboxStore((state) => state.selectedConversations.has(conversationId));

export const useHasBulkSelection = () => useInboxStore((state) => state.selectedConversations.size > 0);

export const useIsComposerDisabled = () => useInboxStore((state) => state.isSending || state.isFileUploading);

// Panel visibility selectors
export const useAnyPanelOpen = () =>
  useInboxStore(
    (state) => state.showPreferences || state.showTicketDialog || state.showAssignmentPanel || state.showCustomerProfile
  );

// Export store for direct access if needed
export { useInboxStore as inboxStore };
