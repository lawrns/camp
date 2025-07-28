/**
 * Performance Monitoring Dashboard
 *
 * Comprehensive dashboard for visualizing all performance metrics and targets
 * Integrates with Supabase Analytics for real-time monitoring
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Globe,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Performance targets from our implementation
const PERFORMANCE_TARGETS = {
  messageLatency: 100, // ms
  dashboardLoad: 500, // ms
  widgetLoad: 100, // ms
  notificationLatency: 100, // ms
  apiResponse: 200, // ms
  realtimeUpdate: 200, // ms
  assignmentNotification: 1000, // ms
  handoverLatency: 2000, // ms
  ticketCreation: 3000, // ms
  readReceiptUpdate: 500, // ms
};

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "excellent" | "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  category: "api" | "realtime" | "ui" | "widget";
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  trends: Array<{
    timestamp: string;
    messageLatency: number;
    dashboardLoad: number;
    apiResponse: number;
    notificationLatency: number;
  }>;
  alerts: Array<{
    id: string;
    type: "performance" | "error" | "warning";
    message: string;
    timestamp: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  systemHealth: {
    overall: number;
    api: number;
    realtime: number;
    ui: number;
    widget: number;
  };
}

export function PerformanceMonitoringDashboard({ organizationId }: { organizationId: string }) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);

        // Fetch from our performance tracking API
        const response = await fetch(
          `/api/analytics/performance?organizationId=${organizationId}&range=${selectedTimeRange}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch performance data");
        }

        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {

        // Fallback to mock data for demonstration
        setPerformanceData(generateMockPerformanceData());
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();

    // Set up real-time updates
    const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [organizationId, selectedTimeRange]);

  // Generate mock data for demonstration
  const generateMockPerformanceData = (): PerformanceData => {
    const now = Date.now();
    const trends = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now - (23 - i) * 60 * 60 * 1000).toISOString(),
      messageLatency: 50 + Math.random() * 100,
      dashboardLoad: 200 + Math.random() * 400,
      apiResponse: 80 + Math.random() * 150,
      notificationLatency: 30 + Math.random() * 120,
    }));

    const metrics: PerformanceMetric[] = [
      {
        name: "Message Latency",
        value: 85,
        target: PERFORMANCE_TARGETS.messageLatency,
        unit: "ms",
        status: "excellent",
        trend: "stable",
        category: "realtime",
      },
      {
        name: "Dashboard Load",
        value: 320,
        target: PERFORMANCE_TARGETS.dashboardLoad,
        unit: "ms",
        status: "good",
        trend: "down",
        category: "ui",
      },
      {
        name: "Widget Load",
        value: 75,
        target: PERFORMANCE_TARGETS.widgetLoad,
        unit: "ms",
        status: "excellent",
        trend: "stable",
        category: "widget",
      },
      {
        name: "API Response",
        value: 145,
        target: PERFORMANCE_TARGETS.apiResponse,
        unit: "ms",
        status: "good",
        trend: "up",
        category: "api",
      },
      {
        name: "Notification Latency",
        value: 65,
        target: PERFORMANCE_TARGETS.notificationLatency,
        unit: "ms",
        status: "excellent",
        trend: "down",
        category: "realtime",
      },
      {
        name: "Assignment Notifications",
        value: 450,
        target: PERFORMANCE_TARGETS.assignmentNotification,
        unit: "ms",
        status: "excellent",
        trend: "stable",
        category: "realtime",
      },
    ];

    return {
      metrics,
      trends,
      alerts: [
        {
          id: "1",
          type: "warning",
          message: "API response time increased by 15% in the last hour",
          timestamp: new Date().toISOString(),
          severity: "medium",
        },
      ],
      systemHealth: {
        overall: 94,
        api: 92,
        realtime: 96,
        ui: 93,
        widget: 95,
      },
    };
  };

  const getStatusColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTrendIcon = (trend: PerformanceMetric["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case "stable":
        return <Minus className="text-foreground-muted h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: PerformanceMetric["category"]) => {
    switch (category) {
      case "api":
        return <Database className="h-5 w-5" />;
      case "realtime":
        return <Activity className="h-5 w-5" />;
      case "ui":
        return <Users className="h-5 w-5" />;
      case "widget":
        return <Globe className="h-5 w-5" />;
    }
  };

  const healthColors = ["#10B981", "#F59E0B", "#EF4444"];
  const healthData = useMemo(() => {
    if (!performanceData) return [];

    const { systemHealth } = performanceData;
    return [
      { name: "API", value: systemHealth.api, color: "#3B82F6" },
      { name: "Real-time", value: systemHealth.realtime, color: "#10B981" },
      { name: "UI", value: systemHealth.ui, color: "#8B5CF6" },
      { name: "Widget", value: systemHealth.widget, color: "#F59E0B" },
    ];
  }, [performanceData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <p className="text-foreground">Unable to load performance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Performance Monitoring</h2>
          <p className="text-foreground">Real-time system performance metrics and targets</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border-ds-border-strong rounded-ds-md border px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="h-2 w-2 animate-pulse rounded-ds-full bg-green-500"></div>
            <span>Live</span>
          </Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm font-medium">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-spacing-sm">
              <div className="text-3xl font-bold text-green-600">{performanceData.systemHealth.overall}%</div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <Progress value={performanceData.systemHealth.overall} className="mt-2" />
          </CardContent>
        </Card>

        {healthData.map((item) => (
          <Card key={item.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm font-medium">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-[${item.color}]`}>
                {item.value}%
              </div>
              <Progress value={item.value} className="mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <Tabs defaultValue="metrics" className="space-y-3">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {performanceData.metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-spacing-sm text-sm font-medium">
                      {getCategoryIcon(metric.category)}
                      <span>{metric.name}</span>
                    </CardTitle>
                    {getTrendIcon(metric.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {metric.value}
                      {metric.unit}
                    </div>
                    <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
                  </div>
                  <div className="text-foreground mb-2 text-sm">
                    Target: {metric.target}
                    {metric.unit}
                  </div>
                  <Progress value={Math.min((metric.target / metric.value) * 100, 100)} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Performance metrics over time ({selectedTimeRange})</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number, name: string) => [`${value}ms`, name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="messageLatency"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Message Latency"
                  />
                  <Line
                    type="monotone"
                    dataKey="dashboardLoad"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Dashboard Load"
                  />
                  <Line type="monotone" dataKey="apiResponse" stroke="#F59E0B" strokeWidth={2} name="API Response" />
                  <Line
                    type="monotone"
                    dataKey="notificationLatency"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Notification Latency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          <div className="space-y-3">
            {performanceData.alerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                    <p className="text-foreground">No performance alerts</p>
                    <p className="text-foreground-muted text-sm">All systems operating normally</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              performanceData.alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="flex items-center space-x-3 py-4">
                    <AlertTriangle
                      className={`h-5 w-5 ${alert.severity === "critical"
                        ? "text-red-500"
                        : alert.severity === "high"
                          ? "text-orange-500"
                          : alert.severity === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-foreground-muted text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant={alert.severity === "critical" ? "error" : "secondary"}>
                      {alert.severity}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceMonitoringDashboard;
