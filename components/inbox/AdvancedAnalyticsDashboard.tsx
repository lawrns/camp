"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle as AlertCircle, ChartBar as BarChart3, Brain, Calendar, ChartPie, CheckCircle, Clock, Download, Funnel as Filter, Heart, MessageCircle as MessageCircle, MessageCircle as MessageSquare, RefreshCw as RefreshCw, Star, Target, Timer, TrendDown as TrendingDown, TrendUp as TrendingUp, UserFocus as UserCheck, Users, Zap as Zap,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Types for analytics data
interface AnalyticsMetric {
  label: string;
  value: number | string;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: "green" | "red" | "blue" | "purple" | "orange";
  description: string;
}

interface AgentPerformance {
  id: string;
  name: string;
  avatar?: string;
  conversationsHandled: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
  status: "online" | "away" | "busy" | "offline";
  workload: "light" | "moderate" | "heavy";
  expertise: string[];
  todayMetrics: {
    conversations: number;
    avgResponseTime: number;
    satisfaction: number;
  };
}

interface ConversationInsight {
  id: string;
  type: "escalation_risk" | "satisfaction_drop" | "long_response" | "ai_handover_needed";
  severity: "low" | "medium" | "high" | "critical";
  conversationId: string;
  customerName: string;
  description: string;
  recommendation: string;
  timestamp: string;
  agentId?: string;
}

