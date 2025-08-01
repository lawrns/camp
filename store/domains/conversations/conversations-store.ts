/**
 * Conversations Store - Domain-specific store for conversation management
 *
 * This store manages all conversation-related state including:
 * - Conversations Map with CRUD operations
 * - Message previews and unread counts
 * - Filtering and searching
 * - Real-time updates and optimistic UI
 *
 * Extracted from unified-campfire-store.ts for better separation of concerns.
 */

import { enableMapSet } from "immer";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Conversation } from "../../../types/entities/conversation";
import type { Message } from "../../../types/entities/message";
import { eventBus } from "../../event-bus";
import { customStorage } from "../../persistence-config";

// Extended Conversation type with version for optimistic updates
export interface ConversationWithVersion extends Conversation {
  version?: number;
  unread_count?: number;
}

// Enable MapSet plugin for Immer to handle Map objects
enableMapSet();

// ===== TYPE DEFINITIONS =====

export interface ConversationsState {
  // Core data - NORMALIZED STATE STRUCTURE
  conversations: Map<string, ConversationWithVersion>;

  // PERFORMANCE OPTIMIZATION: Fast lookup for conversation previews
  lastMessagePreviews: Record<string, string>; // conversationId -> preview text

  // P0 FIX: Unread counter management for Intercom-level UX
  unreadCounts: Record<string, number>; // conversationId -> unread count

  // Selection state
  selectedConversationId: string | null;

  // Filtering and search
  activeFilter: "all" | "unread" | "assigned" | "unassigned" | "closed";
  searchQuery: string;

  // Loading states
  isLoading: boolean;
  isLoadingMessages: Record<string, boolean>; // Per-conversation loading state
  error: string | null;

  // Pagination
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}

