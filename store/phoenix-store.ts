import { create } from "zustand";
import { analytics, type ValidatedTrackingResult } from "@/lib/analytics/posthog-client";
import { CampfireEvents, type CampfireEventData } from "@/lib/conventions/event-registry";

interface User {
  id: string;
  email: string;
  organizationId: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: string;
  status?: string;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderName: string;
  createdAt: string;
  isAI?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

interface CannedResponse {
  id: string;
  text: string;
  shortcut: number;
}

interface Notification {
  id?: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  conversationId?: string;
  persistent?: boolean;
}

export interface PhoenixStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (id: string | null) => void;
  setSelectedConversation: (id: string | null) => void;
  updateConversationStatus: (conversationId: string, status: string) => void;

  // Messages
  messages: Record<string, Message[]>;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  sendMessage: (conversationId: string, content: string, role: string) => void;
  setMessageText: (text: string) => void;

  // Optimistic Messages
  optimisticMessages: Record<string, Message[]>;
  addOptimisticMessage: (conversationId: string, message: Message) => void;
  removeOptimisticMessage: (conversationId: string, messageId: string) => void;
  clearOptimisticMessages: (conversationId?: string) => void;

  // Canned Responses
  cannedResponses: CannedResponse[];
  setCannedResponses: (responses: CannedResponse[]) => void;

  // UI State
  loading: boolean;
  setLoading: (loading: boolean) => void;
  ui: {
    error: string | null;
    isLoading: boolean;
    selectedConversationId?: string | null;
    notifications: Notification[];
  };
  incrementErrorCount: () => void;
  setUIError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;

  // Inbox State
  inbox: {
    messageText: string;
    isSending: boolean;
  };

  // Analytics
  analytics: {
    track: (event: string, data?: unknown) => ValidatedTrackingResult;
    trackTyped: (event: CampfireEvents, data?: CampfireEventData) => ValidatedTrackingResult;
    trackConversation: (action: string, conversationId: string, data?: unknown) => ValidatedTrackingResult;
    trackMessage: (action: string, messageId: string, conversationId: string, data?: unknown) => ValidatedTrackingResult;
    trackWidget: (action: string, data?: unknown) => ValidatedTrackingResult;
    trackHandover: (action: string, handoverId: string, data?: unknown) => ValidatedTrackingResult;
  };
}

export const useStore = create<PhoenixStore>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Conversations
  conversations: [],
  currentConversationId: null,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setSelectedConversation: (id) => set((state) => ({ ui: { ...state.ui, selectedConversationId: id } })),
  updateConversationStatus: (conversationId, status) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => (conv.id === conversationId ? { ...conv, status } : conv)),
    })),

  // Messages
  messages: {},
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),
  sendMessage: (conversationId, content, role) => {
    const message: Message = {
      id: Date.now().toString(),
      conversationId,
      content,
      senderName: role === "agent" ? "Agent" : "Customer",
      createdAt: new Date().toISOString(),
      isAI: role === "agent",
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
      inbox: {
        ...state.inbox,
        messageText: "",
        isSending: false,
      },
    }));
  },
  setMessageText: (text) => set((state) => ({ inbox: { ...state.inbox, messageText: text } })),

  // Optimistic Messages
  optimisticMessages: {},
  addOptimisticMessage: (conversationId, message) =>
    set((state) => ({
      optimisticMessages: {
        ...state.optimisticMessages,
        [conversationId]: [...(state.optimisticMessages[conversationId] || []), message],
      },
    })),
  removeOptimisticMessage: (conversationId, messageId) =>
    set((state) => ({
      optimisticMessages: {
        ...state.optimisticMessages,
        [conversationId]: (state.optimisticMessages[conversationId] || []).filter((m) => m.id !== messageId),
      },
    })),
  clearOptimisticMessages: (conversationId) =>
    set((state) => ({
      optimisticMessages: conversationId ? { ...state.optimisticMessages, [conversationId]: [] } : {},
    })),

  // Canned Responses (default set)
  cannedResponses: [
    { id: "1", text: "Hi! How can I help you today?", shortcut: 1 },
    { id: "2", text: "Let me check that for you.", shortcut: 2 },
    { id: "3", text: "Thank you for contacting us!", shortcut: 3 },
    { id: "4", text: "Is there anything else I can help with?", shortcut: 4 },
    { id: "5", text: "Have a great day!", shortcut: 5 },
  ],
  setCannedResponses: (responses) => set({ cannedResponses: responses }),

  // UI State
  loading: false,
  setLoading: (loading) => set({ loading }),
  ui: {
    error: null,
    isLoading: false,
    selectedConversationId: null,
    notifications: [],
  },
  incrementErrorCount: () => set((state) => ({ ...state })),
  setUIError: (error) => set((state) => ({ ui: { ...state.ui, error } })),
  addNotification: (notification) =>
    set((state) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, { ...notification, id }],
        },
      };
    }),
  removeNotification: (id) =>
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    })),

  // Inbox State
  inbox: {
    messageText: "",
    isSending: false,
  },

  // Analytics
  analytics: {
    track: (event: string, data?: unknown) => {
      return analytics.track(event, data);
    },

    trackTyped: (event: CampfireEvents, data?: CampfireEventData) => {
      return analytics.trackTyped(event, data);
    },

    trackConversation: (action: string, conversationId: string, data?: unknown) => {
      // Helper for conversation-related events with standardized naming
      const eventName = `campfire_conversation_${action}`;
      return analytics.track(eventName, {
        conversationId,
        ...data,
      });
    },

    trackMessage: (action: string, messageId: string, conversationId: string, data?: unknown) => {
      // Helper for message-related events with standardized naming
      const eventName = `campfire_message_${action}`;
      return analytics.track(eventName, {
        messageId,
        conversationId,
        ...data,
      });
    },

    trackWidget: (action: string, data?: unknown) => {
      // Helper for widget-related events with standardized naming
      const eventName = `campfire_widget_${action}`;
      return analytics.track(eventName, data);
    },

    trackHandover: (action: string, handoverId: string, data?: unknown) => {
      // Helper for handover-related events with standardized naming
      const eventName = `campfire_handover_${action}`;
      return analytics.track(eventName, {
        handoverId,
        ...data,
      });
    },
  },
}));
