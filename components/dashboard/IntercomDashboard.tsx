"use client";

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { supabase } from '@/lib/supabase';
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

  // Real team activity data - will be populated from database
  const [teamActivities, setTeamActivities] = useState<any[]>([]);

  // Fetch real team activities
  useEffect(() => {
    const fetchTeamActivities = async () => {
      if (!user?.organizationId) return;

      try {
        const supabaseClient = supabase.browser();
        
        // Get recent conversations
        const { data: recentConversations } = await supabaseClient
          .from('conversations')
          .select('id, subject, status, created_at, assigned_to_user_id')
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Get recent messages
        const { data: recentMessages } = await supabaseClient
          .from('messages')
          .select('id, content, created_at, sender_id, conversation_id')
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Transform into activity format
        const activities = [];
        
        if (recentConversations) {
          for (const conv of recentConversations) {
            activities.push({
              id: conv.id,
              type: 'conversation_started' as const,
              message: `Started conversation: ${conv.subject || 'No subject'}`,
              memberId: conv.assigned_to_user_id || 'unassigned',
              memberName: 'Team Member', // Would need to join with profiles table
              memberAvatar: undefined,
              timestamp: new Date(conv.created_at),
              metadata: {
                conversationId: conv.id,
                status: conv.status,
              },
            });
          }
        }

        if (recentMessages) {
          for (const msg of recentMessages) {
            activities.push({
              id: msg.id,
              type: 'message_sent' as const,
              message: `Sent message: ${msg.content?.substring(0, 50)}...`,
              memberId: msg.sender_id || 'unknown',
              memberName: 'Team Member',
              memberAvatar: undefined,
              timestamp: new Date(msg.created_at),
              metadata: {
                conversationId: msg.conversation_id,
                messageId: msg.id,
              },
            });
          }
        }

        // Sort by timestamp and take the most recent 10
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTeamActivities(activities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching team activities:', error);
        // Fallback to empty array
        setTeamActivities([]);
      }
    };

    fetchTeamActivities();
  }, [user?.organizationId]);

  // Real AI insights based on actual performance data
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  // Generate insights based on real metrics
  useEffect(() => {
    const generateInsights = () => {
      const insights = [];

      // Performance insights
      if (dashboardMetrics.resolvedToday > 20) {
        insights.push({
          id: '1',
          type: 'positive' as const,
          title: 'Excellent Performance Today',
          description: `You've resolved ${dashboardMetrics.resolvedToday} conversations today, exceeding your daily goal!`,
          priority: 'high' as const,
          dismissible: true,
        });
      }

      // Response time insights
      if (dashboardMetrics.avgResponse > 300) { // 5 minutes
        insights.push({
          id: '2',
          type: 'medium' as const,
          title: 'Response Time Alert',
          description: 'Average response time is above target. Consider enabling AI assistance for faster responses.',
          priority: 'medium' as const,
          action: {
            label: 'Configure AI',
            href: '/dashboard/settings',
          },
          dismissible: true,
        });
      }

      // Satisfaction insights
      if (dashboardMetrics.csat < 80) {
        insights.push({
          id: '3',
          type: 'medium' as const,
          title: 'Customer Satisfaction Alert',
          description: 'Customer satisfaction is below target. Review recent conversations for improvement opportunities.',
          priority: 'medium' as const,
          action: {
            label: 'Review Conversations',
            href: '/dashboard/inbox',
          },
          dismissible: true,
        });
      }

      // Workload insights
      if (dashboardMetrics.activeChats > 50) {
        insights.push({
          id: '4',
          type: 'medium' as const,
          title: 'High Workload Detected',
          description: 'High conversation volume detected. Consider adding more agents or enabling AI handover.',
          priority: 'medium' as const,
          action: {
            label: 'Manage Team',
            href: '/dashboard/team',
          },
          dismissible: true,
        });
      }

      // Positive performance insight
      if (dashboardMetrics.csat > 90 && dashboardMetrics.avgResponse < 120) {
        insights.push({
          id: '5',
          type: 'positive' as const,
          title: 'Outstanding Performance',
          description: 'Excellent performance! Team is exceeding targets for both satisfaction and response time.',
          priority: 'high' as const,
          dismissible: true,
        });
      }

      setAiInsights(insights);
    };

    if (dashboardMetrics) {
      generateInsights();
    }
  }, [dashboardMetrics]);

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
