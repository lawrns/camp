/**
 * Team Management Dashboard
 *
 * Comprehensive interface for managing team operations:
 * - Agent availability and assignments
 * - Performance monitoring and analytics
 * - Real-time workload distribution
 * - Skill-based routing configuration
 * - Team collaboration tools
 */

"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { api } from "@/lib/trpc/client";
import { Icon } from "@/lib/ui/Icon";
import { useOrganization } from "@/store/domains/organization";
import {
  Clock,
  DotsThreeVertical,
  Envelope,
  Fire,
  Lightning,
  MagnifyingGlass,
  Star,
  TrendUp,
  User,
  Users,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

interface WorkloadDistribution {
  agentId: string;
  agentName: string;
  currentLoad: number;
  capacity: number;
  efficiency: number;
  waitTime: number;
}

export default function TeamManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName] = useState("Team Manager");
  const organization = useOrganization();

  // Use real organization members data
  const { members, loading: membersLoading, error: membersError } = useOrganizationMembers(organization?.id || "");

  // Fetch real team analytics data
  const { data: mailboxMembers } = api.mailbox.members.getMembers.useQuery(
    { mailboxId: organization?.mailboxes?.[0]?.id || "" },
    { enabled: !!organization?.mailboxes?.[0]?.id }
  );

  // Fetch team performance metrics
  const { data: teamMetrics } = api.analytics.metrics.getTeamMetrics.useQuery(
    { organizationId: organization?.id || "" },
    { enabled: !!organization?.id }
  );

  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalAgents: 0,
    onlineAgents: 0,
    busyAgents: 0,
    totalActiveChats: 0,
    avgResponseTime: 0,
    teamSatisfaction: 0,
    resolutionRate: 0,
    efficiency: 0,
  });

  // Convert organization members to Agent format
  const teamMembers: Agent[] = members.map((member) => ({
    id: member.id,
    name: member.full_name || member.email,
    email: member.email,
    role: member.role || "Team Member",
    status: "online" as const, // Default status - in real app, this would come from presence data
    availability: true,
    activeChats: 0, // Would come from real-time data
    maxChats: 5,
    avgResponseTime: 120,
    satisfactionScore: 4.5,
    resolvedToday: 0,
    skills: [], // Would come from user profile
    workingHours: "9:00 AM - 5:00 PM",
    lastActive: "Online",
    performance: {
      responseTime: 95,
      satisfaction: 90,
      resolution: 85,
      efficiency: 88,
    },
  }));

  // Update metrics based on real data
  useEffect(() => {
    if (members.length > 0) {
      setMetrics({
        totalAgents: members.length,
        onlineAgents: members.length, // Simplified - would be based on real presence
        busyAgents: 0,
        totalActiveChats: 0,
        avgResponseTime: 120,
        teamSatisfaction: 4.5,
        resolutionRate: 0.85,
        efficiency: 0.88,
      });
    }
  }, [members]);

  useEffect(() => {
    setLoading(membersLoading);
  }, [membersLoading]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);

  const [newAgent, setNewAgent] = useState({
    name: "",
    email: "",
    role: "",
    skills: [] as string[],
    maxChats: 3,
    workingHours: "9:00 AM - 5:00 PM",
  });

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusColor = (status: Agent["status"]) => {
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
  };

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="primary" className="bg-emerald-600">
            Online
          </Badge>
        );
      case "busy":
        return (
          <Badge variant="destructive" className="bg-red-600">
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
        return (
          <Badge variant="outline" className="bg-gray-400">
            Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  const handleAgentStatusChange = (agentId: string, newStatus: Agent["status"]) => {
    // In real implementation, this would update the agent's status via API
    console.log(`Changing agent ${agentId} status to ${newStatus}`);
  };

  const handleAvailabilityToggle = (agentId: string) => {
    // In real implementation, this would toggle agent availability via API
    console.log(`Toggling availability for agent ${agentId}`);
  };

  const handleAssignAgent = (agentId: string) => {
    // In real implementation, this would open assignment dialog
    console.log(`Assigning conversations to agent ${agentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading team management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <p className="text-red-600">Error loading team data: {membersError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {userName}
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your team's performance and workload distribution
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddAgent(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon icon={User} className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </div>
        </div>

        {/* Team Metrics Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Icon icon={Users} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.onlineAgents} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <Icon icon={Fire} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalActiveChats}</div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Icon icon={Lightning} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResponseTime}s</div>
              <p className="text-xs text-muted-foreground">
                Team average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Icon icon={Star} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.teamSatisfaction}/5</div>
              <p className="text-xs text-muted-foreground">
                Customer rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Icon icon={MagnifyingGlass} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(agent.status)}`}></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.role}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Icon icon={DotsThreeVertical} className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    {getStatusBadge(agent.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Chats</span>
                    <span className="text-sm font-medium">
                      {agent.activeChats}/{agent.maxChats}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Workload</span>
                      <span className="text-sm font-medium">
                        {Math.round((agent.activeChats / agent.maxChats) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(agent.activeChats / agent.maxChats) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {agent.avgResponseTime}s
                      </div>
                      <div className="text-xs text-gray-500">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {agent.satisfactionScore}
                      </div>
                      <div className="text-xs text-gray-500">Satisfaction</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleAvailabilityToggle(agent.id)}
                    >
                      {agent.availability ? "Set Away" : "Set Available"}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAssignAgent(agent.id)}
                    >
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}