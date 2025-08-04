"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Button } from "@/components/unified-ui/components/Button";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { api } from "@/lib/trpc/provider";

// Import icons
import {
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Users,
  Target,
  Pulse as Activity,
  ChartBar as BarChart3,
  Calendar,
  FunnelSimple as Filter,
  Download,
  ArrowsClockwise as RefreshCw,
  Warning as AlertTriangle,
  CheckCircle,
  User,
} from "@phosphor-icons/react";

interface PerformanceMetrics {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  responseTime: number;
  activeTickets: number;
  overdueTickets: number;
  efficiency: number;
}

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  metrics: PerformanceMetrics;
  trends: {
    ticketsThisWeek: number;
    ticketsLastWeek: number;
    satisfactionTrend: number;
    resolutionTimeTrend: number;
  };
  workload: {
    currentCapacity: number;
    maxCapacity: number;
    availableHours: number;
    scheduledHours: number;
  };
}

export default function TeamPerformancePage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"24h" | "7d" | "30d" | "90d">("7d");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Fetch team performance data
  const { data: performanceData, isLoading: performanceLoading, refetch: refetchPerformance } = api.mailbox.members.performance.useQuery(
    { 
      mailboxSlug: "test-mailbox-dev",
      period: selectedPeriod,
    },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch workload distribution
  const { data: workloadData, isLoading: workloadLoading } = api.mailbox.members.workload.useQuery(
    { mailboxSlug: "test-mailbox-dev" },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch performance trends
  const { data: trendsData, isLoading: trendsLoading } = api.mailbox.members.trends.useQuery(
    { 
      mailboxSlug: "test-mailbox-dev",
      days: selectedPeriod === "24h" ? 7 : selectedPeriod === "7d" ? 14 : selectedPeriod === "30d" ? 30 : 90,
    },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const loading = performanceLoading || workloadLoading || trendsLoading;
  const members = performanceData?.members || [];
  const overall = performanceData?.overall;

  // Calculate team insights
  const teamInsights = useMemo(() => {
    if (!overall || !workloadData) return null;

    const topPerformer = members.reduce((best, current) => 
      current.metrics.efficiency > (best?.metrics.efficiency || 0) ? current : best
    , null as TeamMember | null);

    const needsAttention = members.filter(member => 
      member.metrics.overdueTickets > 0 || member.workload.currentCapacity > 90
    );

    const workloadIssues = workloadData.filter(w => w.status !== 'balanced');

    return {
      topPerformer,
      needsAttention,
      workloadIssues,
      avgEfficiency: overall.teamEfficiency,
      satisfactionTrend: overall.trends.satisfactionTrend,
    };
  }, [members, overall, workloadData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'bg-red-100 text-red-800';
      case 'underutilized': return 'bg-yellow-100 text-yellow-800';
      case 'balanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <Icon icon={TrendingUp} className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <Icon icon={TrendingDown} className="h-4 w-4 text-red-500" />;
    return <Icon icon={Activity} className="h-4 w-4 text-gray-500" />;
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Icon icon={RefreshCw} className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg text-gray-600">Loading team performance data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Performance</h1>
            <p className="text-gray-600 mt-1">Real-time analytics and performance insights</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Icon icon={Calendar} className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as unknown)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => refetchPerformance()}
              className="flex items-center gap-2"
            >
              <Icon icon={RefreshCw} className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Icon icon={Download} className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Overall Metrics Cards */}
        {overall && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Icon icon={Users} className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overall.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {overall.activeMembers} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Icon icon={Target} className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overall.totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {overall.resolvedTickets} resolved ({Math.round((overall.resolvedTickets / overall.totalTickets) * 100)}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Icon icon={Clock} className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overall.avgResolutionTime.toFixed(1)}h</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(overall.trends.efficiencyTrend)}
                  <span className="ml-1">{formatTrend(overall.trends.efficiencyTrend)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Satisfaction</CardTitle>
                <Icon icon={Star} className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overall.avgTeamSatisfaction.toFixed(1)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(overall.trends.satisfactionTrend)}
                  <span className="ml-1">{formatTrend(overall.trends.satisfactionTrend)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Insights */}
        {teamInsights && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={BarChart3} className="h-5 w-5" />
                Team Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Performer */}
                {teamInsights.topPerformer && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={Star} className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Top Performer</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {teamInsights.topPerformer.name} - {teamInsights.topPerformer.metrics.efficiency.toFixed(1)}% efficiency
                    </p>
                  </div>
                )}

                {/* Workload Issues */}
                {teamInsights.workloadIssues.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={AlertTriangle} className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Workload Issues</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {teamInsights.workloadIssues.length} members need attention
                    </p>
                  </div>
                )}

                {/* Team Health */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={Activity} className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Team Health</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {teamInsights.avgEfficiency.toFixed(1)}% average efficiency
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Member Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={Users} className="h-5 w-5" />
              Team Member Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMember(selectedMember === member.userId ? null : member.userId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon icon={User} className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(
                      member.workload.currentCapacity > 90 ? 'overloaded' :
                      member.workload.currentCapacity < 60 ? 'underutilized' : 'balanced'
                    )}>
                      {member.workload.currentCapacity > 90 ? 'Overloaded' :
                       member.workload.currentCapacity < 60 ? 'Underutilized' : 'Balanced'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Active Tickets</p>
                      <p className="text-lg font-semibold">{member.metrics.activeTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Efficiency</p>
                      <p className="text-lg font-semibold">{member.metrics.efficiency.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Satisfaction</p>
                      <div className="flex items-center gap-1">
                        <Icon icon={Star} className="h-3 w-3 text-yellow-500" />
                        <p className="text-sm font-medium">{member.metrics.customerSatisfaction.toFixed(1)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg Resolution</p>
                      <p className="text-sm font-medium">{member.metrics.avgResolutionTime.toFixed(1)}h</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Workload</span>
                      <span>{member.workload.currentCapacity}%</span>
                    </div>
                    <Progress value={member.workload.currentCapacity} className="h-2" />
                  </div>

                  {member.metrics.overdueTickets > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700 flex items-center gap-1">
                      <Icon icon={AlertTriangle} className="h-3 w-3" />
                      {member.metrics.overdueTickets} overdue tickets
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        {workloadData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={BarChart3} className="h-5 w-5" />
                Workload Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workloadData.map((member) => (
                  <div key={member.memberId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon icon={User} className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.currentTickets} active tickets</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.utilizationPercentage}%</p>
                        <p className="text-xs text-gray-500">utilization</p>
                      </div>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Trends */}
        {trendsData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={TrendingUp} className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ticket Volume Trend */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Ticket Volume</h4>
                  <div className="space-y-2">
                    {trendsData.ticketVolume.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(day.tickets / 30) * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-right">{day.tickets}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Satisfaction Trend */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Satisfaction Score</h4>
                  <div className="space-y-2">
                    {trendsData.satisfaction.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(day.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-right">{day.score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Efficiency Trend */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Team Efficiency</h4>
                  <div className="space-y-2">
                    {trendsData.efficiency.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${day.percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right">{day.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
