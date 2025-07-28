"use client";

import { useEffect, useState } from "react";
import {
  Warning as AlertTriangle,
  Clock,
  ChatCircle as MessageSquare,
  Star,
  Target,
  TrendUp as TrendingUp,
  Trophy,
} from "@phosphor-icons/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface PerformanceMetric {
  date: string;
  responseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  conversationsHandled: number;
}

interface AgentPerformance {
  id: string;
  name: string;
  metrics: {
    current: {
      responseTime: number;
      resolutionRate: number;
      customerSatisfaction: number;
      conversationsHandled: number;
      firstContactResolution: number;
      escalationRate: number;
    };
    trend: PerformanceMetric[];
    goals: {
      responseTime: number;
      resolutionRate: number;
      customerSatisfaction: number;
      conversationsHandled: number;
    };
  };
  skills: {
    name: string;
    score: number;
  }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    earnedAt: string;
    icon: string;
  }[];
}

interface AgentPerformanceMetricsProps {
  agentId?: string;
  organizationId: string;
  className?: string;
}

export function AgentPerformanceMetrics({ agentId, organizationId, className }: AgentPerformanceMetricsProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(agentId || "");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents", {
          headers: { "X-Organization-ID": organizationId },
        });
        if (!response.ok) throw new Error("Failed to fetch agents");
        const data = await response.json();
        setAgents(data.map((agent: any) => ({ id: agent.id, name: agent.name })));

        // Select first agent if none selected
        if (!selectedAgentId && data.length > 0) {
          setSelectedAgentId(data[0].id);
        }
      } catch (error) {}
    };

    fetchAgents();
  }, [organizationId, selectedAgentId]);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!selectedAgentId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/agents/${selectedAgentId}/performance?range=${timeRange}`, {
          headers: { "X-Organization-ID": organizationId },
        });
        if (!response.ok) throw new Error("Failed to fetch performance data");
        const data = await response.json();
        setPerformance(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [selectedAgentId, organizationId, timeRange]);

  const getPerformanceColor = (value: number, goal: number, inverse = false) => {
    const ratio = inverse ? goal / value : value / goal;
    if (ratio >= 1) return "text-green-600";
    if (ratio >= 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (!performance || loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Agent Performance Metrics</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const radarData = performance.skills.map((skill: any) => ({
    subject: skill.name,
    score: skill.score,
    fullMark: 100,
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Agent Selector and Time Range */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={selectedAgentId} onValueChange={(value: string) => setSelectedAgentId(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent: any) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(value: string) => setTimeRange(value as typeof timeRange)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Performance Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={Clock} className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-ds-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  getPerformanceColor(
                    performance.metrics.current.responseTime,
                    performance.metrics.goals.responseTime,
                    true
                  )
                )}
              >
                {formatTime(performance.metrics.current.responseTime)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatTime(performance.metrics.goals.responseTime)}
              </span>
            </div>
            <Progress
              value={Math.min(
                100,
                (performance.metrics.goals.responseTime / performance.metrics.current.responseTime) * 100
              )}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={Target} className="h-4 w-4" />
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-ds-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  getPerformanceColor(
                    performance.metrics.current.resolutionRate,
                    performance.metrics.goals.resolutionRate
                  )
                )}
              >
                {performance.metrics.current.resolutionRate}%
              </span>
              <span className="text-sm text-muted-foreground">/ {performance.metrics.goals.resolutionRate}%</span>
            </div>
            <Progress
              value={Math.min(
                100,
                (performance.metrics.current.resolutionRate / performance.metrics.goals.resolutionRate) * 100
              )}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={Star} className="h-4 w-4" />
              Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-ds-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  getPerformanceColor(
                    performance.metrics.current.customerSatisfaction,
                    performance.metrics.goals.customerSatisfaction
                  )
                )}
              >
                {performance.metrics.current.customerSatisfaction}%
              </span>
              <span className="text-sm text-muted-foreground">
                / {performance.metrics.goals.customerSatisfaction}%
              </span>
            </div>
            <Progress
              value={Math.min(
                100,
                (performance.metrics.current.customerSatisfaction / performance.metrics.goals.customerSatisfaction) *
                  100
              )}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={MessageSquare} className="h-4 w-4" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-ds-2">
              <span className="text-3xl font-bold">{performance.metrics.current.conversationsHandled}</span>
              <span className="text-sm text-muted-foreground">handled</span>
            </div>
            <div className="mt-2 flex gap-ds-2">
              <Badge variant="secondary" className="text-tiny">
                FCR: {performance.metrics.current.firstContactResolution}%
              </Badge>
              <Badge variant="outline" className="text-tiny">
                Esc: {performance.metrics.current.escalationRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Tabs defaultValue="trend" className="space-y-3">
        <TabsList>
          <TabsTrigger value="trend">Performance Trend</TabsTrigger>
          <TabsTrigger value="skills">Skills Radar</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performance.metrics.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#8b5cf6"
                    name="Response Time (s)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="customerSatisfaction"
                    stroke="#10b981"
                    name="Satisfaction (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="resolutionRate"
                    stroke="#3b82f6"
                    name="Resolution Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
              <CardDescription>Agent competency across different areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievements & Recognition</CardTitle>
              <CardDescription>Earned badges and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {performance.achievements.map((achievement: any) => (
                  <div key={achievement.id} className="flex items-start gap-3 rounded-ds-lg border bg-muted/50 spacing-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-primary/10">
                      <Icon icon={Trophy} className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <p className="mt-1 text-tiny text-muted-foreground">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
