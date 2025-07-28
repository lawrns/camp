"use client";

import { useCallback, useEffect, useState } from "react";
import { useAIHandover } from "./useAIHandover";
import type { Message } from "@/types/entities/message";

interface AIHandoverWithQueueState {
  isHandoverInProgress: boolean;
  assignedAgentName: string | null;
  showQueueSimulation: boolean;
  confidenceThresholdReached: boolean;
}

export interface AIHandoverWithQueueHook extends ReturnType<typeof useAIHandover> {
  queueState: AIHandoverWithQueueState;
  checkConfidenceAndTriggerHandover: (message: Message) => Promise<void>;
  completeHandoverSimulation: (agentName: string) => void;
  resetHandover: () => void;
}

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Enhanced AI Handover Hook with Queue Simulation
 * Automatically triggers handover when confidence drops below 0.7
 */
export function useAIHandoverWithQueue(
  conversationId: string,
  organizationId: string,
  userId?: string
): AIHandoverWithQueueHook {
  const baseHandover = useAIHandover(conversationId, organizationId, userId);

  const [queueState, setQueueState] = useState<AIHandoverWithQueueState>({
    isHandoverInProgress: false,
    assignedAgentName: null,
    showQueueSimulation: false,
    confidenceThresholdReached: false,
  });

  // Check message confidence and trigger handover if needed
  const checkConfidenceAndTriggerHandover = useCallback(
    async (message: Message) => {
      // Extract confidence score from message metadata or AI response
      const confidenceScore = message.metadata?.confidence || message.ai_confidence_score || baseHandover.confidence;

      // Update the base handover confidence
      baseHandover.updateConfidence(confidenceScore);

      // Check if we need to trigger handover
      if (confidenceScore < CONFIDENCE_THRESHOLD && !queueState.isHandoverInProgress && !baseHandover.isAIActive) {
        setQueueState((prev) => ({
          ...prev,
          isHandoverInProgress: true,
          showQueueSimulation: true,
          confidenceThresholdReached: true,
        }));

        // The actual handover will be triggered after queue simulation completes
      }
    },
    [baseHandover, queueState.isHandoverInProgress]
  );

  // Complete the handover simulation and activate AI with agent persona
  const completeHandoverSimulation = useCallback(
    (agentName: string) => {
      setQueueState((prev) => ({
        ...prev,
        assignedAgentName: agentName,
        showQueueSimulation: false,
      }));

      // Start the actual AI handover after simulation
      setTimeout(async () => {
        try {
          await baseHandover.startHandover("professional"); // Use professional persona for "agent" responses

          // Update state to indicate handover is complete
          setQueueState((prev) => ({
            ...prev,
            isHandoverInProgress: false,
          }));
        } catch (error) {

          setQueueState((prev) => ({
            ...prev,
            isHandoverInProgress: false,
            showQueueSimulation: false,
          }));
        }
      }, 500); // Small delay for smooth transition
    },
    [baseHandover]
  );

  // Reset handover state
  const resetHandover = useCallback(() => {
    setQueueState({
      isHandoverInProgress: false,
      assignedAgentName: null,
      showQueueSimulation: false,
      confidenceThresholdReached: false,
    });
  }, []);

  // Monitor confidence changes from base handover
  useEffect(() => {
    if (
      baseHandover.confidence < CONFIDENCE_THRESHOLD &&
      !queueState.confidenceThresholdReached &&
      !baseHandover.isAIActive
    ) {
      checkConfidenceAndTriggerHandover({
        id: "confidence-check",
        content: "",
        ai_confidence_score: baseHandover.confidence,
      } as Message);
    }
  }, [
    baseHandover.confidence,
    queueState.confidenceThresholdReached,
    baseHandover.isAIActive,
    checkConfidenceAndTriggerHandover,
  ]);

  return {
    ...baseHandover,
    queueState,
    checkConfidenceAndTriggerHandover,
    completeHandoverSimulation,
    resetHandover,
  };
}
