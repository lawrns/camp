import type { StateStorage } from "zustand/middleware";
import type { AuthState } from "./domains/auth/auth-store";
// Import specific store state types
import type { ConversationsState } from "./domains/conversations/conversations-store";
import type { OrganizationState } from "./domains/organization/organization-store";
import type { UIState } from "./domains/ui/ui-store";

// Define partial state interface for persistence
interface PersistedState {
  conversations?: Partial<ConversationsState>;
  ui?: Partial<UIState>;
  auth?: Partial<AuthState>;
  organization?: Partial<OrganizationState>;
  realtime?: {
    activeChannels?: Set<string> | string[];
    onlineUsers?: Set<string> | string[];
    typingUsers?: Record<string, Set<string> | string[]>;
  };
  messages?: Map<string, unknown> | Array<[string, unknown]>;
  users?: Map<string, unknown> | Array<[string, unknown]>;
}

/**
 * Custom storage adapter that handles Map serialization
 */
export const customStorage: StateStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const { state } = JSON.parse(str);

      // Restore Maps from serialized data
      if (state.conversations && Array.isArray(state.conversations)) {
        state.conversations = new Map(state.conversations);
      }
      if (state.messages && Array.isArray(state.messages)) {
        state.messages = new Map(state.messages);
      }
      if (state.users && Array.isArray(state.users)) {
        state.users = new Map(state.users);
      }

      // Restore Sets
      if (state.realtime) {
        if (state.realtime.activeChannels && Array.isArray(state.realtime.activeChannels)) {
          state.realtime.activeChannels = new Set(state.realtime.activeChannels);
        }
        if (state.realtime.onlineUsers && Array.isArray(state.realtime.onlineUsers)) {
          state.realtime.onlineUsers = new Set(state.realtime.onlineUsers);
        }

        // Restore typing users Map<string, Set<string>>
        if (state.realtime.typingUsers && typeof state.realtime.typingUsers === "object") {
          const typingUsersMap: Record<string, Set<string>> = {};
          for (const [convId, users] of Object.entries(state.realtime.typingUsers)) {
            typingUsersMap[convId] = new Set(users as string[]);
          }
          state.realtime.typingUsers = typingUsersMap;
        }
      }

      return JSON.stringify({ state });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to restore state from storage:", error);
      }
      return null;
    }
  },

  setItem: (name: string, value: string) => {
    try {
      // Ensure we have a valid value to work with
      if (!value) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Attempting to persist undefined/null state");
        }
        return;
      }

      // Parse the state from the value
      let parsedValue;
      try {
        parsedValue = typeof value === "string" ? JSON.parse(value) : value;
      } catch (parseError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to parse state value:", parseError);
        }
        return;
      }

      const state = parsedValue.state || parsedValue;

      // Serialize Maps to arrays
      const serializedState = {
        ...state,
        conversations: state.conversations ? Array.from(state.conversations.entries()) : [],
        messages: state.messages ? Array.from(state.messages.entries()) : [],
        users: state.users ? Array.from(state.users.entries()) : [],
      };

      // Serialize Sets in realtime state
      if (state.realtime) {
        serializedState.realtime = {
          ...state.realtime,
          activeChannels: state.realtime.activeChannels ? Array.from(state.realtime.activeChannels) : [],
          onlineUsers: state.realtime.onlineUsers ? Array.from(state.realtime.onlineUsers) : [],
          typingUsers: state.realtime.typingUsers
            ? Object.fromEntries(
                Object.entries(state.realtime.typingUsers).map(([k, v]) => [k, Array.from(v as Set<string>)])
              )
            : {},
        };
      }

      localStorage.setItem(name, JSON.stringify({ state: serializedState }));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to persist state:", error);
      }
    }
  },

  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

/**
 * Determines which parts of the state should be persisted
 */
export const persistPartialize = (state: PersistedState) => {
  // Only persist minimal state that doesn't contain Maps or Sets
  return {
    // Persist UI preferences
    ui: state.ui
      ? {
          sidebarOpen: state.ui.sidebarOpen,
          activeView: state.ui.activeView,
          activeFilter: state.ui.activeFilter,
          messageScrollPositions: state.ui.messageScrollPositions,
          selectedConversationId: state.ui.selectedConversationId,
          searchQuery: state.ui.searchQuery,
        }
      : undefined,
    // Persist organization info
    organization: state.organization,
    // Persist auth state (but not the full session object which might have non-serializable parts)
    auth: state.auth
      ? {
          user: state.auth.user
            ? {
                id: state.auth.user.id,
                email: state.auth.user.email,
                user_metadata: state.auth.user.user_metadata,
              }
            : null,
          isAuthenticated: state.auth.isAuthenticated,
        }
      : undefined,
    // Don't persist actual data (conversations, messages) - load fresh on app start
    // Don't persist real-time state - reconnect on app start
    // Don't persist performance metrics - reset on app start
  };
};

// Export types and config
export interface PersistenceConfig {
  storage: StateStorage;
  partialize: (state: PersistedState) => Partial<PersistedState>;
}

export interface StorageAdapter extends StateStorage {}

export const persistenceConfig: PersistenceConfig = {
  storage: customStorage,
  partialize: persistPartialize,
};
