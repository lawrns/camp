import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  channelId: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface UseCampfireThreadOptions {
  channelId: string;
  enabled?: boolean;
  staleTime?: number;
}

export const useCampfireThread = ({ channelId, enabled = true, staleTime = 30000 }: UseCampfireThreadOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Query for fetching messages
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<Message[], Error>({
    queryKey: ["campfireMessages", channelId],
    queryFn: async () => {
      const res = await fetch(`/api/campfire/messages?channelId=${encodeURIComponent(channelId)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status} ${res.statusText}`);
      }
      return res.json();
    },
    enabled: enabled && !!channelId,
    staleTime,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update local messages when data changes
  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  // Refetch when channel changes
  useEffect(() => {
    if (channelId && enabled) {
      refetch();
    }
  }, [channelId, enabled, refetch]);

  // Send message function with optimistic updates
  const sendMessage = useCallback(
    async (content: string, sender: string = "Me") => {
      if (!content.trim() || !channelId) {
        throw new Error("Content and channelId are required");
      }

      const payload = {
        channelId,
        sender,
        content: content.trim(),
      };

      const optimisticMessage: Message = {
        ...payload,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await fetch("/api/campfire/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }

        // Refetch to get the actual message with server-generated ID
        await refetch();
      } catch (err) {
        // Revert optimistic update on error
        setMessages((prev) => prev.filter((msg: any) => msg.id !== optimisticMessage.id));
        throw err; // Re-throw so UI can handle the error
      }
    },
    [channelId, refetch]
  );

  // Add a message manually (for real-time updates)
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((msg) => msg.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  // Update a message (for editing scenarios)
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((msg: any) => (msg.id === messageId ? { ...msg, ...updates } : msg)));
  }, []);

  // Remove a message
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg: any) => msg.id !== messageId));
  }, []);

  return {
    // Data
    messages,
    isLoading,
    isError,
    error,
    isFetching,

    // Actions
    sendMessage,
    addMessage,
    updateMessage,
    removeMessage,
    refetch,

    // State setters (for advanced use cases)
    setMessages,
  };
};
