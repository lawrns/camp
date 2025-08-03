"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Loader2, UserPlus } from "lucide-react";
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

interface AssignmentButtonProps {
  conversationId: string;
  currentAgentId?: string | null;
  organizationId: string;
  onAssigned?: (agentId: string) => void;
  className?: string;
}

export function AssignmentButton({
  conversationId,
  currentAgentId,
  organizationId,
  onAssigned,
  className,
}: AssignmentButtonProps) {
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
      onAssigned?.(agentId);
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
          assigneeId: "auto",
          organizationId,
          autoAssign: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to auto-assign");
      }

      const data = await response.json();

      toast.success("Auto-assigned based on workload");
      setIsOpen(false);
      onAssigned?.(data.assigneeId);
    } catch (error) {
      toast.error("Failed to auto-assign");
    } finally {
      setIsAssigning(false);
    }
  };

  // Get workload indicator color
  const getWorkloadColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "near-capacity":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-status-info-light text-status-info-dark hover:bg-status-info-light", className)}
          aria-label="Assign conversation to agent"
        >
          <Icon icon={UserPlus} className="mr-1 h-4 w-4" />
          Assign
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
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
                    currentAgentId === agent.user_id && "bg-[var(--fl-color-info-subtle)]"
                  )}
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
                className="flex w-full items-center justify-center gap-ds-2 rounded-ds-md p-spacing-sm text-sm text-blue-600 transition-colors hover:bg-[var(--fl-color-info-subtle)]"
              >
                <Icon icon={Bot} className="h-4 w-4" />
                Auto-assign based on workload
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
