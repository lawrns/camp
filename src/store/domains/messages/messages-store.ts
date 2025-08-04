import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { eventBus } from "@/store/event-bus";
import type { Message, MessageStatus, SenderType } from "@/types/entities/message";

/**
 * Messages state interface
 */
export interface MessagesState {
  /** Messages grouped by conversationId */
  messages: Map<string, Message[]>;

  /** Loading states per conversation */
  loadingStates: Record<string, boolean>;

  /** Sending states per conversation */
  sendingStates: Record<string, boolean>;

  /** Message count per conversation */
  messageCount: Record<string, number>;

  /** Unread count per conversation */
  unreadCount: Record<string, number>;

  /** Optimistic messages while sending */
  optimisticMessages: Map<string, Message[]>;

  /** Track message request versions to prevent stale updates */
  messageVersions: Record<string, number>;
}

/**
 * Messages actions interface
 */
export interface MessagesActions {
  // Data operations
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  upsertMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (params: {
    conversationId: string;
    messageId: string;
    status: MessageStatus;
    metadata?: Record<string, unknown>;
  }) => void;
  removeMessages: (conversationId: string) => void;
  clearAllMessages: () => void;

  // Optimistic updates
  addOptimisticMessage: (conversationId: string, message: Message) => string;
  removeOptimisticMessage: (conversationId: string, tempId: string) => void;
  clearOptimisticMessages: (conversationId: string) => void;

  // CRITICAL-002 FIX: Get all messages with proper deduplication for React rendering
  getAllMessages: (conversationId: string) => Message[];

  // Unread management
  incrementUnreadCount: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;

  // Loading states
  setLoadingState: (conversationId: string, loading: boolean) => void;
  setSendingState: (conversationId: string, sending: boolean) => void;

  // Async operations
  loadMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string, senderType?: string) => Promise<Message>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<void>;

  // Bulk operations
  batchAddMessages: (messagesByConversation: Record<string, Message[]>) => void;
  batchUpdateUnreadCounts: (counts: Record<string, number>) => void;
}

/**
 * Combined messages store type
 */
export type MessagesStore = MessagesState & MessagesActions;

/**
 * Messages store implementation
 */