export interface ConversationsActions {
  // Data operations
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversation: ConversationWithVersion) => void;
  addConversation: (conversation: ConversationWithVersion) => void;
  removeConversation: (conversationId: string) => void;

  // Selection
  setSelectedConversation: (conversationId: string | null) => void;

  // Unread management
  incrementUnreadCount: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;

  // Filtering
  setActiveFilter: (filter: ConversationsState["activeFilter"]) => void;
  setSearchQuery: (query: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setLoadingMessages: (conversationId: string, loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async operations
  loadConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<Message[]>;
  updateConversationStatus: (
    conversationId: string,
    status: ConversationWithVersion["status"],
    accessToken?: string
  ) => Promise<void>;
  assignConversation: (conversationId: string, userId: string | null) => Promise<void>;

  // Utility
  clearConversations: () => void;
  updateLastMessagePreview: (conversationId: string, preview: string, timestamp: string) => void;
}

// ===== INITIAL STATE =====

const initialState: ConversationsState = {
  conversations: new Map(),
  lastMessagePreviews: {},
  unreadCounts: {},
  selectedConversationId: null,
  activeFilter: "all",
  searchQuery: "",
  isLoading: false,
  isLoadingMessages: {},
  error: null,
  hasMore: true,
  nextCursor: null,
  totalCount: 0,
};

// ===== STORE IMPLEMENTATION =====

export const useConversationsStore = create<ConversationsState & ConversationsActions>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,

          // Data operations
          setConversations: (conversations) =>
            set((draft) => {
              draft.conversations.clear();
              draft.lastMessagePreviews = {};
              draft.unreadCounts = {};

              conversations.forEach((conv: Conversation) => {
                // Ensure version for optimistic updates and convert to extended type
                const conversationWithVersion: ConversationWithVersion = {
                  ...conv,
                  version: 1,
                  unread_count: conv.unreadCount || 0,
                };

                draft.conversations.set(conv.id.toString(), conversationWithVersion);

                // Update performance caches
                if (conv.lastMessagePreview) {
                  draft.lastMessagePreviews[conv.id.toString()] = conv.lastMessagePreview;
                }
                draft.unreadCounts[conv.id.toString()] = conversationWithVersion.unread_count || 0;
              });

              draft.totalCount = conversations.length;
              draft.isLoading = false;
              draft.error = null;
            }),

          updateConversation: (conversation) =>
            set((draft) => {
              const existing = draft.conversations.get(conversation.id.toString());

              // Version check for optimistic updates
              const updatedConversation: ConversationWithVersion = {
                ...conversation,
                version: conversation.version || (existing?.version || 0) + 1,
                unread_count: conversation.unread_count ?? conversation.unreadCount ?? existing?.unread_count ?? 0,
              };

              draft.conversations.set(conversation.id.toString(), updatedConversation);

              // Update caches
              if (conversation.lastMessagePreview) {
                draft.lastMessagePreviews[conversation.id.toString()] = conversation.lastMessagePreview;
              }
              if (updatedConversation.unread_count !== undefined) {
                draft.unreadCounts[conversation.id.toString()] = updatedConversation.unread_count;
              }
            }),

          addConversation: (conversation) =>
            set((draft) => {
              const conversationWithVersion: ConversationWithVersion = {
                ...conversation,
                version: conversation.version || 1,
                unread_count: conversation.unreadCount || 0,
              };

              draft.conversations.set(conversation.id.toString(), conversationWithVersion);

              // Update caches
              if (conversation.lastMessagePreview) {
                draft.lastMessagePreviews[conversation.id.toString()] = conversation.lastMessagePreview;
              }
              draft.unreadCounts[conversation.id.toString()] = conversationWithVersion.unread_count || 0;

              draft.totalCount++;
            }),

          removeConversation: (conversationId) =>
            set((draft) => {
              draft.conversations.delete(conversationId);

              // Remove conversationId from lastMessagePreviews
              const { [conversationId]: removed1, ...restPreviews } = draft.lastMessagePreviews;
              draft.lastMessagePreviews = restPreviews;

              // Remove conversationId from unreadCounts
              const { [conversationId]: removed2, ...restUnreadCounts } = draft.unreadCounts;
              draft.unreadCounts = restUnreadCounts;

              // Remove conversationId from isLoadingMessages
              const { [conversationId]: removed3, ...restLoadingMessages } = draft.isLoadingMessages;
              draft.isLoadingMessages = restLoadingMessages;

              if (draft.selectedConversationId === conversationId) {
                draft.selectedConversationId = null;
              }

              draft.totalCount = Math.max(0, draft.totalCount - 1);
            }),

          // Selection
          setSelectedConversation: (conversationId) =>
            set((draft) => {
              draft.selectedConversationId = conversationId;

              // Mark as read when selected
              if (conversationId) {
                const conversation = draft.conversations.get(conversationId);
                if (conversation && (conversation.unread_count || 0) > 0) {
                  conversation.unread_count = 0;
                  draft.unreadCounts[conversationId] = 0;
                }
              }
            }),

          // Unread management
          incrementUnreadCount: (conversationId) =>
            set((draft) => {
              const current = draft.unreadCounts[conversationId] || 0;
              const newCount = current + 1;
              draft.unreadCounts[conversationId] = newCount;

              const conversation = draft.conversations.get(conversationId);
              if (conversation) {
                conversation.unread_count = newCount;
              }
            }),

          markConversationAsRead: (conversationId) =>
            set((draft) => {
              draft.unreadCounts[conversationId] = 0;

              const conversation = draft.conversations.get(conversationId);
              if (conversation) {
                conversation.unread_count = 0;
              }
            }),

          setUnreadCount: (conversationId, count) =>
            set((draft) => {
              draft.unreadCounts[conversationId] = count;

              const conversation = draft.conversations.get(conversationId);
              if (conversation) {
                conversation.unread_count = count;
              }
            }),

          // Filtering
          setActiveFilter: (filter) =>
            set((draft) => {
              draft.activeFilter = filter;
            }),

          setSearchQuery: (query) =>
            set((draft) => {
              draft.searchQuery = query;
            }),

          // Loading states
          setLoading: (loading) =>
            set((draft) => {
              draft.isLoading = loading;
            }),

          setLoadingMessages: (conversationId, loading) =>
            set((draft) => {
              draft.isLoadingMessages[conversationId] = loading;
            }),

          setError: (error) =>
            set((draft) => {
              draft.error = error;
              draft.isLoading = false;
            }),

          // Async operations
          loadConversations: async () => {
            const state = get();
            if (state.isLoading) return;

            set((draft) => {
              draft.isLoading = true;
              draft.error = null;
            });

            try {
              // Get auth token from auth store
              const authStore = (await import("../auth/auth-store")).useAuthStore.getState();
              const accessToken = authStore.session?.access_token;

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
              }

              const response = await fetch(`/api/conversations?action=list&limit=50&offset=0`, {
                method: "GET",
                headers,
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error("Failed to load conversations");
              }

              const data = (await response.json()) as {
                conversations?: Conversation[];
                hasMore?: boolean;
                nextCursor?: string | null;
              };

              if (data.conversations) {
                get().setConversations(data.conversations);
              }

              set((draft) => {
                draft.hasMore = data.hasMore || false;
                draft.nextCursor = data.nextCursor || null;
              });
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Failed to load conversations:", error);
              }
              set((draft) => {
                draft.error = error instanceof Error ? error.message : "Failed to load conversations";
                draft.isLoading = false;
              });
            }
          },

          loadMoreConversations: async () => {
            const state = get();
            if (!state.hasMore || !state.nextCursor || state.isLoading) return;

            set((draft) => {
              draft.isLoading = true;
            });

            try {
              // Get auth token
              const authStore = (await import("../auth/auth-store")).useAuthStore.getState();
              const accessToken = authStore.session?.access_token;

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
              }

              const response = await fetch(`/api/conversations?action=list&cursor=${state.nextCursor}`, {
                method: "GET",
                headers,
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error("Failed to load more conversations");
              }

              const data = (await response.json()) as {
                conversations?: Conversation[];
                hasMore?: boolean;
                nextCursor?: string | null;
              };

              if (data.conversations && data.conversations.length > 0) {
                set((draft) => {
                  data.conversations!.forEach((conv: Conversation) => {
                    const conversationWithVersion: ConversationWithVersion = {
                      ...conv,
                      version: 1,
                      unread_count: conv.unreadCount || 0,
                    };
                    draft.conversations.set(conv.id.toString(), conversationWithVersion);

                    if (conv.lastMessagePreview) {
                      draft.lastMessagePreviews[conv.id.toString()] = conv.lastMessagePreview;
                    }
                    draft.unreadCounts[conv.id.toString()] = conversationWithVersion.unread_count || 0;
                  });

                  draft.totalCount += data.conversations!.length;
                  draft.hasMore = data.hasMore || false;
                  draft.nextCursor = data.nextCursor || null;
                  draft.isLoading = false;
                });
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Failed to load more conversations:", error);
              }
              set((draft) => {
                draft.error = "Failed to load more conversations";
                draft.isLoading = false;
              });
            }
          },

          loadMessages: async (conversationId) => {
            set((draft) => {
              draft.isLoadingMessages[conversationId] = true;
            });

            try {
              // Get auth token
              const authStore = (await import("../auth/auth-store")).useAuthStore.getState();
              const accessToken = authStore.session?.access_token;

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
              }

              const response = await fetch(`/api/conversations?action=messages&id=${conversationId}`, {
                method: "GET",
                headers,
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error("Failed to load messages");
              }

              const data = (await response.json()) as {
                messages?: Message[];
              };

              // Sort messages by createdAt
              const sortedMessages = (data.messages || []).sort(
                (a: Message, b: Message) =>
                  new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
              );

              set((draft) => {
                draft.isLoadingMessages[conversationId] = false;
              });

              return sortedMessages;
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Failed to load messages:", error);
              }
              set((draft) => {
                draft.isLoadingMessages[conversationId] = false;
              });
              throw error;
            }
          },

          updateConversationStatus: async (conversationId, status, accessToken) => {
            const state = get();
            if (process.env.NODE_ENV === "development") {
              console.log("[ConversationsStore] updateConversationStatus called:", {
                conversationId,
                status,
                accessToken: !!accessToken,
              });
            }

            // Get current conversation for optimistic rollback
            const currentConversation = state.conversations.get(conversationId);
            if (!currentConversation) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Conversation not found for status update:", conversationId);
              }
              throw new Error("Conversation not found");
            }

            const originalStatus = currentConversation.status;

            // Optimistic update - immediately update local state
            set((draft) => {
              const conversation = draft.conversations.get(conversationId);
              if (conversation) {
                conversation.status = status;
                conversation.updatedAt = new Date().toISOString(); // Fixed: use camelCase
                conversation.version = (conversation.version || 0) + 1;
                if (process.env.NODE_ENV === "development") {
                  console.log("[ConversationsStore] Optimistically updated conversation status:", {
                    conversationId,
                    status,
                  });
                }
              }
            });

            try {
              // Get auth token if not provided
              if (!accessToken) {
                const authStore = (await import("../auth/auth-store")).useAuthStore.getState();
                accessToken = authStore.session?.access_token;
              }

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
              }

              // Call the dedicated status update API endpoint
              const response = await fetch(`/api/conversations/${conversationId}/status`, {
                method: "PATCH",
                headers,
                credentials: "include",
                body: JSON.stringify({
                  status,
                  reason: "Updated via inbox interface",
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error("[ConversationsStore] Status update API error:", errorText);
                throw new Error(`Failed to update conversation status: ${response.status} ${errorText}`);
              }

              const data = (await response.json()) as {
                success?: boolean;
                data?: Partial<ConversationWithVersion>;
              };
              if (process.env.NODE_ENV === "development") {
                console.log("[ConversationsStore] Status update API response:", data);
              }

              // Update with server response to ensure consistency
              if (data.success && data.data) {
                set((draft) => {
                  const conversation = draft.conversations.get(conversationId);
                  if (conversation) {
                    // Update with server data
                    Object.assign(conversation, data.data);
                    conversation.version = (conversation.version || 0) + 1;
                    if (process.env.NODE_ENV === "development") {
                      console.log("[ConversationsStore] Updated conversation with server response:", conversationId);
                    }
                  }
                });
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Failed to update conversation status:", error);
              }

              // Rollback optimistic update on error
              set((draft) => {
                const conversation = draft.conversations.get(conversationId);
                if (conversation) {
                  conversation.status = originalStatus;
                  if (currentConversation.updatedAt) { // Fixed: use camelCase
                    conversation.updatedAt = currentConversation.updatedAt; // Fixed: use camelCase
                  }
                  if (currentConversation.version !== undefined) {
                    conversation.version = currentConversation.version;
                  }
                  if (process.env.NODE_ENV === "development") {
                    console.log("[ConversationsStore] Rolled back optimistic status update:", {
                      conversationId,
                      originalStatus,
                    });
                  }
                }
              });

              // Re-throw error for component handling
              throw error;
            }
          },

          assignConversation: async (conversationId, userId) => {
            const state = get();
            const conversation = state.conversations.get(conversationId);
            if (!conversation) {
              throw new Error("Conversation not found");
            }

            const originalAssignee = conversation.assigned_to;

            // Optimistic update
            set((draft) => {
              const conv = draft.conversations.get(conversationId);
              if (conv) {
                if (userId) {
                  conv.assignedOperatorId = userId; // Fixed: use camelCase
                } else {
                  delete conv.assignedOperatorId; // Fixed: use camelCase
                }
                conv.updatedAt = new Date().toISOString(); // Fixed: use camelCase
                conv.version = (conv.version || 0) + 1;
              }
            });

            try {
              // Get auth token
              const authStore = (await import("../auth/auth-store")).useAuthStore.getState();
              const accessToken = authStore.session?.access_token;

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
              }

              const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
                method: "PATCH",
                headers,
                credentials: "include",
                body: JSON.stringify({
                  assigned_to: userId,
                  reason: "Manual assignment via inbox",
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to assign conversation");
              }

              const data = (await response.json()) as {
                success?: boolean;
                data?: Partial<ConversationWithVersion>;
              };

              // Update with server response
              if (data.success && data.data) {
                set((draft) => {
                  const conv = draft.conversations.get(conversationId);
                  if (conv) {
                    Object.assign(conv, data.data);
                    conv.version = (conv.version || 0) + 1;
                  }
                });
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("[ConversationsStore] Failed to assign conversation:", error);
              }

              // Rollback on error
              set((draft) => {
                const conv = draft.conversations.get(conversationId);
                if (conv) {
                  if (originalAssignee) {
                    conv.assignedOperatorId = originalAssignee; // Fixed: use camelCase
                  } else {
                    delete conv.assignedOperatorId; // Fixed: use camelCase
                  }
                  if (conversation.updatedAt) { // Fixed: use camelCase
                    conv.updatedAt = conversation.updatedAt; // Fixed: use camelCase
                  }
                  if (conversation.version !== undefined) {
                    conv.version = conversation.version;
                  }
                }
              });

              throw error;
            }
          },

          // Utility
          clearConversations: () =>
            set((draft) => {
              draft.conversations.clear();
              draft.lastMessagePreviews = {};
              draft.unreadCounts = {};
              draft.isLoadingMessages = {};
              draft.selectedConversationId = null;
              draft.totalCount = 0;
              draft.hasMore = true;
              draft.nextCursor = null;
            }),

          updateLastMessagePreview: (conversationId, preview, timestamp) =>
            set((draft) => {
              draft.lastMessagePreviews[conversationId] = preview;

              const conversation = draft.conversations.get(conversationId);
              if (conversation) {
                conversation.lastMessagePreview = preview;
                if (timestamp) {
                  conversation.lastMessageAt = timestamp; // Fixed: use camelCase
                }
                if (timestamp) {
                  conversation.updatedAt = timestamp; // Fixed: use camelCase
                }
                conversation.version = (conversation.version || 0) + 1;
              }
            }),
        })),
        {
          name: "conversations-store",
          storage: customStorage as any,
          // Only persist essential data
          partialize: (state) =>
            ({
              activeFilter: state.activeFilter,
              searchQuery: state.searchQuery,
            }) as Partial<ConversationsState>,
        }
      )
    ),
    {
      name: "ConversationsStore",
    }
  )
);

