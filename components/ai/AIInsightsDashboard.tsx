/**
 * AI Insights Dashboard - Comprehensive AI Performance and Analytics
 * Connects to AI insights and metrics APIs for real-time AI system monitoring
 */

"use client";

import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import {
  Warning as AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  ChatCircle as MessageSquare,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

// AI Insights API Response Types
interface ConversationInsights {
  total: number;
  aiHandled: number;
  humanHandled: number;
  avgConfidence: number;
  escalationRate: number;
}

interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  satisfactionScore: number;
}

interface TopQuery {
  query: string;
  count: number;
  avgConfidence: number;
  category: string;
}

interface RecentActivity {
  id: string;
  type: "conversation_started" | "escalated" | "resolved" | "training_updated";
  description: string;
  timestamp: Date;
  confidence?: number;
  conversationId?: string;
}

interface AIInsightsData {
  conversationInsights: ConversationInsights;
  performanceMetrics: PerformanceMetrics;
  topQueries: TopQuery[];
  recentActivity: RecentActivity[];
  trends: {
    confidence: number[];
    responseTime: number[];
    escalationRate: number[];
    timestamps: string[];
  };
}

// AI Metrics API Response Types
interface AIMetrics {
  totalConversations: number;
  activeAIConversations: number;
  averageConfidence: number;
  escalationRate: number;
  responseTimeMs: number;
  successRate: number;
  messagesHandled: number;
  humanHandoffs: number;
}

interface AIInsightsDashboardProps {
  organizationId: string;
  className?: string;
}

export function AIInsightsDashboard({ organizationId, className }: AIInsightsDashboardProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAIData = async () => {
    try {
      setError(null);

      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      // ACTIVATED: Fetch insights and metrics from real endpoints with proper auth
      const [insightsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/ai/insights?organizationId=${organizationId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include auth cookies
        }),
        fetch(`/api/ai/metrics?organizationId=${organizationId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include auth cookies
        }),
      ]);

      if (!insightsResponse.ok || !metricsResponse.ok) {
        // Enhanced error logging for debugging

        throw new Error(
          `Failed to fetch AI data: Insights ${insightsResponse.status}, Metrics ${metricsResponse.status}`
        );
      }

      const [insightsData, metricsData] = await Promise.all([insightsResponse.json(), metricsResponse.json()]);

      // Handle API response structure
      setInsights(insightsData.success !== false ? insightsData : null);
      setMetrics(metricsData.success !== false ? metricsData : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI data");

      // Provide helpful debugging info

    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, [organizationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAIData();
  };

  const filteredQueries =
    insights?.topQueries.filter(
      (query) =>
        query.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        query.category.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-spacing-sm">
          <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" />
          <span>Loading AI insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon icon={AlertTriangle} className="text-brand-mahogany-500 mx-auto mb-2 h-8 w-8" />
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!insights || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No AI data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">Monitor AI performance and conversation analytics</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" leftIcon={<Icon icon={RefreshCw} className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />}>
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AI Conversations</CardTitle>
            <Icon icon={MessageSquare} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activeAIConversations}</div>
            <p className="text-tiny text-muted-foreground">of {metrics.totalConversations} total conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            <Icon icon={Brain} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(metrics.averageConfidence * 100)}%</div>
            <Progress value={metrics.averageConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Icon icon={Clock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(metrics.responseTimeMs)}ms</div>
            <p className="text-tiny text-muted-foreground">Average AI response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Icon icon={CheckCircle} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(metrics.successRate * 100)}%</div>
            <p className="text-tiny text-muted-foreground">{metrics.humanHandoffs} escalations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Conversation Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Distribution</CardTitle>
                <CardDescription>How conversations are being handled</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Handled</span>
                  <div className="flex items-center space-x-spacing-sm">
                    <div className="h-2 w-32 rounded-ds-full bg-gray-200">
                      <div
                        className="bg-primary h-2 rounded-ds-full"
                        style={{
                          width: `${(insights.conversationInsights.aiHandled / insights.conversationInsights.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{insights.conversationInsights.aiHandled}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Human Handled</span>
                  <div className="flex items-center space-x-spacing-sm">
                    <div className="h-2 w-32 rounded-ds-full bg-gray-200">
                      <div
                        className="bg-semantic-success-dark h-2 rounded-ds-full"
                        style={{
                          width: `${(insights.conversationInsights.humanHandled / insights.conversationInsights.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{insights.conversationInsights.humanHandled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accuracy</span>
                  <Badge variant="secondary">{insights.performanceMetrics.accuracy}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Satisfaction Score</span>
                  <Badge variant="secondary">{insights.performanceMetrics.satisfactionScore}/5.0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Escalation Rate</span>
                  <Badge variant={insights.conversationInsights.escalationRate < 0.2 ? "default" : "error"}>
                    {Math.round(insights.conversationInsights.escalationRate * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>AI performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Confidence Trend</span>
                    <Icon icon={TrendingUp} className="text-semantic-success h-4 w-4" />
                  </div>
                  <Progress value={metrics.averageConfidence * 100} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Response Time Trend</span>
                    <Icon icon={Clock} className="h-4 w-4 text-[var(--fl-color-info)]" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current: {Math.round(metrics.responseTimeMs)}ms
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Success Rate Trend</span>
                    <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />
                  </div>
                  <Progress value={metrics.successRate * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Top Queries</CardTitle>
              <CardDescription>Most common queries handled by AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-spacing-sm">
                  <Icon icon={Search} className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="space-y-spacing-sm">
                  {filteredQueries.slice(0, 10).map((query, index) => (
                    <div key={index} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                      <div className="flex-1">
                        <p className="font-medium">{query.query}</p>
                        <div className="mt-1 flex items-center space-x-spacing-sm">
                          <Badge variant="outline" className="text-tiny">
                            {query.category}
                          </Badge>
                          <span className="text-tiny text-muted-foreground">{query.count} times</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(query.avgConfidence * 100)}%</div>
                        <div className="text-tiny text-muted-foreground">confidence</div>
                      </div>
                    </div>
                  ))}
                  {filteredQueries.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">No queries found matching your search.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest AI system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recentActivity.map((activity: unknown) => (
                  <div key={activity.id} className="flex items-start space-x-3 rounded-ds-lg border spacing-3">
                    <div className="flex-shrink-0">
                      {activity.type === "conversation_started" && (
                        <Icon icon={MessageSquare} className="mt-0.5 h-4 w-4 text-[var(--fl-color-info)]" />
                      )}
                      {activity.type === "escalated" && (
                        <Icon icon={AlertTriangle} className="text-semantic-warning mt-0.5 h-4 w-4" />
                      )}
                      {activity.type === "resolved" && (
                        <Icon icon={CheckCircle} className="text-semantic-success mt-0.5 h-4 w-4" />
                      )}
                      {activity.type === "training_updated" && (
                        <Icon icon={Brain} className="mt-0.5 h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="mt-1 flex items-center space-x-spacing-sm">
                        <span className="text-tiny text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.confidence && (
                          <Badge variant="outline" className="text-tiny">
                            {Math.round(activity.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {insights.recentActivity.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">No recent activity to display.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
