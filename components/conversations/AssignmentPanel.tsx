"use client";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Warning as AlertCircle, CheckCircle, Clock, UserCircle, UserPlus } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface Agent {
  id: string;
  name: string;
  email: string;
  status: "available" | "busy" | "offline";
  avatar_url?: string;
  activeConversations?: number;
  maxCapacity?: number;
  lastAssignedAt?: string;
  metadata?: {
    specialties?: string[];
    languages?: string[];
  };
}

interface AssignmentHistory {
  id: string;
  agentId: string;
  agentName: string;
  assignedAt: string;
  unassignedAt?: string;
  reason?: string;
}

interface AssignmentPanelProps {
  conversationId: string;
  currentAgentId?: string | undefined;
  organizationId: string;
  onAssignmentChange?: ((agentId: string) => void) | undefined;
}

export function AssignmentPanel({
  conversationId,
  currentAgentId,
  organizationId,
  onAssignmentChange,
}: AssignmentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId || "");
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [agentsError, setAgentsError] = useState(false);
  const { toast } = useToast();

  // Fetch agents and their workload
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setAgentsError(false);

        const response = await fetch("/api/agents/availability", {
          method: "GET",
          credentials: "include", // Include cookies for authentication
          headers: {
            "Content-Type": "application/json",
            "X-Organization-ID": organizationId,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.status}`);
        }

        const data = await response.json();

        // Ensure data is an array
        const agentsArray = Array.isArray(data) ? data : [];

        setAgents(agentsArray);
      } catch (error) {
        setAgentsError(true);

        // Set empty array but component will show helpful fallback UI
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [organizationId]);

  // Fetch assignment history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/assignment-history`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Organization-ID": organizationId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAssignmentHistory(data.history || []);
        }
      } catch (error) {
        // Silently fail - assignment history is not critical
        console.warn("Failed to fetch assignment history:", error);
      }
    };

    if (conversationId) {
      fetchHistory();
    }
  }, [conversationId, organizationId]);

  const handleAssignToMe = async () => {
    try {
      setAssigning(true);
      const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({ assignee_type: "human", agentId: "me" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign to yourself");
      }

      toast({
        title: "Success",
        description: "Conversation assigned to you",
      });

      onAssignmentChange?.("me");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign to yourself",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignment = async () => {
    if (!selectedAgentId) return;

    // Handle "Assign to Me" specially
    if (selectedAgentId === "me") {
      return handleAssignToMe();
    }

    try {
      setAssigning(true);
      const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({ assignee_type: "human", agentId: selectedAgentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign agent");
      }

      toast({
        title: "Success",
        description: "Agent assigned successfully",
      });

      onAssignmentChange?.(selectedAgentId);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign agent",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const getWorkloadIndicator = (agent: Agent) => {
    const workload = agent.activeConversations || 0;
    const capacity = agent.maxCapacity || 10;
    const percentage = (workload / capacity) * 100;

    if (percentage >= 90) return { color: "text-red-600", label: "High" };
    if (percentage >= 60) return { color: "text-orange-600", label: "Medium" };
    return { color: "text-green-600", label: "Low" };
  };

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "available":
        return <Icon icon={CheckCircle} className="text-green-600 h-4 w-4" />;
      case "busy":
        return <Icon icon={Clock} className="text-orange-600 h-4 w-4" />;
      case "offline":
        return <Icon icon={AlertCircle} className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="ds-modal w-80">
        <div className="space-y-3 ds-modal-body">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="ds-modal w-80">
      <div className="space-y-4 ds-modal-body">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-lg font-semibold text-gray-900">Assign Agent</h3>
          <p className="text-sm text-gray-500 mt-1">Choose who should handle this conversation</p>
        </div>

        {/* Quick Assign to Me Button */}
        <div className="space-y-3">
          <Button
            onClick={handleAssignToMe}
            disabled={assigning}
            className="w-full ds-button-primary"
            size="sm"
          >
            <Icon icon={UserPlus} className="mr-2 h-4 w-4" />
            {assigning ? "Assigning..." : "Assign to Me"}
          </Button>
        </div>

        {/* Agent Selection - Only show if agents loaded successfully */}
        {!agentsError && agents.length > 0 && (
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-500">or</div>
            <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select another agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: unknown) => {
                  const workload = getWorkloadIndicator(agent);
                  return (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {agent.avatar_url ? (
                            <img src={agent.avatar_url} alt={agent.name} />
                          ) : (
                            <Icon icon={UserCircle} className="h-6 w-6" />
                          )}
                        </Avatar>
                        <span className="flex-1">{agent.name}</span>
                        {getStatusIcon(agent.status)}
                        <Badge variant="outline" className={cn("ml-auto", workload.color)}>
                          {agent.activeConversations || 0}/{agent.maxCapacity || 10}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignment}
              disabled={!selectedAgentId || assigning || selectedAgentId === "me"}
              className="w-full ds-button-secondary"
              variant="outline"
            >
              {assigning ? "Assigning..." : "Assign Selected Agent"}
            </Button>
          </div>
        )}

        {/* Show error message if agents failed to load */}
        {agentsError && (
          <div className="ds-warning-message text-center text-sm">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Icon icon={UserCircle} className="h-4 w-4" />
              <span className="font-medium">Single Agent Mode</span>
            </div>
            <p>
              Team member data is not available. You can assign conversations to yourself using the button above.
            </p>
          </div>
        )}

        {/* Current Agent Info */}
        {currentAgentId && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 ds-modal-body">
            <p className="mb-2 text-sm font-medium text-gray-900">Currently Assigned</p>
            {agents.find((a) => a.id === currentAgentId) ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {agents.find((a) => a.id === currentAgentId)?.avatar_url ? (
                    <img
                      src={agents.find((a) => a.id === currentAgentId)?.avatar_url}
                      alt={agents.find((a) => a.id === currentAgentId)?.name}
                    />
                  ) : (
                    <Icon icon={UserCircle} className="h-8 w-8" />
                  )}
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{agents.find((a) => a.id === currentAgentId)?.name}</p>
                  <p className="text-xs text-gray-500">
                    {agents.find((a) => a.id === currentAgentId)?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <Icon icon={UserCircle} className="h-8 w-8" />
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">Assigned Agent</p>
                  <p className="text-xs text-gray-500">ID: {currentAgentId}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignment History */}
        {assignmentHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Assignment History</h4>
            <ScrollArea className="h-32 rounded-lg border border-gray-200">
              <div className="space-y-2 p-3">
                {assignmentHistory.map((history: unknown) => (
                  <div key={history.id} className="space-y-1 rounded p-2 text-xs hover:bg-gray-100">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{history.agentName}</span>
                      <span className="text-gray-500">{new Date(history.assignedAt).toLocaleDateString()}</span>
                    </div>
                    {history.reason && <p className="text-gray-500">{history.reason}</p>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
