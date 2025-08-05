"use client";

import {
  LazyComprehensiveDashboard,
  LazyPerformanceMonitoringDashboard,
  LazyRAGAnalyticsDashboard,
  LazyRealtimeMetricsDashboard,
} from "@/components/LazyComponents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMemoryLeakDetector } from "@/hooks/useMemoryMonitor";
import { Icon } from "@/lib/ui/Icon";
import {
  Activity,
  ArrowSquareOut,
  ChartBar as BarChart3,
  Robot as Bot,
  CheckCircle,
  Fire as Flame,
  ChatCircle as MessageSquare,
  Sparkle as Sparkles,
  Star,
  Target,
  TrendUp as TrendingUp,
  Users,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AnalyticsMetrics {
  totalConversations: number;
  resolutionRate: number;
  avgResponseTime: string;
  customerSatisfaction: number;
  activeAgents: number;
  aiHandledRate: number;
  escalationRate: number;
  performanceScore: number;
}

// Memoized metric card component
const AnalyticsMetricCard = React.memo(
  ({
    gradient,
    icon: Icon,
    badge,
    value,
    label,
    subValue,
  }: {
    gradient: string;
    icon: unknown;
    badge: string;
    value: string | number;
    label: string;
    subValue?: string;
  }) => (
    <Card className={`${gradient} border-0 text-white shadow-lg`}>
      <CardContent className="spacing-6">
        <div className="mb-4 flex items-center justify-between">
          <Icon className="h-8 w-8" />
          <Badge className="border-0 bg-white/20 text-xs text-white">{badge}</Badge>
        </div>
        <div className="mb-1 text-3xl font-bold">{value}</div>
        <div className="text-sm text-blue-100">{label}</div>
        {subValue && <div className="mt-1 text-xs text-blue-200">{subValue}</div>}
      </CardContent>
    </Card>
  )
);

AnalyticsMetricCard.displayName = "AnalyticsMetricCard";

// Memoized progress item
const ProgressItem = React.memo(({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) => (
  <div>
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-[var(--fl-color-text-muted)]">
        {value}
        {suffix}
      </span>
    </div>
    <Progress value={value} className="h-3" />
  </div>
));

ProgressItem.displayName = "ProgressItem";

const AnalyticsContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [userName] = useState("Analytics Manager");

  // Memory leak detection
  useMemoryLeakDetector("AnalyticsContent");

  // Refs for cleanup
  const loadTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalConversations: 1547,
    resolutionRate: 94.2,
    avgResponseTime: "2.3 min",
    customerSatisfaction: 4.8,
    activeAgents: 8,
    aiHandledRate: 67,
    escalationRate: 15,
    performanceScore: 92,
  });

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Memoized current time
  const currentTime = useMemo(() => new Date().toLocaleTimeString(), [metrics]);

  // Memoized tab content
  const tabContent = useMemo(
    () => ({
      overview: {
        title: "Comprehensive Analytics",
        icon: BarChart3,
        component: <LazyComprehensiveDashboard organizationId={organizationId || ""} />,
      },
      "ai-performance": {
        title: "AI Performance Analytics",
        icon: Bot,
        component: (
          <LazyRAGAnalyticsDashboard
            organizationId={organizationId || ""}
            showExportOptions={true}
            refreshInterval={30}
          />
        ),
      },
      realtime: {
        title: "Real-time Metrics",
        icon: Activity,
        component: <LazyRealtimeMetricsDashboard />,
      },
      performance: {
        title: "Performance Monitoring",
        icon: Lightning,
        component: <LazyPerformanceMonitoringDashboard organizationId={organizationId || ""} />,
      },
    }),
    [organizationId]
  );

  useEffect(() => {
    loadTimerRef.current = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // REMOVED: Simulated polling interval replaced with real-time analytics
    // Connect to the DashboardMetricsManager for real-time analytics updates

    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }

    };
  }, []);

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-ds-full border-4 border-[var(--fl-color-brand)] border-t-transparent"></div>
              <p className="text-gray-600">Loading organization...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="space-y-8">
            <div className="h-32 animate-pulse radius-2xl bg-gray-200"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-ds-xl bg-gray-200"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-ds-xl bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Welcome Header with Fire Icon */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-4">
            <Icon icon={Flame} size={47} className="flex-shrink-0 text-blue-600" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, {userName}!
              </h1>
              <p className="mt-1 text-xl text-gray-600">Comprehensive performance analytics</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-[var(--fl-color-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
              <span>Live data • Last updated {currentTime}</span>
            </div>
            <Button
              onClick={() => handleNavigation("/dashboard")}
              variant="outline"
              size="sm"
              className="border-status-info-light flex items-center gap-2 text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
            >
              <Icon icon={Zap} className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Analytics Metrics - Beautiful Blue Theme */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsMetricCard
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            icon={MessageSquare}
            badge="Total"
            value={metrics.totalConversations}
            label="Conversations"
          />
          <AnalyticsMetricCard
            gradient="bg-gradient-to-br from-blue-400 to-blue-500"
            icon={CheckCircle}
            badge="Rate"
            value={`${metrics.resolutionRate}%`}
            label="Resolution Rate"
          />
          <AnalyticsMetricCard
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            icon={Star}
            badge="Rating"
            value={metrics.customerSatisfaction}
            label="Satisfaction"
            subValue="out of 5.0"
          />
          <AnalyticsMetricCard
            gradient="bg-gradient-to-br from-blue-300 to-blue-400"
            icon={Target}
            badge="Score"
            value={`${metrics.performanceScore}%`}
            label="Performance"
          />
        </div>

        {/* Main Analytics Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Icon icon={BarChart3} className="h-4 w-4" />
                <span className="hidden sm:block">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <Icon icon={MessageSquare} className="h-4 w-4" />
                <span className="hidden sm:block">Conversations</span>
              </TabsTrigger>
              <TabsTrigger value="ai-performance" className="flex items-center gap-2">
                <Icon icon={Bot} className="h-4 w-4" />
                <span className="hidden sm:block">AI Performance</span>
              </TabsTrigger>
              <TabsTrigger value="realtime" className="flex items-center gap-2">
                <Icon icon={Activity} className="h-4 w-4" />
                <span className="hidden sm:block">Real-time</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Icon icon={Users} className="h-4 w-4" />
                <span className="hidden sm:block">Team</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Performance Summary */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={TrendingUp} className="h-6 w-6 text-blue-600" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressItem label="Overall Performance" value={metrics.performanceScore} />
                  <ProgressItem label="AI Handling Rate" value={metrics.aiHandledRate} />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.activeAgents}</div>
                      <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                        Active Agents
                      </div>
                    </div>
                    <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.escalationRate}%</div>
                      <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                        Escalation Rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Dashboard */}
              <div className="lg:col-span-2">
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Icon icon={BarChart3} className="h-6 w-6 text-blue-600" />
                      {tabContent.overview.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{tabContent.overview.component}</CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={MessageSquare} className="h-6 w-6 text-blue-600" />
                    Conversation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
                    <span className="text-sm font-medium text-blue-900">Total Conversations</span>
                    <Badge className="bg-blue-600 text-white">{metrics.totalConversations}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-ds-lg bg-emerald-50 spacing-3">
                    <span className="text-sm font-medium text-emerald-900">Resolution Rate</span>
                    <Badge className="bg-emerald-600 text-white">{metrics.resolutionRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-ds-lg bg-amber-50 spacing-3">
                    <span className="text-sm font-medium text-amber-900">Avg Response Time</span>
                    <Badge className="bg-amber-600 text-white">{metrics.avgResponseTime}</Badge>
                  </div>

                  <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                    <div className="flex items-start gap-3">
                      <Icon icon={Sparkles} className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="mb-1 font-semibold text-blue-900">Conversation Insight</h4>
                        <p className="text-status-info-dark leading-relaxed text-sm">
                          Conversation volume has increased 12% this month with improved resolution rates.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-lg lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={TrendingUp} className="h-6 w-6 text-blue-600" />
                    Conversation Volume Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-ds-xl bg-gradient-to-r from-neutral-50 to-neutral-100">
                    <div className="text-center text-[var(--fl-color-text-muted)]">
                      <Icon icon={BarChart3} className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                      <p>Conversation trends chart visualization</p>
                      <p className="mt-1 text-sm">Real-time data visualization would appear here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Performance Tab */}
          <TabsContent value="ai-performance" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Bot} className="h-6 w-6 text-blue-600" />
                  {tabContent["ai-performance"].title}
                </CardTitle>
              </CardHeader>
              <CardContent>{tabContent["ai-performance"].component}</CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Activity} className="h-6 w-6 text-blue-600" />
                  {tabContent.realtime.title}
                </CardTitle>
              </CardHeader>
              <CardContent>{tabContent.realtime.component}</CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={Users} className="h-6 w-6 text-blue-600" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
                    <span className="text-sm font-medium text-blue-900">Active Agents</span>
                    <Badge className="bg-blue-600 text-white">{metrics.activeAgents}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-ds-lg bg-purple-50 spacing-3">
                    <span className="text-sm font-medium text-purple-900">Avg Conversations/Agent</span>
                    <Badge className="bg-purple-600 text-white">12.5</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-ds-lg bg-emerald-50 spacing-3">
                    <span className="text-sm font-medium text-emerald-900">Customer Satisfaction</span>
                    <Badge className="bg-emerald-600 text-white">{metrics.customerSatisfaction}/5.0</Badge>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => handleNavigation("/dashboard/team")}
                    >
                      <Icon icon={Users} className="mr-2 h-5 w-5" />
                      Team Management
                      <Icon icon={ArrowSquareOut} className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={Star} className="h-6 w-6 text-blue-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-ds-xl bg-gradient-to-r from-neutral-50 to-neutral-100">
                    <div className="text-center text-[var(--fl-color-text-muted)]">
                      <Icon icon={Users} className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                      <p>Team performance leaderboard</p>
                      <p className="mt-1 text-sm">Performance rankings would appear here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const DashboardAnalyticsPage = () => {
  return <AnalyticsContent />;
};

export default React.memo(DashboardAnalyticsPage);
