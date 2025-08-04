/**
 * Conversation Store - Example Implementation
 *
 * This store manages conversation data, including the conversations list,
 * selection state, and conversation-related operations.
 */

import { produce } from "immer";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
// Import types from shared types
import type { Conversation } from "@/types/entities";

interface ConversationState {
  // Core data
  conversationsMap: Map<string, Conversation>;
  conversationIds: string[]; // Ordered list for performance

  // Selection state
  selectedConversationId: string | null;
  selectedConversation: Conversation | null;

  // UI state
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;

  // Filtering and search
  activeFilter: "all" | "unread" | "assigned" | "unassigned" | "closed";
  searchQuery: string;

  // Pagination
  hasMore: boolean;
  nextCursor: string | null;

  // Performance optimization
  lastMessagePreviews: Record<string, string>;
  unreadCounts: Record<string, number>;
}

interface ConversationActions {
  // Data operations
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;

  // Selection
  selectConversation: (conversationId: string | null) => void;

  // Unread management
  incrementUnreadCount: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;

  // Filtering
  setActiveFilter: (filter: ConversationState["activeFilter"]) => void;
  setSearchQuery: (query: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async operations
  loadConversations: (organizationId: string) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  updateConversationStatus: (conversationId: string, status: Conversation["status"]) => Promise<void>;
  assignConversation: (conversationId: string, userId: string | null) => Promise<void>;
}

const initialState: ConversationState = {
  conversationsMap: new Map(),
  conversationIds: [],
  selectedConversationId: null,
  selectedConversation: null,
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  activeFilter: "all",
  searchQuery: "",
  hasMore: true,
  nextCursor: null,
  lastMessagePreviews: {},
  unreadCounts: {},
};

export const useConversationStore = create<ConversationState & ConversationActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      setConversations: (conversations) => {
        const conversationsMap = new Map<number, Conversation>();
        const conversationIds: number[] = [];
        const lastMessagePreviews: Record<string, string> = {};
        const unreadCounts: Record<string, number> = {};

        conversations.forEach((conv: unknown) => {
          conversationsMap.set(conv.id, conv);
          conversationIds.push(conv.id);
          lastMessagePreviews[conv.id] = conv.lastMessagePreview || "";
          unreadCounts[conv.id] = conv.unread_count;
        });

        set({
          conversationsMap,
          conversationIds,
          lastMessagePreviews,
          unreadCounts,
          isLoading: false,
          error: null,
        });
      },

      addConversation: (conversation) => {
        set(
          produce((state: ConversationState) => {
            state.conversationsMap.set(conversation.id, conversation);
            if (!state.conversationIds.includes(conversation.id)) {
              state.conversationIds.unshift(conversation.id); // Add to beginning
            }
            state.lastMessagePreviews[conversation.id] = conversation.lastMessagePreview || "";
            state.unreadCounts[conversation.id] = conversation.unreadCount || 0;
          })
        );
      },

      updateConversation: (conversation) => {
        set(
          produce((state: ConversationState) => {
            const existing = state.conversationsMap.get(conversation.id);
            if (existing) {
              state.conversationsMap.set(conversation.id, {
                ...existing,
                ...conversation,
              });
              state.lastMessagePreviews[conversation.id] = conversation.lastMessagePreview || "";
              state.unreadCounts[conversation.id] = conversation.unreadCount || 0;

              // Update selected conversation if it's the current one
              if (state.selectedConversationId === conversation.id) {
                state.selectedConversation = state.conversationsMap.get(conversation.id) || null;
              }
            }
          })
        );
      },

      removeConversation: (conversationId) => {
        set(
          produce((state: ConversationState) => {
            state.conversationsMap.delete(conversationId);
            state.conversationIds = state.conversationIds.filter((id) => id !== conversationId);
            delete state.lastMessagePreviews[conversationId];
            delete state.unreadCounts[conversationId];

            if (state.selectedConversationId === conversationId) {
              state.selectedConversationId = null;
              state.selectedConversation = null;
            }
          })
        );
      },

      selectConversation: (conversationId) => {
        const conversation = conversationId ? get().conversationsMap.get(conversationId) : null;
        set({
          selectedConversationId: conversationId,
          selectedConversation: conversation || null,
        });

        // Notify other stores
        if (conversationId) {
          window.dispatchEvent(
            new CustomEvent("conversation:selected", {
              detail: { conversationId, conversation },
            })
          );
        }
      },

