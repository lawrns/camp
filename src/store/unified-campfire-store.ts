/**
 * Unified Campfire Store - Stub Implementation
 */

import { supabase } from "@/lib/supabase";
import { create } from "zustand";

interface Notification {
  id?: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  conversationId?: string;
  persistent?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  senderType: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface Conversation {
  id: string;
  last_message?: string;
  last_message_at?: string;
  updated_at: string;
  priority?: string;
  metadata?: Record<string, any>;
}

interface CampfireState {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  organization: { id: string } | null;
  ui: {
    selectedConversationId: string | null;
    notifications: Notification[];
  };

  // CONSOLIDATED: Dashboard metrics from dashboard-store.ts
  dashboard: {
    metrics: unknown | null;
    isLoading: boolean;
    error: string | null;
    lastRefresh: string | null;
  };

  // CONSOLIDATED: Inbox state from useInboxStore.ts
  inbox: {
    messageText: string;
    isSending: boolean;
    isFileUploading: boolean;
    selectedConversations: Set<string>;
    showPreferences: boolean;
    showTicketDialog: boolean;
    showAssignmentPanel: boolean;
    showCustomerProfile: boolean;
  };

  // Actions
  loadConversations: () => Promise<void>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  updateConversationStatus: (conversationId: string, status: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, senderType?: "customer" | "agent") => Promise<void>;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  incrementUnreadCount: (conversationId: string) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  setRealtimeConnection: (connected: boolean, status: string) => void;
  syncOfflineChanges: () => void;
  clearAuth: () => void;
  subscribeToConversations: () => () => void;

