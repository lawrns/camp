"use client";

import React from "react";
import { Warning as AlertTriangle, Robot as Bot, CheckCircle, Clock, User } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Label } from "@/components/unified-ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/components/unified-ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REASONS,
  HandoffConfig,
  HandoffData,
  HandoffReason,
  STATUS_CONFIG,
  UIMode,
  URGENCY_CONFIG,
} from "./types";

interface HandoffFormProps {
  handoffData: HandoffData;
  setHandoffData: React.Dispatch<React.SetStateAction<HandoffData>>;
  currentStep: number;
  uiMode: UIMode;
  config: HandoffConfig;
  filteredAgents: unknown[];
  selectedReason?: HandoffReason;
}

export function HandoffForm({
  handoffData,
  setHandoffData,
  currentStep,
  uiMode,
  config,
  filteredAgents,
  selectedReason,
}: HandoffFormProps) {
  const renderReasonSelection = () => {
    if (!config.enableReasons) return null;

    const reasons = DEFAULT_REASONS;

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Select Handoff Reason</Label>
          <p className="mt-1 text-sm text-muted-foreground">Choose the primary reason for this handoff</p>
        </div>
        <RadioGroup
          value={handoffData.reason?.id || ""}
          onValueChange={(value: string) => {
            const reason = reasons.find((r) => r.id === value);
            setHandoffData(
              (prev: HandoffData): HandoffData => ({
                ...prev,
                reason: reason || undefined,
                urgency: reason?.urgency || prev.urgency,
              })
            );
          }}
        >
          <div className="grid gap-3">
            {reasons.map((reason: unknown) => (
              <div
                key={reason.id}
                className={cn(
                  "flex cursor-pointer items-start space-x-3 rounded-ds-lg border spacing-4 transition-colors",
                  handoffData.reason?.id === reason.id
                    ? "border-primary bg-primary/5"
                    : "border-[var(--fl-color-border)] hover:bg-neutral-50"
                )}
                onClick={() => {
                  setHandoffData(
                    (prev: HandoffData): HandoffData => ({
                      ...prev,
                      reason,
                      urgency: reason.urgency,
                    })
                  );
                }}
              >
                <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={reason.id} className="cursor-pointer">
                    <div className="font-medium">{reason.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{reason.description}</div>
                  </Label>
                  <div className="mt-2 flex items-center gap-ds-2">
                    <Badge variant="outline" className="text-tiny">
                      {reason.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", URGENCY_CONFIG[reason.urgency as keyof typeof URGENCY_CONFIG].color)}
                    >
                      {URGENCY_CONFIG[reason.urgency as keyof typeof URGENCY_CONFIG].label} Priority
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="mt-4 space-y-spacing-sm">
          <Label htmlFor="customNote">Additional Notes (Optional)</Label>
          <Textarea
            id="customNote"
            value={handoffData.customNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setHandoffData(
                (prev: HandoffData): HandoffData => ({
                  ...prev,
                  customNote: e.target.value,
                })
              )
            }
            placeholder="Add any additional context or notes for the handoff..."
            rows={3}
          />
        </div>
      </div>
    );
  };

  const renderAgentSelection = () => {
    if (!config.enableAgentSelection || handoffData.toType !== "agent") return null;

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Select Agent</Label>
          <p className="mt-1 text-sm text-muted-foreground">Choose an agent to handle this conversation</p>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Icon icon={User} className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No available agents at the moment</p>
          </div>
        ) : (
          <RadioGroup
            value={handoffData.assignTo || ""}
            onValueChange={(value: string) =>
              setHandoffData(
                (prev: HandoffData): HandoffData => ({
                  ...prev,
                  assignTo: value,
                })
              )
            }
          >
            <div className="grid gap-3">
              {filteredAgents.map((agent: unknown) => (
                <div
                  key={agent.id}
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-ds-lg border spacing-3 hover:bg-accent",
                    handoffData.assignTo === agent.id
                      ? "border-primary bg-primary/5"
                      : "border-[var(--fl-color-border)]"
                  )}
                  onClick={() =>
                    setHandoffData(
                      (prev: HandoffData): HandoffData => ({
                        ...prev,
                        assignTo: agent.id,
                      })
                    )
                  }
                >
                  <RadioGroupItem value={agent.id} id={agent.id} />
                  <div className="flex-1">
                    <Label htmlFor={agent.id} className="cursor-pointer">
                      <div className="flex items-center gap-ds-2">
                        <span className="font-medium">{agent.name}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG].color)}
                        >
                          {STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG].label}
                        </Badge>
                      </div>
                      {agent.specialties && (
                        <div className="mt-1 flex gap-1">
                          {agent.specialties.map((specialty: string) => (
                            <Badge key={specialty} variant="secondary" className="text-tiny">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground">{agent.activeChats || 0} active chats</div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
    );
  };

  const renderAIPersonaSelection = () => {
    if (!config.enablePersonaSelection || handoffData.toType !== "ai") return null;

    const personas = ["friendly", "professional", "supportive", "technical"];

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Select AI Persona</Label>
          <p className="mt-1 text-sm text-muted-foreground">Choose the AI personality for this handoff</p>
        </div>
        <Select
          {...(handoffData.aiPersona && { value: handoffData.aiPersona })}
          onValueChange={(value: string) =>
            setHandoffData(
              (prev: HandoffData): HandoffData => ({
                ...prev,
                aiPersona: value,
              })
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a persona" />
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona: unknown) => (
              <SelectItem key={persona} value={persona}>
                <div className="flex items-center gap-ds-2">
                  <Icon icon={Bot} className="h-4 w-4" />
                  <span className="capitalize">{persona}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderFinalStep = () => {
    return (
      <div className="space-y-3">
        <div className="text-semantic-success-dark mb-4 flex items-center gap-ds-2">
          <Icon icon={CheckCircle} className="h-5 w-5" />
          <span className="font-medium">Ready to complete handoff</span>
        </div>
        <div className="space-y-spacing-sm rounded-ds-lg bg-muted/50 spacing-3">
          <p className="text-sm">
            <strong>Type:</strong> {handoffData.type}
          </p>
          {handoffData.reason && (
            <p className="text-sm">
              <strong>Reason:</strong> {handoffData.reason.label}
            </p>
          )}
          <p className="text-sm">
            <strong>Priority:</strong>{" "}
            <span className={URGENCY_CONFIG[handoffData.urgency].color}>
              {URGENCY_CONFIG[handoffData.urgency].label}
            </span>
          </p>
          {handoffData.assignTo && (
            <p className="text-sm">
              <strong>Assigned to:</strong> {filteredAgents.find((a) => a.id === handoffData.assignTo)?.name}
            </p>
          )}
          {handoffData.customNote && (
            <p className="text-sm">
              <strong>Notes:</strong> {handoffData.customNote}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (uiMode === "single-page") {
    return (
      <div className="space-y-6">
        {renderReasonSelection()}
        {renderAgentSelection()}
        {renderAIPersonaSelection()}
      </div>
    );
  }

  // Wizard mode
  switch (currentStep) {
    case 1:
      return renderReasonSelection();
    case 2:
      return handoffData.toType === "agent" ? renderAgentSelection() : renderAIPersonaSelection();
    case 3:
      return renderFinalStep();
    default:
      return null;
  }
}