      incrementUnreadCount: (conversationId) => {
        set(
          produce((state: ConversationState) => {
            const current = state.unreadCounts[conversationId] || 0;
            state.unreadCounts[conversationId] = current + 1;

            const conversation = state.conversationsMap.get(conversationId);
            if (conversation) {
              conversation.unreadCount = current + 1;
            }
          })
        );
      },

      markConversationAsRead: (conversationId) => {
        set(
          produce((state: ConversationState) => {
            state.unreadCounts[conversationId] = 0;

            const conversation = state.conversationsMap.get(conversationId);
            if (conversation) {
              conversation.unreadCount = 0;
            }
          })
        );
      },

      setUnreadCount: (conversationId, count) => {
        set(
          produce((state: ConversationState) => {
            state.unreadCounts[conversationId] = count;

            const conversation = state.conversationsMap.get(conversationId);
            if (conversation) {
              conversation.unreadCount = count;
            }
          })
        );
      },

      setActiveFilter: (filter) => set({ activeFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
      setError: (error) => set({ error, isLoading: false }),

      loadConversations: async (organizationId) => {
        set({ isLoading: true, error: null });
        try {
          // API call would go here
          // const conversations = await api.conversations.list({ organizationId });
          // get().setConversations(conversations);
        } catch (error) {
          set({ error: "Failed to load conversations" });
        } finally {
          set({ isLoading: false });
        }
      },

      loadMoreConversations: async () => {
        const { nextCursor, hasMore } = get();
        if (!hasMore || !nextCursor) return;

        set({ isLoading: true });
        try {
          // API call with cursor
          // const { conversations, nextCursor, hasMore } = await api.conversations.list({ cursor: nextCursor });
          // Append to existing conversations
        } catch (error) {
          set({ error: "Failed to load more conversations" });
        } finally {
          set({ isLoading: false });
        }
      },

      updateConversationStatus: async (conversationId, status) => {
        try {
          // Optimistic update
          const conversation = get().conversationsMap.get(conversationId);
          if (conversation) {
            get().updateConversation({ ...conversation, status });
          }

          // API call
          // await api.conversations.updateStatus(conversationId, status);
        } catch (error) {
          // Rollback on error
          set({ error: "Failed to update conversation status" });
        }
      },

      assignConversation: async (conversationId, userId) => {
        try {
          // Optimistic update
          const conversation = get().conversationsMap.get(conversationId);
          if (conversation) {
            get().updateConversation({ ...conversation, assigned_to: userId || "" });
          }

          // API call
          // await api.conversations.assign(conversationId, userId);
        } catch (error) {
          set({ error: "Failed to assign conversation" });
        }
      },
    })),
    {
      name: "ConversationStore",
    }
  )
);

// Selectors
export const conversationSelectors = {
  // Get filtered conversations
  getFilteredConversations: (state: ConversationState): Conversation[] => {
    const { conversationIds, conversationsMap, activeFilter, searchQuery } = state;

    return conversationIds
      .map((id: unknown) => conversationsMap.get(id))
      .filter((conv: unknown): conv is Conversation => {
        if (!conv) return false;

        // Apply filter
        switch (activeFilter) {
          case "unread":
            if (conv.unread_count === 0) return false;
            break;
          case "assigned":
            if (!conv.assigned_to) return false;
            break;
          case "unassigned":
            if (conv.assigned_to) return false;
            break;
          case "closed":
            if (conv.status !== "closed") return false;
            break;
        }

        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            conv.customerName?.toLowerCase().includes(query) ||
            conv.customerEmail?.toLowerCase().includes(query) ||
            conv.subject?.toLowerCase().includes(query) ||
            conv.lastMessagePreview?.toLowerCase().includes(query)
          );
        }

        return true;
      });
  },

  // Get total unread count
  getTotalUnreadCount: (state: ConversationState): number => {
    return Object.values(state.unreadCounts).reduce((sum: number, count: number) => sum + count, 0);
  },

  // Get conversation by ID
  getConversationById:
    (id: number) =>
    (state: ConversationState): Conversation | undefined => {
      return state.conversationsMap.get(id);
    },
};

// Convenience hooks
export const useSelectedConversation = () => useConversationStore((state) => state.selectedConversation);
export const useConversationLoading = () => useConversationStore((state) => state.isLoading);
export const useFilteredConversations = () => useConversationStore(conversationSelectors.getFilteredConversations);
export const useTotalUnreadCount = () => useConversationStore(conversationSelectors.getTotalUnreadCount);
