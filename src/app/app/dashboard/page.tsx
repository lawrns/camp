"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Bell, ChatCircle, Clock, Fire, MagnifyingGlass as Search, Gear as Settings, Users } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EnhancedDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Mock metrics for now to avoid hook issues
  const metrics = {
    conversations: 1234,
    activeAgents: 12,
    responseTime: "2.3m",
    satisfaction: "94%",
    pendingTickets: 23,
    resolvedToday: 45,
    loading: false,
    error: null
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("[Dashboard] User not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state while auth is initializing
  if (loading || metrics.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Design System */}
      <header className="ds-bg-surface ds-border-b ds-border-border ds-px-6 ds-py-4">
        <div className="ds-flex ds-items-center ds-justify-between">
          <div>
            <h1 className="ds-text-2xl ds-font-bold ds-text-foreground">Dashboard</h1>
            <p className="ds-text-sm ds-text-muted-foreground">
              {user ? `Welcome back, ${user.email}` : "Welcome to Campfire"}
            </p>
          </div>

          <div className="ds-flex ds-items-center ds-gap-3">
            <Button variant="outline" size="sm" className="ds-focus-ring">
              <Search className="ds-h-4 ds-w-4 ds-mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm" className="ds-focus-ring">
              <Bell className="ds-h-4 ds-w-4" />
            </Button>
            <Button variant="outline" size="sm" className="ds-focus-ring">
              <Settings className="ds-h-4 ds-w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Enhanced Metrics Grid with Design System */}
        <div className="ds-grid ds-grid-cols-1 ds-gap-6 sm:ds-grid-cols-2 lg:ds-grid-cols-3 xl:ds-grid-cols-6 ds-mb-8">
          <div className="ds-dashboard-card ds-bg-primary-500 ds-text-primary-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <ChatCircle className="ds-h-6 ds-w-6 ds-text-primary-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Live</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-primary-50">{metrics.conversations}</div>
              <div className="ds-text-xs ds-text-primary-100">Active Conversations</div>
            </div>
          </div>

          <div className="ds-dashboard-card ds-bg-success-500 ds-text-success-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <Users className="ds-h-6 ds-w-6 ds-text-success-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Online</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-success-50">{metrics.activeAgents}</div>
              <div className="ds-text-xs ds-text-success-100">Active Agents</div>
            </div>
          </div>

          <div className="ds-dashboard-card ds-bg-info-500 ds-text-info-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <Clock className="ds-h-6 ds-w-6 ds-text-info-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Avg</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-info-50">{metrics.responseTime}</div>
              <div className="ds-text-xs ds-text-info-100">Response Time</div>
            </div>
          </div>

          <div className="ds-dashboard-card ds-bg-warning-500 ds-text-warning-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <Fire className="ds-h-6 ds-w-6 ds-text-warning-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Score</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-warning-50">{metrics.satisfaction}</div>
              <div className="ds-text-xs ds-text-warning-100">Satisfaction</div>
            </div>
          </div>

          <div className="ds-dashboard-card ds-bg-error-500 ds-text-error-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <Bell className="ds-h-6 ds-w-6 ds-text-error-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Pending</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-error-50">{metrics.pendingTickets}</div>
              <div className="ds-text-xs ds-text-error-100">Pending Tickets</div>
            </div>
          </div>

          <div className="ds-dashboard-card ds-bg-accent-500 ds-text-accent-50 ds-border-0">
            <div className="ds-p-4">
              <div className="ds-flex ds-items-center ds-justify-between ds-mb-2">
                <ChatCircle className="ds-h-6 ds-w-6 ds-text-accent-100" weight="duotone" />
                <Badge className="ds-border-0 ds-bg-white/20 ds-text-xs ds-text-white">Today</Badge>
              </div>
              <div className="ds-text-2xl ds-font-bold ds-text-accent-50">{metrics.resolvedToday}</div>
              <div className="ds-text-xs ds-text-accent-100">Resolved Today</div>
            </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fire className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <ChatCircle className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View Team Status
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Bell className="mr-2 h-4 w-4" />
                  Check Notifications
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const timeAgo = Math.floor((Date.now() - activity.timestamp.getTime()) / 60000);
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full bg-${activity.color}-500`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {timeAgo < 1 ? 'Just now' : `${timeAgo} minute${timeAgo > 1 ? 's' : ''} ago`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Status</span>
                  <Badge className={`${systemStatus.api === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {systemStatus.api === 'operational' ? 'Operational' : 'Error'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge className={`${systemStatus.database === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {systemStatus.database === 'healthy' ? 'Healthy' : 'Error'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time</span>
                  <Badge className={`${systemStatus.realtime === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {systemStatus.realtime === 'connected' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication</span>
                  <Badge className={`${systemStatus.auth === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {systemStatus.auth === 'active' ? 'Active' : 'Error'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
