"use client";

import { Button } from "@/components/ui/Button-unified";
import { Avatar } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
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

    if (organizationId) {
      fetchAgents();
    }
  }, [organizationId]);

  // Fetch assignment history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
          headers: {
            "X-Organization-ID": organizationId,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setAssignmentHistory(data.history || []);
      } catch (error) { }
    };

    fetchHistory();
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
        body: JSON.stringify({
          assignee_type: "human",
          agentId: "me", // Special value to assign to current user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign to yourself");
      }

      toast({
        title: "Success",
        description: "Conversation assigned to you successfully",
      });

      onAssignmentChange?.("me");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to assign to yourself",
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
        description: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to assign agent",
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

    if (percentage >= 90) return { color: "text-[var(--fl-color-danger)]", label: "High" };
    if (percentage >= 60) return { color: "text-[var(--fl-color-warning)]", label: "Medium" };
    return { color: "text-[var(--fl-color-success)]", label: "Low" };
  };

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "available":
        return <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />;
      case "busy":
        return <Icon icon={Clock} className="text-semantic-warning h-4 w-4" />;
      case "offline":
        return <Icon icon={AlertCircle} className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assign Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Assign to Me Button */}
        <div className="space-y-spacing-sm">
          <Button
            onClick={handleAssignToMe}
            disabled={assigning}
            className="bg-primary w-full text-white hover:bg-blue-700"
            size="sm"
          >
            <Icon icon={UserPlus} className="mr-2 h-4 w-4" />
            {assigning ? "Assigning..." : "Assign to Me"}
          </Button>
        </div>

        {/* Agent Selection - Only show if agents loaded successfully */}
        {!agentsError && agents.length > 0 && (
          <div className="space-y-spacing-sm">
            <div className="text-foreground text-center text-sm">or</div>
            <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select another agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: any) => {
                  const workload = getWorkloadIndicator(agent);
                  return (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-ds-2">
                        <Avatar className="h-6 w-6">
                          {agent.avatar_url ? (
                            <img src={agent.avatar_url} alt={agent.name} />
                          ) : (
                            <Icon icon={UserCircle} className="h-6 w-6" />
                          )}
                        </Avatar>
                        <span>{agent.name}</span>
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
              className="w-full"
              variant="outline"
            >
              {assigning ? "Assigning..." : "Assign Selected Agent"}
            </Button>
          </div>
        )}

        {/* Show error message if agents failed to load */}
        {agentsError && (
          <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3 text-center text-sm text-[var(--fl-color-text-muted)]">
            <div className="mb-2 flex items-center justify-center gap-ds-2">
              <Icon icon={UserCircle} className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Single Agent Mode</span>
            </div>
            <p className="text-status-info-dark">
              Team member data is not available. You can assign conversations to yourself using the button above.
            </p>
          </div>
        )}

        {/* Current Agent Info */}
        {currentAgentId && (
          <div className="rounded-ds-lg border bg-muted/50 spacing-3">
            <p className="mb-1 text-sm font-medium">Currently Assigned</p>
            {agents.find((a) => a.id === currentAgentId) ? (
              <div className="flex items-center gap-ds-2">
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
                  <p className="font-medium">{agents.find((a) => a.id === currentAgentId)?.name}</p>
                  <p className="text-tiny text-muted-foreground">
                    {agents.find((a) => a.id === currentAgentId)?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-ds-2">
                <Avatar className="h-8 w-8">
                  <Icon icon={UserCircle} className="h-8 w-8" />
                </Avatar>
                <div>
                  <p className="font-medium">Assigned Agent</p>
                  <p className="text-tiny text-muted-foreground">ID: {currentAgentId}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignment History */}
        {assignmentHistory.length > 0 && (
          <div className="space-y-spacing-sm">
            <h4 className="text-sm font-medium">Assignment History</h4>
            <ScrollArea className="h-32 rounded-ds-lg border">
              <div className="space-y-spacing-sm p-spacing-sm">
                {assignmentHistory.map((history: any) => (
                  <div key={history.id} className="space-y-1 rounded p-spacing-sm text-tiny hover:bg-muted">
                    <div className="flex justify-between">
                      <span className="font-medium">{history.agentName}</span>
                      <span className="text-muted-foreground">{new Date(history.assignedAt).toLocaleDateString()}</span>
                    </div>
                    {history.reason && <p className="text-muted-foreground">{history.reason}</p>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
