"use client";

import React, { useCallback, useState } from "react";
import { Robot as Bot, CheckCircle as Check, UserPlus, Users } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  workload: number; // 0-100 percentage
  activeChats: number;
  status: "online" | "away" | "busy" | "offline";
  skills?: string[];
}

interface WorkloadIndicatorProps {
  load: number;
  className?: string;
}

function WorkloadIndicator({ load, className }: WorkloadIndicatorProps) {
  const getLoadColor = (load: number) => {
    if (load < 30) return "bg-green-500";
    if (load < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLoadLabel = (load: number) => {
    if (load < 30) return "Light";
    if (load < 70) return "Moderate";
    return "Heavy";
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="h-2 w-2 rounded-ds-full" style={{ backgroundColor: getLoadColor(load) }} />
      <span className="text-tiny text-[var(--fl-color-text-muted)]">{getLoadLabel(load)}</span>
    </div>
  );
}

interface ConversationAssignmentPanelProps {
  conversationId?: string;
  currentAssigneeId?: string;
  agents: Agent[];
  onAssign: (agentId: string) => Promise<void>;
  onAutoAssign: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Conversation Assignment Panel Component
 * Implements the inline assignment feature from the inbox improvement proposal
 */
export function ConversationAssignmentPanel({
  conversationId,
  currentAssigneeId,
  agents,
  onAssign,
  onAutoAssign,
  isLoading = false,
  className,
}: ConversationAssignmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  const handleAssign = useCallback(
    async (agentId: string) => {
      if (assigningTo || isLoading) return;

      setAssigningTo(agentId);
      try {
        await onAssign(agentId);
        setIsOpen(false);
      } catch (error) {
      } finally {
        setAssigningTo(null);
      }
    },
    [onAssign, assigningTo, isLoading]
  );

  const handleAutoAssign = useCallback(async () => {
    if (assigningTo || isLoading) return;

    setAssigningTo("auto");
    try {
      await onAutoAssign();
      setIsOpen(false);
    } catch (error) {
    } finally {
      setAssigningTo(null);
    }
  }, [onAutoAssign, assigningTo, isLoading]);

  const currentAssignee = agents.find((agent) => agent.id === currentAssigneeId);
  const availableAgents = agents.filter((agent: any) => agent.status !== "offline");
  const sortedAgents = availableAgents.sort((a, b) => a.workload - b.workload);

  if (!conversationId) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Icon icon={UserPlus} className="h-4 w-4" />
        <span className="sr-only">No conversation selected</span>
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="ghost"
          size="sm"
          aria-label={currentAssignee ? `Reassign from ${currentAssignee.name}` : "Assign conversation"}
          className={cn("flex items-center gap-2", className)}
        >
          {currentAssignee ? (
            <>
              <Avatar className="h-5 w-5">
                {currentAssignee.avatar && <AvatarImage src={currentAssignee.avatar} alt={currentAssignee.name} />}
                <AvatarFallback className="text-tiny">
                  {currentAssignee.name
                    .split(" ")
                    .map((n: any) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{currentAssignee.name}</span>
            </>
          ) : (
            <>
              <Icon icon={UserPlus} className="h-4 w-4" />
              <span className="text-sm">Assign</span>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="spacing-3">
          <div className="mb-3 flex items-center gap-ds-2">
            <Icon icon={Users} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
            <h4 className="text-sm font-medium">Assign to Agent</h4>
          </div>

          {/* Current Assignment */}
          {currentAssignee && (
            <>
              <div className="mb-3">
                <p className="mb-2 text-tiny text-[var(--fl-color-text-muted)]">Currently assigned to:</p>
                <div className="flex items-center gap-ds-2 rounded-ds-md bg-[var(--fl-color-info-subtle)] p-spacing-sm">
                  <Avatar className="h-6 w-6">
                    {currentAssignee.avatar && <AvatarImage src={currentAssignee.avatar} alt={currentAssignee.name} />}
                    <AvatarFallback className="text-tiny">
                      {currentAssignee.name
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{currentAssignee.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {currentAssignee.activeChats} chats
                  </Badge>
                </div>
              </div>
              <Separator className="mb-3" />
            </>
          )}

          {/* Agent List */}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {sortedAgents.map((agent: any) => {
              const isCurrentAssignee = agent.id === currentAssigneeId;
              const isAssigning = assigningTo === agent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => handleAssign(agent.id)}
                  disabled={isCurrentAssignee || isAssigning || isLoading}
                  className={cn(
                    "flex w-full items-center justify-between rounded-ds-md spacing-2 transition-colors",
                    "hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isCurrentAssignee && "bg-status-info-light cursor-default",
                    (isAssigning || isLoading) && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex items-center gap-ds-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="text-tiny">
                        {agent.name
                          .split(" ")
                          .map((n: any) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="flex items-center gap-ds-2">
                        <span className="text-sm font-medium">{agent.name}</span>
                        {isCurrentAssignee && <Icon icon={Check} className="h-3 w-3 text-blue-600" />}
                      </div>
                      <div className="flex items-center gap-ds-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-ds-full",
                            agent.status === "online" && "bg-semantic-success",
                            agent.status === "away" && "bg-semantic-warning",
                            agent.status === "busy" && "bg-brand-mahogany-500",
                            agent.status === "offline" && "bg-neutral-400"
                          )}
                        />
                        <span className="text-tiny capitalize text-[var(--fl-color-text-muted)]">{agent.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-ds-2 text-tiny">
                    <WorkloadIndicator load={agent.workload} />
                    <span className="text-[var(--fl-color-text-muted)]">{agent.activeChats} chats</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Auto-assign Option */}
          <Separator className="my-3" />
          <button
            onClick={handleAutoAssign}
            disabled={assigningTo === "auto" || isLoading}
            className={cn(
              "text-typography-sm hover:bg-status-info-light flex w-full items-center gap-2 rounded-ds-md spacing-2 text-blue-600 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              (assigningTo === "auto" || isLoading) && "cursor-not-allowed opacity-50"
            )}
          >
            <Icon icon={Bot} className="h-4 w-4" />
            <span>Auto-assign based on workload</span>
            {assigningTo === "auto" && (
              <div className="ml-auto">
                <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
              </div>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Hook for managing agent data and assignment operations
 */
export function useConversationAssignment(organizationId: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents?organizationId=${organizationId}`);
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (error) {}
  }, [organizationId]);

  const assignConversation = useCallback(async (conversationId: string, agentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: agentId }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Assignment failed");
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autoAssignConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: "auto", autoAssign: true }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Auto-assignment failed");
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    agents,
    isLoading,
    loadAgents,
    assignConversation,
    autoAssignConversation,
  };
}
