"use client";

import { useCallback } from "react";
import { useCampfireStore } from "@/store";
import { createOptimisticMessage } from "../utils/conversationHelpers";
import { logWithContext } from "../utils/logger";

interface UseMessageHandlingProps {
  selectedConversationId?: string;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  sendMessage: (conversationId: string, content: string) => Promise<any>;
  trackMessageDelivery?: (startTime: number) => void;
}

export function useMessageHandling({
  selectedConversationId,
  userId,
  userEmail,
  organizationId,
  sendMessage,
  trackMessageDelivery,
}: UseMessageHandlingProps) {
  const { addOptimisticMessage, removeOptimisticMessage, clearOptimisticMessages } = useCampfireStore();

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || !selectedConversationId || !userId) {
        return { success: false, error: "Missing required fields" };
      }

      const content = messageText.trim();
      const deliveryStartTime = performance.now();

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(
        selectedConversationId,
        content,
        userId,
        userEmail || "",
        organizationId || ""
      );

      addOptimisticMessage(selectedConversationId, optimisticMessage as unknown);

      try {
        const result = await sendMessage(selectedConversationId, content);
        logWithContext("info", "Message sent successfully", {
          messageId: result?.id,
          tempId: optimisticMessage.temp_id,
        });

        // Track successful delivery time
        if (trackMessageDelivery) {
          trackMessageDelivery(deliveryStartTime);
        }

        // Remove optimistic message after real message arrives
        setTimeout(() => {
          removeOptimisticMessage(selectedConversationId, optimisticMessage.temp_id);
          logWithContext("info", "Optimistic message cleaned up", {
            tempId: optimisticMessage.temp_id,
          });
        }, 1000);

        return { success: true, result };
      } catch (error) {
        logWithContext("error", "Failed to send message", {
          error,
          tempId: optimisticMessage.temp_id,
        });

        // Remove failed optimistic message
        removeOptimisticMessage(selectedConversationId, optimisticMessage.temp_id);

        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to send message",
          content, // Return content so UI can restore it
        };
      }
    },
    [
      selectedConversationId,
      userId,
      userEmail,
      organizationId,
      sendMessage,
      addOptimisticMessage,
      removeOptimisticMessage,
      trackMessageDelivery,
    ]
  );

  const clearOptimistic = useCallback(() => {
    if (selectedConversationId) {
      clearOptimisticMessages(selectedConversationId);
    }
  }, [selectedConversationId, clearOptimisticMessages]);

  return {
    handleSendMessage,
    clearOptimistic,
  };
}