// ===== SELECTORS =====

export const conversationSelectors = {
  // Get all conversations as array (sorted by last message)
  getAllConversations: (state: ConversationsState): ConversationWithVersion[] => {
    return Array.from(state.conversations.values()).sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt || "").getTime() : 0; // Fixed: use camelCase
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt || "").getTime() : 0; // Fixed: use camelCase
      return bTime - aTime;
    });
  },

  // Get filtered conversations
  getFilteredConversations: (state: ConversationsState): ConversationWithVersion[] => {
    const { conversations, activeFilter, searchQuery } = state;

    let filtered = Array.from(conversations.values());

    // Apply filter
    switch (activeFilter) {
      case "all":
        // No filtering needed - show all conversations
        break;
      case "unread":
        filtered = filtered.filter((conv: ConversationWithVersion) => (conv.unread_count || 0) > 0);
        break;
      case "assigned":
        filtered = filtered.filter((conv: ConversationWithVersion) => !!conv.assigned_to);
        break;
      case "unassigned":
        filtered = filtered.filter((conv: ConversationWithVersion) => !conv.assigned_to);
        break;
      case "closed":
        filtered = filtered.filter((conv: ConversationWithVersion) => conv.status === "closed");
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.customer_name?.toLowerCase().includes(query) ||
          conv.customer_email?.toLowerCase().includes(query) ||
          conv.subject?.toLowerCase().includes(query) ||
          conv.lastMessagePreview?.toLowerCase().includes(query)
      );
    }

    // Sort by last message time
    return filtered.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt || "").getTime() : 0; // Fixed: use camelCase
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt || "").getTime() : 0; // Fixed: use camelCase
      return bTime - aTime;
    });
  },

  // Get conversation by ID
  getConversationById:
    (id: string | null) =>
    (state: ConversationsState): ConversationWithVersion | undefined => {
      return id ? state.conversations.get(id) : undefined;
    },

  // Get selected conversation
  getSelectedConversation: (state: ConversationsState): ConversationWithVersion | null => {
    return state.selectedConversationId ? state.conversations.get(state.selectedConversationId) || null : null;
  },

  // Get total unread count
  getTotalUnreadCount: (state: ConversationsState): number => {
    return Object.values(state.unreadCounts).reduce((sum: number, count: number) => sum + count, 0);
  },

  // Get unread conversations count
  getUnreadConversationsCount: (state: ConversationsState): number => {
    return Object.values(state.unreadCounts).filter((count: number) => count > 0).length;
  },

  // Check if conversation is loading messages
  isLoadingMessages:
    (conversationId: string) =>
    (state: ConversationsState): boolean => {
      return state.isLoadingMessages[conversationId] || false;
    },
};