  // CONSOLIDATED: Inbox actions
  setMessageText: (text: string) => void;
  setIsSending: (sending: boolean) => void;
  toggleConversationSelection: (conversationId: string) => void;
  clearConversationSelection: () => void;
  setShowAssignmentPanel: (show: boolean) => void;
}

export const useCampfireStore = create<CampfireState>((set, get) => ({
  conversations: new Map(),
  messages: new Map(),
  organization: null,
  ui: {
    selectedConversationId: null,
    notifications: [],
  },

  // CONSOLIDATED: Dashboard initial state
  dashboard: {
    metrics: null,
    isLoading: false,
    error: null,
    lastRefresh: null,
  },

  // CONSOLIDATED: Inbox initial state
  inbox: {
    messageText: "",
    isSending: false,
    isFileUploading: false,
    selectedConversations: new Set(),
    showPreferences: false,
    showTicketDialog: false,
    showAssignmentPanel: false,
    showCustomerProfile: false,
  },

  loadConversations: async () => {
    const client = supabase.browser();
    const { data, error } = await client.from("conversations").select("*").order("updated_at", { ascending: false });
    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }
    if (data) {
      set({ conversations: new Map(data.map((conv) => [conv.id, conv as Conversation])) });
    }
  },

  subscribeToConversations: () => {
    const client = supabase.browser();
    const organization = get().organization;
    if (!organization) return () => {};

    // STEP 0: DISABLED - postgres_changes subscription causing binding mismatch
    console.log('[unified-campfire-store] PostgreSQL subscription disabled due to binding mismatch');

    /*
    const channel = client
      .channel(`org:${organization.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, (payload) => {
        if (payload.eventType === "INSERT") {
          get().addConversation(payload.new as Conversation);
        } else if (payload.eventType === "UPDATE") {
          get().updateConversation({ id: payload.new.id as string, ...payload.new });
        } else if (payload.eventType === "DELETE") {
          set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.delete(payload.old.id);
            return { conversations: newConversations };
          });
        }
      })
    */

    // Create dummy channel for now
    const channel = client
      .channel(`org:${organization.id}:disabled`)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  },

  addConversation: (conversation) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      newConversations.set(conversation.id, conversation);
      return { conversations: newConversations };
    });
  },

  updateConversation: (conversation) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      const existing = newConversations.get(conversation.id);
      if (existing) {
        newConversations.set(conversation.id, { ...existing, ...conversation });
      }
      return { conversations: newConversations };
    });
  },

  updateConversationStatus: async (conversationId, status) => {
    const conversation = get().conversations.get(conversationId);
    if (conversation) {
      // Store status in metadata since Conversation doesn't have a status field
      get().updateConversation({
        ...conversation,
        metadata: { ...conversation.metadata, status },
      });
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      const conversationMessages = newMessages.get(conversationId) || [];
      newMessages.set(conversationId, [...conversationMessages, message]);
      return { messages: newMessages };
    });
  },

  setMessages: (conversationId, messages) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    });
  },

  incrementUnreadCount: (conversationId) => {
    const conversation = get().conversations.get(conversationId);
    if (conversation) {
      const unreadCount = (conversation.metadata?.unreadCount || 0) + 1;
      get().updateConversation({
        id: conversationId,
        metadata: { ...conversation.metadata, unreadCount },
      });
    }
  },

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, { ...notification, id }],
      },
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    }));
  },

  setRealtimeConnection: (connected, status) => {
    console.log(`Realtime connection: ${connected ? "connected" : "disconnected"} - ${status}`);
  },

  syncOfflineChanges: () => {
    console.log("Syncing offline changes...");
  },

  clearAuth: () => {
    set({
      conversations: new Map(),
      messages: new Map(),
      organization: null,
      ui: {
        selectedConversationId: null,
        notifications: [],
      },
      dashboard: {
        metrics: null,
        isLoading: false,
        error: null,
        lastRefresh: null,
      },
      inbox: {
        messageText: "",
        isSending: false,
        isFileUploading: false,
        selectedConversations: new Set(),
        showPreferences: false,
        showTicketDialog: false,
        showAssignmentPanel: false,
        showCustomerProfile: false,
      },
    });
  },

  // CONSOLIDATED: Dashboard actions from dashboard-store.ts
  setDashboardMetrics: (metrics: unknown) => {
    set((state) => ({
      dashboard: {
        ...state.dashboard,
        metrics,
        lastRefresh: new Date().toISOString(),
        error: null,
      },
    }));
  },

  setDashboardLoading: (loading: boolean) => {
    set((state) => ({
      dashboard: { ...state.dashboard, isLoading: loading },
    }));
  },

  setDashboardError: (error: string | null) => {
    set((state) => ({
      dashboard: { ...state.dashboard, error, isLoading: false },
    }));
  },

  // CONSOLIDATED: Inbox actions from useInboxStore.ts
  setMessageText: (text: string) => {
    set((state) => ({
      inbox: { ...state.inbox, messageText: text },
    }));
  },

  setIsSending: (sending: boolean) => {
    set((state) => ({
      inbox: { ...state.inbox, isSending: sending },
    }));
  },

  toggleConversationSelection: (conversationId: string) => {
    set((state) => {
      const newSelected = new Set(state.inbox.selectedConversations);
      if (newSelected.has(conversationId)) {
        newSelected.delete(conversationId);
      } else {
        newSelected.add(conversationId);
      }
      return {
        inbox: { ...state.inbox, selectedConversations: newSelected },
      };
    });
  },

  clearConversationSelection: () => {
    set((state) => ({
      inbox: { ...state.inbox, selectedConversations: new Set() },
    }));
  },

  setShowAssignmentPanel: (show: boolean) => {
    set((state) => ({
      inbox: { ...state.inbox, showAssignmentPanel: show },
    }));
  },

  // Add missing sendMessage function for bidirectional communication
  sendMessage: async (conversationId: string, content: string, senderType: "customer" | "agent" = "agent") => {
    if (!content.trim()) {
      console.warn('[Store] Empty message content, aborting send');
      return;
    }

    const { setIsSending } = get();
    setIsSending(true);

    try {
      console.log('🚨 [UNIFIED CAMPFIRE STORE] 🚀 Making API call to dashboard endpoint...');

      // Use the correct dashboard API endpoint for bidirectional communication
      const response = await fetch(`/api/dashboard/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          content: content.trim(),
          senderType,
          senderName: senderType === 'agent' ? 'Support Agent' : 'Customer'
        }),
      });

      console.log('🚨 [UNIFIED CAMPFIRE STORE] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🚨 [UNIFIED CAMPFIRE STORE] ❌ API error:', errorText);
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🚨 [UNIFIED CAMPFIRE STORE] ✅ Message sent successfully:', result);

      // Add the message to local state for immediate UI update
      const newMessage = {
        id: result.id || `temp-${Date.now()}`,
        conversation_id: conversationId,
        content: content.trim(),
        senderType: senderType,
        senderName: senderType === 'agent' ? 'Support Agent' : 'Customer',
        created_at: new Date().toISOString(),
        attachments: [],
        read_status: 'sent' as const,
      };

      // Update messages in store
      const currentMessages = get().messages.get(conversationId) || [];
      get().messages.set(conversationId, [...currentMessages, newMessage]);

      console.log('🚨 [UNIFIED CAMPFIRE STORE] ✅ Message added to local state');

    } catch (error) {
      console.error('🚨 [UNIFIED CAMPFIRE STORE] ❌ Send message error:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  },

  // Add updateConversationStatus function if it doesn't exist
  updateConversationStatus: async (conversationId: string, status: "open" | "resolved" | "pending") => {
    console.log('🚨 [UNIFIED CAMPFIRE STORE] updateConversationStatus called:', { conversationId, status });
    // TODO: Implement conversation status update API call
  },
}));
