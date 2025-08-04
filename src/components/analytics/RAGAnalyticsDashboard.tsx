/**
 * RAG Analytics Dashboard
 *
 * Comprehensive dashboard for RAG system analytics, performance monitoring,
 * and optimization insights.
 */

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Button } from "@/components/ui/Button-unified";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { OptimizationRecommendation, PerformanceInsight, RAGMetrics } from "@/lib/analytics/RAGAnalyticsService";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  ChartLine as Activity,
  Warning as AlertCircle,
  Warning as AlertTriangle,
  ChartBar as BarChart3,
  CheckCircle,
  Clock,
  CurrencyDollar as DollarSign,
  Download,
  Lightbulb,
  ChartPie as PieChartIcon,
  ArrowsClockwise as RefreshCw,
  Target,
  TrendDown as TrendingDown,
  TrendUp as TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface RAGAnalyticsDashboardProps {
  organizationId?: string;
  className?: string;
  showExportOptions?: boolean;
  refreshInterval?: number; // in seconds
}

interface DashboardState {
  metrics: RAGMetrics | null;
  insights: PerformanceInsight[];
  recommendations: OptimizationRecommendation[];
  realTimeData: unknown;
  loading: boolean;
  error: string | null;
  timeRange: "1h" | "24h" | "7d" | "30d";
  autoRefresh: boolean;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#6366f1",
  muted: "#6b7280",
};

