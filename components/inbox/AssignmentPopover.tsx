"use client";

import { useCallback, useEffect, useState } from "react";
import { Robot as Bot, CheckCircle as Check, Spinner as Loader2, UserPlus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Button } from "@/components/ui/Button-unified";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  workload: number;
  capacity: number;
  available: boolean;
  status: "available" | "busy" | "near-capacity";
}

interface AssignmentPopoverProps {
  conversationId: string;
  currentAgentId?: string | null;
  organizationId: string;
  onAssigned?: (agentId: string) => void;
  className?: string;
  variant?: "header" | "button";
  size?: "sm" | "md";
}

export function AssignmentPopover({
  conversationId,
  currentAgentId,
  organizationId,
  onAssigned,
  className,
  variant = "header",
  size = "sm",
}: AssignmentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch available agents
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign?organizationId=${organizationId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, conversationId]);

  // Load agents when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen, fetchAgents]);

  // Handle agent assignment
  const handleAssign = async (agentId: string) => {
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: agentId,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign agent");
      }

      const data = await response.json();

      toast.success(`Assigned to ${agents.find((a) => a.user_id === agentId)?.full_name || "agent"}`);
      setIsOpen(false);
      onAssigned?.(data.assigneeId);
    } catch (error) {
      toast.error("Failed to assign agent");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle auto-assignment
  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          autoAssign: true,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to auto-assign");
      }

      const data = await response.json();
      toast.success("Auto-assigned to best available agent");
      setIsOpen(false);
      onAssigned?.(data.assigneeId);
    } catch (error) {
      toast.error("Failed to auto-assign");
    } finally {
      setIsAssigning(false);
    }
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "near-capacity":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Header variant - just the icon button
  if (variant === "header") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "touch-target text-neutral-600 transition-all hover:text-neutral-900",
            "hover:bg-neutral-100",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className
          )}
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label="Assign conversation to agent"
        >
          <Icon icon={UserPlus} className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0 md:w-96"
        >
          <div className="border-b spacing-3">
            <h4 className="text-sm font-medium">Assign to Agent</h4>
            <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
              Select an agent or auto-assign based on workload
            </p>
          </div>

          {isLoading ? (
            <div className="p-spacing-lg text-center">
              <Icon icon={Loader2} className="mx-auto h-6 w-6 animate-spin text-gray-400" />
              <p className="mt-2 text-sm text-[var(--fl-color-text-muted)]">Loading agents...</p>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {agents.map((agent: any) => (
                  <button
                    key={agent.user_id}
                    onClick={() => handleAssign(agent.user_id)}
                    disabled={isAssigning || !agent.available}
                    className={cn(
                      "flex w-full items-center justify-between spacing-3 transition-colors hover:bg-neutral-50",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "touch-target", // Mobile-friendly touch target
                      currentAgentId === agent.user_id && "bg-[var(--fl-color-info-subtle)]"
                    )}
                    style={{ minHeight: 60 }} // Ensure touch-friendly height
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {agent.avatar_url && <AvatarImage src={agent.avatar_url} />}
                        <AvatarFallback>{agent.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{agent.full_name}</p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">
                          {agent.workload}/{agent.capacity} conversations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-ds-2">
                      {currentAgentId === agent.user_id && <Icon icon={Check} className="h-4 w-4 text-blue-600" />}
                      <div
                        className={cn("h-2 w-2 rounded-ds-full", getWorkloadColor(agent.status))}
                        aria-label={`Status: ${agent.status}`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t spacing-3">
                <button
                  onClick={handleAutoAssign}
                  disabled={isAssigning}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 spacing-3",
                    "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "touch-target"
                  )}
                  style={{ minHeight: 48 }}
                >
                  <Icon icon={Bot} className="h-4 w-4" />
                  <span className="text-sm font-medium">Auto-assign to best agent</span>
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  // Button variant - full button with text
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          "touch-target",
          size === "sm" ? "h-8 px-3" : "h-10 px-4",
          className
        )}
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <Icon icon={UserPlus} className="mr-2 h-4 w-4" />
        Assign Agent
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 md:w-96"
      >
        <div className="border-b spacing-3">
          <h4 className="text-sm font-medium">Assign to Agent</h4>
          <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
            Select an agent or auto-assign based on workload
          </p>
        </div>

        {isLoading ? (
          <div className="p-spacing-lg text-center">
            <Icon icon={Loader2} className="mx-auto h-6 w-6 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-[var(--fl-color-text-muted)]">Loading agents...</p>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {agents.map((agent: any) => (
                <button
                  key={agent.user_id}
                  onClick={() => handleAssign(agent.user_id)}
                  disabled={isAssigning || !agent.available}
                  className={cn(
                    "flex w-full items-center justify-between spacing-3 transition-colors hover:bg-neutral-50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "touch-target",
                    currentAgentId === agent.user_id && "bg-[var(--fl-color-info-subtle)]"
                  )}
                  style={{ minHeight: 60 }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {agent.avatar_url && <AvatarImage src={agent.avatar_url} />}
                      <AvatarFallback>{agent.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{agent.full_name}</p>
                      <p className="text-tiny text-[var(--fl-color-text-muted)]">
                        {agent.workload}/{agent.capacity} conversations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-ds-2">
                    {currentAgentId === agent.user_id && <Icon icon={Check} className="h-4 w-4 text-blue-600" />}
                    <div
                      className={cn("h-2 w-2 rounded-ds-full", getWorkloadColor(agent.status))}
                      aria-label={`Status: ${agent.status}`}
                    />
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t spacing-3">
              <button
                onClick={handleAutoAssign}
                disabled={isAssigning}
                className={cn(
                  "flex w-full items-center justify-center gap-2 spacing-3",
                  "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "touch-target"
                )}
                style={{ minHeight: 48 }}
              >
                <Icon icon={Bot} className="h-4 w-4" />
                <span className="text-sm font-medium">Auto-assign to best agent</span>
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
} 