/**
 * AI Management Dashboard
 *
 * Comprehensive interface for managing and monitoring:
 * - Unified RAG Service
 * - Human-like AI Pipeline
 * - Knowledge Base Operations
 * - Confidence Scoring & Escalation
 * - Real-time Performance Monitoring
 */

"use client";

import { useState } from "react";
import { Brain, CheckCircle, Clock, Eye, Settings, Zap, Search, Play, Plus, Bot, TrendUp, AlertCircle,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";

interface AIMetrics {
  totalRequests: number;
  averageConfidence: number;
  escalationRate: number;
  humanLikeMode: boolean;
  knowledgeBaseUsage: number;
  averageResponseTime: number;
  tokensUsed: number;
  successRate: number;
}

interface ConversationStats {
  total: number;
  aiHandled: number;
  escalated: number;
  avgSatisfaction: number;
}

export default function AIManagementPage() {
  const { organization } = useOrganization();

  // Fetch real AI dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = api.ai.analytics.getDashboard.useQuery(
    { mailboxId: organization?.mailboxes?.[0]?.id },
    { enabled: !!organization?.mailboxes?.[0]?.id }
  );

  // Fetch real-time metrics
  const { data: realtimeData, isLoading: isRealtimeLoading } = api.ai.analytics.getRealTime.useQuery(undefined, {
    enabled: !!organization,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cost breakdown for the last 7 days
  const { data: costData } = api.ai.analytics.getCostBreakdown.useQuery({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    groupBy: "model",
  });

  const [settings, setSettings] = useState({
    humanLikeMode: true,
    knowledgeBaseEnabled: true,
    confidenceThreshold: 0.6,
    typingSimulation: true,
    personalization: true,
    phraseFiltering: true,
  });

  // Transform real data into component format
  const aiMetrics: AIMetrics = {
    totalRequests: dashboardData?.summary?.totalRequests || 0,
    averageConfidence: 0.82, // Would need to be calculated from actual confidence data
    escalationRate: 0.15, // Would need escalation tracking
    humanLikeMode: settings.humanLikeMode,
    knowledgeBaseUsage: 0.68, // Would need knowledge base usage tracking
    averageResponseTime: dashboardData?.summary?.avgResponseTime || 0,
    tokensUsed: (dashboardData?.summary?.totalInputTokens || 0) + (dashboardData?.summary?.totalOutputTokens || 0),
    successRate: 0.94, // Would need success rate tracking
  };

  const conversationStats: ConversationStats = {
    total: dashboardData?.summary?.totalRequests || 0,
    aiHandled: Math.round((dashboardData?.summary?.totalRequests || 0) * 0.85), // Estimated
    escalated: Math.round((dashboardData?.summary?.totalRequests || 0) * 0.15), // Estimated
    avgSatisfaction: 4.3, // Would need satisfaction tracking
  };

  const realtimeMetrics = {
    activeConversations: realtimeData?.activeModels?.length || 0,
    queueLength: 5, // Would need queue tracking
    averageWaitTime: 45, // Would need wait time tracking
    agentsOnline: 8, // Would need agent tracking
  };

  const testUnifiedAI = async () => {
    try {
      const response = await fetch("/api/ai/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organization?.id || "test-org",
        },
        body: JSON.stringify({
          conversationId: "test-conversation",
          messageContent: "Hello, I need help with billing",
          useHumanLikeMode: settings.humanLikeMode,
          useKnowledgeBase: settings.knowledgeBaseEnabled,
          confidenceThreshold: settings.confidenceThreshold,
        }),
      });

      const result = await response.json();

      // Refresh dashboard data after test
      refetchDashboard();

      toast.success(
        `AI Response: ${result.response}\n\nConfidence: ${Math.round(result.confidence * 100)}%\nProcessing Time: ${result.performance.processingTime}ms`
      );
    } catch (error) {

      toast.error("AI test failed. Check console for details.");
    }
  };

  return (
    <div className="container mx-auto space-y-6 spacing-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Management Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and configure your unified AI systems with human-like capabilities
          </p>
        </div>
        <Button onClick={testUnifiedAI} className="flex items-center gap-2">
          <Icon icon={Zap} className="h-4 w-4" />
          Test Unified AI
        </Button>
      </div>

      {/* Real-time Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Icon icon={Eye} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isRealtimeLoading ? (
              <div className="h-8 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{realtimeMetrics.activeConversations}</div>
            )}
            <p className="text-xs text-muted-foreground">Real-time active models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Icon icon={TrendUp} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="h-8 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{aiMetrics.totalRequests.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Icon icon={Brain} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="h-8 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{Math.round(aiMetrics.averageConfidence * 100)}%</div>
            )}
            <Progress value={aiMetrics.averageConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Icon icon={CheckCircle} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(aiMetrics.successRate * 100)}%</div>
            <p className="text-xs text-muted-foreground">{aiMetrics.totalRequests} total requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="human-like">Human-like AI</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={Search} className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Real-time AI system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Average Response Time</span>
                  <Badge variant="secondary">{aiMetrics.averageResponseTime}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tokens Used (24h)</span>
                  <Badge variant="secondary">{aiMetrics.tokensUsed.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Knowledge Base Usage</span>
                  <Badge variant="secondary">{Math.round(aiMetrics.knowledgeBaseUsage * 100)}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Escalation Rate</span>
                  <Badge variant={aiMetrics.escalationRate > 0.2 ? "error" : "secondary"}>
                    {Math.round(aiMetrics.escalationRate * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={Play} className="h-5 w-5" />
                  Conversation Analytics
                </CardTitle>
                <CardDescription>Today's conversation statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Conversations</span>
                  <Badge variant="primary">{conversationStats.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Handled</span>
                  <Badge variant="secondary">{conversationStats.aiHandled}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Escalated</span>
                  <Badge variant="outline">{conversationStats.escalated}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Satisfaction</span>
                  <Badge variant="primary">{conversationStats.avgSatisfaction}/5</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="human-like" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Bot} className="h-5 w-5" />
                Human-like AI Pipeline
              </CardTitle>
              <CardDescription>Advanced AI that mimics human conversation patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-ds-lg border spacing-4">
                  <h4 className="mb-2 font-semibold">Sentiment Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Happy</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} />
                    <div className="flex justify-between text-sm">
                      <span>Frustrated</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} />
                    <div className="flex justify-between text-sm">
                      <span>Neutral</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} />
                  </div>
                </div>

                <div className="rounded-ds-lg border spacing-4">
                  <h4 className="mb-2 font-semibold">Tone Adaptation</h4>
                  <div className="space-y-2">
                    <Badge variant="secondary">Friendly: 45%</Badge>
                    <Badge variant="secondary">Professional: 30%</Badge>
                    <Badge variant="secondary">Empathetic: 20%</Badge>
                    <Badge variant="secondary">Technical: 5%</Badge>
                  </div>
                </div>

                <div className="rounded-ds-lg border spacing-4">
                  <h4 className="mb-2 font-semibold">Personalization</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon icon={Plus} className="h-4 w-4" />
                      <span className="text-sm">Customer Names: 78%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon={Clock} className="h-4 w-4" />
                      <span className="text-sm">Time-based: 92%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon={TrendUp} className="h-4 w-4" />
                      <span className="text-sm">Tier-based: 56%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Pipeline Features</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Phrase Filtering</span>
                      <p className="text-sm text-muted-foreground">Remove robotic phrases</p>
                    </div>
                    <Switch
                      checked={settings.phraseFiltering}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({ ...prev, phraseFiltering: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Typing Simulation</span>
                      <p className="text-sm text-muted-foreground">Realistic typing delays</p>
                    </div>
                    <Switch
                      checked={settings.typingSimulation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({ ...prev, typingSimulation: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Personalization</span>
                      <p className="text-sm text-muted-foreground">Customer-specific responses</p>
                    </div>
                    <Switch
                      checked={settings.personalization}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({ ...prev, personalization: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Human-like Mode</span>
                      <p className="text-sm text-muted-foreground">Full pipeline enabled</p>
                    </div>
                    <Switch
                      checked={settings.humanLikeMode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings((prev) => ({ ...prev, humanLikeMode: e.target.checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Search} className="h-5 w-5" />
                Knowledge Base Management
              </CardTitle>
              <CardDescription>Monitor and manage your AI knowledge sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-ds-lg border spacing-4 text-center">
                  <div className="text-2xl font-bold">1,247</div>
                  <div className="text-sm text-muted-foreground">Knowledge Chunks</div>
                </div>
                <div className="rounded-ds-lg border spacing-4 text-center">
                  <div className="text-2xl font-bold">68%</div>
                  <div className="text-sm text-muted-foreground">Usage Rate</div>
                </div>
                <div className="rounded-ds-lg border spacing-4 text-center">
                  <div className="text-2xl font-bold">0.82</div>
                  <div className="text-sm text-muted-foreground">Avg Relevance</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Knowledge Sources</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded border spacing-3">
                    <div>
                      <span className="font-medium">Product Documentation</span>
                      <p className="text-sm text-muted-foreground">524 chunks • Last updated 2 hours ago</p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded border spacing-3">
                    <div>
                      <span className="font-medium">FAQ Database</span>
                      <p className="text-sm text-muted-foreground">342 chunks • Last updated 1 day ago</p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded border spacing-3">
                    <div>
                      <span className="font-medium">Support Articles</span>
                      <p className="text-sm text-muted-foreground">381 chunks • Last updated 3 days ago</p>
                    </div>
                    <Badge variant="secondary">Updating</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={AlertCircle} className="h-5 w-5" />
                Escalation Management
              </CardTitle>
              <CardDescription>Configure when conversations should be escalated to human agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Confidence Threshold: {settings.confidenceThreshold}
                  </label>
                  <Slider
                    value={settings.confidenceThreshold}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings((prev) => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))
                    }
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Conversations with AI confidence below this threshold will be escalated
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Escalations</h4>
                  <div className="space-y-2">
                    <div className="rounded border spacing-3 text-sm">
                      <div className="flex justify-between">
                        <span>Low confidence (45%)</span>
                        <span className="text-muted-foreground">2 min ago</span>
                      </div>
                      <p className="text-muted-foreground">Billing dispute conversation</p>
                    </div>
                    <div className="rounded border spacing-3 text-sm">
                      <div className="flex justify-between">
                        <span>Customer request</span>
                        <span className="text-muted-foreground">15 min ago</span>
                      </div>
                      <p className="text-muted-foreground">Technical support needed</p>
                    </div>
                    <div className="rounded border spacing-3 text-sm">
                      <div className="flex justify-between">
                        <span>Complex inquiry</span>
                        <span className="text-muted-foreground">32 min ago</span>
                      </div>
                      <p className="text-muted-foreground">API integration question</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Escalation Rules</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded border spacing-3">
                      <span className="text-sm">Low AI confidence</span>
                      <Badge variant="primary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded border spacing-3">
                      <span className="text-sm">Customer explicitly requests human</span>
                      <Badge variant="primary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded border spacing-3">
                      <span className="text-sm">Sensitive topics (billing, account)</span>
                      <Badge variant="primary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded border spacing-3">
                      <span className="text-sm">Long conversation (&gt;8 messages)</span>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Settings} className="h-5 w-5" />
                AI System Configuration
              </CardTitle>
              <CardDescription>Configure your unified AI system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Core Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Human-like AI Mode</span>
                        <p className="text-sm text-muted-foreground">Enable sophisticated human-like responses</p>
                      </div>
                      <Switch
                        checked={settings.humanLikeMode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings((prev) => ({ ...prev, humanLikeMode: e.target.checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Knowledge Base</span>
                        <p className="text-sm text-muted-foreground">Use knowledge base for responses</p>
                      </div>
                      <Switch
                        checked={settings.knowledgeBaseEnabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings((prev) => ({ ...prev, knowledgeBaseEnabled: e.target.checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Confidence Threshold: {settings.confidenceThreshold}
                      </label>
                      <Slider
                        value={settings.confidenceThreshold}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings((prev) => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))
                        }
                        max={1}
                        min={0.1}
                        step={0.05}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Save Configuration</h4>
                    <p className="text-sm text-muted-foreground">Apply changes to your AI system</p>
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
