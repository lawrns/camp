"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Icon } from "@/lib/ui/Icon";
import { HandoffForm } from "./HandoffForm";
import { HandoffPreview } from "./HandoffPreview";
import { HandoffData, HandoffType, UIMode } from "./types";
import { useHandoff } from "./useHandoff";

export interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHandoff: (data: HandoffData) => void;
  availableAgents?: unknown[];
  conversationId: string;
  currentContext: string;
  uiMode?: UIMode;
  config?: {
    enableReasons?: boolean;
    enableAgentSelection?: boolean;
    enablePersonaSelection?: boolean;
    availableTypes?: HandoffType[];
  };
}

export function HandoffDialog({
  open,
  onOpenChange,
  onHandoff,
  availableAgents = [],
  conversationId,
  currentContext,
  uiMode = "wizard",
  config = {
    enableReasons: true,
    enableAgentSelection: true,
    enablePersonaSelection: true,
    availableTypes: ["visitor-to-agent", "agent-to-agent", "ai-to-human"],
  },
}: HandoffDialogProps) {
  const {
    handoffData,
    setHandoffData,
    currentStep,
    setCurrentStep,
    canProceed,
    getStepConfig,
    filteredAgents,
    selectedReason,
  } = useHandoff({
    availableAgents,
    conversationId,
    currentContext,
    config,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setHandoffData({
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
      } as unknown as HandoffData);
      setCurrentStep(1);
    }
  }, [open, conversationId, currentContext, setHandoffData, setCurrentStep]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onHandoff(handoffData);
      handleOpenChange(false);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const stepConfig = getStepConfig();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Handoff Conversation</DialogTitle>
          <DialogDescription>Transfer this conversation to another agent or back to the customer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {uiMode === "wizard" && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex space-x-spacing-sm">
                {[1, 2, 3].map((step: unknown) => (
                  <div
                    key={step}
                    className={`flex h-8 w-8 items-center justify-center rounded-ds-full text-sm font-medium ${
                      currentStep >= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 text-[var(--fl-color-text-muted)]"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <HandoffForm
                handoffData={handoffData}
                setHandoffData={setHandoffData}
                currentStep={currentStep}
                uiMode={uiMode}
                config={config}
                filteredAgents={filteredAgents}
                {...(selectedReason && { selectedReason })}
              />
            </div>
            <div>
              <HandoffPreview
                handoffData={handoffData}
                {...(selectedReason && { selectedReason })}
                filteredAgents={filteredAgents}
              />
            </div>
          </div>

          <div className="flex justify-between">
            {uiMode === "wizard" && currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isLoading} leftIcon={<Icon icon={ArrowLeft} className="h-4 w-4" />}>
                Back
              </Button>
            )}
            <div className="ml-auto flex gap-ds-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              {uiMode === "wizard" && currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                  Next
                  <Icon icon={ArrowRight} className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed() || isLoading}>
                  {isLoading ? "Processing..." : "Complete Handoff"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
