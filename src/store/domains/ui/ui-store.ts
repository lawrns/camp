/**
 * UI Store - Domain-specific store for UI state management
 *
 * This store handles all UI-related state including:
 * - Sidebar and drawer visibility
 * - View and filter states
 * - Loading and error states
 * - Notifications
 * - Message scroll positions
 * - Search functionality
 */

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

/**
 * Notification type for UI notifications
 */
export interface UINotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: number;
}

/**
 * Available view types in the application
 */
export type ViewType = "inbox" | "knowledge" | "settings" | "analytics";

/**
 * Available filter types for conversation filtering
 */
export type FilterType = "all" | "unread" | "assigned" | "unassigned" | "closed";

/**
 * UI state interface containing all UI-related state
 */
export interface UIState {
  // Navigation state
  selectedConversationId: string | null;
  activeView: ViewType;
  activeFilter: FilterType;

  // Visibility states
  sidebarOpen: boolean;
  isDrawerOpen: boolean;

  // Search state
  searchQuery: string;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Scroll positions for message panels (keyed by conversationId)
  messageScrollPositions: Record<string, number>;

  // Notifications
  notifications: UINotification[];
}

/**
 * UI actions interface containing all UI state mutations
 */
export interface UIActions {
  // Navigation actions
  setSelectedConversation: (conversationId: string | null) => void;
  setActiveView: (view: ViewType) => void;
  setActiveFilter: (filter: FilterType) => void;

  // Visibility actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Loading and error actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Scroll position actions
  setMessageScrollPosition: (conversationId: string, position: number) => void;
  getMessageScrollPosition: (conversationId: string) => number;
  clearMessageScrollPosition: (conversationId: string) => void;

  // Notification actions
  addNotification: (notification: Omit<UINotification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Utility actions
  resetUIState: () => void;
}

/**
 * Combined type for the UI store
 */
export type UIStore = UIState & UIActions;

/**
 * Initial UI state
 */
const initialState: UIState = {
  // Navigation
  selectedConversationId: null,
  activeView: "inbox",
  activeFilter: "all",

  // Visibility
  sidebarOpen: true,
  isDrawerOpen: false,

  // Search
  searchQuery: "",

  // Loading and error
  isLoading: false,
  error: null,

  // Scroll positions
  messageScrollPositions: {},

  // Notifications
  notifications: [],
};

/**
 * Create the UI store with all actions
 */
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Navigation actions
          setSelectedConversation: (conversationId) =>
            set((draft) => {
              draft.selectedConversationId = conversationId;
            }),

          setActiveView: (view) =>
            set((draft) => {
              draft.activeView = view;
              // Clear selection when changing views
              if (view !== "inbox") {
                draft.selectedConversationId = null;
              }
            }),

          setActiveFilter: (filter) =>
            set((draft) => {
              draft.activeFilter = filter;
            }),

          // Visibility actions
          setSidebarOpen: (open) =>
            set((draft) => {
              draft.sidebarOpen = open;
            }),

          toggleSidebar: () =>
            set((draft) => {
              draft.sidebarOpen = !draft.sidebarOpen;
            }),

          setDrawerOpen: (open) =>
            set((draft) => {
              draft.isDrawerOpen = open;
            }),

          toggleDrawer: () =>
            set((draft) => {
              draft.isDrawerOpen = !draft.isDrawerOpen;
            }),

          // Search actions
          setSearchQuery: (query) =>
            set((draft) => {
              draft.searchQuery = query;
            }),

          clearSearch: () =>
            set((draft) => {
              draft.searchQuery = "";
            }),

          // Loading and error actions
          setLoading: (loading) =>
            set((draft) => {
              draft.isLoading = loading;
              // Clear error when starting a new loading operation
              if (loading) {
                draft.error = null;
              }
            }),

          setError: (error) =>
            set((draft) => {
              draft.error = error;
              draft.isLoading = false;
            }),

          clearError: () =>
            set((draft) => {
              draft.error = null;
            }),

          // Scroll position actions
          setMessageScrollPosition: (conversationId, position) =>
            set((draft) => {
              draft.messageScrollPositions[conversationId] = position;
            }),

          getMessageScrollPosition: (conversationId) => {
            const state = get();
            return state.messageScrollPositions[conversationId] || 0;
          },

