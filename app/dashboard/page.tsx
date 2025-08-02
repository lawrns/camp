'use client';

import { Suspense } from 'react';
import { InboxDashboard } from '@/components/InboxDashboard';
import { MemoryMonitor } from '@/components/MemoryMonitor';
import { useRealtimeDashboard } from '../app/hooks/useRealtimeDashboard';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { TrendingUp, TrendingDown, Users, Clock, Star, Ticket, CheckCircle, AlertCircle } from 'lucide-react';
import { EnhancedHeroSection } from '@/components/dashboard/EnhancedHeroSection';
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { TeamActivityFeed } from '@/components/dashboard/TeamActivityFeed';
import { TeamStatusGrid } from '@/components/dashboard/TeamStatusGrid';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { motion } from 'framer-motion';
import { 
  ChatCircle, 
  Brain, 
  TrendUp, 
  Users as UsersIcon, 
  Gear, 
  ChartLine 
} from '@phosphor-icons/react';

interface DisplayMetrics {
  conversations: number;
  responseTime: string;
  satisfaction: string;
  resolvedToday: number;
  pendingConversations?: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { metrics, activities, systemStatus } = useRealtimeDashboard();
  const { loading: metricsLoading, error } = metrics;

  // Use enhanced dashboard metrics
  const {
    metrics: enhancedMetrics,
    loading: enhancedMetricsLoading,
    error: enhancedMetricsError,
  } = useDashboardMetrics({
    range: "today",
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Use enhanced metrics if available, fallback to realtime metrics
  const displayMetrics: DisplayMetrics = enhancedMetrics ? {
    conversations: enhancedMetrics.totalConversations || 0,
    responseTime: enhancedMetrics.responseTime || "0s",
    satisfaction: enhancedMetrics.satisfactionRate?.toString() || "0%",
    resolvedToday: enhancedMetrics.resolvedToday || 0,
    pendingConversations: enhancedMetrics.openConversations || 0,
  } : {
    conversations: metrics.conversations || 0,
    responseTime: metrics.responseTime || "0s",
    satisfaction: metrics.satisfaction || "0%",
    resolvedToday: metrics.resolvedToday || 0,
    pendingConversations: 0,
  };

  const metricCards = [
    {
      title: "Active Conversations",
      value: displayMetrics.conversations,
      change: "+12%",
      trend: "up" as const,
      icon: Users,
      color: "blue" as const,
      description: "From last hour",
    },
    {
      title: "Avg Response Time",
      value: `${displayMetrics.responseTime}`,
      change: "-8%",
      trend: "down" as const,
      icon: Clock,
      color: "orange" as const,
      description: "Faster today",
    },
    {
      title: "Customer Satisfaction",
      value: `${displayMetrics.satisfaction}`,
      change: "+0.2",
      trend: "up" as const,
      icon: Star,
      color: "yellow" as const,
      description: "This week",
    },
    {
      title: "Resolved Today",
      value: displayMetrics.resolvedToday,
      change: "+15%",
      trend: "up" as const,
      icon: CheckCircle,
      color: "green" as const,
      description: "vs yesterday",
    },
  ];

  const quickActions = [
    {
      title: "Start Chat",
      description: "Begin new conversation",
      icon: ChatCircle,
      href: "/dashboard/inbox",
      color: "blue" as const,
      badge: displayMetrics.pendingConversations ? `${displayMetrics.pendingConversations} pending` : undefined,
    },
    {
      title: "Knowledge Base",
      description: "Search articles & docs",
      icon: Brain,
      href: "/knowledge",
      color: "purple" as const,
    },
    {
      title: "Analytics",
      description: "Performance insights",
      icon: TrendUp,
      href: "/dashboard/analytics",
      color: "green" as const,
    },
    {
      title: "Team Chat",
      description: "Collaborate with team",
      icon: UsersIcon,
      href: "/dashboard/team",
      color: "orange" as const,
    },
    {
      title: "Settings",
      description: "Configure preferences",
      icon: Gear,
      href: "/dashboard/settings",
      color: "yellow" as const,
    },
    {
      title: "Reports",
      description: "View detailed reports",
      icon: ChartLine,
      href: "/dashboard/analytics",
      color: "blue" as const,
    },
  ];

  return (
    <AuthGuard>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Enhanced Hero Section */}
        <EnhancedHeroSection 
          metrics={displayMetrics}
          userName={user?.firstName}
        />

        {/* Enhanced Metrics Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {enhancedMetricsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <EnhancedMetricCard
                key={i}
                title="Loading..."
                value="0"
                icon={Users}
                color="blue"
                loading={true}
              />
            ))
          ) : enhancedMetricsError ? (
            <div className="col-span-full text-center text-red-500">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              Error loading metrics: {enhancedMetricsError.toString()}
            </div>
          ) : (
            metricCards.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <EnhancedMetricCard
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  trend={metric.trend}
                  icon={metric.icon}
                  color={metric.color}
                  description={metric.description}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Team Collaboration Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="lg:col-span-2">
            <TeamActivityFeed organizationId={user?.organizationId || ''} />
          </div>
          <div>
            <TeamStatusGrid organizationId={user?.organizationId || ''} />
          </div>
        </motion.div>

        {/* Quick Actions and AI Insights Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <QuickActionButton
                      title={action.title}
                      description={action.description}
                      icon={action.icon}
                      href={action.href}
                      color={action.color}
                      badge={action.badge}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <AIInsightsPanel 
            metrics={displayMetrics}
            organizationId={user?.organizationId}
          />
        </motion.div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <Suspense fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            }>
              <InboxDashboard />
            </Suspense>
          </div>
          <div className="space-y-6">
            <MemoryMonitor />
            {/* Additional widgets can be added here */}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}