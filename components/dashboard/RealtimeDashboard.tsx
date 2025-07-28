import { useEffect, useMemo } from "react";
import { ArrowClockwise, ChatCircle, Clock, TrendUp, Users, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationRealtime } from "@/lib/realtime";
import {
  selectDashboardError,
  selectDashboardLoading,
  selectDashboardMetrics,
  useDashboardStore,
} from "@/store/dashboard-store";

/**
 * Realtime-enabled dashboard that eliminates page refreshes
 * Uses Zustand store + Supabase realtime for live updates
 */
export function RealtimeDashboard() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  // Dashboard store state
  const metrics = useDashboardStore(selectDashboardMetrics);
  const isLoading = useDashboardStore(selectDashboardLoading);
  const error = useDashboardStore(selectDashboardError);

  // Dashboard store actions
  const {
    setOrganizationId,
    refreshMetrics,
    handleStatsUpdate,
    handleConversationUpdate,
    handleMetricUpdate,
    setError,
  } = useDashboardStore();

  // Set organization ID when available
  useEffect(() => {
    if (organizationId) {
      setOrganizationId(organizationId);
      refreshMetrics();
    }
  }, [organizationId, setOrganizationId, refreshMetrics]);

  // Memoize realtime options to prevent infinite re-renders
  const realtimeOptions = useMemo(
    () => ({
      onNewMessage: (payload: any) => {
        // Handle both stats updates and metric updates
        if (payload.metric && payload.value) {
          handleMetricUpdate(payload.metric, payload.value);
        } else {
          handleStatsUpdate(payload);
        }
      },
      onConversationUpdate: handleConversationUpdate,
    }),
    [handleStatsUpdate, handleConversationUpdate, handleMetricUpdate]
  );

  // Subscribe to realtime dashboard updates (single subscription)
  useOrganizationRealtime(organizationId || "", realtimeOptions);

  const handleRetry = () => {
    setError(null);
    refreshMetrics();
  };

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-spacing-md">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-status-error-light bg-[var(--fl-color-danger-subtle)]">
        <CardContent className="p-spacing-lg text-center">
          <Warning className="text-brand-mahogany-500 mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-base font-semibold text-red-900">Unable to Load Dashboard</h3>
          <p className="text-red-600-dark mb-4" data-testid="error-message">
            {error}
          </p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="text-red-600-dark border-[var(--fl-color-danger-muted)] hover:bg-[var(--fl-color-danger-subtle)]"
            disabled={isLoading}
            data-testid="refresh-button"
          >
            <ArrowClockwise className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-spacing-lg text-center">
          <p className="text-[var(--fl-color-text-muted)]">No dashboard data available</p>
          <Button onClick={handleRetry} variant="outline" className="mt-4" data-testid="refresh-button">
            Load Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const todayStats = metrics.todayStats;

  return (
    <div className="space-y-6" data-testid="dashboard-metrics">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <ChatCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="total-conversations">
              {todayStats.totalConversations}
            </div>
            <p className="text-tiny text-muted-foreground">
              <span data-testid="active-conversations">{todayStats.activeConversations}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="avg-response-time">
              {todayStats.avgResponseTime}s
            </div>
            <p className="text-tiny text-muted-foreground">Target: &lt; 60s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="satisfaction-score">
              {todayStats.satisfactionScore}%
            </div>
            <p className="text-tiny text-muted-foreground">Based on feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Handovers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="ai-handovers">
              {todayStats.aiHandovers}
            </div>
            <p className="text-tiny text-muted-foreground">{todayStats.resolvedToday} resolved today</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-spacing-sm">
          <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full"></div>
          <span className="text-foreground text-sm">Live updates enabled</span>
        </div>
        <div className="text-tiny text-[var(--fl-color-text-muted)]">
          Last updated: {new Date(todayStats.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
