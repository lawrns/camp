/**
 * Conversation Provider
 * Context provider for managing conversation state and operations
 */

"use client";

import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import type { Conversation, Message } from "@/types/entities";

export interface ConversationState {
  conversations: Conversation[];
  currentConversation?: Conversation | undefined;
  messages: Message[];
  loading: boolean;
  error: string | null;
  filters: ConversationFilters;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ConversationFilters {
  status?: Conversation["status"][];
  priority?: Conversation["priority"][];
  assigned_agent_id?: string;
  ai_enabled?: boolean;
  tags?: string[];
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

type ConversationAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONVERSATIONS"; payload: { conversations: Conversation[]; pagination: any } }
  | { type: "SET_CURRENT_CONVERSATION"; payload: Conversation | undefined }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: Message }
  | { type: "DELETE_MESSAGE"; payload: number }
  | { type: "UPDATE_CONVERSATION"; payload: Conversation }
  | { type: "SET_FILTERS"; payload: Partial<ConversationFilters> }
  | { type: "SET_PAGE"; payload: number };

const initialState: ConversationState = {
  conversations: [],
  messages: [],
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  },
};

function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload.conversations,
        pagination: action.payload.pagination,
        loading: false,
      };

    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversation: action.payload };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload, loading: false };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) => (msg.id === action.payload.id ? action.payload : msg)),
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.filter((msg) => msg.id !== action.payload),
      };

    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          String(conv.id) === String(action.payload.id) ? action.payload : conv
        ),
        currentConversation:
          String(state.currentConversation?.id) === String(action.payload.id)
            ? action.payload
            : state.currentConversation,
      };

    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page
      };

    case "SET_PAGE":
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload },
      };

    default:
      return state;
  }
}

export interface ConversationContextValue {
  state: ConversationState;
  actions: {
    loadConversations: () => Promise<void>;
    loadConversation: (id: number) => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, content: string, attachments?: string[]) => Promise<Message>;
    updateMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    updateConversationStatus: (conversationId: string, status: Conversation["status"]) => Promise<void>;
    updateConversationPriority: (conversationId: string, priority: Conversation["priority"]) => Promise<void>;
    assignConversation: (conversationId: string, agentId: string) => Promise<void>;
    addConversationTags: (conversationId: string, tags: string[]) => Promise<void>;
    removeConversationTags: (conversationId: string, tags: string[]) => Promise<void>;
    setFilters: (filters: Partial<ConversationFilters>) => void;
    setPage: (page: number) => void;
    createConversation: (customerEmail: string, initialMessage?: string) => Promise<Conversation>;
  };
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}

