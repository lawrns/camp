'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3Icon,
  TrendingUpIcon,
  UsersIcon,
  MessageSquareIcon,
  ClockIcon,
  StarIcon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-react';
import { trpc } from '@/trpc/react';

interface AnalyticsMetrics {
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
  agentUtilization: number;
}

interface TimeSeriesData {
  date: string;
  conversations: number;
  messages: number;
  responseTime: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics data using tRPC
  const { data: dashboardMetrics, isLoading: metricsLoading, refetch } = trpc.analytics.getDashboardMetrics.useQuery({
    timeRange,
  });

  const mockMetrics: AnalyticsMetrics = {
    totalConversations: 1247,
    activeConversations: 89,
    avgResponseTime: 4.2,
    customerSatisfaction: 4.6,
    resolutionRate: 94.2,
    agentUtilization: 78.5
  };

  const mockTimeSeries: TimeSeriesData[] = [
    { date: '2024-01-01', conversations: 45, messages: 234, responseTime: 3.8 },
    { date: '2024-01-02', conversations: 52, messages: 287, responseTime: 4.1 },
    { date: '2024-01-03', conversations: 38, messages: 198, responseTime: 3.9 },
    { date: '2024-01-04', conversations: 61, messages: 312, responseTime: 4.5 },
    { date: '2024-01-05', conversations: 47, messages: 256, responseTime: 4.0 },
    { date: '2024-01-06', conversations: 55, messages: 289, responseTime: 4.2 },
    { date: '2024-01-07', conversations: 49, messages: 267, responseTime: 3.7 },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const handleRefresh = () => {
    setIsLoading(true);
    refetch();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your team&apos;s performance and customer satisfaction metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex space-x-1">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 Hours' : 
               range === '7d' ? '7 Days' :
               range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+5.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-8.1%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.customerSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.8%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Utilization</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.agentUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">-2.1%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="satisfaction">Customer Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Trends</CardTitle>
              <CardDescription>
                Daily conversation volume and response times over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3Icon className="h-12 w-12 mx-auto mb-4" />
                  <p>Chart visualization would be rendered here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of conversation metrics and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Channel</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Chat Widget</span>
                        <Badge variant="secondary">65%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Email</span>
                        <Badge variant="secondary">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">API</span>
                        <Badge variant="secondary">10%</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Resolved</span>
                        <Badge variant="default">78%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Active</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="outline">7%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Individual agent metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <UsersIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Agent performance metrics would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
              <CardDescription>
                Customer feedback and satisfaction scores over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <StarIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Customer satisfaction metrics would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
