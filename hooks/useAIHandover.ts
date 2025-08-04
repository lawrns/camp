// 🔧 FIXED AI HANDOVER HOOK - CAMPFIRE V2
// Updated to handle missing organizationId and provide better error handling

"use client";

import { supabase } from "@/lib/supabase/consolidated-exports";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../store/domains/auth/auth-store";

interface AIHandoverState {
  isAIActive: boolean;
  confidence: number;
  isProcessing: boolean;
  sessionId: string | null;
  error: string | null;
  responseCount: number;
  averageResponseTime: number;
  currentSource: string | null;
  processingProgress: number;
  messageCount: number;
}

export interface AIHandoverActions {
  toggleAI: () => Promise<void>;
  updateConfidence: (confidence: number) => void;
  setKnowledgeSource: (source: string) => void;
  startHandover: (persona?: string) => Promise<void>;
  stopHandover: () => Promise<void>;
  updatePersona: (persona: string) => Promise<void>;
}

export type AIHandoverHook = AIHandoverState & AIHandoverActions;

/**
 * Complete AI Handover Hook
 * Provides full AI handover functionality using existing API infrastructure
 */
export function useAIHandover(conversationId: string, organizationId?: string, userId?: string): AIHandoverHook {
  const [state, setState] = useState<AIHandoverState>({
    isAIActive: false,
    confidence: 0.85,
    isProcessing: false,
    sessionId: null,
    error: null,
    responseCount: 0,
    averageResponseTime: 0,
    currentSource: "knowledge_base",
    processingProgress: 0,
    messageCount: 0,
  });

  const supabaseClient = supabase.browser();

  // Helper function to get authenticated headers
  const getAuthHeaders = async () => {
    try {
      const accessToken = useAuthStore.getState().session?.access_token;
      const authStoreOrgId = useAuthStore.getState().organizationId;
      const currentOrgId = organizationId || authStoreOrgId;

      console.log("[useAIHandover] Auth debug:", {
        passedOrgId: organizationId,
        authStoreOrgId,
        finalOrgId: currentOrgId,
        hasAccessToken: !!accessToken
      });

      if (!currentOrgId || currentOrgId.trim() === "") {
        const error = `Organization ID is required for AI handover. Passed: "${organizationId}", Store: "${authStoreOrgId}"`;
        console.error("[useAIHandover]", error);
        throw new Error(error);
      }

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-ID": currentOrgId,
      };
    } catch (error) {
      console.error("[useAIHandover] Failed to get auth headers:", error);
      throw error instanceof Error ? error : new Error("Organization ID is required");
    }
  };

  // Check current AI status on mount
  useEffect(() => {
    if (conversationId && organizationId) {
      void checkAIStatus();
    }
  }, [conversationId, organizationId]);

  const checkAIStatus = async () => {
    try {
      const headers = await getAuthHeaders();

      // Check if conversation is currently assigned to AI
      const response = await fetch(`/api/conversations?action=list&id=${conversationId}`, {
        headers,
        credentials: "include", // Include cookies for authentication
      });

      if (response.ok) {
        const result = await response.json();
        const conversation = result.data?.conversations?.[0] || result.conversations?.[0];

        if (conversation) {
          setState((prev) => ({
            ...prev,
            isAIActive: conversation.assignedToAi || conversation.assigned_to === "ai" || false,
            confidence: conversation.aiConfidence || 0.85,
            sessionId: conversation.aiHandoverSessionId || null,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to check AI status:", error);
    }
  };

  const startHandover = useCallback(
    async (persona: string = "friendly") => {
      console.log("[useAIHandover] startHandover called with:", {
        conversationId,
        organizationId,
        userId,
        persona
      });

      if (!organizationId || organizationId.trim() === "") {
        const error = `Organization ID is required for AI handover. Received: "${organizationId}"`;
        console.error("[useAIHandover]", error);
        setState((prev) => ({
          ...prev,
          error,
          isProcessing: false,
          processingProgress: 0,
        }));
        throw new Error(error);
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null, processingProgress: 10 }));

      try {
        const headers = await getAuthHeaders();
        setState((prev) => ({ ...prev, processingProgress: 30 }));

        // Try the main AI handover endpoint first
        let response = await fetch("/api/ai/handover", {
          method: "POST",
          headers,
          credentials: "include", // Include cookies for authentication
          body: JSON.stringify({
            conversationId,
            organizationId,
            action: "start",
            reason: "agent_initiated_ai_handover",
            targetOperatorId: userId,
            metadata: {
              persona,
              initiated_by: "agent",
            },
          }),
        });

        setState((prev) => ({ ...prev, processingProgress: 60 }));

        // If that fails, try the conversation-specific handover endpoint
        if (!response.ok) {
          response = await fetch(`/api/conversations/${conversationId}/handover`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({
              targetOperatorId: "ai",
              reason: "agent_initiated_ai_handover",
              metadata: {
                persona,
                initiated_by: "agent",
              },
            }),
          });
        }

        setState((prev) => ({ ...prev, processingProgress: 80 }));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || errorData.message || `Handover failed: ${response.status}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          isAIActive: true,
          sessionId: result.handoverId || result.sessionId || Date.now().toString(),
          confidence: 0.85,
          isProcessing: false,
          processingProgress: 100,
          currentSource: "knowledge_base",
          messageCount: 0,
        }));

        // Clear progress after a delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, processingProgress: 0 }));
        }, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Handover failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isProcessing: false,
          processingProgress: 0,
        }));
        throw error;
      }
    },
    [conversationId, organizationId, userId]
  );

  const stopHandover = useCallback(async () => {
    if (!organizationId) {
      const error = "Organization ID is required";
      setState((prev) => ({
        ...prev,
        error,
        isProcessing: false,
        processingProgress: 0,
      }));
      throw new Error(error);
    }

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/ai/handover", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          organizationId,
          action: "stop",
          reason: "agent_stopped_ai_handover",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || errorData.message || `Stop handover failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      setState((prev) => ({
        ...prev,
        isAIActive: false,
        sessionId: null,
        isProcessing: false,
        processingProgress: 0,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Stop handover failed";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        processingProgress: 0,
      }));
      throw error;
    }
  }, [conversationId, organizationId]);

  const toggleAI = useCallback(async () => {
    if (state.isAIActive) {
      await stopHandover();
    } else {
      await startHandover();
    }
  }, [state.isAIActive, startHandover, stopHandover]);

  const updateConfidence = useCallback((confidence: number) => {
    setState((prev) => ({ ...prev, confidence }));
  }, []);

  const setKnowledgeSource = useCallback((source: string) => {
    setState((prev) => ({ ...prev, currentSource: source }));
  }, []);

  const updatePersona = useCallback(async (persona: string) => {
    if (!state.isAIActive) {
      throw new Error("AI must be active to update persona");
    }

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/ai?action=handover", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          organizationId,
          action: "update_persona",
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update persona");
      }

      // Update local state if needed
      setState((prev) => ({ ...prev }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update persona";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [conversationId, organizationId, state.isAIActive]);

  return {
    ...state,
    startHandover,
    stopHandover,
    toggleAI,
    updateConfidence,
    setKnowledgeSource,
    updatePersona,
  };
}
