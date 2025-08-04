import { v4 as uuidv4 } from "uuid";
import type { Conversation, ConversationChannel, Message } from "@/types";

// import type { CampfireState } from "./unified-campfire-store"; // Not available yet
type CampfireState = any; // Placeholder

// Optimistic update types
export interface OptimisticMessage extends Message {
  temp_id: string;
  is_optimistic: true;
  pending: true;
  error?: string;
  retry_count?: number;
  original_content?: string;
}

export interface OptimisticConversation extends Conversation {
  temp_id?: string;
  is_optimistic?: boolean;
  pending?: boolean;
  error?: string;
}

export interface OptimisticOperation {
  id: string;
  type: "message" | "conversation" | "status" | "assignment";
  action: "create" | "update" | "delete";
  timestamp: number;
  data: unknown;
  rollbackData?: unknown;
  retryCount: number;
  maxRetries: number;
}

// Optimistic update store state
export interface OptimisticState {
  operations: Map<string, OptimisticOperation>;
  pendingMessages: Map<string, OptimisticMessage>;
  pendingConversations: Map<string, OptimisticConversation>;
  failedOperations: Map<string, OptimisticOperation>;
}

// Optimistic update utilities
export const optimisticUtils = {
  // Generate temporary ID for optimistic entities
  generateTempId: (prefix = "temp"): string => {
    return `${prefix}_${uuidv4()}`;
  },

  // Create optimistic message
  createOptimisticMessage: (
    conversationId: string,
    content: string,
    senderId: string,
    senderType: "visitor" | "agent" | "system" = "agent"
  ): OptimisticMessage => {
    const tempId = optimisticUtils.generateTempId("msg");
    return {
      id: tempId,
      temp_id: tempId,
      conversationId: conversationId,
      content,
      senderId,
      senderType,
      senderName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
      is_optimistic: true,
      pending: true,
      contentType: "text",
      attachments: [],
      metadata: {},
    };
  },

  // Create optimistic conversation
  createOptimisticConversation: (visitorId: string, channel: ConversationChannel = "chat"): OptimisticConversation => {
    const tempId = optimisticUtils.generateTempId("conv");
    return {
      id: tempId,
      temp_id: tempId,
      organizationId: "", // Required field - should be set by caller
      customerId: visitorId,
      channel,
      status: "open",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_optimistic: true,
      pending: true,
      unreadCount: 0,
      tags: [],
      metadata: {},
    };
  },

  // Create rollback operation
  createRollbackOperation: (operation: OptimisticOperation, state: CampfireState): (() => void) | null => {
    switch (operation.type) {
      case "message":
        return () => optimisticUtils.rollbackMessageOperation(operation, state);
      case "conversation":
        return () => optimisticUtils.rollbackConversationOperation(operation, state);
      case "status":
        return () => optimisticUtils.rollbackStatusOperation(operation, state);
      case "assignment":
        return () => optimisticUtils.rollbackAssignmentOperation(operation, state);
      default:
        return null;
    }
  },

  // Rollback message operation
  rollbackMessageOperation: (operation: OptimisticOperation, state: CampfireState): void => {
    const { action, data } = operation;

    switch (action) {
      case "create":
        // Remove optimistic message
        if (data.conversationId && data.temp_id) {
          const messages = state.messages.get(data.conversationId) || [];
          const filtered = messages.filter((m: unknown) => !("temp_id" in m) || m.temp_id !== data.temp_id);
          state.messages.set(data.conversationId, filtered);
        }
        break;

      case "update":
        // Restore original message content
        if (operation.rollbackData && data.conversationId && data.messageId) {
          const messages = state.messages.get(data.conversationId) || [];
          const index = messages.findIndex((m: unknown) => m.id === data.messageId);
          if (index !== -1) {
            messages[index] = { ...messages[index], ...operation.rollbackData };
          }
        }
        break;

      case "delete":
        // Restore deleted message
        if (operation.rollbackData && data.conversationId) {
          const messages = state.messages.get(data.conversationId) || [];
          messages.push(operation.rollbackData);
          // Sort by creation date
          messages.sort((a: unknown, b: unknown) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          state.messages.set(data.conversationId, messages);
        }
        break;
    }
  },

  // Rollback conversation operation
  rollbackConversationOperation: (operation: OptimisticOperation, state: CampfireState): void => {
    const { action, data } = operation;

    switch (action) {
      case "create":
        // Remove optimistic conversation
        if (data.temp_id) {
          state.conversations.delete(data.temp_id);
        }
        break;

      case "update":
        // Restore original conversation data
        if (operation.rollbackData && data.conversationId) {
          const conversation = state.conversations.get(data.conversationId);
          if (conversation) {
            state.conversations.set(data.conversationId, {
              ...conversation,
              ...operation.rollbackData,
            });
          }
        }
        break;

      case "delete":
        // Restore deleted conversation
        if (operation.rollbackData && data.conversationId) {
          state.conversations.set(data.conversationId, operation.rollbackData);
        }
        break;
    }
  },

  // Rollback status operation
  rollbackStatusOperation: (operation: OptimisticOperation, state: CampfireState): void => {
    if (operation.rollbackData && operation.data.conversationId) {
      const conversation = state.conversations.get(operation.data.conversationId);
      if (conversation) {
        conversation.status = operation.rollbackData.status;
        state.conversations.set(operation.data.conversationId, conversation);
      }
    }
  },

  // Rollback assignment operation
  rollbackAssignmentOperation: (operation: OptimisticOperation, state: CampfireState): void => {
    if (operation.rollbackData && operation.data.conversationId) {
      const conversation = state.conversations.get(operation.data.conversationId);
      if (conversation) {
        conversation.assigned_agent_id = operation.rollbackData.assigned_agent_id;
        state.conversations.set(operation.data.conversationId, conversation);
      }
    }
  },

  // Check if entity is optimistic
  isOptimistic: (entity: unknown): boolean => {
    return entity?.is_optimistic === true || entity?.pending === true;
  },

  // Get visual styling for optimistic entities
  getOptimisticStyles: (entity: unknown): React.CSSProperties => {
    if (!optimisticUtils.isOptimistic(entity)) {
      return {};
    }

    const baseStyles: React.CSSProperties = {
      opacity: entity.error ? 0.5 : 0.7,
      transition: "opacity 0.2s ease-in-out",
    };

    if (entity.error) {
      return {
        ...baseStyles,
        borderLeft: "3px solid #ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.05)",
      };
    }

    return baseStyles;
  },

  // Get status indicator for optimistic operations
  getStatusIndicator: (
    entity: unknown
  ): {
    icon: string;
    color: string;
    tooltip: string;
  } | null => {
    if (!optimisticUtils.isOptimistic(entity)) {
      return null;
    }

    if (entity.error) {
      return {
        icon: "error",
        color: "#ef4444",
        tooltip: `Failed: ${entity.error}. Click to retry.`,
      };
    }

    if (entity.pending) {
      return {
        icon: "pending",
        color: "#6b7280",
        tooltip: "Sending...",
      };
    }

    return null;
  },

  // Merge optimistic entity with server response
  mergeOptimisticWithServer: <T extends { id: string }>(
    optimistic: T & {
      temp_id?: string;
      is_optimistic?: boolean;
      pending?: boolean;
      error?: string;
      retry_count?: number;
    },
    server: T
  ): T => {
    // Remove optimistic flags and temp_id
    const { temp_id, is_optimistic, pending, error, retry_count, ...rest } = optimistic;

    // Merge with server data, preferring server values
    return {
      ...rest,
      ...server,
    };
  },
};

// Retry utilities
export const retryUtils = {
  // Calculate exponential backoff delay
  getBackoffDelay: (retryCount: number): number => {
    return Math.min(1000 * Math.pow(2, retryCount), 30000);
  },

  // Should retry operation
  shouldRetry: (operation: OptimisticOperation): boolean => {
    return operation.retryCount < operation.maxRetries;
  },

  // Create retry operation
  createRetryOperation: (operation: OptimisticOperation): OptimisticOperation => {
    return {
      ...operation,
      retryCount: operation.retryCount + 1,
      timestamp: Date.now(),
    };
  },
};

// Typing indicator utilities
export const typingUtils = {
  // Track typing users
  typingUsers: new Map<string, Set<string>>(),
  typingTimeouts: new Map<string, NodeJS.Timeout>(),

  // Add typing user
  addTypingUser: (conversationId: string, userId: string): void => {
    if (!typingUtils.typingUsers.has(conversationId)) {
      typingUtils.typingUsers.set(conversationId, new Set());
    }
    typingUtils.typingUsers.get(conversationId)!.add(userId);

    // Clear existing timeout
    const timeoutKey = `${conversationId}-${userId}`;
    if (typingUtils.typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingUtils.typingTimeouts.get(timeoutKey)!);
    }

    // Set new timeout to remove user after 5 seconds
    const timeout = setTimeout(() => {
      typingUtils.removeTypingUser(conversationId, userId);
    }, 5000);
    typingUtils.typingTimeouts.set(timeoutKey, timeout);
  },

  // Remove typing user
  removeTypingUser: (conversationId: string, userId: string): void => {
    const users = typingUtils.typingUsers.get(conversationId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        typingUtils.typingUsers.delete(conversationId);
      }
    }

    // Clear timeout
    const timeoutKey = `${conversationId}-${userId}`;
    if (typingUtils.typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingUtils.typingTimeouts.get(timeoutKey)!);
      typingUtils.typingTimeouts.delete(timeoutKey);
    }
  },

  // Get typing users for conversation
  getTypingUsers: (conversationId: string): string[] => {
    const users = typingUtils.typingUsers.get(conversationId);
    return users ? Array.from(users) : [];
  },

  // Clear all typing indicators for conversation
  clearTypingUsers: (conversationId: string): void => {
    const users = typingUtils.typingUsers.get(conversationId);
    if (users) {
      users.forEach((userId: unknown) => {
        const timeoutKey = `${conversationId}-${userId}`;
        if (typingUtils.typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingUtils.typingTimeouts.get(timeoutKey)!);
          typingUtils.typingTimeouts.delete(timeoutKey);
        }
      });
      typingUtils.typingUsers.delete(conversationId);
    }
  },
};