// ===== CONVENIENCE HOOKS =====

export const useSelectedConversation = () => useConversationsStore(conversationSelectors.getSelectedConversation);

export const useFilteredConversations = () => useConversationsStore(conversationSelectors.getFilteredConversations);

export const useTotalUnreadCount = () => useConversationsStore(conversationSelectors.getTotalUnreadCount);

export const useConversationById = (id: string | null) =>
  useConversationsStore(conversationSelectors.getConversationById(id));

export const useIsLoadingMessages = (conversationId: string) =>
  useConversationsStore(conversationSelectors.isLoadingMessages(conversationId));

// ===== EVENT LISTENERS =====

// Listen for auth events to clear conversations
eventBus.on("auth:logout", {
  handler: () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ConversationsStore] Clearing conversations on logout");
    }
    useConversationsStore.getState().clearConversations();
  },
});

// Listen for auth login to reload conversations
eventBus.on("auth:login", {
  handler: async () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ConversationsStore] Reloading conversations after login");
    }
    // Small delay to ensure auth state is fully updated
    setTimeout(() => {
      void useConversationsStore.getState().loadConversations();
    }, 100);
  },
});

// ===== STORE UTILITIES =====

/**
 * Get conversation statistics
 */
export const getConversationStats = () => {
  const state = useConversationsStore.getState();
  const conversations = Array.from(state.conversations.values());

  return {
    total: conversations.length,
    open: conversations.filter((c: ConversationWithVersion) => c.status === "open").length,
    closed: conversations.filter((c: ConversationWithVersion) => c.status === "closed").length,
    unread: conversations.filter((c: ConversationWithVersion) => (c.unread_count || 0) > 0).length,
    assigned: conversations.filter((c: ConversationWithVersion) => !!c.assigned_to).length,
    unassigned: conversations.filter((c: ConversationWithVersion) => !c.assigned_to).length,
  };
};

/**
 * Batch update multiple conversations
 */
export const batchUpdateConversations = (updates: { id: string; changes: Partial<ConversationWithVersion> }[]) => {
  useConversationsStore.setState((draft) => {
    updates.forEach(({ id, changes }) => {
      const conversation = draft.conversations.get(id);
      if (conversation) {
        const updatedConversation = { ...conversation, ...changes, version: (conversation.version || 0) + 1 };
        draft.conversations.set(id, updatedConversation);
      }
    });
  });
};