          clearMessageScrollPosition: (conversationId) =>
            set((draft) => {
              delete draft.messageScrollPositions[conversationId];
            }),

          // Notification actions
          addNotification: (notification) =>
            set((draft) => {
              const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              draft.notifications.push({
                ...notification,
                id,
                timestamp: Date.now(),
              });

              // Auto-remove success notifications after 5 seconds
              if (notification.type === "success") {
                setTimeout(() => {
                  get().removeNotification(id);
                }, 5000);
              }

              // Auto-remove info notifications after 10 seconds
              if (notification.type === "info") {
                setTimeout(() => {
                  get().removeNotification(id);
                }, 10000);
              }
            }),

          removeNotification: (id) =>
            set((draft) => {
              const index = draft.notifications.findIndex((n) => n.id === id);
              if (index !== -1) {
                draft.notifications.splice(index, 1);
              }
            }),

          clearNotifications: () =>
            set((draft) => {
              draft.notifications = [];
            }),

          // Utility actions
          resetUIState: () =>
            set((draft) => {
              Object.assign(draft, initialState);
            }),
        }))
      ),
      {
        name: "campfire-ui-store",
        // Only persist certain UI state
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeView: state.activeView,
          activeFilter: state.activeFilter,
          messageScrollPositions: state.messageScrollPositions,
        }),
      }
    ),
    {
      name: "UI Store",
    }
  )
);

/**
 * Typed hook for selecting UI state
 */
export const useUIState = () =>
  useUIStore((state) => ({
    selectedConversationId: state.selectedConversationId,
    activeView: state.activeView,
    activeFilter: state.activeFilter,
    sidebarOpen: state.sidebarOpen,
    isDrawerOpen: state.isDrawerOpen,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    error: state.error,
    notifications: state.notifications,
  }));

/**
 * Typed hook for UI actions
 */
export const useUIActions = () =>
  useUIStore((state) => ({
    setSelectedConversation: state.setSelectedConversation,
    setActiveView: state.setActiveView,
    setActiveFilter: state.setActiveFilter,
    setSidebarOpen: state.setSidebarOpen,
    toggleSidebar: state.toggleSidebar,
    setDrawerOpen: state.setDrawerOpen,
    toggleDrawer: state.toggleDrawer,
    setSearchQuery: state.setSearchQuery,
    clearSearch: state.clearSearch,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    setMessageScrollPosition: state.setMessageScrollPosition,
    getMessageScrollPosition: state.getMessageScrollPosition,
    clearMessageScrollPosition: state.clearMessageScrollPosition,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    resetUIState: state.resetUIState,
  }));

/**
 * Typed hook for sidebar state
 */
export const useSidebarState = () =>
  useUIStore((state) => ({
    isOpen: state.sidebarOpen,
    toggle: state.toggleSidebar,
    setOpen: state.setSidebarOpen,
  }));

/**
 * Typed hook for drawer state
 */
export const useDrawerState = () =>
  useUIStore((state) => ({
    isOpen: state.isDrawerOpen,
    toggle: state.toggleDrawer,
    setOpen: state.setDrawerOpen,
  }));

/**
 * Typed hook for loading state
 */
export const useLoadingState = () =>
  useUIStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));

/**
 * Typed hook for notifications
 */
export const useNotifications = () =>
  useUIStore((state) => ({
    notifications: state.notifications,
    add: state.addNotification,
    remove: state.removeNotification,
    clear: state.clearNotifications,
  }));

/**
 * Typed hook for search functionality
 */
export const useSearch = () =>
  useUIStore((state) => ({
    query: state.searchQuery,
    setQuery: state.setSearchQuery,
    clear: state.clearSearch,
  }));

/**
 * Typed hook for conversation selection
 */
export const useConversationSelection = () =>
  useUIStore((state) => ({
    selectedId: state.selectedConversationId,
    select: state.setSelectedConversation,
    clear: () => state.setSelectedConversation(null),
  }));

/**
 * Typed hook for message scroll positions
 */
export const useMessageScroll = () =>
  useUIStore((state) => ({
    positions: state.messageScrollPositions,
    setPosition: state.setMessageScrollPosition,
    getPosition: state.getMessageScrollPosition,
    clearPosition: state.clearMessageScrollPosition,
  }));