export function RAGAnalyticsDashboard({
  organizationId,
  className,
  showExportOptions = true,
  refreshInterval = 30,
}: RAGAnalyticsDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    insights: [],
    recommendations: [],
    realTimeData: null,
    loading: true,
    error: null,
    timeRange: "24h",
    autoRefresh: false, // DISABLED: Polling replaced with real-time updates
  });

  useEffect(() => {
    loadDashboardData();
  }, [state.timeRange, organizationId]);

  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [state.autoRefresh, refreshInterval]);

  const loadDashboardData = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const timeRange = getTimeRangeForSelection(state.timeRange);

      // Call the API endpoint instead of the service directly
      const response = await fetch(
        `/api/analytics/rag?startDate=${timeRange.start.toISOString()}&endDate=${timeRange.end.toISOString()}&organizationId=${organizationId}&includeInsights=true&includeRealTime=true`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const metricsResult = data.metrics;
      const insightsResult = data.insights || { insights: [], patterns: [], recommendations: [] };
      const realTimeResult = data.realTime || { currentMetrics: {}, alerts: [], trends: {} };

      setState((prev) => ({
        ...prev,
        metrics: metricsResult,
        insights: insightsResult.insights,
        recommendations: insightsResult.recommendations,
        realTimeData: realTimeResult,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to load dashboard data",
        loading: false,
      }));
    }
  };

  const getTimeRangeForSelection = (selection: string) => {
    const now = new Date();
    const start = new Date();

    switch (selection) {
      case "1h":
        start.setHours(now.getHours() - 1);
        break;
      case "24h":
        start.setDate(now.getDate() - 1);
        break;
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
    }

    return { start, end: now };
  };

  const handleExport = async (format: "json" | "csv" | "excel") => {
    try {
      const timeRange = getTimeRangeForSelection(state.timeRange);

      // For now, export the current metrics data
      const exportData = {
        data: JSON.stringify(state.metrics, null, 2),
        filename: `rag-analytics-${format}-${new Date().toISOString().split("T")[0]}.${format}`,
      };

      // Create download
      const blob = new Blob([exportData.data], {
        type:
          format === "json"
            ? "application/json"
            : format === "csv"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Export failed: ${error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error"}`,
      }));
    }
  };

  const renderOverviewMetrics = () => {
    if (!state.metrics) return <Skeleton className="h-32" />;

    const metrics = [
      {
        title: "Total Requests",
        value: state.metrics.usage.totalRequests.toLocaleString(),
        change: "+12.5%",
        trend: "up" as const,
        icon: Activity,
        color: COLORS.primary,
      },
      {
        title: "Avg Response Time",
        value: `${Math.round(state.metrics.performance.averageResponseTime)}ms`,
        change: "-8.2%",
        trend: "down" as const,
        icon: Clock,
        color: COLORS.success,
      },
      {
        title: "Success Rate",
        value: `${Math.round(state.metrics.performance.successRate * 100)}%`,
        change: "+2.1%",
        trend: "up" as const,
        icon: CheckCircle,
        color: state.metrics.performance.successRate > 0.95 ? COLORS.success : COLORS.warning,
      },
      {
        title: "Total Cost",
        value: `$${state.metrics.cost.totalCost.toFixed(2)}`,
        change: "+5.3%",
        trend: "up" as const,
        icon: DollarSign,
        color: COLORS.info,
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="spacing-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground mb-1 text-sm">{metric.title}</p>
                  <p className={`text-3xl font-bold text-[${metric.color}]`}>
                    {metric.value}
                  </p>
                  <div className="mt-1 flex items-center">
                    {metric.trend === "up" ? (
                      <Icon icon={TrendingUp} className="text-semantic-success mr-1 h-3 w-3" />
                    ) : (
                      <Icon icon={TrendingDown} className="text-brand-mahogany-500 mr-1 h-3 w-3" />
                    )}
                    <span
                      className={cn("text-xs", metric.trend === "up" ? "text-semantic-success-dark" : "text-red-600")}
                    >
                      {metric.change}
                    </span>
                  </div>
                </div>
                <metric.icon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPerformanceCharts = () => {
    if (!state.metrics) return <Skeleton className="h-64" />;

    // Use real requestsByDay data from analytics
    const requestsData = state.metrics.usage.requestsByDay || [];
    const responseTimeData =
      requestsData.length > 0
        ? requestsData.map((item: unknown) => ({
          time: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          responseTime: item.avgResponseTime || 0,
          requests: item.requests || 0,
          errors: item.errors || 0,
        }))
        : []; // Return empty array if no real data available

    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon icon={BarChart3} className="mr-2 h-5 w-5" />
              Response Time Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon icon={Activity} className="mr-2 h-5 w-5" />
              Request Volume & Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke={COLORS.success}
                  fill={COLORS.success}
                  fillOpacity={0.6}
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stackId="2"
                  stroke={COLORS.error}
                  fill={COLORS.error}
                  fillOpacity={0.6}
                  name="Errors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFeatureUsage = () => {
    if (!state.metrics) return <Skeleton className="h-64" />;

    const featureData = [
      { name: "Vector Search", value: state.metrics.features.vectorSearchUsage, color: COLORS.primary },
      { name: "Batch Embeddings", value: state.metrics.features.batchEmbeddingUsage, color: COLORS.success },
      { name: "Streaming Responses", value: state.metrics.features.streamingResponseUsage, color: COLORS.warning },
      { name: "Similarity Matching", value: state.metrics.features.similarityMatchingUsage, color: COLORS.info },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon icon={PieChartIcon} className="mr-2 h-5 w-5" />
            Feature Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={featureData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {featureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {featureData.map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`mr-2 h-3 w-3 rounded-ds-full bg-[${feature.color}]`} />
                    <span className="text-sm">{feature.name}</span>
                  </div>
                  <span className="font-medium">{feature.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsights = () => {
    if (state.loading) return <Skeleton className="h-32" />;

    if (state.insights.length === 0) {
      return (
        <Card>
          <CardContent className="p-spacing-md text-center text-[var(--color-text-muted)]">
            <Icon icon={CheckCircle} className="text-semantic-success mx-auto mb-2 h-8 w-8" />
            <p>All systems operating normally</p>
            <p className="text-sm">No performance insights at this time</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {state.insights.map((insight, index) => (
          <Alert
            key={index}
            className={cn(
              insight.severity === "critical"
                ? "border-status-error-light bg-status-error-light"
                : insight.severity === "high"
                  ? "border-orange-200 bg-orange-50"
                  : insight.severity === "medium"
                    ? "border-status-info-light bg-status-info-light"
                    : "border-status-success-light bg-status-success-light"
            )}
          >
            <div className="flex items-start">
              {insight.type === "warning" ? (
                <Icon
                  icon={AlertTriangle}
                  className={cn(
                    "mr-3 mt-0.5 h-4 w-4",
                    insight.impact === "critical" ? "text-brand-mahogany-500" : "text-semantic-warning"
                  )}
                />
              ) : insight.type === "info" ? (
                <Icon icon={Lightbulb} className="mr-3 mt-0.5 h-4 w-4 text-[var(--color-info)]" />
              ) : insight.type === "success" ? (
                <Icon icon={CheckCircle} className="text-semantic-success mr-3 mt-0.5 h-4 w-4" />
              ) : (
                <Icon icon={AlertCircle} className="mr-3 mt-0.5 h-4 w-4 text-[var(--color-info)]" />
              )}

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge
                    variant={
                      insight.impact === "critical" ? "error" : insight.impact === "high" ? "secondary" : "outline"
                    }
                  >
                    {insight.impact}
                  </Badge>
                </div>

                <AlertDescription className="mb-2">{insight.description}</AlertDescription>

                <div className="text-foreground mb-2 text-sm">
                  <strong>Impact:</strong> {insight.impact}
                </div>

                {insight.suggestion && (
                  <div className="text-foreground text-sm">
                    <strong>Recommendation:</strong> {insight.suggestion}
                  </div>
                )}

                {insight.metric && insight.currentValue !== undefined && (
                  <div className="mt-2 text-tiny text-[var(--color-text-muted)]">
                    <span className="mr-4">
                      {insight.metric}:{" "}
                      {typeof insight.currentValue === "number"
                        ? insight.currentValue.toFixed(2)
                        : insight.currentValue}
                      {insight.targetValue !== undefined && (
                        <>
                          {" "}
                          (target:{" "}
                          {typeof insight.targetValue === "number"
                            ? insight.targetValue.toFixed(2)
                            : insight.targetValue}
                          )
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (state.loading) return <Skeleton className="h-32" />;

    if (state.recommendations.length === 0) {
      return (
        <Card>
          <CardContent className="p-spacing-md text-center text-[var(--color-text-muted)]">
            <Icon icon={Target} className="mx-auto mb-2 h-8 w-8 text-[var(--color-info)]" />
            <p>System is well optimized</p>
            <p className="text-sm">No optimization recommendations at this time</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {state.recommendations.map((rec, index) => (
          <Card key={index}>
            <CardContent className="spacing-3">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="mb-1 font-medium">{rec.title}</h4>
                  <div className="flex items-center space-x-spacing-sm">
                    <Badge
                      variant={
                        rec.priority === "critical" ? "error" : rec.priority === "high" ? "secondary" : "outline"
                      }
                    >
                      {rec.priority} priority
                    </Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Implement
                </Button>
              </div>

              <p className="text-foreground mb-3 text-sm">{rec.description}</p>

              <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div>
                  <h5 className="mb-2 text-sm font-medium">Expected Impact</h5>
                  {rec.expectedImpact.performanceGain && (
                    <div className="text-semantic-success-dark text-sm">
                      Performance: +{Math.round(rec.expectedImpact.performanceGain * 100)}%
                    </div>
                  )}
                  {rec.expectedImpact.costSaving && (
                    <div className="text-sm text-blue-600">
                      Cost Saving: {Math.round(rec.expectedImpact.costSaving * 100)}%
                    </div>
                  )}
                  {rec.expectedImpact.qualityImprovement && (
                    <div className="text-sm text-purple-600">
                      Quality: +{Math.round(rec.expectedImpact.qualityImprovement * 100)}%
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="mb-2 text-sm font-medium">Implementation</h5>
                  <div className="text-foreground text-sm">
                    <div>Difficulty: {rec.implementation.difficulty}</div>
                    <div>Time: {rec.implementation.estimatedTime}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  Current: {rec.metrics?.currentValue} {rec.metrics?.measurement}
                </span>
                <span className="text-semantic-success-dark">
                  Target: {rec.metrics?.targetValue} {rec.metrics?.measurement}
                </span>
              </div>

              <Progress
                value={
                  rec.metrics?.targetValue && rec.metrics?.currentValue
                    ? Math.min((rec.metrics.targetValue / rec.metrics.currentValue) * 100, 100)
                    : 0
                }
                className="mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (state.error) {
    return (
      <Alert className={className}>
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>
          {state.error}
          <Button variant="outline" size="sm" onClick={loadDashboardData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className} data-testid="rag-analytics">
      {/* Dashboard Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold">RAG Analytics Dashboard</h2>

        <div className="flex items-center space-x-spacing-sm">
          <Select
            value={state.timeRange}
            onValueChange={(value: string) =>
              setState((prev) => ({ ...prev, timeRange: value as typeof state.timeRange }))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setState((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
          >
            <Icon icon={RefreshCw} className={cn("mr-1 h-4 w-4", state.autoRefresh && "animate-spin")} />
            {state.autoRefresh ? "Auto" : "Manual"}
          </Button>

          {showExportOptions && (
            <Select onValueChange={(value: string) => handleExport(value as "json" | "csv" | "excel")}>
              <SelectTrigger className="w-24">
                <Icon icon={Download} className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="mb-6">{renderOverviewMetrics()}</div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="performance" className="space-y-3">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage & Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-3">
          {renderPerformanceCharts()}
          {renderFeatureUsage()}
        </TabsContent>

        <TabsContent value="usage" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                {state.metrics?.usage.topOrganizations.slice(0, 5).map((org: unknown, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{org.name}</span>
                    <span className="font-medium">{org.requestCount}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Conversation Cache Hit Rate</span>
                      <span>{Math.round((state.metrics?.features.conversationCacheHitRate || 0) * 100)}%</span>
                    </div>
                    <Progress value={Math.min((state.metrics?.features.conversationCacheHitRate || 0) * 100, 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          {renderInsights()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3">
          {renderRecommendations()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RAGAnalyticsDashboard;
