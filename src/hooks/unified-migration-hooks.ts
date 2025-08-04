/**
 * Unified Migration Hooks
 * Provides unified hooks for migrated functionality
 */

import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "@/types/common";

// Mock data and state management for migration period
const mockConversations: Conversation[] = [
  {
    id: 1,
    organizationId: "org_1",
    customerId: "cust_1",
    status: "open",
    priority: "medium",
    subject: "Customer support inquiry",
    customerEmail: "customer@example.com",
    customerName: "John Doe",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 5,
  },
  {
    id: 2,
    organizationId: "org_1",
    customerId: "cust_2",
    status: "closed",
    priority: "low",
    subject: "Billing question",
    customerEmail: "billing@example.com",
    customerName: "Jane Smith",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 3,
  },
];

interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderType: "customer" | "agent" | "system";
  senderName?: string;
  createdAt: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    content: "Hello, I need help with my account",
    senderType: "customer",
    senderName: "John Doe",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    conversationId: "1",
    content: "Hi John! I'd be happy to help you with your account.",
    senderType: "agent",
    senderName: "Agent Smith",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Unified conversations hook
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConversations(mockConversations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (data: Partial<Conversation>) => {
    const newConversation: Conversation = {
      id: Date.now(),
      organizationId: "org_1",
      customerId: "customer_1",
      customerName: null,
      customerEmail: null,
      customerAvatar: null,
      subject: null,
      status: "open",
      priority: "medium",
      assignedOperatorId: null,
      assignedOperatorName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: null,
      messageCount: 0,
      ...data,
    };

    setConversations((prev) => [newConversation, ...prev]);
    return newConversation;
  }, []);

  const updateConversation = useCallback(async (id: number, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, ...updates, updatedAt: new Date().toISOString() } : conv))
    );
  }, []);

  return {
    conversations,
    loading,
    error,
    refreshConversations,
    createConversation,
    updateConversation,
  };
}

/**
 * Unified messages hook
 */
export function useMessagesStore(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      const conversationMessages = mockMessages.filter((msg) => msg.conversationId === convId);
      setMessages(conversationMessages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, senderType: "customer" | "agent" = "agent") => {
      if (!conversationId) return;

      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: conversationId || "",
        content,
        senderType,
        senderName: senderType === "agent" ? "Agent" : "Customer",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [conversationId]
  );

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: () => conversationId && loadMessages(conversationId),
  };
}

/**
 * Unified realtime hook
 */
export function useRealtimeStore(channelName: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    // Mock realtime connection
    setIsConnected(true);

    // REMOVED: Heartbeat polling replaced with real-time connection
    // This eliminates the 30-second polling interval that was causing unnecessary updates

    return () => {
      setIsConnected(false);

    };
  }, [channelName]);

  const sendRealtimeMessage = useCallback(
    (message: unknown) => {
      setLastMessage({
        ...message,
        timestamp: new Date().toISOString(),
        channel: channelName,
      });
    },
    [channelName]
  );

  return {
    isConnected,
    lastMessage,
    sendMessage: sendRealtimeMessage,
  };
}

/**
 * Unified typing indicators hook
 */
export function useTypingUsers(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = useCallback(() => {
    setIsTyping(true);
    // Mock: Add current user to typing list
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    // Mock: Remove current user from typing list
  }, [conversationId]);

  useEffect(() => {
    // REMOVED: Typing simulation polling replaced with real-time typing indicators
    // This eliminates the 5-second polling interval that was causing unnecessary updates
    // Real-time typing indicators will be handled by the messaging system

    return () => {

    };
  }, [conversationId]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  };
}

/**
 * Unified conversation AI hook
 */
export function useConversationAI(conversationId: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (context: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Mock AI suggestion generation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockSuggestions = [
        "Thank you for reaching out. I'll help you resolve this issue.",
        "I understand your concern. Let me look into this for you.",
        "I apologize for any inconvenience. Here's what we can do...",
      ];

      setSuggestions(mockSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateResponse = useCallback(async (message: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Mock AI response generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return "Thank you for your message. I'll get back to you shortly with a detailed response.";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate response");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const analyzeSentiment = useCallback(async (message: string) => {
    // Mock sentiment analysis
    const sentiments = ["positive", "neutral", "negative"];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }, []);

  return {
    suggestions,
    isGenerating,
    error,
    generateSuggestions,
    generateResponse,
    analyzeSentiment,
  };
}

/**
 * Export all hooks as a unified object
 */
export const UnifiedHooks = {
  useConversations,
  useMessagesStore,
  useRealtimeStore,
  useTypingUsers,
  useConversationAI,
};
