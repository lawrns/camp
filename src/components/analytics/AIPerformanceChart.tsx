/**
 * AI Performance Chart Component - TEAM2-P3-005
 * Comprehensive analytics visualization for AI performance metrics
 */

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils/date";
import {
  ChartLineUp as Activity,
  Warning as AlertTriangle,
  Brain,
  Clock,
  ChatCircle as MessageSquare,
  TrendDown as TrendingDown,
  TrendUp as TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AIPerformanceData {
  timestamp: string;
  confidence: number;
  responseTime: number;
  messageCount: number;
  escalationRate: number;
  successRate: number;
}

interface AIAnalyticsProps {
  organizationId: string;
  timeRange?: "1h" | "24h" | "7d" | "30d";
  className?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AIPerformanceChart({ organizationId, timeRange = "24h", className }: AIAnalyticsProps) {
  const [performanceData, setPerformanceData] = useState<AIPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState({
    averageConfidence: 0,
    averageResponseTime: 0,
    totalMessages: 0,
    escalationRate: 0,
    successRate: 0,
  });

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);

        // Fetch current metrics
        const metricsResponse = await fetch(`/api/ai/metrics?organizationId=${organizationId}`);
        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          setCurrentMetrics({
            averageConfidence: metrics.averageConfidence || 0,
            averageResponseTime: metrics.responseTimeMs || 0,
            totalMessages: metrics.messagesHandled || 0,
            escalationRate: metrics.escalationRate || 0,
            successRate: metrics.successRate || 0,
          });
        }

        // Generate time series data (in production, this would come from analytics API)
        const now = new Date();
        const dataPoints = timeRange === "1h" ? 12 : timeRange === "24h" ? 24 : 30;
        const interval =
          timeRange === "1h" ? 5 * 60 * 1000 : timeRange === "24h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        const generatedData: AIPerformanceData[] = [];

        for (let i = dataPoints; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * interval);

          // Simulate realistic performance data with trends
          const baseConfidence = 0.75 + Math.random() * 0.2;
          const timeOfDay = timestamp.getHours();
          const busyPeriod = timeOfDay >= 9 && timeOfDay <= 17; // Business hours

          generatedData.push({
            timestamp: timestamp.toISOString(),
            confidence: Math.max(
              0.3,
              Math.min(1, baseConfidence + (busyPeriod ? -0.1 : 0.1) + (Math.random() - 0.5) * 0.1)
            ),
            responseTime: 1500 + (busyPeriod ? 500 : 0) + Math.random() * 1000,
            messageCount: Math.floor((busyPeriod ? 15 : 5) + Math.random() * 10),
            escalationRate: Math.max(
              0,
              Math.min(0.3, 0.1 + (busyPeriod ? 0.05 : -0.02) + (Math.random() - 0.5) * 0.05)
            ),
            successRate: Math.max(0.6, Math.min(1, 0.9 + (busyPeriod ? -0.05 : 0.05) + (Math.random() - 0.5) * 0.1)),
          });
        }

        setPerformanceData(generatedData);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchPerformanceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId, timeRange]);

  const formatTimestampLocal = (timestamp: string) => formatTimestamp(timestamp, timeRange);

  const getConfidenceData = () => {
    return performanceData.map((d: unknown) => ({
      time: formatTimestampLocal(d.timestamp),
      confidence: Math.round(d.confidence * 100),
      successRate: Math.round(d.successRate * 100),
    }));
  };

  const getResponseTimeData = () => {
    return performanceData.map((d: unknown) => ({
      time: formatTimestampLocal(d.timestamp),
      responseTime: Math.round(d.responseTime),
      messages: d.messageCount,
    }));
  };

  const getEscalationData = () => {
    return performanceData.map((d: unknown) => ({
      time: formatTimestampLocal(d.timestamp),
      escalationRate: Math.round(d.escalationRate * 100),
      messageCount: d.messageCount,
    }));
  };

  const getDistributionData = () => {
    if (performanceData.length === 0) return [];

    const totalMessages = performanceData.reduce((sum: unknown, d: unknown) => sum + d.messageCount, 0);
    const escalated = Math.round(totalMessages * currentMetrics.escalationRate);
    const successful = totalMessages - escalated;

    return [
      { name: "Successful", value: successful, color: "#00C49F" },
      { name: "Escalated", value: escalated, color: "#FF8042" },
    ];
  };

  const MetricCard = ({
    title,
    value,
    trend,
    icon: IconComponent,
    color,
    suffix = "",
  }: {
    title: string;
    value: number | string;
    trend?: "up" | "down" | "neutral";
    icon: unknown;
    color: string;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="spacing-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-ds-2">
              <p className="text-3xl font-bold">
                {value}
                {suffix}
              </p>
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1",
                    trend === "up" ? "text-semantic-success-dark" : trend === "down" ? "text-red-600" : "text-gray-600"
                  )}
                >
                  {trend === "up" && <Icon icon={TrendingUp} className="h-4 w-4" />}
                  {trend === "down" && <Icon icon={TrendingDown} className="h-4 w-4" />}
                </div>
              )}
            </div>
          </div>
          <div className={cn("rounded-ds-full spacing-2", color)}>
            <Icon icon={IconComponent} className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="spacing-3">
                <div className="animate-pulse">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-8 w-1/2 rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-spacing-md">
            <div className="animate-pulse">
              <div className="h-64 rounded bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Average Confidence"
          value={Math.round(currentMetrics.averageConfidence * 100)}
          suffix="%"
          trend={
            currentMetrics.averageConfidence > 0.8 ? "up" : currentMetrics.averageConfidence < 0.6 ? "down" : "neutral"
          }
          icon={Brain}
          color="bg-purple-500"
        />

        <MetricCard
          title="Avg Response Time"
          value={Math.round(currentMetrics.averageResponseTime / 1000)}
          suffix="s"
          trend={
            currentMetrics.averageResponseTime < 2000
              ? "up"
              : currentMetrics.averageResponseTime > 4000
                ? "down"
                : "neutral"
          }
          icon={Clock}
          color="bg-blue-500"
        />

        <MetricCard
          title="Total Messages"
          value={currentMetrics.totalMessages}
          icon={MessageSquare}
          color="bg-green-500"
        />

        <MetricCard
          title="Escalation Rate"
          value={Math.round(currentMetrics.escalationRate * 100)}
          suffix="%"
          trend={currentMetrics.escalationRate < 0.1 ? "up" : currentMetrics.escalationRate > 0.2 ? "down" : "neutral"}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
      </div>

      {/* Performance Charts */}
      <Tabs defaultValue="confidence" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="confidence" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Confidence Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getConfidenceData()}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name === "confidence" ? "Confidence" : "Success Rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stroke="#8884d8"
                    fill="url(#confidenceGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="successRate"
                    stroke="#00C49F"
                    fill="url(#successGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response-time" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Response Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getResponseTimeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="time" orientation="left" />
                  <YAxis yAxisId="count" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "responseTime" ? `${value}ms` : `${value} messages`,
                      name === "responseTime" ? "Response Time" : "Message Count",
                    ]}
                  />
                  <Line
                    yAxisId="time"
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  />
                  <Bar yAxisId="count" dataKey="messages" fill="#00C49F" opacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalations" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Escalation Rate Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getEscalationData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Escalation Rate"]} />
                  <Bar dataKey="escalationRate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Activity className="text-semantic-success-dark h-5 w-5" />
                Message Outcome Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getDistributionData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} messages`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  <h4 className="text-base font-semibold">Performance Summary</h4>
                  {getDistributionData().map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-ds-2">
                        <div className={`h-3 w-3 rounded-ds-full bg-[${item.color}]`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.value} messages</Badge>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="text-semantic-success-dark text-lg font-bold">
                          {Math.round(currentMetrics.successRate * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Escalation Rate</p>
                        <p className="text-lg font-bold text-orange-600">
                          {Math.round(currentMetrics.escalationRate * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
