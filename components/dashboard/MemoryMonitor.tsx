'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BrainIcon,
  DatabaseIcon,
  ClockIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface MemoryMetrics {
  totalMemoryUsage: number; // in MB
  maxMemoryLimit: number; // in MB
  activeConnections: number;
  cacheHitRate: number; // percentage
  averageResponseTime: number; // in ms
  errorRate: number; // percentage
  lastUpdated: Date;
}

interface MemoryUsageData {
  timestamp: string;
  memoryUsage: number;
  responseTime: number;
  activeConnections: number;
}

interface MemoryMonitorProps {
  className?: string;
  refreshInterval?: number; // in seconds
}

export function MemoryMonitor({ 
  className, 
  refreshInterval = 30 
}: MemoryMonitorProps) {
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<MemoryUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load memory metrics
  const loadMetrics = async () => {
    try {
      setError(null);
      
      // Simulate memory metrics (in a real app, this would come from your monitoring service)
      const mockMetrics: MemoryMetrics = {
        totalMemoryUsage: Math.random() * 800 + 200, // 200-1000 MB
        maxMemoryLimit: 1024, // 1GB limit
        activeConnections: Math.floor(Math.random() * 50) + 10,
        cacheHitRate: Math.random() * 20 + 80, // 80-100%
        averageResponseTime: Math.random() * 1000 + 500, // 500-1500ms
        errorRate: Math.random() * 5, // 0-5%
        lastUpdated: new Date()
      };

      setMetrics(mockMetrics);
      setLastRefresh(new Date());

      // Add to historical data
      const newDataPoint: MemoryUsageData = {
        timestamp: new Date().toISOString(),
        memoryUsage: mockMetrics.totalMemoryUsage,
        responseTime: mockMetrics.averageResponseTime,
        activeConnections: mockMetrics.activeConnections
      };

      setHistoricalData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });

    } catch (err) {
      console.error('Failed to load memory metrics:', err);
      setError('Failed to load memory metrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getMemoryUsageStatus = () => {
    if (!metrics) return 'info';
    const usagePercentage = (metrics.totalMemoryUsage / metrics.maxMemoryLimit) * 100;
    if (usagePercentage >= 90) return 'error';
    if (usagePercentage >= 75) return 'warning';
    return 'success';
  };

  const getResponseTimeStatus = () => {
    if (!metrics) return 'info';
    if (metrics.averageResponseTime >= 2000) return 'error';
    if (metrics.averageResponseTime >= 1000) return 'warning';
    return 'success';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <BrainIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-600" />
            <span>Memory Monitor Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadMetrics} size="sm">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainIcon className="h-5 w-5" />
            <CardTitle>AI Memory Monitor</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs rounded-full">
              Last updated: {lastRefresh ? formatDistanceToNow(lastRefresh, { addSuffix: true }) : 'Never'}
            </Badge>
            <Button
              onClick={loadMetrics}
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time monitoring of AI system performance and resource usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !metrics ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Memory Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    {getStatusIcon(getMemoryUsageStatus())}
                  </div>
                  <div className="text-2xl font-bold">
                    {metrics ? formatBytes(metrics.totalMemoryUsage * 1024 * 1024) : '---'}
                  </div>
                  <Progress 
                    value={metrics ? (metrics.totalMemoryUsage / metrics.maxMemoryLimit) * 100 : 0} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {metrics ? `${((metrics.totalMemoryUsage / metrics.maxMemoryLimit) * 100).toFixed(1)}% of ${formatBytes(metrics.maxMemoryLimit * 1024 * 1024)}` : 'Loading...'}
                  </div>
                </div>

                {/* Response Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    {getStatusIcon(getResponseTimeStatus())}
                  </div>
                  <div className="text-2xl font-bold">
                    {metrics ? formatTime(metrics.averageResponseTime) : '---'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average response time
                  </div>
                </div>

                {/* Active Connections */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connections</span>
                    <DatabaseIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {metrics ? metrics.activeConnections : '---'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active connections
                  </div>
                </div>

                {/* Cache Hit Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <TrendingUpIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {metrics ? `${metrics.cacheHitRate.toFixed(1)}%` : '---'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cache efficiency
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {/* Memory Usage Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Memory Usage Over Time</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis tickFormatter={(value) => `${value.toFixed(0)}MB`} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(1)}MB`, 'Memory Usage']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response Time Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Response Time Trends</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis tickFormatter={(value) => `${value}ms`} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={metrics && metrics.errorRate < 1 ? 'default' : 'destructive'} className="rounded-full">
                        {metrics ? `${metrics.errorRate.toFixed(2)}%` : '---'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cache Hit Rate</span>
                      <Badge variant={metrics && metrics.cacheHitRate > 90 ? 'default' : 'secondary'} className="rounded-full">
                        {metrics ? `${metrics.cacheHitRate.toFixed(1)}%` : '---'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Connections</span>
                      <span className="text-sm font-medium">
                        {metrics ? metrics.activeConnections : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <Badge variant={getResponseTimeStatus() === 'success' ? 'default' : 'destructive'} className="rounded-full">
                        {metrics ? formatTime(metrics.averageResponseTime) : '---'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Efficiency</span>
                      <Badge variant={getMemoryUsageStatus() === 'success' ? 'default' : 'secondary'} className="rounded-full">
                        {metrics ? `${(100 - (metrics.totalMemoryUsage / metrics.maxMemoryLimit) * 100).toFixed(1)}%` : '---'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last Updated</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics ? formatDistanceToNow(metrics.lastUpdated, { addSuffix: true }) : '---'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}