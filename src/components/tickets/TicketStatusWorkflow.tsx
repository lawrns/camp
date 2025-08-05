"use client";

import React, { useState } from "react";
import { Warning as AlertTriangle, ArrowRight, CheckCircle, Clock, User, XCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
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

interface TicketStatusWorkflowProps {
  ticketId: string;
  currentStatus: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  onStatusChange: (status: string, comment?: string) => void;
  onAssignmentChange: (agentId: string) => void;
  availableAgents: Array<{ id: string; name: string; email: string; available: boolean }>;
  className?: string;
}

const statusConfig = {
  open: {
    label: "Open",
    color: "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]",
    icon: Clock,
    description: "Ticket is open and awaiting assignment",
    nextStates: ["in_progress", "closed"],
  },
  in_progress: {
    label: "In Progress",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    description: "Ticket is being actively worked on",
    nextStates: ["waiting", "resolved", "closed"],
  },
  waiting: {
    label: "Waiting",
    color: "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]",
    icon: Clock,
    description: "Waiting for customer response or external dependency",
    nextStates: ["in_progress", "resolved", "closed"],
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]",
    icon: CheckCircle,
    description: "Issue has been resolved, awaiting confirmation",
    nextStates: ["closed", "in_progress"],
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]",
    icon: XCircle,
    description: "Ticket is closed and complete",
    nextStates: ["in_progress"], // Can reopen if needed
  },
};

const priorityConfig = {
  low: { color: "bg-gray-100 text-gray-800", slaHours: 48 },
  medium: { color: "bg-blue-100 text-blue-800", slaHours: 24 },
  high: { color: "bg-orange-100 text-orange-800", slaHours: 8 },
  critical: { color: "bg-red-100 text-red-800", slaHours: 4 },
};

export function TicketStatusWorkflow({
  ticketId,
  currentStatus,
  priority,
  assignedTo,
  onStatusChange,
  onAssignmentChange,
  availableAgents,
  className,
}: TicketStatusWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(assignedTo || "");

  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;
  const nextStates = currentConfig.nextStates;

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      await onStatusChange(selectedStatus, comment);
      setComment("");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (selectedAgent === assignedTo) return;

    setIsUpdating(true);
    try {
      await onAssignmentChange(selectedAgent);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusWorkflowSteps = () => {
    const allStates = ["open", "in_progress", "waiting", "resolved", "closed"];
    const currentIndex = allStates.indexOf(currentStatus);

    return allStates.map((state, index) => ({
      state,
      config: statusConfig[state as keyof typeof statusConfig],
      isActive: state === currentStatus,
      isCompleted: index < currentIndex,
      isNext: nextStates.includes(state),
    }));
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
          <CurrentIcon className="h-4 w-4" />
          Ticket Status & Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={cn("text-typography-xs border px-3 py-1", currentConfig.color)}>
              <CurrentIcon className="mr-1 h-3 w-3" />
              {currentConfig.label}
            </Badge>
            <Badge className={cn("text-typography-xs px-2 py-1", priorityConfig[priority].color)}>
              {priority.toUpperCase()}
            </Badge>
          </div>
          <div className="text-tiny text-[var(--fl-color-text-muted)]">SLA: {priorityConfig[priority].slaHours}h</div>
        </div>

        {/* Status Description */}
        <div className="text-foreground rounded-ds-md bg-[var(--fl-color-background-subtle)] spacing-3 text-sm">
          {currentConfig.description}
        </div>

        {/* Workflow Steps */}
        <div className="space-y-spacing-sm">
          <label className="text-sm font-medium">Workflow Progress</label>
          <div className="flex items-center gap-ds-2 overflow-x-auto pb-2">
            {getStatusWorkflowSteps().map((step, index) => {
              const StepIcon = step.config.icon;
              return (
                <div key={step.state} className="flex flex-shrink-0 items-center gap-ds-2">
                  <div
                    className={cn(
                      "text-typography-xs flex items-center gap-2 rounded-ds-md border px-3 py-2",
                      step.isActive
                        ? step.config.color
                        : step.isCompleted
                          ? "bg-status-success-light text-status-success-dark border-status-success-light"
                          : step.isNext
                            ? "bg-status-info-light text-status-info-dark border-status-info-light"
                            : "border-[var(--fl-color-border)] bg-neutral-50 text-neutral-500"
                    )}
                  >
                    <StepIcon className="h-3 w-3" />
                    {step.config.label}
                  </div>
                  {index < getStatusWorkflowSteps().length - 1 && (
                    <Icon icon={ArrowRight} className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignment Section */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={User} className="h-4 w-4" />
              Assignment
            </label>
            {assignedTo && (
              <Badge variant="outline" className="text-tiny">
                Assigned
              </Badge>
            )}
          </div>

          <div className="flex gap-ds-2">
            <Select value={selectedAgent} onValueChange={(value: string) => setSelectedAgent(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {availableAgents.map((agent: unknown) => (
                  <SelectItem key={agent.id} value={agent.id} disabled={!agent.available}>
                    <div className="flex items-center gap-ds-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-ds-full",
                          agent.available ? "bg-semantic-success" : "bg-neutral-400"
                        )}
                      />
                      {agent.name}
                      {!agent.available && (
                        <span className="text-tiny text-[var(--fl-color-text-muted)]">(Unavailable)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAgent !== assignedTo && (
              <Button onClick={handleAssignmentUpdate} disabled={isUpdating} size="sm">
                {isUpdating ? "Updating..." : "Assign"}
              </Button>
            )}
          </div>
        </div>

        {/* Status Change Section */}
        <div className="space-y-3 border-t pt-3">
          <label className="text-sm font-medium">Change Status</label>

          <div className="space-y-3">
            <Select
              value={selectedStatus}
              onValueChange={(value: string) =>
                setSelectedStatus(value as "open" | "closed" | "resolved" | "in_progress" | "waiting")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentStatus}>
                  <div className="flex items-center gap-ds-2">
                    <CurrentIcon className="h-4 w-4" />
                    {currentConfig.label} (Current)
                  </div>
                </SelectItem>
                {nextStates.map((state: unknown) => {
                  const config = statusConfig[state as keyof typeof statusConfig];
                  const StateIcon = config.icon;
                  return (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center gap-ds-2">
                        <StateIcon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedStatus !== currentStatus && (
              <div className="space-y-spacing-sm">
                <Textarea
                  placeholder="Add a comment about this status change..."
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                  rows={3}
                />

                <div className="flex gap-ds-2">
                  <Button onClick={handleStatusUpdate} disabled={isUpdating} className="flex-1">
                    {isUpdating
                      ? "Updating..."
                      : `Update to ${statusConfig[selectedStatus as keyof typeof statusConfig].label}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStatus(currentStatus);
                      setComment("");
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps Guidance */}
        {nextStates.length > 0 && (
          <div className="rounded-ds-md bg-[var(--fl-color-info-subtle)] spacing-3 text-tiny text-[var(--fl-color-text-muted)]">
            <div className="mb-1 font-medium">Possible next steps:</div>
            <div className="space-y-1">
              {nextStates.map((state: unknown) => (
                <div key={state} className="flex items-center gap-ds-2">
                  <Icon icon={ArrowRight} className="h-3 w-3" />
                  {statusConfig[state as keyof typeof statusConfig].label}:{" "}
                  {statusConfig[state as keyof typeof statusConfig].description}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TicketStatusWorkflow;
