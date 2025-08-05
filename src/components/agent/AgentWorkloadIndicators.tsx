"use client";

import { useEffect, useState } from "react";
import { Minus, TrendDown as TrendingDown, TrendUp as TrendingUp, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { useRealtime } from "@/hooks/useRealtime";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AgentWorkload {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: "available" | "busy" | "offline";
  activeConversations: number;
  maxCapacity: number;
  utilizationPercentage: number;
  averageResponseTime: number;
  conversationTrend: "up" | "down" | "stable";
  lastUpdated: string;
}

interface AgentWorkloadIndicatorsProps {
  organizationId: string;
  teamId?: string;
  className?: string;
}

export function AgentWorkloadIndicators({ organizationId, teamId, className }: AgentWorkloadIndicatorsProps) {
  const [workloads, setWorkloads] = useState<AgentWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  // Use unified realtime for agent workload updates
  const [realtimeState] = useRealtime({
    type: "dashboard",
    organizationId,
    enableHeartbeat: true
  });

  useEffect(() => {
    const fetchWorkloads = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ organizationId });
        if (teamId) params.append("teamId", teamId);

        const response = await fetch(`/api/agents/workload?${params}`);
        if (!response.ok) throw new Error("Failed to fetch workloads");

        const data = await response.json();
        setWorkloads(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchWorkloads();
  }, [organizationId, teamId]);

  // Handle realtime workload updates
  useEffect(() => {
    // Note: This is a placeholder for future realtime workload updates
    // The unified realtime hook will be enhanced to support workload events
    // TODO: Implement proper realtime workload updates when the feature is available
  }, [realtimeState]);

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-[var(--fl-color-danger)]";
    if (percentage >= 70) return "text-[var(--fl-color-warning)]";
    return "text-[var(--fl-color-success)]";
  };

  const getStatusBadgeVariant = (status: AgentWorkload["status"]) => {
    switch (status) {
      case "available":
        return "default";
      case "busy":
        return "secondary";
      case "offline":
        return "outline";
    }
  };

  const getTrendIcon = (trend: AgentWorkload["conversationTrend"]) => {
    switch (trend) {
      case "up":
        return <Icon icon={TrendingUp} className="text-brand-mahogany-500 h-4 w-4" />;
      case "down":
        return <Icon icon={TrendingDown} className="text-semantic-success h-4 w-4" />;
      case "stable":
        return <Icon icon={Minus} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
    }
  };

  if (loading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {workloads.map((agent: unknown) => (
        <Card key={agent.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-ds-2">
                <Avatar className="h-8 w-8">
                  {agent.avatar_url ? (
                    <AvatarImage src={agent.avatar_url} alt={agent.name} />
                  ) : (
                    <AvatarFallback>
                      <Icon icon={UserCircle} className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                  <p className="text-tiny text-muted-foreground">{agent.email}</p>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(agent.status)}>{agent.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Workload Progress */}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Workload</span>
                <span className={cn("font-medium", getUtilizationColor(agent.utilizationPercentage))}>
                  {agent.activeConversations}/{agent.maxCapacity} conversations
                </span>
              </div>
              <Progress value={agent.utilizationPercentage} className="h-2" />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Avg. Response:</span>
                <span className="font-medium">
                  {agent.averageResponseTime < 60
                    ? `${agent.averageResponseTime}s`
                    : `${Math.round(agent.averageResponseTime / 60)}m`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Trend:</span>
                {getTrendIcon(agent.conversationTrend)}
              </div>
            </div>

            {/* Utilization Percentage */}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-tiny text-muted-foreground">Utilization</span>
                <span className={cn("text-lg font-bold", getUtilizationColor(agent.utilizationPercentage))}>
                  {agent.utilizationPercentage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
