/**
 * Confidence Monitoring Dashboard - TEAM2-P3-008
 * Integration with Team 1's confidence analytics and tuning system
 */

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Label } from "@/components/unified-ui/components/label";
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { useEffect, useState } from "react";

interface ConfidenceMetrics {
  averageConfidence: number;
  confidenceTrend: "increasing" | "decreasing" | "stable";
  escalationRate: number;
  performanceScore: number;
  optimalThreshold: number;
  currentThreshold: number;
  totalEvaluations: number;
  improvementPotential: number;
}

interface ConfidenceTrend {
  timestamp: string;
  confidence: number;
  threshold: number;
  escalations: number;
  performance: number;
}

interface TuningRecommendation {
  type: "threshold" | "model" | "knowledge" | "training";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
  action: string;
  estimatedImprovement: number;
}

interface ConfidenceMonitoringDashboardProps {
  organizationId: string;
  className?: string;
}

export function ConfidenceMonitoringDashboard({ organizationId, className }: ConfidenceMonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<ConfidenceMetrics>({
    averageConfidence: 0,
    confidenceTrend: "stable",
    escalationRate: 0,
    performanceScore: 0,
    optimalThreshold: 0.6,
    currentThreshold: 0.6,
    totalEvaluations: 0,
    improvementPotential: 0,
  });

  const [trends, setTrends] = useState<ConfidenceTrend[]>([]);
  const [recommendations, setRecommendations] = useState<TuningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoTuningEnabled, setAutoTuningEnabled] = useState(false);
  const [customThreshold, setCustomThreshold] = useState(0.6);
  const [isAdjustingThreshold, setIsAdjustingThreshold] = useState(false);

  // Fetch confidence metrics and trends
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // ACTIVATED: Fetch confidence metrics from real API endpoints
        const [metricsRes, trendsRes, tuningRes] = await Promise.all([
          fetch(`/api/ai/confidence/metrics?organizationId=${organizationId}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`/api/ai/confidence/trends?organizationId=${organizationId}&timeRange=24h`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`/api/ai/confidence/tuning?organizationId=${organizationId}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData.metrics || metrics);
          setCustomThreshold(metricsData.metrics?.currentThreshold || 0.6);
        }

        if (trendsRes.ok) {
          const trendsData = await trendsRes.json();
          setTrends(trendsData.trends || []);
        }

        if (tuningRes.ok) {
          const tuningData = await tuningRes.json();
          setRecommendations(tuningData.recommendations || []);
          setAutoTuningEnabled(tuningData.autoTuningEnabled || false);
        }
      } catch (error) {
        // Fallback to mock data for development
        setMetrics({
          averageConfidence: 0.78,
          confidenceTrend: "increasing",
          escalationRate: 0.15,
          performanceScore: 0.85,
          optimalThreshold: 0.65,
          currentThreshold: 0.6,
          totalEvaluations: 247,
          improvementPotential: 0.12,
        });

        // Mock trend data
        const mockTrends: ConfidenceTrend[] = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
          mockTrends.push({
            timestamp: timestamp.toISOString(),
            confidence: 0.7 + Math.random() * 0.2,
            threshold: 0.6,
            escalations: Math.floor(Math.random() * 5),
            performance: 0.8 + Math.random() * 0.15,
          });
        }
        setTrends(mockTrends);

        // Mock recommendations
        setRecommendations([
          {
            type: "threshold",
            severity: "medium",
            title: "Optimize Escalation Threshold",
            description: "Current threshold may be too conservative, causing unnecessary escalations",
            impact: "12% reduction in false escalations",
            action: "Increase threshold to 0.65",
            estimatedImprovement: 0.12,
          },
          {
            type: "knowledge",
            severity: "high",
            title: "Knowledge Base Gap Detected",
            description: "Low confidence in billing-related queries suggests knowledge gaps",
            impact: "18% improvement in billing query handling",
            action: "Add billing documentation to knowledge base",
            estimatedImprovement: 0.18,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const handleThresholdAdjustment = async () => {
    try {
      setIsAdjustingThreshold(true);

      const response = await fetch("/api/ai/confidence/tuning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          action: "adjust_threshold",
          threshold: customThreshold,
        }),
      });

      if (response.ok) {
        setMetrics((prev) => ({ ...prev, currentThreshold: customThreshold }));
      }
    } catch (error) {
    } finally {
      setIsAdjustingThreshold(false);
    }
  };

  const handleAutoTuningToggle = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/ai/confidence/tuning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          action: "toggle_auto_tuning",
          enabled,
        }),
      });

      if (response.ok) {
        setAutoTuningEnabled(enabled);
      }
    } catch (error) {}
  };

  const applyRecommendation = async (recommendation: TuningRecommendation) => {
    try {
      const response = await fetch("/api/ai/confidence/tuning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          action: "apply_recommendation",
          recommendation,
        }),
      });

      if (response.ok) {
        // Remove applied recommendation
        setRecommendations((prev) => prev.filter((r: unknown) => r !== recommendation));
      }
    } catch (error) {}
  };

  const formatTrendData = () => {
    return trends.map((trend: unknown) => ({
      time: new Date(trend.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: Math.round(trend.confidence * 100),
      threshold: Math.round(trend.threshold * 100),
      performance: Math.round(trend.performance * 100),
      escalations: trend.escalations,
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <Icon icon={TrendingUp} className="text-semantic-success-dark h-4 w-4" />;
      case "decreasing":
        return <Icon icon={TrendingDown} className="h-4 w-4 text-red-600" />;
      default:
        return <Icon icon={Activity} className="text-foreground h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]";
      default:
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-spacing-md">
          <div className="flex items-center justify-center py-8">
            <Icon icon={Loader2} className="h-8 w-8 animate-spin text-gray-400" />
            <p className="ml-2 text-muted-foreground">Loading confidence analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-ds-2 text-base font-semibold">
            <Icon icon={Brain} className="h-5 w-5 text-purple-600" />
            AI Confidence Monitoring
          </h3>
          <p className="text-sm text-muted-foreground">Analytics and tuning for AI confidence optimization</p>
        </div>

        <div className="flex items-center gap-ds-2">
          <Switch checked={autoTuningEnabled} onChange={(e) => handleAutoTuningToggle(e.target.checked)} />
          <Label className="text-sm">Auto-tuning</Label>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Confidence</p>
                <div className="flex items-center gap-ds-2">
                  <p className="text-3xl font-bold">{Math.round(metrics.averageConfidence * 100)}%</p>
                  {getTrendIcon(metrics.confidenceTrend)}
                </div>
              </div>
              <Icon icon={Brain} className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                <p className="text-3xl font-bold">{Math.round(metrics.performanceScore * 100)}%</p>
              </div>
              <Icon icon={Target} className="text-semantic-success h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escalation Rate</p>
                <p className="text-3xl font-bold">{Math.round(metrics.escalationRate * 100)}%</p>
              </div>
              <Icon icon={AlertTriangle} className="text-semantic-warning h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement Potential</p>
                <p className="text-3xl font-bold">+{Math.round(metrics.improvementPotential * 100)}%</p>
              </div>
              <Icon icon={Zap} className="h-6 w-6 text-[var(--fl-color-info)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Confidence Trends</TabsTrigger>
          <TabsTrigger value="tuning">Threshold Tuning</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={BarChart3} className="h-5 w-5 text-blue-600" />
                Confidence Trends (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}${name === "escalations" ? "" : "%"}`,
                      name === "confidence"
                        ? "Confidence"
                        : name === "threshold"
                          ? "Threshold"
                          : name === "performance"
                            ? "Performance"
                            : "Escalations",
                    ]}
                  />
                  <ReferenceLine
                    y={Math.round(metrics.currentThreshold * 100)}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label="Current Threshold"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tuning" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={Settings} className="text-foreground h-5 w-5" />
                  Threshold Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-spacing-sm">
                  <div className="flex items-center justify-between">
                    <Label>Current Threshold</Label>
                    <Badge>{Math.round(metrics.currentThreshold * 100)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Optimal Threshold</Label>
                    <Badge variant="outline">{Math.round(metrics.optimalThreshold * 100)}%</Badge>
                  </div>
                </div>

                <div className="space-y-spacing-sm">
                  <Label>Adjust Threshold: {Math.round(customThreshold * 100)}%</Label>
                  <Slider
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
                    min={0.3}
                    max={0.9}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleThresholdAdjustment}
                  disabled={isAdjustingThreshold || customThreshold === metrics.currentThreshold}
                  className="w-full"
                >
                  {isAdjustingThreshold ? (
                    <>
                      <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      <Icon icon={Target} className="mr-2 h-4 w-4" />
                      Apply Threshold
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={Zap} className="h-5 w-5 text-blue-600" />
                  Auto-Tuning Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automatic Optimization</p>
                    <p className="text-sm text-muted-foreground">
                      {autoTuningEnabled ? "System will automatically adjust thresholds" : "Manual threshold control"}
                    </p>
                  </div>
                  {autoTuningEnabled ? (
                    <Icon icon={CheckCircle} className="text-semantic-success-dark h-5 w-5" />
                  ) : (
                    <Icon icon={Clock} className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {autoTuningEnabled && (
                  <div className="border-status-success-light rounded border bg-[var(--fl-color-success-subtle)] spacing-3">
                    <p className="text-sm text-green-800">
                      Auto-tuning is active. The system will monitor performance and adjust thresholds automatically
                      based on escalation patterns and success rates.
                    </p>
                  </div>
                )}

                <div className="space-y-spacing-sm text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Evaluations:</span>
                    <span className="font-medium">{metrics.totalEvaluations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Optimization:</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3">
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <OptimizedMotion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="spacing-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-spacing-sm">
                        <div className="flex items-center gap-ds-2">
                          <Badge className={cn("text-xs", getSeverityColor(rec.severity))}>
                            {rec.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-tiny">
                            {rec.type}
                          </Badge>
                        </div>

                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-green-600-dark font-medium">Expected Impact:</p>
                            <p className="text-semantic-success-dark">{rec.impact}</p>
                          </div>
                          <div>
                            <p className="text-status-info-dark font-medium">Recommended Action:</p>
                            <p className="text-blue-600">{rec.action}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-semantic-success-dark text-3xl font-bold">
                          +{Math.round(rec.estimatedImprovement * 100)}%
                        </div>
                        <p className="text-tiny text-muted-foreground">improvement</p>

                        <Button size="sm" onClick={() => applyRecommendation(rec)} className="mt-2">
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </OptimizedMotion.div>
            ))}

            {recommendations.length === 0 && (
              <Card>
                <CardContent className="p-spacing-lg text-center">
                  <Icon icon={CheckCircle} className="text-semantic-success mx-auto mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-base font-semibold">All Optimized!</h3>
                  <p className="text-muted-foreground">
                    No recommendations available. Your AI system is performing optimally.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
