import { useConversationsStore } from "./conversations-store";

/**
 * Conversations Store Exports
 *
 * Clean public API for the conversations domain store
 */

// Main store and types
export { useConversationsStore, type ConversationsState, type ConversationsActions } from "./conversations-store";

// Selectors
export { conversationSelectors } from "./conversations-store";

// Convenience hooks
export {
  useSelectedConversation,
  useFilteredConversations,
  useTotalUnreadCount,
  useConversationById,
  useIsLoadingMessages,
} from "./conversations-store";

// Store action hooks for external use
export const useUpdateConversation = () => {
  const updateConversation = useConversationsStore((state) => state.updateConversation);
  return updateConversation;
};

export const useMarkAsRead = () => {
  const markAsRead = useConversationsStore((state) => state.markConversationAsRead);
  return markAsRead;
};

export const useMarkAsUnread = () => {
  const incrementUnread = useConversationsStore((state) => state.incrementUnreadCount);
  return incrementUnread;
};

export const useAssignConversation = () => {
  const assignConversation = useConversationsStore((state) => state.assignConversation);
  return assignConversation;
};

export const useUpdatePriority = () => {
  const { updateConversation, conversations } = useConversationsStore.getState();
  return (conversationId: number, priority: any) => {
    const conversation = conversations.get(conversationId);
    if (conversation) {
      updateConversation({ ...conversation, priority });
    }
  };
};

export const useAddReaction = () => {
  const { updateConversation, conversations } = useConversationsStore.getState();
  return (conversationId: number, reaction: any) => {
    const conversation = conversations.get(conversationId);
    if (conversation) {
      // TODO: Implement reactions when ConversationWithVersion supports it
      // const reactions = conversation.reactions || [];
      // updateConversation({ ...conversation, reactions: [...reactions, reaction] });
    }
  };
};

export const useRemoveReaction = () => {
  const { updateConversation, conversations } = useConversationsStore.getState();
  return (conversationId: number, reactionId: string) => {
    const conversation = conversations.get(conversationId);
    if (conversation) {
      // TODO: Implement reactions when ConversationWithVersion supports it
      // const reactions = conversation.reactions?.filter((r: any) => r.id !== reactionId) || [];
      // updateConversation({ ...conversation, reactions });
    }
  };
};

export const useConversation = (conversationId: number) => {
  return useConversationsStore((state) => state.conversations.get(conversationId));
};

export const useConversations = () => {
  return useConversationsStore((state) => Array.from(state.conversations.values()));
};

export const useActiveConversation = () => {
  return useConversationsStore((state) => {
    const selectedId = state.selectedConversationId;
    return selectedId ? state.conversations.get(selectedId) : null;
  });
};

export const useSetActiveConversation = () => {
  return useConversationsStore((state) => state.setSelectedConversation);
};

export const useDeleteConversation = () => {
  return useConversationsStore((state) => state.removeConversation);
};

// Utilities
export { getConversationStats, batchUpdateConversations } from "./conversations-store";

// Re-export conversation types for convenience
export type {
  Conversation,
  ConversationStatus,
  ConversationPriority,
  ConversationChannel,
  ConversationMetadata,
  ConversationWithRelations,
  ConversationListItem,
} from "@/types/entities/conversation";
