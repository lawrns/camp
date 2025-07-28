"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAIMode } from "@/hooks/useAIMode";
import { useAuth } from "@/hooks/useAuth";
import { useTenantSupabase } from "@/hooks/useTenantSupabase";
import { queryKeys } from "@/lib/cache/optimized-query-config";

interface Message {
  id: string;
  content: string;
  sender_type: "customer" | "agent" | "system";
  created_at: string;
  conversation_id: string;
}

interface UseRAGReturn {
  isGeneratingRAG: boolean;
  generateRAGResponse: (conversationId: string) => Promise<void>;
  insertAISuggestion: (content: string) => void;
  searchRAGSnippets: (query: string) => Promise<any[]>;
}

export function useRAG(): UseRAGReturn {
  const tenantClient = useTenantSupabase();
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const aiMode = useAIMode();
  const queryClient = useQueryClient();
  const [currentAISuggestion, setCurrentAISuggestion] = useState<string>("");

  // Generate RAG response mutation
  const generateRAGMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Get messages from cache
      const messages = queryClient.getQueryData(
        queryKeys.conversations.messages(conversationId)
      ) as unknown as Message[];
      if (!messages || messages.length === 0) return;

      const lastCustomerMessage = messages.filter((m: any) => m.sender_type === "customer").pop();

      if (!lastCustomerMessage) return;

      // Generate RAG response
      const response = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: lastCustomerMessage.content,
          context: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate RAG response");
      }

      const data = await response.json();

      // Insert RAG response as a message
      const { error } = await tenantClient.from("messages").insert({
        content: data.response,
        conversation_id: conversationId,
        sender_type: "agent",
        created_at: new Date().toISOString(),
        organization_id: organizationId,
        metadata: { rag_generated: true, confidence: data.confidence },
      });

      if (error) throw error;

      // Invalidate messages to refetch
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(conversationId),
      });

      return data;
    },
  });

  // Search RAG snippets
  const searchRAGSnippets = useCallback(async (query: string) => {
    if (!query || query.length < 3) return [];

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.snippets || [];
    } catch (error) {
      return [];
    }
  }, []);

  // Generate RAG response
  const generateRAGResponse = useCallback(
    async (conversationId: string) => {
      if (!aiMode.isAIEnabled) {
        return;
      }

      await generateRAGMutation.mutateAsync(conversationId);
    },
    [aiMode.isAIEnabled, generateRAGMutation]
  );

  // Insert AI suggestion into composer
  const insertAISuggestion = useCallback((content: string) => {
    setCurrentAISuggestion(content);
    // This will be consumed by the composer component
    window.dispatchEvent(new CustomEvent("ai-suggestion", { detail: { content } }));
  }, []);

  return {
    isGeneratingRAG: generateRAGMutation.isPending,
    generateRAGResponse,
    insertAISuggestion,
    searchRAGSnippets,
  };
}