export interface ConversationProviderProps {
  children: React.ReactNode;
  organizationId: string;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children, organizationId }) => {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  // FIXED: Create a stable buildQueryString function without dependencies
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    // Add pagination
    params.append("page", state.pagination.page.toString());
    params.append("limit", state.pagination.per_page.toString());

    // Add sorting
    params.append("sort", "recent:desc");

    // Add filters
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return params.toString() ? `?${params.toString()}` : "";
  }, [state.pagination.page, state.pagination.per_page, state.filters]);

  // FIXED: Remove buildQueryString dependency to prevent circular updates
  const loadConversations = useCallback(async () => {
    if (!organizationId) {

      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Build query string inline to avoid dependency issues
      const params = new URLSearchParams();
      params.append("page", state.pagination.page.toString());
      params.append("limit", state.pagination.per_page.toString());
      params.append("sort", "recent:desc");

      Object.entries(state.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const response = await fetch(`/api/conversations${queryString}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();

      dispatch({
        type: "SET_CONVERSATIONS",
        payload: {
          conversations: data.conversations || [],
          pagination: data.pagination || {
            page: state.pagination.page,
            per_page: state.pagination.per_page,
            total: data.totalCount || 0,
            total_pages: Math.ceil((data.totalCount || 0) / state.pagination.per_page),
          },
        },
      });

    } catch (error) {

      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load conversations",
      });
    }
  }, [organizationId, state.pagination.page, state.pagination.per_page, state.filters]); // Direct state dependencies

  const loadConversation = useCallback(async (id: number) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`/api/conversations/${id}`);

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const conversation = await response.json();
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load conversation",
      });
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const messages = await response.json();
      dispatch({ type: "SET_MESSAGES", payload: messages });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load messages",
      });
    }
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, attachments?: string[]): Promise<Message> => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            attachments,
            organization_id: organizationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const message = await response.json();
        dispatch({ type: "ADD_MESSAGE", payload: message });
        return message;
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to send message",
        });
        throw error;
      }
    },
    [organizationId]
  );

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to update message");
      }

      const updatedMessage = await response.json();
      dispatch({ type: "UPDATE_MESSAGE", payload: updatedMessage });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update message",
      });
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      dispatch({ type: "DELETE_MESSAGE", payload: parseInt(messageId, 10) });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to delete message",
      });
      throw error;
    }
  }, []);

  const updateConversationStatus = useCallback(async (conversationId: string, status: Conversation["status"]) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update conversation status");
      }

      const updatedConversation = await response.json();
      dispatch({ type: "UPDATE_CONVERSATION", payload: updatedConversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update conversation status",
      });
      throw error;
    }
  }, []);

  const updateConversationPriority = useCallback(async (conversationId: string, priority: Conversation["priority"]) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority }),
      });

      if (!response.ok) {
        throw new Error("Failed to update conversation priority");
      }

      const updatedConversation = await response.json();
      dispatch({ type: "UPDATE_CONVERSATION", payload: updatedConversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update conversation priority",
      });
      throw error;
    }
  }, []);

  const assignConversation = useCallback(async (conversationId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign conversation");
      }

      const updatedConversation = await response.json();
      dispatch({ type: "UPDATE_CONVERSATION", payload: updatedConversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to assign conversation",
      });
      throw error;
    }
  }, []);

  const addConversationTags = useCallback(async (conversationId: string, tags: string[]) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to add tags");
      }

      const updatedConversation = await response.json();
      dispatch({ type: "UPDATE_CONVERSATION", payload: updatedConversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to add tags",
      });
      throw error;
    }
  }, []);

  const removeConversationTags = useCallback(async (conversationId: string, tags: string[]) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/tags`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove tags");
      }

      const updatedConversation = await response.json();
      dispatch({ type: "UPDATE_CONVERSATION", payload: updatedConversation });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to remove tags",
      });
      throw error;
    }
  }, []);

  const setFilters = useCallback((filters: Partial<ConversationFilters>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const createConversation = useCallback(
    async (customerEmail: string, initialMessage?: string): Promise<Conversation> => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_email: customerEmail,
            initial_message: initialMessage,
            organization_id: organizationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }

        const conversation = await response.json();
        // Reload conversations to include the new one
        await loadConversations();
        return conversation;
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to create conversation",
        });
        throw error;
      }
    },
    [organizationId, loadConversations]
  );

  // REAL-TIME SYSTEM: Load conversations on initialization only
  useEffect(() => {
    // Initial load only
    loadConversations();

    // Connect to real-time conversation updates instead of auto-reloading

    // Real-time updates will be handled by the dashboard metrics manager
    // This eliminates the constant re-fetching of conversations
  }, [organizationId]); // Only load when organization changes

  // REAL-TIME SYSTEM: Load conversations when filters or pagination change
  // Use a ref to track if we need to reload to prevent infinite loops
  const prevFiltersRef = useRef(state.filters);
  const prevPageRef = useRef(state.pagination.page);

  useEffect(() => {
    // Only reload if filters or page actually changed
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(state.filters);
    const pageChanged = prevPageRef.current !== state.pagination.page;

    if (organizationId && (filtersChanged || pageChanged)) {
      // Update refs
      prevFiltersRef.current = state.filters;
      prevPageRef.current = state.pagination.page;

      // Load conversations
      loadConversations();
    }
  }, [organizationId, state.filters, state.pagination.page, loadConversations]);

  const contextValue: ConversationContextValue = {
    state,
    actions: {
      loadConversations,
      loadConversation,
      loadMessages,
      sendMessage,
      updateMessage,
      deleteMessage,
      updateConversationStatus,
      updateConversationPriority,
      assignConversation,
      addConversationTags,
      removeConversationTags,
      setFilters,
      setPage,
      createConversation,
    },
  };

  return <ConversationContext.Provider value={contextValue}>{children}</ConversationContext.Provider>;
};

export default ConversationProvider;
