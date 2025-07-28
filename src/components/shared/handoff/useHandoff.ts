"use client";

import { useMemo, useState } from "react";
import { DEFAULT_REASONS, HandoffConfig, HandoffData, HandoffReason } from "./types";

interface UseHandoffProps {
  availableAgents: any[];
  conversationId: string;
  currentContext: string;
  config: HandoffConfig;
}

export function useHandoff({ availableAgents, conversationId, currentContext, config }: UseHandoffProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [handoffData, setHandoffData] = useState<HandoffData>({
    type: "visitor-to-agent",
    conversationId,
    fromType: "visitor",
    toType: "agent",
    reason: undefined,
    urgency: "medium",
    context: currentContext,
    customNote: "",
    assignTo: undefined,
    aiPersona: undefined,
    metadata: {},
  });

  const filteredAgents = useMemo(() => {
    return availableAgents.filter((agent: any) => {
      // Filter based on urgency
      if (handoffData.urgency === "critical") {
        return agent.status === "online";
      }
      if (handoffData.urgency === "high") {
        return agent.status === "online" || agent.status === "busy";
      }
      return agent.status !== "offline";
    });
  }, [availableAgents, handoffData.urgency]);

  const selectedReason = handoffData.reason;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.enableReasons ? !!handoffData.reason : true;
      case 2:
        if (handoffData.toType === "agent") {
          return config.enableAgentSelection ? !!handoffData.assignTo : true;
        } else {
          return config.enablePersonaSelection ? !!handoffData.aiPersona : true;
        }
      case 3:
        return true;
      default:
        return false;
    }
  };

  const getStepConfig = () => {
    const steps = [];

    if (config.enableReasons) {
      steps.push({
        number: 1,
        title: "Select Reason",
        description: "Choose the reason for handoff",
      });
    }

    if (config.enableAgentSelection || config.enablePersonaSelection) {
      steps.push({
        number: 2,
        title: handoffData.toType === "agent" ? "Select Agent" : "Select AI Persona",
        description: handoffData.toType === "agent" ? "Choose an agent to handle this" : "Choose AI personality",
      });
    }

    steps.push({
      number: 3,
      title: "Review & Confirm",
      description: "Review handoff details",
    });

    return steps;
  };

  return {
    handoffData,
    setHandoffData,
    currentStep,
    setCurrentStep,
    canProceed,
    getStepConfig,
    filteredAgents,
    selectedReason,
  };
}
