/**
 * Unified Conversation Store - Stub Implementation
 */

import { create } from "zustand";

interface Conversation {
  id: string;
  last_message?: string;
  last_message_at?: string;
  updated_at: string;
  priority?: string;
  metadata?: Record<string, any>;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  organizationId: string | null;

  // Actions
  loadConversations: (organizationId: string) => Promise<void>;
  updateConversation: (conversation: Conversation) => void;
  subscribeToOrganization: (organizationId: string) => void;
  clearAllData: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  organizationId: null,

  loadConversations: async (organizationId: string) => {
    // TODO: Implement actual conversation loading
    console.log(`Loading conversations for organization: ${organizationId}`);
    set({ organizationId });
  },

  updateConversation: (conversation) => {
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conversation.id ? conversation : c)),
      currentConversation: state.currentConversation?.id === conversation.id ? conversation : state.currentConversation,
    }));
  },

  subscribeToOrganization: (organizationId: string) => {
    console.log(`Subscribing to organization: ${organizationId}`);
    set({ organizationId });
  },

  clearAllData: () => {
    set({
      conversations: [],
      currentConversation: null,
      organizationId: null,
    });
  },
}));