export const useMessagesStore = create<MessagesStore>()(
  devtools(
    subscribeWithSelector(
      immer(
        persist(
          (set, get) => ({
            // Initial state
            messages: new Map(),
            loadingStates: {},
            sendingStates: {},
            messageCount: {},
            unreadCount: {},
            optimisticMessages: new Map(),
            messageVersions: {},

            // Data operations
            setMessages: (conversationId, messages) => {
              set((state) => {
                state.messages.set(conversationId, messages);
                state.messageCount[conversationId] = messages.length;
                state.messageVersions[conversationId] = (state.messageVersions[conversationId] || 0) + 1;
              });
            },

            addMessage: (conversationId, message) => {
              set((state) => {
                const messages = state.messages.get(conversationId) || [];

                // CRITICAL-002 FIX: Enhanced duplicate prevention and optimistic message replacement

                // 1. Check for exact ID match (prevent true duplicates)
                if (messages.some((m) => m.id === message.id)) {
                  console.log('[MessagesStore] Skipping duplicate message by ID:', message.id);
                  return;
                }

                // 2. Handle optimistic message replacement
                // If this is a real message, remove any optimistic messages that it replaces
                const optimisticMessages = state.optimisticMessages.get(conversationId) || [];
                if (!message.is_optimistic && optimisticMessages.length > 0) {
                  const timeThreshold = 5000; // 5 seconds
                  const messageTime = new Date(message.createdAt || message.created_at).getTime();

                  // Find and remove matching optimistic messages
                  const filteredOptimistic = optimisticMessages.filter((opt: any) => {
                    const optTime = new Date(opt.createdAt || opt.created_at).getTime();
                    const timeDiff = Math.abs(messageTime - optTime);
                    const contentMatch = opt.content?.trim() === message.content?.trim();
                    const senderMatch = (opt.senderType || opt.sender_type) === (message.senderType || message.sender_type);

                    if (contentMatch && senderMatch && timeDiff < timeThreshold) {
                      console.log('[MessagesStore] Replacing optimistic message:', opt.id, '→', message.id);
                      return false; // Remove this optimistic message
                    }
                    return true; // Keep this optimistic message
                  });

                  if (filteredOptimistic.length !== optimisticMessages.length) {
                    state.optimisticMessages.set(conversationId, filteredOptimistic);
                  }
                }

                // 3. Check for content-based duplicates (prevent rapid-fire duplicates)
                const recentTimeThreshold = 2000; // 2 seconds
                const messageTime = new Date(message.createdAt || message.created_at).getTime();
                const contentDuplicate = messages.find((m) => {
                  const mTime = new Date(m.createdAt || m.created_at).getTime();
                  const timeDiff = Math.abs(messageTime - mTime);
                  const contentMatch = m.content?.trim() === message.content?.trim();
                  const senderMatch = (m.senderType || m.sender_type) === (message.senderType || message.sender_type);

                  return contentMatch && senderMatch && timeDiff < recentTimeThreshold;
                });

                if (contentDuplicate) {
                  console.log('[MessagesStore] Skipping content duplicate:', message.content?.substring(0, 50));
                  return;
                }

                // Binary search for insertion point (maintain chronological order)
                let left = 0;
                let right = messages.length;
                while (left < right) {
                  const mid = Math.floor((left + right) / 2);
                  if (
                    messages[mid] &&
                    new Date(messages[mid].created_at || "").getTime() < new Date(message.created_at || "").getTime()
                  ) {
                    left = mid + 1;
                  } else {
                    right = mid;
                  }
                }

                messages.splice(left, 0, message);
                state.messages.set(conversationId, messages);
                state.messageCount[conversationId] = messages.length;

                console.log('[MessagesStore] Added message:', message.id, 'Total:', messages.length);

                // Emit event
                eventBus.emit("message:added", {
                  source: "MessagesStore",
                  conversationId,
                  message,
                });
              });
            },

            updateMessage: (conversationId, messageId, updates) => {
              set((state) => {
                const messages = state.messages.get(conversationId);
                if (!messages) return;

                const index = messages.findIndex((m) => m.id === messageId);
                if (index !== -1) {
                  // Handle exactOptionalPropertyTypes by creating a new message object
                  const existingMessage = messages[index];
                  if (!existingMessage) return; // Type guard

                  const updatedMessage: Message = {
                    ...existingMessage,
                    ...updates,
                  };
                  messages[index] = updatedMessage;
                  state.messages.set(conversationId, [...messages]);

                  // Emit event
                  eventBus.emit("message:updated", {
                    source: "MessagesStore",
                    conversationId,
                    messageId: messageId,
                    updates,
                  });
                }
              });
            },

            upsertMessage: (conversationId, message) => {
              const messages = get().messages.get(conversationId) || [];
              const exists = messages.some((m) => m.id === message.id);

              if (exists) {
                get().updateMessage(conversationId, message.id, message);
              } else {
                get().addMessage(conversationId, message);
              }
            },

            updateMessageStatus: ({ conversationId, messageId, status, metadata }) => {
              get().updateMessage(conversationId, messageId, { status, ...(metadata && { metadata }) });
            },

            removeMessages: (conversationId) => {
              set((state) => {
                state.messages.delete(conversationId);
                delete state.messageCount[conversationId];
                delete state.unreadCount[conversationId];
                delete state.loadingStates[conversationId];
                delete state.sendingStates[conversationId];
                state.optimisticMessages.delete(conversationId);
              });
            },

            clearAllMessages: () => {
              set((state) => {
                state.messages.clear();
                state.optimisticMessages.clear();
                state.loadingStates = {};
                state.sendingStates = {};
                state.messageCount = {};
                state.unreadCount = {};
                state.messageVersions = {};
              });
            },

            // Optimistic updates
            addOptimisticMessage: (conversationId, message) => {
              const tempId = `temp-${Date.now()}-${Math.random()}`;
              const optimisticMessage: Message = {
                ...message,
                id: tempId,
                temp_id: tempId,
                is_optimistic: true as unknown,
                conversationId: conversationId,
                content: message.content,
                senderType: message.senderType,
                createdAt: message.createdAt || new Date().toISOString(),
              };

              set((state) => {
                const optimistic = state.optimisticMessages.get(conversationId) || [];
                optimistic.push(optimisticMessage);
                state.optimisticMessages.set(conversationId, optimistic);
              });

              return tempId;
            },

            removeOptimisticMessage: (conversationId, tempId) => {
              set((state) => {
                const optimistic = state.optimisticMessages.get(conversationId) || [];
                const filtered = optimistic.filter(
                  (m: Message) => (m as Message & { temp_id?: string }).temp_id !== tempId
                );
                if (filtered.length === 0) {
                  state.optimisticMessages.delete(conversationId);
                } else {
                  state.optimisticMessages.set(conversationId, filtered);
                }
              });
            },

            clearOptimisticMessages: (conversationId) => {
              set((state) => {
                state.optimisticMessages.delete(conversationId);
              });
            },

            // CRITICAL-002 FIX: Get all messages with proper deduplication for React rendering
            getAllMessages: (conversationId) => {
              const state = get();
              const realMessages = state.messages.get(conversationId) || [];
              const optimisticMessages = state.optimisticMessages.get(conversationId) || [];

              // Combine real and optimistic messages
              const allMessages = [...realMessages, ...optimisticMessages];

              // Remove duplicates based on ID and content
              const deduplicatedMessages = allMessages.filter((message, index, array) => {
                // Keep if this is the first occurrence of this ID
                const firstOccurrenceIndex = array.findIndex(m => m.id === message.id);
                if (firstOccurrenceIndex === index) {
                  return true;
                }

                // If there are multiple messages with same ID, prefer real messages over optimistic
                const firstOccurrence = array[firstOccurrenceIndex];
                const currentIsOptimistic = message.is_optimistic || message.temp_id;
                const firstIsOptimistic = firstOccurrence.is_optimistic || firstOccurrence.temp_id;

                // Keep real message over optimistic
                if (!currentIsOptimistic && firstIsOptimistic) {
                  // Replace the first occurrence with this real message
                  array[firstOccurrenceIndex] = message;
                  return false; // Don't include this one at current position
                }

                return false; // Skip duplicate
              });

              // Sort by creation time to maintain chronological order
              return deduplicatedMessages.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
                const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
                return timeA - timeB;
              });
            },

            // Unread management
            incrementUnreadCount: (conversationId) => {
              set((state) => {
                state.unreadCount[conversationId] = (state.unreadCount[conversationId] || 0) + 1;
              });
            },

            markConversationAsRead: (conversationId) => {
              set((state) => {
                state.unreadCount[conversationId] = 0;
              });

              eventBus.emit("conversation:read", {
                source: "MessagesStore",
                conversationId,
              });
            },

            setUnreadCount: (conversationId, count) => {
              set((state) => {
                state.unreadCount[conversationId] = count;
              });
            },

            // Loading states
            setLoadingState: (conversationId, loading) => {
              set((state) => {
                state.loadingStates[conversationId] = loading;
              });
            },

            setSendingState: (conversationId, sending) => {
              set((state) => {
                state.sendingStates[conversationId] = sending;
              });
            },

            // Async operations
            loadMessages: async (conversationId) => {
              const { setLoadingState, setMessages } = get();
              setLoadingState(conversationId, true);

              try {
                // TODO: Replace with actual API call
                const response = await fetch(`/api/conversations/${conversationId}/messages`);
                if (!response.ok) throw new Error("Failed to load messages");

                const messages = await response.json();
                setMessages(conversationId, messages);

                eventBus.emit("messages:loaded", {
                  source: "MessagesStore",
                  conversationId,
                  count: messages.length,
                });

                return messages;
              } catch (error) {
                console.error("Error loading messages:", error);
                eventBus.emit("messages:error", {
                  source: "MessagesStore",
                  conversationId,
                  error: error instanceof Error ? error.message : "Unknown error",
                });
                throw error;
              } finally {
                setLoadingState(conversationId, false);
              }
            },

            sendMessage: async (conversationId, content, senderType = "agent") => {
              const { addOptimisticMessage, removeOptimisticMessage, addMessage, setSendingState } = get();
              setSendingState(conversationId, true);

              // CRITICAL-002 FIX: Create optimistic message with unique temp ID
              const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const tempMessage: Message = {
                id: tempId, // Use string temp ID to avoid conflicts
                temp_id: tempId, // Store temp ID for replacement tracking
                is_optimistic: true,
                conversationId: typeof conversationId === "string" ? parseInt(conversationId, 10) : conversationId,
                content,
                senderType: senderType as SenderType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              addOptimisticMessage(conversationId, tempMessage);

              try {
                // TODO: Replace with actual API call
                const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content, senderType: senderType }),
                });

                if (!response.ok) throw new Error("Failed to send message");

                const sentMessage = await response.json();

                // Remove optimistic and add real message
                removeOptimisticMessage(conversationId, tempId);
                addMessage(conversationId, sentMessage);

                eventBus.emit("message:sent", {
                  source: "MessagesStore",
                  conversationId,
                  messageId: sentMessage.id as string,
                  content: sentMessage.content || content,
                  sender: (sentMessage.senderType || senderType) as "customer" | "ai" | "user",
                });

                return sentMessage;
              } catch (error) {
                // Remove optimistic message on error
                removeOptimisticMessage(conversationId, tempId);
                console.error("Error sending message:", error);
                throw error;
              } finally {
                setSendingState(conversationId, false);
              }
            },

            markMessageAsRead: async (conversationId, messageId) => {
              try {
                // TODO: Replace with actual API call
                await fetch(`/api/messages/${messageId}/read`, {
                  method: "POST",
                });

                get().updateMessage(conversationId, messageId, { status: "read" as MessageStatus });
              } catch (error) {
                console.error("Error marking message as read:", error);
                throw error;
              }
            },

            // Bulk operations
            batchAddMessages: (messagesByConversation) => {
              set((state) => {
                Object.entries(messagesByConversation).forEach(([conversationId, messages]) => {
                  state.messages.set(conversationId, messages);
                  state.messageCount[conversationId] = messages.length;
                });
              });
            },

            batchUpdateUnreadCounts: (counts) => {
              set((state) => {
                Object.assign(state.unreadCount, counts);
              });
            },
          }),
          {
            name: "messages-store",
            partialize: (state) => ({
              // Don't persist messages or temporary states
              unreadCount: state.unreadCount,
            }),
          }
        )
      )
    ),
    {
      name: "MessagesStore",
    }
  )
);

