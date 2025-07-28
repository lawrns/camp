import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Types
export interface RealtimeState {
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  activeChannels: Set<string>;
  typingUsers: Record<string, Set<string>>; // conversationId -> userIds
  onlineUsers: Set<string>;
  lastConnectedAt: string | null;
}

export interface RealtimeActions {
  // Connection management
  setRealtimeConnection: (connected: boolean, status: RealtimeState["connectionStatus"]) => void;

  // Channel management
  addActiveChannel: (channel: string) => void;
  removeActiveChannel: (channel: string) => void;
  clearActiveChannels: () => void;

  // Typing indicators
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  addTypingUser: (conversationId: string, userId: string, userInfo?: { userName?: string; userType?: string }) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  clearAllTypingUsers: () => void;

  // Online users
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;

  // Reset
  resetRealtimeState: () => void;
}

export type RealtimeStore = RealtimeState & RealtimeActions;

// Initial state
const initialState: RealtimeState = {
  isConnected: false,
  connectionStatus: "disconnected",
  activeChannels: new Set(),
  typingUsers: {},
  onlineUsers: new Set(),
  lastConnectedAt: null,
};

// Store implementation
export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        ...initialState,

        // Connection management
        setRealtimeConnection: (connected, status) =>
          set((draft) => {
            draft.isConnected = connected;
            draft.connectionStatus = status;
            if (connected) {
              draft.lastConnectedAt = new Date().toISOString();
            }
          }),

        // Channel management
        addActiveChannel: (channel) =>
          set((draft) => {
            draft.activeChannels.add(channel);
          }),

        removeActiveChannel: (channel) =>
          set((draft) => {
            draft.activeChannels.delete(channel);
          }),

        clearActiveChannels: () =>
          set((draft) => {
            draft.activeChannels.clear();
          }),

        // Typing indicators
        setTypingUsers: (conversationId, userIds) =>
          set((draft) => {
            draft.typingUsers[conversationId] = new Set(userIds);
          }),

        addTypingUser: (conversationId, userId, userInfo) =>
          set((draft) => {
            if (!draft.typingUsers[conversationId]) {
              draft.typingUsers[conversationId] = new Set();
            }
            draft.typingUsers[conversationId].add(userId);
          }),

        removeTypingUser: (conversationId, userId) =>
          set((draft) => {
            if (draft.typingUsers[conversationId]) {
              draft.typingUsers[conversationId].delete(userId);
            }
          }),

        clearTypingUsers: (conversationId) =>
          set((draft) => {
            if (draft.typingUsers[conversationId]) {
              draft.typingUsers[conversationId].clear();
            }
          }),

        clearAllTypingUsers: () =>
          set((draft) => {
            draft.typingUsers = {};
          }),

        // Online users
        setOnlineUsers: (userIds) =>
          set((draft) => {
            draft.onlineUsers = new Set(userIds);
          }),

        addOnlineUser: (userId) =>
          set((draft) => {
            draft.onlineUsers.add(userId);
          }),

        removeOnlineUser: (userId) =>
          set((draft) => {
            draft.onlineUsers.delete(userId);
          }),

        // Reset
        resetRealtimeState: () =>
          set(() => ({
            ...initialState,
            activeChannels: new Set(),
            typingUsers: {},
            onlineUsers: new Set(),
          })),
      }))
    ),
    { name: "realtime-store" }
  )
);

// Typed hooks
export const useRealtimeConnection = () =>
  useRealtimeStore((state) => ({
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastConnectedAt: state.lastConnectedAt,
  }));

export const useActiveChannels = () => useRealtimeStore((state) => state.activeChannels);

export const useTypingUsers = (conversationId: string) =>
  useRealtimeStore((state) => state.typingUsers[conversationId] || new Set());

export const useOnlineUsers = () => useRealtimeStore((state) => state.onlineUsers);

export const useIsUserOnline = (userId: string) => useRealtimeStore((state) => state.onlineUsers.has(userId));

// Selectors
export const selectRealtimeConnection = (state: RealtimeStore) => ({
  isConnected: state.isConnected,
  connectionStatus: state.connectionStatus,
  lastConnectedAt: state.lastConnectedAt,
});

export const selectActiveChannels = (state: RealtimeStore) => state.activeChannels;

export const selectTypingUsers = (conversationId: string) => (state: RealtimeStore) =>
  state.typingUsers[conversationId] || new Set();

export const selectOnlineUsers = (state: RealtimeStore) => state.onlineUsers;

export const selectIsUserOnline = (userId: string) => (state: RealtimeStore) => state.onlineUsers.has(userId);

// Actions export for external usage
export const realtimeActions = {
  setRealtimeConnection: useRealtimeStore.getState().setRealtimeConnection,
  addActiveChannel: useRealtimeStore.getState().addActiveChannel,
  removeActiveChannel: useRealtimeStore.getState().removeActiveChannel,
  clearActiveChannels: useRealtimeStore.getState().clearActiveChannels,
  setTypingUsers: useRealtimeStore.getState().setTypingUsers,
  addTypingUser: useRealtimeStore.getState().addTypingUser,
  removeTypingUser: useRealtimeStore.getState().removeTypingUser,
  clearTypingUsers: useRealtimeStore.getState().clearTypingUsers,
  clearAllTypingUsers: useRealtimeStore.getState().clearAllTypingUsers,
  setOnlineUsers: useRealtimeStore.getState().setOnlineUsers,
  addOnlineUser: useRealtimeStore.getState().addOnlineUser,
  removeOnlineUser: useRealtimeStore.getState().removeOnlineUser,
  resetRealtimeState: useRealtimeStore.getState().resetRealtimeState,
};
