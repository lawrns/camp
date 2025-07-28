import { useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useCampfireStore } from "@/store";
import { Message, SenderType } from "@/types/entities";

interface OptimisticMessage {
  id: string;
  temp_id: string;
  is_optimistic: boolean;
  conversationId: string;
  content: string;
  senderType: SenderType;
  senderId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface UseOptimisticMessagesOptions {
  conversationId: string;
  onError?: (error: Error, tempId: string) => void;
  onSuccess?: (tempId: string, actualMessage: Message) => void;
}

export function useOptimisticMessages({ conversationId, onError, onSuccess }: UseOptimisticMessagesOptions) {
  const { addOptimisticMessage, removeOptimisticMessage, clearOptimisticMessages, sendMessage } = useCampfireStore();

  const pendingMessages = useRef<Map<string, OptimisticMessage>>(new Map());

  /**
   * Send a message with optimistic update
   */
  const sendOptimisticMessage = useCallback(
    async (content: string, senderType: SenderType, metadata?: Record<string, any>) => {
      const tempId = uuidv4();
      const optimisticMessage: OptimisticMessage = {
        id: tempId, // Will be replaced with actual ID
        temp_id: tempId,
        is_optimistic: true,
        conversationId: conversationId,
        content,
        senderType: senderType as SenderType,
        senderId: "current-user", // This should be replaced with actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          status: "sending",
        },
      };

      // Add to pending messages
      pendingMessages.current.set(tempId, optimisticMessage);

      // Add optimistic message to store
      const messageForStore: Message = {
        id: optimisticMessage.id,
        conversationId: optimisticMessage.conversationId,
        content: optimisticMessage.content,
        senderType: optimisticMessage.senderType,
        senderId: optimisticMessage.senderId || null,
        createdAt: optimisticMessage.createdAt,
        updatedAt: optimisticMessage.updatedAt,
        ...(optimisticMessage.metadata && { metadata: optimisticMessage.metadata }),
      };
      addOptimisticMessage(conversationId, messageForStore as any);

      try {
        // Send the actual message
        // Send message doesn't return anything in phoenix store, create a mock message
        sendMessage(conversationId, content, senderType);

        const actualMessage: Message = {
          id: uuidv4(),
          conversationId: conversationId,
          content,
          senderType: senderType,
          senderId: "current-user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Remove optimistic message
        removeOptimisticMessage(conversationId, tempId);
        pendingMessages.current.delete(tempId);

        if (onSuccess) {
          onSuccess(tempId, actualMessage);
        }

        return actualMessage;
      } catch (error) {
        // Update optimistic message to show error state
        const errorMessage = {
          ...optimisticMessage,
          metadata: {
            ...optimisticMessage.metadata,
            status: "error",
            error: error instanceof Error ? error.message : "Failed to send message",
          },
        };

        // Remove the failed optimistic message
        removeOptimisticMessage(conversationId, tempId);
        pendingMessages.current.delete(tempId);

        if (onError) {
          onError(error as Error, tempId);
        }

        throw error;
      }
    },
    [conversationId, addOptimisticMessage, removeOptimisticMessage, sendMessage, onError, onSuccess]
  );

  /**
   * Update a message with optimistic update
   */
  const updateOptimisticMessage = useCallback(
    async (messageId: string, updates: Partial<Message>) => {
      // Store original message state for rollback
      const state = useCampfireStore.getState();
      const conversationMessages = state.messages?.[conversationId] || [];
      const originalMessage = conversationMessages.find((m: any) => m.id === messageId);

      if (!originalMessage) {
        throw new Error("Message not found");
      }

      // Apply optimistic update (mock implementation)
      // updateMessage function not available in current store

      try {
        // Send actual update request
        const response = await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update message");
        }

        const updatedMessage = await response.json();

        // Update with actual data (mock implementation)

        return updatedMessage;
      } catch (error) {
        // Rollback to original state (mock implementation)

        throw error;
      }
    },
    [conversationId]
  );

  /**
   * Retry sending a failed optimistic message
   */
  const retryOptimisticMessage = useCallback(
    async (tempId: string) => {
      const message = pendingMessages.current.get(tempId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Update status to retrying
      // Note: updateMessage not available, using optimistic update approach

      try {
        // Send message doesn't return anything in phoenix store, create a mock message
        sendMessage(conversationId, message.content, message.senderType);

        const actualMessage: Message = {
          id: uuidv4(),
          conversationId: conversationId,
          content: message.content,
          senderType: message.senderType,
          senderId: "current-user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Remove optimistic message
        removeOptimisticMessage(conversationId, tempId);
        pendingMessages.current.delete(tempId);

        if (onSuccess) {
          onSuccess(tempId, actualMessage);
        }

        return actualMessage;
      } catch (error) {
        // Remove failed optimistic message
        removeOptimisticMessage(conversationId, tempId);
        pendingMessages.current.delete(tempId);

        if (onError) {
          onError(error as Error, tempId);
        }

        throw error;
      }
    },
    [conversationId, sendMessage, removeOptimisticMessage, onError, onSuccess]
  );

  /**
   * Remove a failed optimistic message
   */
  const removeFailedMessage = useCallback(
    (tempId: string) => {
      removeOptimisticMessage(conversationId, tempId);
      pendingMessages.current.delete(tempId);
    },
    [conversationId, removeOptimisticMessage]
  );

  /**
   * Clear all optimistic messages for the conversation
   */
  const clearAllOptimisticMessages = useCallback(() => {
    clearOptimisticMessages(conversationId);
    // Clear pending messages for this conversation
    Array.from(pendingMessages.current.entries()).forEach(([tempId, message]) => {
      if (message.conversationId === conversationId) {
        pendingMessages.current.delete(tempId);
      }
    });
  }, [conversationId, clearOptimisticMessages]);

  return {
    sendOptimisticMessage,
    updateOptimisticMessage,
    retryOptimisticMessage,
    removeFailedMessage,
    clearAllOptimisticMessages,
  };
}