interface AdvancedAnalyticsDashboardProps {
  organizationId: string;
  timeRange?: "today" | "week" | "month" | "quarter";
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export function AdvancedAnalyticsDashboard({
  organizationId,
  timeRange = "today",
  onTimeRangeChange,
  className,
}: AdvancedAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real implementation, this would come from APIs
  const analyticsMetrics: AnalyticsMetric[] = [
    {
      label: "Total Conversations",
      value: 1247,
      change: 12.5,
      trend: "up",
      icon: <Icon icon={MessageCircle} className="h-4 w-4" />,
      color: "blue",
      description: "Active conversations in selected period",
    },
    {
      label: "Avg Response Time",
      value: "2.3 min",
      change: -15.2,
      trend: "up",
      icon: <Icon icon={Timer} className="h-4 w-4" />,
      color: "green",
      description: "Average first response time",
    },
    {
      label: "Customer Satisfaction",
      value: "4.8/5",
      change: 3.1,
      trend: "up",
      icon: <Icon icon={Heart} className="h-4 w-4" />,
      color: "purple",
      description: "Average customer rating",
    },
    {
      label: "Resolution Rate",
      value: "94.2%",
      change: 2.8,
      trend: "up",
      icon: <Icon icon={CheckCircle} className="h-4 w-4" />,
      color: "green",
      description: "Conversations resolved successfully",
    },
    {
      label: "AI Handover Rate",
      value: "23.1%",
      change: -8.4,
      trend: "up",
      icon: <Icon icon={Brain} className="h-4 w-4" />,
      color: "orange",
      description: "Conversations requiring human agent",
    },
    {
      label: "Active Agents",
      value: 12,
      change: 0,
      trend: "neutral",
      icon: <Icon icon={UserCheck} className="h-4 w-4" />,
      color: "blue",
      description: "Agents currently online",
    },
  ];

  const agentPerformance: AgentPerformance[] = [
    {
      id: "agent-1",
      name: "Sarah Chen",
      conversationsHandled: 89,
      avgResponseTime: 1.8,
      customerSatisfaction: 4.9,
      resolutionRate: 96.2,
      status: "online",
      workload: "moderate",
      expertise: ["Technical Support", "Billing"],
      todayMetrics: { conversations: 15, avgResponseTime: 1.5, satisfaction: 4.9 },
    },
    {
      id: "agent-2",
      name: "Mike Rodriguez",
      conversationsHandled: 76,
      avgResponseTime: 2.1,
      customerSatisfaction: 4.7,
      resolutionRate: 94.8,
      status: "online",
      workload: "light",
      expertise: ["Sales", "General Support"],
      todayMetrics: { conversations: 8, avgResponseTime: 1.9, satisfaction: 4.8 },
    },
    {
      id: "agent-3",
      name: "Emma Thompson",
      conversationsHandled: 102,
      avgResponseTime: 2.5,
      customerSatisfaction: 4.8,
      resolutionRate: 97.1,
      status: "busy",
      workload: "heavy",
      expertise: ["Technical Support", "Escalations"],
      todayMetrics: { conversations: 22, avgResponseTime: 2.2, satisfaction: 4.9 },
    },
  ];

  const conversationInsights: ConversationInsight[] = [
    {
      id: "insight-1",
      type: "escalation_risk",
      severity: "high",
      conversationId: "conv-123",
      customerName: "John Smith",
      description: "Customer expressing frustration, sentiment score dropping",
      recommendation: "Assign to senior agent immediately",
      timestamp: "2 minutes ago",
      agentId: "agent-1",
    },
    {
      id: "insight-2",
      type: "long_response",
      severity: "medium",
      conversationId: "conv-456",
      customerName: "Alice Johnson",
      description: "Response time exceeding 5 minutes",
      recommendation: "Check agent availability or trigger auto-response",
      timestamp: "5 minutes ago",
      agentId: "agent-2",
    },
    {
      id: "insight-3",
      type: "ai_handover_needed",
      severity: "low",
      conversationId: "conv-789",
      customerName: "Bob Wilson",
      description: "AI confidence dropping, complex technical query",
      recommendation: "Route to technical support specialist",
      timestamp: "8 minutes ago",
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getMetricColor = (color: string) => {
    const colors = {
      green: "text-green-600 bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-muted)]",
      red: "text-red-600 bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]",
      blue: "text-blue-600 bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-muted)]",
      purple: "text-purple-600 bg-purple-50 border-purple-200",
      orange: "text-orange-600 bg-orange-50 border-orange-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "neutral") return null;
    return change > 0 ? (
      <Icon icon={TrendingUp} className="text-semantic-success-dark h-3 w-3" />
    ) : (
      <Icon icon={TrendingDown} className="h-3 w-3 text-red-600" />
    );
  };

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case "light":
        return "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)]";
      case "moderate":
        return "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)]";
      case "heavy":
        return "bg-[var(--fl-color-danger-subtle)] text-[var(--fl-color-danger)]";
      default:
        return "bg-[var(--fl-color-surface)] text-[var(--fl-color-text)]";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[var(--fl-color-success-subtle)]0";
      case "away":
        return "bg-[var(--fl-color-warning-subtle)]0";
      case "busy":
        return "bg-[var(--fl-color-danger-subtle)]0";
      case "offline":
        return "bg-[var(--fl-color-background-subtle)]0";
      default:
        return "bg-[var(--fl-color-background-subtle)]0";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500 bg-[var(--fl-color-danger-subtle)]";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-yellow-500 bg-[var(--fl-color-warning-subtle)]";
      case "low":
        return "border-l-blue-500 bg-[var(--fl-color-info-subtle)]";
      default:
        return "border-l-gray-500 bg-[var(--fl-color-background-subtle)]";
    }
  };

  return (
    <div className={cn("advanced-analytics-dashboard space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-foreground">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onTimeRangeChange?.(e.target.value)}
            className="border-ds-border-strong rounded-ds-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-ds-2">
            <Icon icon={RefreshCw} className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-ds-2">
            <Icon icon={Download} className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {analyticsMetrics.map((metric, index) => (
          <Card key={index} className={cn("border-l-4", getMetricColor(metric.color))}>
            <CardContent className="spacing-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-ds-lg spacing-2", getMetricColor(metric.color))}>{metric.icon}</div>
                  <div>
                    <p className="text-foreground text-sm font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-[var(--fl-spacing-1)]">
                  {getTrendIcon(metric.trend, metric.change)}
                  <span
                    className={cn(
                      "text-typography-sm font-medium",
                      metric.change > 0
                        ? "text-semantic-success-dark"
                        : metric.change < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    )}
                  >
                    {metric.change !== 0 && (metric.change > 0 ? "+" : "")}
                    {metric.change}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-tiny text-[var(--fl-color-text-muted)]">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={(value: string) => setSelectedTab(value)} className="space-y-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="insights">Smart Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={BarChart3} className="h-5 w-5" />
                  Conversation Volume
                </CardTitle>
                <CardDescription>Daily conversation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-ds-lg bg-[var(--fl-color-background-subtle)]">
                  <p className="text-[var(--fl-color-text-muted)]">Chart visualization would go here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={ChartPie} className="h-5 w-5" />
                  Resolution Types
                </CardTitle>
                <CardDescription>How conversations are being resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Resolved</span>
                    <div className="flex items-center gap-ds-2">
                      <div className="h-2 w-20 rounded-ds-full bg-gray-200">
                        <div className="h-2 w-16 rounded-ds-full bg-brand-blue-500"></div>
                      </div>
                      <span className="text-sm font-medium">76.9%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Agent Resolved</span>
                    <div className="flex items-center gap-ds-2">
                      <div className="h-2 w-20 rounded-ds-full bg-gray-200">
                        <div className="bg-semantic-success h-2 w-5 rounded-ds-full"></div>
                      </div>
                      <span className="text-sm font-medium">23.1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {agentPerformance.map((agent: unknown) => (
              <Card key={agent.id}>
                <CardContent className="spacing-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-gray-200">
                          <span className="text-sm font-medium">{agent.name.charAt(0)}</span>
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 h-4 w-4 rounded-ds-full border-2 border-white",
                            getStatusColor(agent.status)
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <div className="mt-1 flex items-center gap-ds-2">
                          <Badge variant="secondary" className={getWorkloadColor(agent.workload)}>
                            {agent.workload}
                          </Badge>
                          {agent.expertise.map((skill: unknown) => (
                            <Badge key={skill} variant="outline" className="text-tiny rounded-full">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-foreground text-sm">Conversations</p>
                        <p className="text-base font-semibold">{agent.conversationsHandled}</p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm">Avg Response</p>
                        <p className="text-base font-semibold">{agent.avgResponseTime}m</p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm">Satisfaction</p>
                        <p className="text-base font-semibold">{agent.customerSatisfaction}/5</p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm">Resolution</p>
                        <p className="text-base font-semibold">{agent.resolutionRate}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          <div className="space-y-3">
            {conversationInsights.map((insight: unknown) => (
              <Card key={insight.id} className={cn("border-l-4", getSeverityColor(insight.severity))}>
                <CardContent className="spacing-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-ds-2">
                        <Icon icon={AlertCircle} className="text-semantic-warning h-4 w-4" />
                        <h3 className="font-semibold capitalize text-gray-900">{insight.type.replace("_", " ")}</h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            insight.severity === "critical" && "bg-status-error-light text-[var(--fl-color-danger)]",
                            insight.severity === "high" && "bg-orange-100 text-orange-800",
                            insight.severity === "medium" && "bg-status-warning-light text-[var(--fl-color-warning)]",
                            insight.severity === "low" && "bg-status-info-light text-[var(--fl-color-primary)]"
                          )}
                        >
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-foreground mb-1 text-sm">{insight.description}</p>
                      <p className="text-sm font-medium text-blue-600">{insight.recommendation}</p>
                      <div className="mt-2 flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                        <span>Customer: {insight.customerName}</span>
                        <span>Conversation: {insight.conversationId}</span>
                        <span>{insight.timestamp}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average response time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-ds-lg bg-[var(--fl-color-background-subtle)]">
                  <p className="text-[var(--fl-color-text-muted)]">Trend chart would go here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction Trends</CardTitle>
                <CardDescription>Satisfaction scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-ds-lg bg-[var(--fl-color-background-subtle)]">
                  <p className="text-[var(--fl-color-text-muted)]">Satisfaction chart would go here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
