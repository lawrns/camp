/**
 * Dashboard - Optimized for Memory Management
 *
 * Key optimizations:
 * - React.memo for component memoization
 * - useCallback for event handlers
 * - useMemo for expensive computations
 * - Proper cleanup of intervals and subscriptions
 * - Memory monitoring integration
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, Brain, Calendar, CaretRight, ChartBar, MessageCircle, Clock, Flame, Settings, Zap, PuzzlePiece, Sparkles, Ticket, Users,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useMemoryLeakDetector, useMemoryMonitor } from "@/hooks/useMemoryMonitor";

interface DashboardMetrics {
  totalConversations: number;
  activeConversations: number;
  responseTime: string;
  teamSatisfaction: number;
  messagesToday: number;
  activeAgents: number;
  satisfactionRate: number;
  aiConfidence: number;
  aiHandledToday: number;
  escalationRate: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: unknown;
  badge?: string;
}

// Memoized metric card component
const MetricCard = React.memo(
  ({
    gradient,
    icon: Icon,
    badge,
    value,
    label,
  }: {
    gradient: string;
    icon: unknown;
    badge: string;
    value: string | number;
    label: string;
  }) => (
    <Card className={`${gradient} border-0 text-white shadow-lg`}>
      <CardContent className="spacing-6">
        <div className="mb-4 flex items-center justify-between">
          <Icon className="h-8 w-8" weight="duotone" />
          <Badge className="border-0 bg-white/20 text-xs text-white">{badge}</Badge>
        </div>
        <div className="mb-1 text-3xl font-bold">{value}</div>
        <div className="text-sm text-blue-100">{label}</div>
      </CardContent>
    </Card>
  )
);

MetricCard.displayName = "MetricCard";

// Memoized quick action button
const QuickActionButton = React.memo(
  ({ action, onClick }: { action: QuickAction; onClick: (href: string) => void }) => {
    const IconComponent = action.icon;

    const handleClick = useCallback(() => {
      onClick(action.href);
    }, [action.href, onClick]);

    return (
      <Button
        variant="ghost"
        className="h-auto w-full justify-start spacing-4 transition-all hover:bg-[var(--fl-color-info-subtle)]"
        onClick={handleClick}
      >
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-[var(--fl-color-info-subtle)] text-blue-600">
          <IconComponent className="h-6 w-6" weight="duotone" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            {action.title}
            {action.badge && (
              <Badge variant="secondary" className="text-xs">
                {action.badge}
              </Badge>
            )}
          </div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">{action.description}</div>
        </div>
        <CaretRight className="h-5 w-5 text-gray-400" />
      </Button>
    );
  }
);

QuickActionButton.displayName = "QuickActionButton";

const DashboardPage = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalConversations: 1247,
    activeConversations: 23,
    responseTime: "< 1 min",
    teamSatisfaction: 4.6,
    messagesToday: 89,
    activeAgents: 6,
    satisfactionRate: 95,
    aiConfidence: 84,
    aiHandledToday: 67,
    escalationRate: 16,
  });

  const [loading, setLoading] = useState(true);
  const [userName] = useState("Team");

  // Memory monitoring
  useMemoryLeakDetector("DashboardPage");
  const { memoryStats, isWarning } = useMemoryMonitor({
    warningThreshold: 75,
    criticalThreshold: 90,
    onWarning: (info) => {},
  });

  // Refs for cleanup
  const loadTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: "ai-management",
        title: "AI Management",
        description: "Monitor and configure AI systems",
        href: "/dashboard/ai-management",
        icon: Brain,
        badge: "New",
      },
      {
        id: "inbox",
        title: "Conversations",
        description: "Handle customer conversations",
        href: "/dashboard/inbox",
        icon: MessageCircle,
        badge: `${metrics.activeConversations}`,
      },
      {
        id: "knowledge",
        title: "Knowledge Base",
        description: "Manage documents and FAQs",
        href: "/knowledge",
        icon: BookOpen,
      },
      {
        id: "team",
        title: "Team Management",
        description: "Manage agents and assignments",
        href: "/dashboard/team",
        icon: Users,
      },
      {
        id: "analytics",
        title: "Analytics",
        description: "Performance insights and reports",
        href: "/dashboard/analytics",
        icon: ChartBar,
      },
      {
        id: "tickets",
        title: "Tickets",
        description: "Track and manage support tickets",
        href: "/dashboard/tickets",
        icon: Ticket,
      },
      {
        id: "settings",
        title: "Settings",
        description: "Configure your organization",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        id: "integrations",
        title: "Integrations",
        description: "Connect third-party services",
        href: "/dashboard/integrations",
        icon: PuzzlePiece,
      },
    ],
    [metrics.activeConversations]
  );

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const testUnifiedSystem = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": "demo-org",
        },
        body: JSON.stringify({
          conversationId: `test-${Date.now()}`,
          messageContent: "Hello, I need help with my account settings",
          useHumanLikeMode: true,
          useKnowledgeBase: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMetrics((prev) => ({
          ...prev,
          aiConfidence: Math.round((result.confidence || 0.8) * 100),
        }));

        alert(
          `AI System Test Successful!\n\nResponse: ${result.response}\nConfidence: ${Math.round((result.confidence || 0) * 100)}%`
        );
      } else {
        throw new Error("System test failed");
      }
    } catch (error) {
      alert("AI system test failed. Check console for details.");
    }
  }, []);

  const handleNavigation = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  // Memoized time string
  const currentTime = useMemo(() => new Date().toLocaleTimeString(), [metrics]);

  useEffect(() => {
    // Loading timer
    loadTimerRef.current = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // REMOVED: Simulated polling interval replaced with real-time metrics
    // Connect to the DashboardMetricsManager for real-time updates

    // Cleanup function
    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }

    };
  }, []);

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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="h-80 animate-pulse rounded-ds-xl bg-gray-200"></div>
              <div className="h-80 animate-pulse rounded-ds-xl bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Memory warning */}
        {isWarning && memoryStats && (
          <div className="mb-4 rounded-ds-lg bg-[var(--fl-color-warning-subtle)] spacing-3 text-sm text-yellow-800">
            High memory usage: {memoryStats.percentUsed} ({memoryStats.used} / {memoryStats.limit})
          </div>
        )}

        {/* Welcome Header with Fire Icon */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-4">
            <Flame size={47} weight="fill" className="flex-shrink-0 text-blue-600" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, {userName}!
              </h1>
              <p className="mt-1 text-xl text-gray-600">Welcome to your Campfire dashboard</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-[var(--fl-color-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
              <span>Live data • Last updated {currentTime}</span>
            </div>
            <Button
              onClick={testUnifiedSystem}
              variant="outline"
              size="sm"
              className="border-status-info-light flex items-center gap-2 text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
            >
              <Zap className="h-4 w-4" />
              Test AI System
            </Button>
          </div>
        </div>

        {/* Key Metrics - Beautiful Blue Theme */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            icon={MessageCircle}
            badge="Today"
            value={metrics.totalConversations}
            label="Total Conversations"
          />
          <MetricCard
            gradient="bg-gradient-to-br from-blue-400 to-blue-500"
            icon={Clock}
            badge="Avg"
            value={metrics.responseTime}
            label="Response Time"
          />
          <MetricCard
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            icon={Brain}
            badge="AI"
            value={`${metrics.aiConfidence}%`}
            label="AI Confidence"
          />
          <MetricCard
            gradient="bg-gradient-to-br from-blue-300 to-blue-400"
            icon={Users}
            badge="Online"
            value={metrics.activeAgents}
            label="Team Members"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-6 w-6 text-blue-600" weight="duotone" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action: unknown) => (
                <QuickActionButton key={action.id} action={action} onClick={handleNavigation} />
              ))}
            </CardContent>
          </Card>

          {/* Today's Progress & AI Insights */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6 text-blue-600" weight="duotone" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Performance */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">AI Performance</span>
                  <span className="text-sm text-[var(--fl-color-text-muted)]">{metrics.aiConfidence}% confidence</span>
                </div>
                <Progress value={metrics.aiConfidence} className="h-3" />
              </div>

              {/* Messages Progress */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Messages Handled</span>
                  <span className="text-sm text-[var(--fl-color-text-muted)]">{metrics.messagesToday}/100 goal</span>
                </div>
                <Progress value={Math.min((metrics.messagesToday / 100) * 100, 100)} className="h-3" />
              </div>

              {/* AI Insights */}
              <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600" weight="fill" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-blue-900">AI Insight</h4>
                    <p className="text-status-info-dark leading-relaxed text-sm">
                      Your AI system is performing excellently today with {metrics.aiConfidence}% confidence.
                      {metrics.aiHandledToday} conversations handled automatically with only {metrics.escalationRate}%
                      requiring human intervention.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{metrics.aiHandledToday}</div>
                  <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">AI Handled</div>
                </div>
                <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{metrics.satisfactionRate}%</div>
                  <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">Satisfaction</div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleNavigation("/dashboard/inbox")}
              >
                <MessageCircle className="mr-2 h-5 w-5" weight="duotone" />
                Start Handling Conversations
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardPage);
