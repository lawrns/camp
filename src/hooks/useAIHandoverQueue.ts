"use client";

import { useState, useEffect, useCallback } from "react";
import { AIHandoverService, HandoverQueueStatus } from "@/lib/services/ai-handover";
import { useRealtime } from "@/hooks/useRealtime";

export interface UseAIHandoverQueueProps {
  conversationId: string;
  organizationId: string;
  onHandoverComplete?: (agentName: string) => void;
  onHandoverCancelled?: () => void;
}

export interface UseAIHandoverQueueReturn {
  // State
  isHandoverActive: boolean;
  handoverStatus: HandoverQueueStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  triggerHandover: (aiConfidence: number, context?: unknown, reason?: string) => Promise<void>;
  cancelHandover: () => Promise<void>;

  // UI helpers
  shouldShowHandoverUI: boolean;
  handoverMessage: string;
  assignedAgentName: string | null;
}

export function useAIHandoverQueue({
  conversationId,
  organizationId,
  onHandoverComplete,
  onHandoverCancelled,
}: UseAIHandoverQueueProps): UseAIHandoverQueueReturn {
  const [handoverStatus, setHandoverStatus] = useState<HandoverQueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handoverService = AIHandoverService.getInstance();

  // Subscribe to real-time handover events
  const { subscribe, unsubscribe } = useRealtime({
    organizationId,
    conversationId,
  });

  // Handle real-time handover events
  const handleHandoverEvent = useCallback(
    (payload: unknown) => {

      if (payload.conversation_id !== conversationId) return;

      switch (payload.type) {
        case "handover_initiated":
          setHandoverStatus({
            status: "connecting",
            message: payload.message || "Connecting to agent...",
          });
          break;

        case "handover_connecting":
          setHandoverStatus({
            status: "connecting",
            message: payload.message || "Connecting to agent...",
            estimatedWaitTime: payload.estimatedWaitTime,
          });
          break;

        case "handover_in_queue":
          setHandoverStatus({
            status: "in_queue",
            message: payload.message || "Finding available agent...",
            estimatedWaitTime: payload.estimatedWaitTime,
            queuePosition: payload.queuePosition,
          });
          break;

        case "handover_assigned":
          setHandoverStatus({
            status: "assigned",
            message: payload.message || `Agent ${payload.agentName} assigned`,
            agentName: payload.agentName,
          });

          // Notify parent component
          if (onHandoverComplete && payload.agentName) {
            onHandoverComplete(payload.agentName);
          }
          break;

        default:

      }
    },
    [conversationId, onHandoverComplete]
  );

  // Subscribe to handover events on mount
  useEffect(() => {
    const unsubscribeHandover = subscribe("ai_handover", handleHandoverEvent);

    // Check if there's already an active handover
    const existingStatus = handoverService.getHandoverStatus(conversationId);
    if (existingStatus) {
      setHandoverStatus(existingStatus);
    }

    return () => {
      unsubscribeHandover();
    };
  }, [conversationId, subscribe, handleHandoverEvent, handoverService]);

  // Trigger handover
  const triggerHandover = useCallback(
    async (aiConfidence: number, context: unknown = {}, reason: string = "Low AI confidence") => {
      if (isLoading || handoverStatus?.status === "assigned") {

        return;
      }

      setIsLoading(true);
      setError(null);

      try {

        await handoverService.triggerHandover(
          conversationId,
          organizationId,
          aiConfidence,
          {
            ...context,
            trigger_timestamp: new Date().toISOString(),
            user_action: "ai_confidence_threshold",
          },
          reason
        );

      } catch (err) {

        setError(err instanceof Error ? err.message : "Failed to connect to agent");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, organizationId, isLoading, handoverStatus, handoverService]
  );

  // Cancel handover
  const cancelHandover = useCallback(async () => {
    if (!handoverStatus) return;

    setIsLoading(true);
    setError(null);

    try {
      await handoverService.cancelHandover(conversationId);
      setHandoverStatus(null);

      if (onHandoverCancelled) {
        onHandoverCancelled();
      }

    } catch (err) {

      setError(err instanceof Error ? err.message : "Failed to cancel handover");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, handoverStatus, handoverService, onHandoverCancelled]);

  // Computed values
  const isHandoverActive = handoverService.isHandoverActive(conversationId);
  const shouldShowHandoverUI = Boolean(handoverStatus && handoverStatus.status !== "completed");
  const handoverMessage = handoverStatus?.message || "";
  const assignedAgentName = handoverStatus?.agentName || null;

  return {
    // State
    isHandoverActive,
    handoverStatus,
    isLoading,
    error,

    // Actions
    triggerHandover,
    cancelHandover,

    // UI helpers
    shouldShowHandoverUI,
    handoverMessage,
    assignedAgentName,
  };
}

// Helper hook for checking if AI should trigger handover based on confidence
export function useAIConfidenceMonitor(
  aiConfidence: number | null,
  threshold: number = 0.7,
  onShouldHandover?: () => void
) {
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (aiConfidence === null) return;

    // Only trigger if confidence drops below threshold and wasn't already below
    if (aiConfidence < threshold && (lastConfidence === null || lastConfidence >= threshold)) {

      if (onShouldHandover) {
        onShouldHandover();
      }
    }

    setLastConfidence(aiConfidence);
  }, [aiConfidence, threshold, lastConfidence, onShouldHandover]);

  return {
    shouldHandover: aiConfidence !== null && aiConfidence < threshold,
    confidenceScore: aiConfidence,
    threshold,
  };
}
