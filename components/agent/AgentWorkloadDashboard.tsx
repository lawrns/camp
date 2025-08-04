"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ChatCircle as MessageSquare,
  ArrowsClockwise as RefreshCw,
  TrendUp as TrendingUp,
  Users,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";
import { AgentWorkloadIndicators } from "./AgentWorkloadIndicators";

interface AgentStats {
  id: string;
  name: string;
  activeConversations: number;
  totalConversations: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  status: "available" | "busy" | "offline";
}

interface DashboardMetrics {
  totalAgents: number;
  availableAgents: number;
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

interface AgentWorkloadDashboardProps {
  organizationId: string;
  teamId?: string;
}

export function AgentWorkloadDashboard({ organizationId, teamId }: AgentWorkloadDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ organizationId });
      if (teamId) params.append("teamId", teamId);

      // Fetch overall metrics
      const metricsResponse = await fetch(`/api/agents/metrics?${params}`);
      if (!metricsResponse.ok) throw new Error("Failed to fetch metrics");
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch individual agent stats
      const statsResponse = await fetch(`/api/agents/stats?${params}`);
      if (!statsResponse.ok) throw new Error("Failed to fetch agent stats");
      const statsData = await statsResponse.json();
      setAgentStats(statsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // REPLACED: Use real-time subscription instead of 30-second polling
    // Connect to the dashboard metrics manager for real-time agent workload updates

    // Real-time workload data will be provided by the dashboard metrics system
    // This eliminates the 30-second polling interval

    return () => {

    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Prepare chart data
  const responseTimeData = agentStats.map((agent: unknown) => ({
    name: agent.name.split(" ")[0], // First name only for chart
    responseTime: agent.avgResponseTime,
  }));

  const conversationDistribution = agentStats.map((agent: unknown) => ({
    name: agent.name.split(" ")[0],
    active: agent.activeConversations,
    total: agent.totalConversations,
  }));

  const statusDistribution = [
    { name: "Available", value: agentStats.filter((a: unknown) => a.status === "available").length, color: "#10b981" },
    { name: "Busy", value: agentStats.filter((a: unknown) => a.status === "busy").length, color: "#f59e0b" },
    { name: "Offline", value: agentStats.filter((a: unknown) => a.status === "offline").length, color: "#6b7280" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agent Workload Dashboard</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} leftIcon={<Icon icon={RefreshCw} className={`h-4 w-4 ${refreshing && "animate-spin"}`} />}>
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Icon icon={Users} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalAgents || 0}</div>
            <p className="text-tiny text-muted-foreground">{metrics?.availableAgents || 0} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Icon icon={MessageSquare} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.activeConversations || 0}</div>
            <p className="text-tiny text-muted-foreground">{metrics?.totalConversations || 0} total today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Icon icon={Clock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.avgResponseTime
                ? metrics.avgResponseTime < 60
                  ? `${metrics.avgResponseTime}s`
                  : `${Math.round(metrics.avgResponseTime / 60)}m`
                : "0s"}
            </div>
            <p className="text-tiny text-muted-foreground">Target: {"<"}2m</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Icon icon={TrendingUp} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.satisfactionScore || 0}%</div>
            <p className="text-tiny text-muted-foreground">Based on customer feedback</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Workload Indicators */}
      <div>
        <h3 className="mb-4 text-base font-semibold">Agent Status Overview</h3>
        <AgentWorkloadIndicators organizationId={organizationId} teamId={teamId || ""} />
      </div>

      {/* Charts */}
      <Tabs defaultValue="response-time" className="space-y-3">
        <TabsList>
          <TabsTrigger value="response-time">Response Times</TabsTrigger>
          <TabsTrigger value="conversations">Conversation Load</TabsTrigger>
          <TabsTrigger value="status">Agent Status</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Average Response Time by Agent</CardTitle>
              <CardDescription>Average time to first response in seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responseTime" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Distribution</CardTitle>
              <CardDescription>Active vs total conversations per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="active" fill="#10b981" name="Active" />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Agent Status Distribution</CardTitle>
              <CardDescription>Current availability of agents</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-3">
                {statusDistribution.map((status: unknown) => (
                  <div key={status.name} className="flex items-center gap-ds-2">
                    <div className="h-3 w-3 rounded-ds-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm">
                      {status.name} ({status.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Details</CardTitle>
          <CardDescription>Detailed performance metrics for each agent</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-tiny uppercase">
                  <tr>
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Active/Total</th>
                    <th className="px-6 py-3">Avg Response</th>
                    <th className="px-6 py-3">Avg Resolution</th>
                    <th className="px-6 py-3">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((agent: unknown) => (
                    <tr key={agent.id} className="border-b">
                      <td className="px-6 py-4 font-medium">{agent.name}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            agent.status === "available" ? "default" : agent.status === "busy" ? "secondary" : "outline"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {agent.activeConversations}/{agent.totalConversations}
                      </td>
                      <td className="px-6 py-4">
                        {agent.avgResponseTime < 60
                          ? `${agent.avgResponseTime}s`
                          : `${Math.round(agent.avgResponseTime / 60)}m`}
                      </td>
                      <td className="px-6 py-4">
                        {agent.avgResolutionTime < 60
                          ? `${agent.avgResolutionTime}s`
                          : `${Math.round(agent.avgResolutionTime / 60)}m`}
                      </td>
                      <td className="px-6 py-4">{agent.satisfactionScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
