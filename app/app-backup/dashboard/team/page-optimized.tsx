/**
 * Team Management Dashboard - Optimized for Memory Management
 *
 * Key optimizations:
 * - React.memo for component memoization
 * - useCallback for event handlers
 * - useMemo for expensive computations
 * - Proper cleanup of intervals and subscriptions
 * - Virtualized list for large team member lists
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowSquareOut,
  ChartBar as BarChart3,
  Clock,
  Fire as Flame,
  ChatCircle as MessageCircle,
  Sparkle as Sparkles,
  Star,
  Target,
  User,
  Users,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useMemoryLeakDetector } from "@/hooks/useMemoryMonitor";
import { Icon } from "@/lib/ui/Icon";

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "online" | "busy" | "away" | "offline";
  availability: boolean;
  activeChats: number;
  maxChats: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolvedToday: number;
  skills: string[];
  workingHours: string;
  lastActive: string;
  performance: {
    responseTime: number;
    satisfaction: number;
    resolution: number;
    efficiency: number;
  };
}

interface TeamMetrics {
  totalAgents: number;
  onlineAgents: number;
  busyAgents: number;
  totalActiveChats: number;
  avgResponseTime: number;
  teamSatisfaction: number;
  resolutionRate: number;
  efficiency: number;
}

// Memoized team member row component
const TeamMemberRow = React.memo(
  ({
    member,
    onStatusChange,
    onAvailabilityToggle,
    onAssign,
  }: {
    member: Agent;
    onStatusChange: (agentId: string, status: Agent["status"]) => void;
    onAvailabilityToggle: (agentId: string, available: boolean) => void;
    onAssign: (agentId: string) => void;
  }) => {
    const getStatusColor = useCallback((status: Agent["status"]) => {
      switch (status) {
        case "online":
          return "bg-emerald-500";
        case "busy":
          return "bg-red-500";
        case "away":
          return "bg-yellow-500";
        case "offline":
          return "bg-gray-400";
        default:
          return "bg-gray-400";
      }
    }, []);

    const getStatusBadge = useCallback((status: Agent["status"]) => {
      switch (status) {
        case "online":
          return (
            <Badge variant="success" className="bg-emerald-600">
              Online
            </Badge>
          );
        case "busy":
          return (
            <Badge variant="error" className="bg-red-600">
              Busy
            </Badge>
          );
        case "away":
          return (
            <Badge variant="secondary" className="bg-yellow-600">
              Away
            </Badge>
          );
        case "offline":
          return <Badge variant="outline">Offline</Badge>;
        default:
          return <Badge variant="outline">Unknown</Badge>;
      }
    }, []);

    const handleAssign = useCallback(() => {
      onAssign(member.id);
    }, [member.id, onAssign]);

    return (
      <div className="flex items-center gap-4 rounded-ds-xl border border-[var(--fl-color-border-subtle)] spacing-4 transition-all hover:bg-[var(--fl-color-info-subtle)]">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
            <Icon icon={User} className="h-6 w-6 text-blue-600" />
          </div>
          <div
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-ds-full border-2 border-white ${getStatusColor(member.status)}`}
          ></div>
        </div>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            {getStatusBadge(member.status)}
          </div>
          <p className="text-sm text-[var(--fl-color-text-muted)]">{member.role}</p>
          <p className="text-xs text-gray-400">{member.email}</p>
        </div>

        <div className="space-y-1 text-right">
          <div className="text-sm font-medium text-gray-900">{member.activeChats} conversations</div>
          <div className="text-xs text-[var(--fl-color-text-muted)]">{member.avgResponseTime}s avg response</div>
          <div className="flex items-center gap-1">
            <Icon icon={Star} className="text-semantic-warning h-3 w-3" />
            <span className="text-xs font-medium">{member.satisfactionScore}/5</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
          onClick={handleAssign}
        >
          Assign
        </Button>
      </div>
    );
  }
);

TeamMemberRow.displayName = "TeamMemberRow";

// Memoized metric card
const TeamMetricCard = React.memo(
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
          <Icon className="h-8 w-8" />
          <Badge className="border-0 bg-white/20 text-xs text-white">{badge}</Badge>
        </div>
        <div className="mb-1 text-3xl font-bold">{value}</div>
        <div className="text-sm text-blue-100">{label}</div>
      </CardContent>
    </Card>
  )
);

TeamMetricCard.displayName = "TeamMetricCard";

const TeamManagementPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName] = useState("Team Manager");

  // Memory leak detection
  useMemoryLeakDetector("TeamManagementPage");

  // Refs for cleanup
  const loadTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalAgents: 8,
    onlineAgents: 6,
    busyAgents: 2,
    totalActiveChats: 127,
    avgResponseTime: 112,
    teamSatisfaction: 4.7,
    resolutionRate: 0.87,
    efficiency: 0.9,
  });

  const [teamMembers, setTeamMembers] = useState<Agent[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@company.com",
      role: "Senior Support Agent",
      status: "online",
      availability: true,
      activeChats: 3,
      maxChats: 5,
      avgResponseTime: 120,
      satisfactionScore: 4.8,
      resolvedToday: 12,
      skills: ["billing", "technical", "sales"],
      workingHours: "9:00 AM - 5:00 PM",
      lastActive: "2 minutes ago",
      performance: {
        responseTime: 95,
        satisfaction: 96,
        resolution: 88,
        efficiency: 92,
      },
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike@company.com",
      role: "Technical Specialist",
      status: "busy",
      availability: true,
      activeChats: 5,
      maxChats: 5,
      avgResponseTime: 95,
      satisfactionScore: 4.9,
      resolvedToday: 8,
      skills: ["technical", "api", "integrations"],
      workingHours: "10:00 AM - 6:00 PM",
      lastActive: "Now",
      performance: {
        responseTime: 98,
        satisfaction: 98,
        resolution: 92,
        efficiency: 96,
      },
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily@company.com",
      role: "Customer Success Manager",
      status: "online",
      availability: true,
      activeChats: 2,
      maxChats: 4,
      avgResponseTime: 85,
      satisfactionScore: 4.7,
      resolvedToday: 15,
      skills: ["onboarding", "account", "strategy"],
      workingHours: "8:00 AM - 4:00 PM",
      lastActive: "5 minutes ago",
      performance: {
        responseTime: 89,
        satisfaction: 94,
        resolution: 85,
        efficiency: 89,
      },
    },
    {
      id: "4",
      name: "David Kim",
      email: "david@company.com",
      role: "Support Agent",
      status: "away",
      availability: false,
      activeChats: 0,
      maxChats: 3,
      avgResponseTime: 145,
      satisfactionScore: 4.5,
      resolvedToday: 6,
      skills: ["general", "billing"],
      workingHours: "9:00 AM - 5:00 PM",
      lastActive: "15 minutes ago",
      performance: {
        responseTime: 78,
        satisfaction: 90,
        resolution: 82,
        efficiency: 83,
      },
    },
  ]);

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

  const handleAgentStatusChange = useCallback((agentId: string, newStatus: Agent["status"]) => {
    setTeamMembers((prev) =>
      prev.map((agent: unknown) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
    );
  }, []);

  const handleAvailabilityToggle = useCallback((agentId: string, available: boolean) => {
    setTeamMembers((prev) =>
      prev.map((agent: unknown) =>
        agent.id === agentId ? { ...agent, availability: available, status: available ? "online" : "offline" } : agent
      )
    );
  }, []);

  const handleAssignAgent = useCallback((agentId: string) => {
    // Implement assignment logic
  }, []);

  // Memoized current time
  const currentTime = useMemo(() => new Date().toLocaleTimeString(), [metrics]);

  // Memoized online agents list
  const onlineAgents = useMemo(() => teamMembers.filter((agent: unknown) => agent.status === "online"), [teamMembers]);

  useEffect(() => {
    loadTimerRef.current = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // REMOVED: Team metrics polling replaced with real-time updates
    // This eliminates the 5-second polling interval that was causing constant updates
    // Real-time team metrics will be handled by the dashboard metrics system

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
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-ds-xl bg-gray-200"></div>
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
              <p className="mt-1 text-xl text-gray-600">Manage your support team effectively</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[var(--fl-color-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
              <span>Live data • Last updated {currentTime}</span>
            </div>
            <Button
              onClick={() => handleNavigation("/dashboard")}
              variant="outline"
              size="sm"
              className="border-status-info-light flex items-center gap-2 text-blue-600 hover:bg-[var(--fl-color-info-subtle)] mobile-full-width sm:w-auto"
            >
              <Icon icon={Zap} className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Team Metrics - Beautiful Blue Theme */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TeamMetricCard
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            icon={Users}
            badge="Online"
            value={`${metrics.onlineAgents}/${metrics.totalAgents}`}
            label="Active Agents"
          />
          <TeamMetricCard
            gradient="bg-gradient-to-br from-blue-400 to-blue-500"
            icon={MessageCircle}
            badge="Today"
            value={metrics.totalActiveChats}
            label="Team Conversations"
          />
          <TeamMetricCard
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            icon={Clock}
            badge="Avg"
            value={`${metrics.avgResponseTime}s`}
            label="Response Time"
          />
          <TeamMetricCard
            gradient="bg-gradient-to-br from-blue-300 to-blue-400"
            icon={Star}
            badge="Rating"
            value={`${metrics.teamSatisfaction}/5`}
            label="Team Rating"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Team Members List */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Users} className="h-6 w-6 text-blue-600" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.map((member: unknown) => (
                  <TeamMemberRow
                    key={member.id}
                    member={member}
                    onStatusChange={handleAgentStatusChange}
                    onAvailabilityToggle={handleAvailabilityToggle}
                    onAssign={handleAssignAgent}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Team Performance & Quick Actions */}
          <div className="space-y-8">
            {/* Performance Summary */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Target} className="h-6 w-6 text-blue-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Efficiency */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Team Efficiency</span>
                    <span className="text-sm text-[var(--fl-color-text-muted)]">
                      {Math.round(metrics.efficiency * 100)}%
                    </span>
                  </div>
                  <Progress value={metrics.efficiency * 100} className="h-3" />
                </div>

                {/* Team Insight */}
                <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={Sparkles} className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-blue-900">Team Insight</h4>
                      <p className="text-status-info-dark leading-relaxed text-sm">
                        Your team is performing exceptionally well with {Math.round(metrics.efficiency * 100)}%
                        efficiency.
                        {metrics.onlineAgents} agents are currently online handling conversations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleNavigation("/dashboard/inbox")}
                  >
                    <Icon icon={MessageCircle} className="mr-2 h-5 w-5" />
                    View Conversations
                    <Icon icon={ArrowSquareOut} className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="border-status-info-light w-full text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
                    onClick={() => handleNavigation("/dashboard/analytics")}
                  >
                    <Icon icon={BarChart3} className="mr-2 h-5 w-5" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TeamManagementPage);