// Convenience hooks
export const useMessages = (conversationId: string) =>
  useMessagesStore((state) => state.messages.get(conversationId) || []);

export const useOptimisticMessages = (conversationId: string) =>
  useMessagesStore((state) => state.optimisticMessages.get(conversationId) || []);

export const useAllMessages = (conversationId: string) => {
  const messages = useMessages(conversationId);
  const optimistic = useOptimisticMessages(conversationId);
  return [...messages, ...optimistic];
};

export const useMessageCount = (conversationId: string) =>
  useMessagesStore((state) => state.messageCount[conversationId] || 0);

export const useUnreadCount = (conversationId: string) =>
  useMessagesStore((state) => state.unreadCount[conversationId] || 0);

export const useTotalUnreadCount = () =>
  useMessagesStore((state) => Object.values(state.unreadCount).reduce((sum: number, count: number) => sum + count, 0));

export const useIsLoadingMessages = (conversationId: string) =>
  useMessagesStore((state) => state.loadingStates[conversationId] || false);

export const useIsSendingMessage = (conversationId: string) =>
  useMessagesStore((state) => state.sendingStates[conversationId] || false);

// Selectors
export const messagesSelectors = {
  getMessages: (conversationId: string) => (state: MessagesStore) => state.messages.get(conversationId) || [],

  getUnreadMessages: (conversationId: string) => (state: MessagesStore) => {
    const messages = state.messages.get(conversationId) || [];
    return messages.filter((m: Message) => !m.readAt);
  },

  getLastMessage: (conversationId: string) => (state: MessagesStore) => {
    const messages = state.messages.get(conversationId) || [];
    return messages[messages.length - 1];
  },

  hasMessages: (conversationId: string) => (state: MessagesStore) =>
    (state.messages.get(conversationId)?.length || 0) > 0,
};

// Actions for external use
export const messagesActions = {
  loadMessages: (conversationId: string) => useMessagesStore.getState().loadMessages(conversationId),
  sendMessage: (conversationId: string, content: string, senderType?: string) =>
    useMessagesStore.getState().sendMessage(conversationId, content, senderType),
  markAsRead: (conversationId: string) => useMessagesStore.getState().markConversationAsRead(conversationId),
  clearMessages: (conversationId: string) => useMessagesStore.getState().removeMessages(conversationId),
};

// Event listeners
eventBus.on("conversation:deleted", (event: { conversationId?: string; source?: string }) => {
  if (event.conversationId) {
    useMessagesStore.getState().removeMessages(event.conversationId);
  }
});

eventBus.on("auth:logout", () => {
  useMessagesStore.getState().clearAllMessages();
});
