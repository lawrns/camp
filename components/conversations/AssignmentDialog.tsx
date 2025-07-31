"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle as Check, Spinner as Loader2, UserPlus, Robot as Bot } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Button } from "@/components/ui/Button-unified";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
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

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAgentId?: string | null;
  organizationId: string;
  onAssigned?: (agentId: string) => void;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  conversationId,
  currentAgentId,
  organizationId,
  onAssigned,
}: AssignmentDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(currentAgentId || null);

  // Load agents when dialog opens
  useEffect(() => {
    if (open && organizationId) {
      loadAgents();
    }
  }, [open, organizationId]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/availability?organizationId=${organizationId}`);
      if (!response.ok) {
        throw new Error("Failed to load agents");
      }
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast.error("Failed to load available agents");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle agent assignment
  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: selectedAgentId,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign agent");
      }

      const data = await response.json();
      const assignedAgent = agents.find((a) => a.user_id === selectedAgentId);

      toast.success(`Assigned to ${assignedAgent?.full_name || "agent"}`);
      onAssigned?.(data.assigneeId);
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign agent");
    } finally {
      setIsAssigning(false);
    }
  };

  // Auto-assign to best available agent
  const handleAutoAssign = async () => {
    const availableAgents = agents.filter(a => a.available && a.status === "available");
    if (availableAgents.length === 0) {
      toast.error("No available agents for auto-assignment");
      return;
    }

    // Find agent with lowest workload
    const bestAgent = availableAgents.reduce((best, current) =>
      (current.workload / current.capacity) < (best.workload / best.capacity) ? current : best
    );

    setSelectedAgentId(bestAgent.user_id);

    // Auto-assign immediately
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: bestAgent.user_id,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to auto-assign agent");
      }

      const data = await response.json();
      toast.success(`Auto-assigned to ${bestAgent.full_name}`);
      onAssigned?.(data.assigneeId);
      onOpenChange(false);
    } catch (error) {
      console.error("Auto-assignment error:", error);
      toast.error("Failed to auto-assign agent");
    } finally {
      setIsAssigning(false);
    }
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-400";
      case "busy":
        return "bg-yellow-400";
      case "near-capacity":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-ds-2">
            <Icon icon={UserPlus} className="h-5 w-5" />
            Assign to Agent
          </DialogTitle>
          <DialogDescription>
            Select an agent or auto-assign based on workload
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-spacing-md">
          {/* Auto-assign option */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-spacing-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-ds-2">
                <Icon icon={Bot} className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Auto-assign to best agent</p>
                  <p className="text-sm text-blue-700">Based on current workload and availability</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={isAssigning || isLoading}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Auto-assign
              </Button>
            </div>
          </div>

          {/* Agent list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-spacing-lg">
              <Icon icon={Loader2} className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-ds-2 text-sm text-gray-600">Loading agents...</span>
            </div>
          ) : (
            <div className="space-y-spacing-sm max-h-64 overflow-y-auto">
              {agents.map((agent) => (
                <div
                  key={agent.user_id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-spacing-sm cursor-pointer transition-colors",
                    selectedAgentId === agent.user_id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                    !agent.available && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => agent.available && setSelectedAgentId(agent.user_id)}
                >
                  <div className="flex items-center gap-ds-2">
                    <Avatar className="h-8 w-8">
                      {agent.avatar_url && <AvatarImage src={agent.avatar_url} />}
                      <AvatarFallback className="text-xs">{agent.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{agent.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {agent.workload}/{agent.capacity} conversations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-ds-2">
                    {selectedAgentId === agent.user_id && (
                      <Icon icon={Check} className="h-4 w-4 text-blue-600" />
                    )}
                    <div
                      className={cn("h-2 w-2 rounded-full", getWorkloadColor(agent.status))}
                      title={`Status: ${agent.status}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedAgentId || isAssigning || isLoading}
            loading={isAssigning}
          >
            {isAssigning ? "Assigning..." : "Assign Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
