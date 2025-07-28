"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Brain,
  Calendar,
  ChatCircle,
  Clock,
  Fire,
  Lightning,
  Sparkle,
  TrendUp,
  Users,
  Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { ListItem } from "@/components/unified-ui/components/ListItem";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useOrganizationRealtimeSubscription } from "@/contexts/OrganizationRealtimeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  badge?: string | undefined;
}

export function WelcomeDashboard() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const router = useRouter();

  // Use real dashboard metrics
  const {
    metrics,
    loading,
    error: metricsError,
  } = useDashboardMetrics({
    range: "today",
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Memoize realtime options to prevent infinite re-renders
  const realtimeOptions = useMemo(
    () => ({
      onNewMessage: (message: any) => {
        // Metrics will auto-refresh via the hook
      },
      onConversationUpdate: (update: any) => {
        // Metrics will auto-refresh via the hook
      },
      onNewConversation: (conversation: any) => {
        // Metrics will auto-refresh via the hook
      },
    }),
    []
  );

  // Realtime updates using native Supabase provider
  useOrganizationRealtimeSubscription(realtimeOptions);

  const quickActions: QuickAction[] = [
    {
      id: "inbox",
      title: "Inbox",
      description: "Manage conversations",
      icon: ChatCircle,
      href: "/dashboard/inbox",
      color: "blue",
      badge: metrics?.totalConversations ? `${metrics.totalConversations} active` : undefined,
    },
    {
      id: "knowledge",
      title: "Knowledge Base",
      description: "Search articles & docs",
      icon: Brain,
      href: "/knowledge",
      color: "blue",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Performance insights",
      icon: TrendUp,
      href: "/analytics",
      color: "blue",
    },
    {
      id: "ai-insights",
      title: "AI Insights",
      description: "Smart recommendations",
      icon: Sparkle,
      href: "/ai-insights",
      color: "blue",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Agent";

  // Fixed loading animation - no pulsating border
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="space-y-8">
            <div className="h-32 radius-2xl bg-gray-200"></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-ds-xl bg-gray-200"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="h-80 rounded-ds-xl bg-gray-200"></div>
              <div className="h-80 rounded-ds-xl bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <Card className="border-status-error-light bg-[var(--fl-color-danger-subtle)]">
            <CardContent className="p-spacing-lg text-center">
              <Warning className="text-brand-mahogany-500 mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-base font-semibold text-red-900">Unable to Load Dashboard</h3>
              <p className="text-red-600-dark mb-4">{metricsError?.message || "Unable to load dashboard data"}</p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="text-red-600-dark rounded-ds-md border border-[var(--fl-color-danger-muted)] px-4 py-2 transition-colors hover:bg-[var(--fl-color-danger-subtle)]"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Welcome Header with Fire Icon */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-3">
            <Fire size={47} weight="fill" className="flex-shrink-0 text-blue-600" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-foreground mt-1 text-lg">Welcome to your Campfire dashboard</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-ds-2 text-sm text-[var(--fl-color-text-muted)]">
            <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
            <span>Live data • Last updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Key Metrics - All Blue Theme */}
        <div className="mb-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-metrics">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center justify-between">
                <ChatCircle className="h-8 w-8" weight="duotone" />
                <Badge className="bg-background/20 border-0 text-tiny text-white">Today</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold" data-testid="total-conversations">
                {metrics?.totalConversations || 0}
              </div>
              <div className="text-sm text-blue-100">Total Conversations</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-400 to-blue-500 text-white">
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center justify-between">
                <Clock className="h-8 w-8" weight="duotone" />
                <Badge className="bg-background/20 border-0 text-tiny text-white">Avg</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold" data-testid="avg-response-time">
                {metrics?.responseTime || "< 1 min"}
              </div>
              <div className="text-sm text-blue-100">Response Time</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center justify-between">
                <Users className="h-8 w-8" weight="duotone" />
                <Badge className="bg-background/20 border-0 text-tiny text-white">Active</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold" data-testid="ai-handovers">
                {metrics?.activeAgents || 0}
              </div>
              <div className="text-sm text-blue-100">Team Members</div>
            </CardContent>
          </Card>

          {/* RAG Feature Card */}
          <Card
            className="bg-background group cursor-pointer border-0 transition-all duration-300 hover:bg-[var(--fl-color-info-subtle)]"
            onClick={() => router.push("/ai-insights")}
          >
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-16 w-16 overflow-hidden rounded-ds-xl">
                  <img src="/images/rag.png" alt="RAG AI System" className="h-full w-full object-cover" />
                </div>
                <Badge className="text-status-info-dark border-0 bg-[var(--fl-color-info-subtle)] text-tiny font-semibold">
                  AI POWERED
                </Badge>
              </div>
              <div className="text-status-info-dark mb-1 text-3xl font-bold" data-testid="satisfaction-score">
                {metrics?.satisfactionRate || 95}%
              </div>
              <div className="text-sm font-medium text-blue-600">RAG Accuracy Rate</div>
              <div className="mt-2 text-tiny text-[var(--fl-color-text-muted)] opacity-75 transition-opacity group-hover:opacity-100">
                Click to explore AI insights →
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="bg-background border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-ds-2 text-lg">
                <Lightning className="h-6 w-6 text-blue-600" weight="duotone" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action: any) => {
                const IconComponent = action.icon;

                return (
                  <ListItem
                    key={action.id}
                    variant="button"
                    onClick={() => router.push(action.href)}
                    icon={IconComponent as any}
                    title={action.title}
                    description={action.description}
                    badge={
                      action.badge && (
                        <Badge variant="secondary" className="text-tiny">
                          {action.badge}
                        </Badge>
                      )
                    }
                  />
                );
              })}
            </CardContent>
          </Card>

          {/* Daily Progress & Insights */}
          <Card className="bg-background border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-ds-2 text-lg">
                <Calendar className="h-6 w-6 text-blue-600" weight="duotone" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Messages Progress */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium">Messages Handled</span>
                  <span className="text-sm text-[var(--fl-color-text-muted)]">
                    {metrics?.messagesToday || 0}/50 goal
                  </span>
                </div>
                <Progress value={Math.min(((metrics?.messagesToday || 0) / 50) * 100, 100)} className="h-3" />
              </div>

              {/* AI Insights */}
              <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-3">
                <div className="flex items-start gap-3">
                  <Sparkle className="h-6 w-6 text-blue-600" weight="fill" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-blue-900">AI Insight</h4>
                    <p className="text-status-info-dark leading-relaxed text-sm">
                      {(metrics?.totalConversations || 0) > 0
                        ? `Great work! You're maintaining excellent response times. Your satisfaction rate of ${metrics?.satisfactionRate || 95}% is above target.`
                        : "Ready to start your day! Your dashboard will show insights as you handle conversations."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
                  <div className="text-3xl font-bold text-gray-900">{metrics?.messagesToday || 0}</div>
                  <div className="text-tiny uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                    Messages Today
                  </div>
                </div>
                <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
                  <div className="text-3xl font-bold text-gray-900" data-testid="active-conversations">
                    {metrics?.activeAgents || 0}
                  </div>
                  <div className="text-tiny uppercase tracking-wide text-[var(--fl-color-text-muted)]">Team Online</div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                className="bg-primary flex w-full items-center justify-center gap-ds-2 rounded-ds-md px-4 py-2 text-white transition-colors hover:bg-blue-700"
                onClick={() => router.push("/dashboard/inbox")}
              >
                <ChatCircle className="h-5 w-5" weight="duotone" />
                Start Handling Conversations
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
