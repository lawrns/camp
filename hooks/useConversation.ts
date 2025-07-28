"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    type: "customer" | "agent" | "system" | "ai";
    avatar?: string;
  };
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  metadata?: {
    aiGenerated?: boolean;
    confidence?: number;
    suggestedResponses?: string[];
  };
}

interface Conversation {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: "online" | "away" | "offline";
    phone?: string;
    location?: string;
    timezone?: string;
    company?: string;
    title?: string;
    website?: string;
    createdAt: Date;
    lastSeen?: Date;
    totalConversations: number;
    averageResponseTime?: string;
    satisfaction?: number;
    notes?: string;
    tags: string[];
  };
  subject: string;
  status: "active" | "waiting" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Real data integration - no mock data needed

export function useConversation(conversationId: string | null) {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation data from real API
  useEffect(() => {
    if (!conversationId) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch real conversation data
    Promise.all([
      fetch(`/api/conversations/${conversationId}`).then((res) => res.json()),
      fetch(`/api/conversations/${conversationId}/messages`).then((res) => res.json()),
    ])
      .then(([conversationData, messagesData]) => {
        if (conversationData.error) {
          setError(conversationData.error);
          return;
        }

        // Transform API data to match expected format
        if (conversationData.conversation) {
          const conversation: Conversation = {
            id: conversationData.conversation.id,
            customer: {
              id: conversationData.conversation.customer_id || "unknown",
              name: conversationData.conversation.customer_name || "Unknown Customer",
              email: conversationData.conversation.customer_email || "",
              status: "online",
              createdAt: new Date(conversationData.conversation.created_at),
              totalConversations: 1,
              tags: [],
            },
            subject: conversationData.conversation.subject || "No subject",
            status: conversationData.conversation.status || "active",
            priority: conversationData.conversation.priority || "medium",
            tags: conversationData.conversation.tags || [],
            createdAt: new Date(conversationData.conversation.created_at),
            updatedAt: new Date(conversationData.conversation.updated_at),
          };
          setCurrentConversation(conversation);
        }

        // Transform messages data
        if (messagesData.messages) {
          const transformedMessages: Message[] = messagesData.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: {
              id: msg.sender?.id || "unknown",
              name: msg.sender?.name || "Unknown",
              type: msg.sender?.type || "customer",
              avatar: msg.sender?.avatar,
            },
            timestamp: new Date(msg.timestamp || msg.createdAt),
            status: msg.status || "delivered",
            metadata: msg.metadata || {},
          }));
          setMessages(transformedMessages);
        }

        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load conversation");
        setLoading(false);
      });
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!conversationId || !currentConversation) return;

      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        content,
        sender: {
          id: "current-agent",
          name: "Current Agent",
          type: "agent",
        },
        timestamp: new Date(),
        status: "sending",
        attachments:
          attachments?.map((file) => ({
            id: `att-${Date.now()}`,
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type,
            size: file.size,
          })) || [],
      };

      // Optimistically add message
      setMessages((prev) => [...prev, newMessage]);

      try {
        // Send message via real API
        const response = await fetch(`/api/messages?action=send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            content,
            sender_type: "agent",
            metadata: attachments ? { attachments: attachments.map((f) => f.name) } : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const result = await response.json();

        // Replace temporary message with real message data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: result.message.id,
                  status: "delivered" as const,
                  timestamp: new Date(result.message.createdAt),
                }
              : msg
          )
        );
      } catch (error) {
        // Update message status to failed
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" as const } : msg)));
        setError("Failed to send message");
      }
    },
    [conversationId, currentConversation]
  );

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implement actual API call
    } catch (error) {}
  }, []);

  const updateConversation = useCallback(
    async (updates: Partial<Conversation>) => {
      if (!currentConversation) return;

      try {
        const updatedConversation = { ...currentConversation, ...updates };
        setCurrentConversation(updatedConversation);

        // TODO: Implement actual API call
      } catch (error) {
        setError("Failed to update conversation");
      }
    },
    [currentConversation]
  );

  const selectConversation = useCallback(
    (convId: string) => {
      const conversation = conversations.find((c) => c.id === convId) || null;
      setSelectedConversation(conversation);
      setCurrentConversation(conversation);
    },
    [conversations]
  );

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentConversation,
    messages,
    conversations,
    conversationMessages: messages,
    selectedConversation: selectedConversation || currentConversation,
    loading,
    isLoading,
    isLoadingMessages,
    error,
    sendMessage,
    markAsRead,
    updateConversation,
    selectConversation,
    loadConversations,
  };
}
