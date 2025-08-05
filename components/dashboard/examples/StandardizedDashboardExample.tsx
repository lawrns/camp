"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from "@phosphor-icons/react";
import {
  MetricCard,
  DashboardGrid,
  DashboardSection,
  ActivityFeed,
  SuccessMetricCard,
  WarningMetricCard,
  ErrorMetricCard,
  InfoMetricCard,
  MetricCardSkeleton
} from "../StandardizedDashboard";

// Example data types
interface MetricData {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  change?: number;
  trend: "up" | "down" | "neutral";
  icon: unknown;
  variant: "default" | "success" | "warning" | "error" | "info";
  description?: string;
}

interface ActivityData {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon: unknown;
  status?: "success" | "warning" | "error" | "info";
}

// Mock data
const mockMetrics: MetricData[] = [
  {
    id: "1",
    title: "Total Revenue",
    value: 125000,
    previousValue: 110000,
    change: 13.6,
    trend: "up",
    icon: TrendingUp,
    variant: "success",
    description: "Monthly revenue growth"
  },
  {
    id: "2",
    title: "Active Users",
    value: 2847,
    previousValue: 2650,
    change: 7.4,
    trend: "up",
    icon: Users,
    variant: "info",
    description: "Daily active users"
  },
  {
    id: "3",
    title: "Response Time",
    value: 2.3,
    previousValue: 1.8,
    change: 27.8,
    trend: "down",
    icon: Clock,
    variant: "warning",
    description: "Average response time in seconds"
  },
  {
    id: "4",
    title: "Error Rate",
    value: 2.1,
    previousValue: 1.5,
    change: 40.0,
    trend: "down",
    icon: AlertTriangle,
    variant: "error",
    description: "Percentage of failed requests"
  }
];

const mockActivity: ActivityData[] = [
  {
    id: "1",
    title: "New conversation started",
    description: "Customer inquiry about pricing plans",
    timestamp: "2 minutes ago",
    icon: MessageCircle,
    status: "info"
  },
  {
    id: "2",
    title: "Issue resolved",
    description: "Technical support ticket #1234 closed",
    timestamp: "5 minutes ago",
    icon: CheckCircle,
    status: "success"
  },
  {
    id: "3",
    title: "System alert",
    description: "High CPU usage detected on server-01",
    timestamp: "15 minutes ago",
    icon: AlertTriangle,
    status: "warning"
  },
  {
    id: "4",
    title: "New user registered",
    description: "John Doe joined the platform",
    timestamp: "1 hour ago",
    icon: Users,
    status: "info"
  }
];

export function StandardizedDashboardExample() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [activity, setActivity] = useState<ActivityData[]>([]);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setMetrics(mockMetrics);
      setActivity(mockActivity);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const formatValue = (value: number, title: string): string => {
    if (title.includes("Revenue")) {
      return `$${value.toLocaleString()}`;
    }
    if (title.includes("Response Time")) {
      return `${value}s`;
    }
    if (title.includes("Error Rate")) {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const getChangePeriod = (): string => {
    return "last month";
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardSection title="Loading Dashboard" />
        <DashboardGrid columns={4}>
          <MetricCardSkeleton count={4} />
        </DashboardGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Main Metrics Section */}
      <DashboardSection
        title="Key Performance Indicators"
        description="Overview of your business metrics for this period"
      >
        <DashboardGrid columns={4}>
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.title}
              value={formatValue(metric.value, metric.title)}
              description={metric.description}
              change={{
                value: Math.abs(metric.change || 0),
                period: getChangePeriod(),
                trend: metric.trend
              }}
              icon={metric.icon}
              variant={metric.variant}
            />
          ))}
        </DashboardGrid>
      </DashboardSection>

      {/* Preset Variants Section */}
      <DashboardSection
        title="Preset Variants"
        description="Pre-configured metric cards for common use cases"
      >
        <DashboardGrid columns={4}>
          <SuccessMetricCard
            title="Conversion Rate"
            value="85%"
            description="Website conversion rate"
            icon={TrendingUp}
          />
          <WarningMetricCard
            title="Pending Tasks"
            value={12}
            description="Tasks awaiting review"
            icon={Clock}
          />
          <ErrorMetricCard
            title="Failed Logins"
            value={3}
            description="Failed authentication attempts"
            icon={AlertTriangle}
          />
          <InfoMetricCard
            title="System Status"
            value="Healthy"
            description="All systems operational"
            icon={CheckCircle}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Activity Feed Section */}
      <DashboardSection
        title="Recent Activity"
        description="Latest events and updates"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed items={activity} />
          </div>
          <div className="space-y-4">
            {/* Additional metrics or widgets can go here */}
            <MetricCard
              title="Quick Stats"
              value="All Good"
              description="System health overview"
              icon={CheckCircle}
              variant="success"
            />
          </div>
        </div>
      </DashboardSection>

      {/* Interactive Example */}
      <DashboardSection
        title="Interactive Metrics"
        description="Click on cards to see interactions"
      >
        <DashboardGrid columns={3}>
          <MetricCard
            title="Clickable Metric"
            value={42}
            description="Click me!"
            icon={Info}
            variant="info"
            onClick={() => alert("Metric card clicked!")}
          />
          <MetricCard
            title="With Target"
            value={75}
            description="Progress towards goal"
            icon={TrendingUp}
            variant="success"
            target={{
              value: 100,
              label: "Target goal"
            }}
          />
          <MetricCard
            title="With Chart"
            value={1234}
            description="Trending data"
            icon={TrendingUp}
            variant="default"
            chart={
              <div className="h-16 w-full bg-gradient-to-r from-blue-500 to-purple-500 rounded opacity-20" />
            }
          />
        </DashboardGrid>
      </DashboardSection>
    </div>
  );
}

// Example of a simplified dashboard using only the essential components
export function SimpleDashboardExample() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Simple Dashboard</h1>
      
      <DashboardGrid columns={2}>
        <SuccessMetricCard
          title="Revenue"
          value="$50,000"
          description="This month"
        />
        <InfoMetricCard
          title="Users"
          value="1,234"
          description="Active users"
        />
      </DashboardGrid>

      <ActivityFeed
        items={[
          {
            id: "1",
            title: "New user signed up",
            timestamp: "5 minutes ago",
            icon: Users
          }
        ]}
      />
    </div>
  );
}

// Example showing loading states
export function LoadingDashboardExample() {
  return (
    <div className="p-6 space-y-6">
      <DashboardSection title="Loading Dashboard" />
      <DashboardGrid columns={4}>
        <MetricCardSkeleton count={4} />
      </DashboardGrid>
    </div>
  );
} 