"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Download,
  Funnel as Filter,
  ChatCircle as MessageSquare,
  Minus,
  Plus,
  ArrowsClockwise as RefreshCw,
  Gear as Settings,
  TrendUp as TrendingUp,
  Users,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface DashboardStat {
  title: string;
  value: string;
  description: string;
  trend: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
}

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  time_ago: string;
  status: string;
}

export default function OverviewPage() {
  const { resolvedTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch stats and activity in parallel
      const [statsResponse, activityResponse] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/activity?limit=4"),
      ]);

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      if (!activityResponse.ok) {
        throw new Error("Failed to fetch recent activity");
      }

      const statsData = await statsResponse.json();
      const activityData = await activityResponse.json();

      if (statsData.success) {
        // Add icons to stats
        const statsWithIcons = statsData.data.stats.map((stat: DashboardStat, index: number) => ({
          ...stat,
          icon: [
            <Icon icon={MessageSquare} className="h-5 w-5" key="msg" />,
            <Icon icon={Users} className="h-5 w-5" key="users" />,
            <Icon icon={Clock} className="h-5 w-5" key="clock" />,
            <Icon icon={TrendingUp} className="h-5 w-5" key="trend" />,
          ][index] || <Icon icon={TrendingUp} className="h-5 w-5" key="default" />,
        }));
        setStats(statsWithIcons);
      }

      if (activityData.success && activityData.data.events) {
        // Transform activity data to match our interface
        const transformedActivity = activityData.data.events.map((event: unknown, index: number) => ({
          id: event.id || index,
          type: event.type || "general",
          title: getActivityTitle(event.action || event.type),
          description: event.description,
          time_ago: getTimeAgo(event.timestamp),
          status: getActivityStatus(event.action || event.type),
        }));
        setRecentActivity(transformedActivity);
      }
    } catch (err) {

      setError(err instanceof Error ? err.message : "Failed to load dashboard data");

      // Fallback to basic stats if API fails
      setStats([
        {
          title: "Dashboard",
          value: "Ready",
          description: "Loading...",
          trend: { value: 0, label: "initializing", direction: "up" },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="bg-background-secondary/30 min-h-full transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6 spacing-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="mt-1 text-gray-600">Welcome back! Here's what's happening with your customer support.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            <Button size="sm">New Report</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
              variant="elevated"
              className="transition-transform duration-200 hover:scale-105"
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle size="lg">Recent Activity</CardTitle>
                <Badge variant="secondary" className="bg-surface-accent text-text-accent">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-error-50 border-error-200 rounded-ds-lg border spacing-4">
                  <p className="text-error-700 text-sm">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-error-600 hover:text-error-700 mt-2"
                  >
                    Try again
                  </Button>
                </div>
              )}

              {isLoading && !recentActivity.length ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-ds-lg spacing-3">
                      <div className="mt-2 h-2 w-2 animate-pulse rounded-ds-full bg-gray-300" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                recentActivity.map((activity: ActivityItem) => (
                  <div
                    key={activity.id}
                    className="hover:bg-surface-hover flex items-start gap-3 rounded-ds-lg spacing-3 transition-colors duration-200"
                  >
                    <div
                      className={`mt-2 h-2 w-2 rounded-ds-full ${
                        activity.status === "active"
                          ? "bg-primary-500"
                          : activity.status === "success"
                            ? "bg-success-500"
                            : activity.status === "warning"
                              ? "bg-warning-500"
                              : "bg-neutral-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                      <p className="mt-1 text-xs text-text-tertiary">{activity.time_ago}</p>
                    </div>
                  </div>
                ))
              )}

              {!isLoading && !error && recentActivity.length === 0 && (
                <div className="py-8 text-center">
                  <Icon icon={MessageSquare} className="mx-auto mb-2 h-12 w-12 text-text-tertiary" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-xs text-text-tertiary">Activity will appear here as it happens</p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle size="lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Start New Conversation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Manage Team
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Configure Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View Analytics
              </Button>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-xs text-text-tertiary">Need help getting started?</p>
                <Button variant="ghost" size="sm" className="text-text-accent w-full">
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts Section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle size="lg">Conversation Volume</CardTitle>
              <p className="text-sm text-gray-600">Daily conversation trends over the past week</p>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart */}
              <div className="bg-surface-secondary flex h-64 items-center justify-center rounded-ds-lg">
                <div className="text-center">
                  <Icon icon={TrendingUp} className="mx-auto mb-2 h-12 w-12 text-text-tertiary" />
                  <p className="text-gray-600">Chart visualization</p>
                  <p className="text-xs text-text-tertiary">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle size="lg">Response Times</CardTitle>
              <p className="text-sm text-gray-600">Average response time by hour</p>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart */}
              <div className="bg-surface-secondary flex h-64 items-center justify-center rounded-ds-lg">
                <div className="text-center">
                  <Icon icon={Clock} className="mx-auto mb-2 h-12 w-12 text-text-tertiary" />
                  <p className="text-gray-600">Time-based analytics</p>
                  <p className="text-xs text-text-tertiary">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Demo Section */}
        <Card variant="outlined" className="border-border-accent border-2 border-dashed">
          <CardHeader>
            <CardTitle size="lg" className="flex items-center gap-2">
              🎨 Design System Demo
              <Badge variant="secondary" className="bg-primary-100 text-primary-700">
                New
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              This page showcases our new design system with {resolvedTheme === "dark" ? "dark" : "light"} mode support.
              Try switching themes using the toggle in the header!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Color Tokens</h4>
                <div className="flex gap-2">
                  <div className="bg-primary-500 h-8 w-8 rounded border border-border" title="Primary" />
                  <div className="bg-success-500 h-8 w-8 rounded border border-border" title="Success" />
                  <div className="bg-warning-500 h-8 w-8 rounded border border-border" title="Warning" />
                  <div className="bg-error-500 h-8 w-8 rounded border border-border" title="Error" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Typography</h4>
                <div className="space-y-1">
                  <p className="text-xs text-text-tertiary">Small text</p>
                  <p className="text-sm text-gray-600">Regular text</p>
                  <p className="text-base font-medium text-gray-900">Medium text</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Components</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary">
                    Primary
                  </Button>
                  <Button size="sm" variant="outline">
                    Outline
                  </Button>
                  <Button size="sm" variant="ghost">
                    Ghost
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
