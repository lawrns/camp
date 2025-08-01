"use client";

import { supabase } from "@/lib/supabase/consolidated-exports";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "../store/domains/auth/auth-store"; // Adjust path as needed

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
export function useAIHandover(conversationId: string, organizationId: string, userId?: string): AIHandoverHook {
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

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-ID": organizationId,
      };
    } catch (error) {
      return {
        "Content-Type": "application/json",
        "X-Organization-ID": organizationId,
      };
    }
  };

  // Check current AI status on mount
  useEffect(() => {
    void checkAIStatus();
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
            isAIActive: conversation.assignedtoai || conversation.assigned_to === "ai" || false,
            confidence: conversation.ai_confidence_score || 0.85,
            sessionId: conversation.ai_handover_session_id || null,
          }));
        }
      }
    } catch (error) { }
  };

  const startHandover = useCallback(
    async (persona: string = "friendly") => {
      // Validate required parameters
      if (!organizationId || organizationId.trim() === "") {
        const errorMessage = "Organization ID is required for AI handover";
        setState((prev) => ({ ...prev, error: errorMessage, isProcessing: false }));
        throw new Error(errorMessage);
      }

      if (!conversationId || conversationId.trim() === "") {
        const errorMessage = "Conversation ID is required for AI handover";
        setState((prev) => ({ ...prev, error: errorMessage, isProcessing: false }));
        throw new Error(errorMessage);
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null, processingProgress: 10 }));

      try {
        const headers = await getAuthHeaders();
        setState((prev) => ({ ...prev, processingProgress: 30 }));

        // Try the main AI handover endpoint first
        let response = await fetch("/api/ai?action=handover", {
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
    setState((prev) => ({ ...prev, isProcessing: true, error: null, processingProgress: 10 }));

    try {
      const headers = await getAuthHeaders();
      setState((prev) => ({ ...prev, processingProgress: 50 }));

      // Use the AI stop endpoint
      const response = await fetch("/api/ai?action=handover", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          organizationId,
          action: "stop",
          reason: "agent_takeover",
          targetOperatorId: userId,
        }),
      });

      setState((prev) => ({ ...prev, processingProgress: 80 }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || errorData.message || `Stop handover failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      setState((prev) => ({
        ...prev,
        isAIActive: false,
        sessionId: null,
        confidence: 0,
        isProcessing: false,
        processingProgress: 100,
        currentSource: null,
      }));

      // Clear progress after a delay
      setTimeout(() => {
        setState((prev) => ({ ...prev, processingProgress: 0 }));
      }, 1000);
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
  }, [conversationId, organizationId, userId]);

  const toggleAI = useCallback(async () => {
    if (state.isAIActive) {
      await stopHandover();
    } else {
      await startHandover();
    }
  }, [state.isAIActive, startHandover, stopHandover]);

  const updatePersona = useCallback(async (persona: string) => {
    try {
      // For now, just update the confidence based on persona
      const confidenceMap: Record<string, number> = {
        friendly: 0.85,
        professional: 0.9,
        supportive: 0.88,
        technical: 0.92,
      };

      setState((prev) => ({
        ...prev,
        confidence: confidenceMap[persona] || 0.85,
      }));
    } catch (error) { }
  }, []);

  const updateConfidence = useCallback((confidence: number) => {
    setState((prev) => ({
      ...prev,
      confidence: Math.max(0, Math.min(1, confidence)),
    }));
  }, []);

  const setKnowledgeSource = useCallback((source: string) => {
    setState((prev) => ({
      ...prev,
      currentSource: source,
    }));
  }, []);

  // REMOVED: Simulated metrics updates polling
  // This eliminates the 30-second polling interval that was causing unnecessary updates
  // Real-time metrics will be handled by actual event-driven updates

  return {
    ...state,
    toggleAI,
    updateConfidence,
    setKnowledgeSource,
    startHandover,
    stopHandover,
    updatePersona,
  };
}
