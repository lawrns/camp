"use client";

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent } from '@/components/unified-ui/components/Card';
import { IntercomMetricCard } from './IntercomMetricCard';
import { IntercomActionTileGrid } from './IntercomActionTile';
import { IntercomTimelineList } from './IntercomTimelineList';
import { IntercomAlertStack } from './IntercomAlertStack';
import { IntercomAgentPresencePanel } from './IntercomAgentPresencePanel';
import { MemoryMonitor } from '@/components/MemoryMonitor';
import { 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  HandThumbUpIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DashboardMetrics {
  activeChats: number;
  avgResponse: number;
  csat: number;
  resolvedToday: number;
  pendingChats?: number;
  activeChatsDelta?: number;
  avgResponseDelta?: number;
  resolvedTodayDelta?: number;
}

export function IntercomDashboard() {
  const { user, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  // Enhanced dashboard metrics
  const {
    metrics: enhancedMetrics,
    loading: metricsLoading,
    error: metricsError,
  } = useDashboardMetrics({
    range: "today",
    refreshInterval: 30000,
  });

  // Organization members for team presence
  const { members, loading: membersLoading } = useOrganizationMembers(user?.organizationId || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Transform metrics to dashboard format
  const dashboardMetrics: DashboardMetrics = enhancedMetrics ? {
    activeChats: enhancedMetrics.openConversations || 0,
    avgResponse: Math.round(parseFloat(enhancedMetrics.responseTime?.replace('s', '') || '0')),
    csat: enhancedMetrics.satisfactionRate || 0,
    resolvedToday: enhancedMetrics.resolvedToday || 0,
    pendingChats: enhancedMetrics.openConversations || 0,
    activeChatsDelta: 12, // Mock trend data
    avgResponseDelta: -8,
    resolvedTodayDelta: 15,
  } : {
    activeChats: 0,
    avgResponse: 0,
    csat: 0,
    resolvedToday: 0,
  };

  // Hero metrics cards configuration
  const metricCards = [
    {
      label: "Active Chats",
      value: dashboardMetrics.activeChats,
      trend: dashboardMetrics.activeChatsDelta ? {
        value: dashboardMetrics.activeChatsDelta,
        direction: dashboardMetrics.activeChatsDelta > 0 ? 'up' as const : 'down' as const
      } : undefined,
      icon: ChatBubbleLeftRightIcon,
      color: 'info' as const,
    },
    {
      label: "Avg Response Time",
      value: dashboardMetrics.avgResponse,
      suffix: "s",
      trend: dashboardMetrics.avgResponseDelta ? {
        value: Math.abs(dashboardMetrics.avgResponseDelta),
        direction: dashboardMetrics.avgResponseDelta < 0 ? 'up' as const : 'down' as const // Inverted for response time
      } : undefined,
      icon: ClockIcon,
      color: 'warm' as const,
    },
    {
      label: "Satisfaction",
      value: dashboardMetrics.csat,
      suffix: "%",
      icon: HandThumbUpIcon,
      color: 'success' as const,
    },
    {
      label: "Resolved Today",
      value: dashboardMetrics.resolvedToday,
      trend: dashboardMetrics.resolvedTodayDelta ? {
        value: dashboardMetrics.resolvedTodayDelta,
        direction: dashboardMetrics.resolvedTodayDelta > 0 ? 'up' as const : 'down' as const
      } : undefined,
      icon: CheckCircleIcon,
      color: 'success' as const,
    },
  ];

  // Quick action tiles configuration
  const actionTiles = [
    {
      label: "Start Chat",
      icon: PlusCircleIcon,
      route: "/dashboard/inbox",
      badge: dashboardMetrics.pendingChats || undefined,
      description: "Begin new conversation",
      color: 'primary' as const,
    },
    {
      label: "Knowledge Base",
      icon: BookOpenIcon,
      route: "/knowledge",
      description: "Search articles & docs",
      color: 'accent' as const,
    },
    {
      label: "Analytics",
      icon: ChartBarIcon,
      route: "/dashboard/analytics",
      description: "Performance insights",
      color: 'secondary' as const,
    },
    {
      label: "Team Chat",
      icon: ChatBubbleLeftIcon,
      route: "/dashboard/team",
      description: "Collaborate with team",
      color: 'neutral' as const,
    },
    {
      label: "Settings",
      icon: Cog6ToothIcon,
      route: "/dashboard/settings",
      description: "Configure preferences",
      color: 'neutral' as const,
    },
    {
      label: "Reports",
      icon: DocumentChartBarIcon,
      route: "/dashboard/analytics",
      description: "View detailed reports",
      color: 'primary' as const,
    },
  ];

  // Mock team activity data
  const teamActivities = [
    {
      id: '1',
      type: 'conversation_started' as const,
      message: 'Started a new conversation with customer support',
      memberId: '1',
      memberName: 'Sarah Johnson',
      memberAvatar: undefined,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      metadata: {
        conversationId: 'conv-123',
        messagesCount: 1,
      },
    },
    {
      id: '2',
      type: 'conversation_resolved' as const,
      message: 'Successfully resolved a billing inquiry',
      memberId: '2',
      memberName: 'Mike Chen',
      memberAvatar: undefined,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      metadata: {
        conversationId: 'conv-124',
        satisfaction: 5,
        responseTime: 120,
      },
    },
    {
      id: '3',
      type: 'performance_milestone' as const,
      message: 'Achieved 95% customer satisfaction this week',
      memberId: '3',
      memberName: 'Emma Davis',
      memberAvatar: undefined,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      metadata: {
        satisfaction: 95,
      },
    },
  ];

  // Mock AI insights
  const aiInsights = [
    {
      id: '1',
      type: 'positive' as const,
      title: 'Excellent Performance Today',
      description: `You've resolved ${dashboardMetrics.resolvedToday} conversations today, exceeding your daily goal!`,
      priority: 'high' as const,
      dismissible: true,
    },
    {
      id: '2',
      type: 'medium' as const,
      title: 'AI-Powered Suggestion',
      description: 'Enable AI handover for complex technical queries to improve response time.',
      priority: 'medium' as const,
      action: {
        label: 'Configure AI',
        href: '/dashboard/settings',
      },
      dismissible: true,
    },
  ];

  // Transform members to agents format
  const agents = members.map(member => ({
    id: member.id,
    name: member.profile.full_name || member.profile.email,
    email: member.profile.email,
    avatar: member.profile.avatar_url,
    status: 'online' as const, // Mock status
    kpis: {
      conversationsToday: Math.floor(Math.random() * 20) + 5,
      avgResponseTime: Math.floor(Math.random() * 180) + 60,
      satisfactionRate: Math.floor(Math.random() * 20) + 80,
      resolvedToday: Math.floor(Math.random() * 15) + 3,
    },
  }));

  return (
    <AuthGuard>
      <div className={cn(
        "container-dashboard py-6 space-y-8 transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}>
        {/* Hero Metrics Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 font-heading">
              Welcome back, {user?.firstName || 'Agent'}
            </h1>
            <p className="text-gray-600 font-body">
              Here's what's happening with your team today
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricCards.map((metric, index) => (
              <div
                key={metric.label}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <IntercomMetricCard
                  {...metric}
                  loading={metricsLoading}
                  onClick={() => {
                    // Handle metric card clicks based on your routing needs
                    if (metric.label === "Active Chats") {
                      window.location.href = "/dashboard/inbox?filter=active";
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Team Activity and Status Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <IntercomTimelineList
              activities={teamActivities}
              loading={membersLoading}
            />
          </div>
          <div>
            <IntercomAgentPresencePanel 
              agents={agents}
            />
          </div>
        </section>

        {/* Quick Actions and AI Insights Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 font-heading">
                  Quick Actions
                </h2>
                <IntercomActionTileGrid
                  tiles={actionTiles}
                  columns={3}
                />
              </div>
            </CardContent>
          </Card>
          
          <IntercomAlertStack
            alerts={aiInsights}
            actions={[
              {
                label: "Configure AI",
                onClick: () => window.location.href = "/dashboard/settings",
                variant: "secondary",
              },
              {
                label: "Request Help",
                onClick: () => window.location.href = "/dashboard/help",
                variant: "secondary",
              },
            ]}
          />
        </section>

        {/* System Overview Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <CpuChipIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 font-heading">
                      System Overview
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Your dashboard was upgraded with real-time metrics & enhanced team collaboration.
                    </p>
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      Release Notes →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-32" />}>
              <MemoryMonitor />
            </Suspense>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
