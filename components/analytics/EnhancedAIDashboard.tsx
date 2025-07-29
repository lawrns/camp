'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface EnhancedAIDashboardProps {
  organizationId: string;
  className?: string;
}

export function EnhancedAIDashboard({ organizationId, className = '' }: EnhancedAIDashboardProps) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up real-time updates
    const interval = setInterval(loadRealTimeData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [organizationId, timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      // Load performance metrics
      const performanceResponse = await fetch(
        `/api/analytics/ai-enhanced?organizationId=${organizationId}&type=performance&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (performanceResponse.ok) {
        const performanceResult = await performanceResponse.json();
        setPerformanceData(performanceResult.data);
      }

      // Load trend data
      const trendResponse = await fetch(
        `/api/analytics/ai-enhanced?organizationId=${organizationId}&type=trends&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&granularity=day`
      );
      
      if (trendResponse.ok) {
        const trendResult = await trendResponse.json();
        setTrendData(trendResult.data);
      }

      await loadRealTimeData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const response = await fetch(
        `/api/analytics/ai-enhanced?organizationId=${organizationId}&type=realtime`
      );
      
      if (response.ok) {
        const result = await response.json();
        setRealTimeData(result.data);
      }
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced AI Analytics</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realTimeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{realTimeData.activeConversations}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatResponseTime(realTimeData.averageResponseTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Confidence</p>
                  <p className={`text-2xl font-bold ${getConfidenceColor(realTimeData.currentConfidence)}`}>
                    {Math.round(realTimeData.currentConfidence * 100)}%
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Handovers</p>
                  <p className="text-2xl font-bold text-gray-900">{realTimeData.recentHandovers}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Overview */}
      {performanceData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Interactions</span>
                  <span className="text-lg font-bold">{performanceData.totalInteractions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Confidence</span>
                  <Badge className={getConfidenceBadgeColor(performanceData.averageConfidence)}>
                    {Math.round(performanceData.averageConfidence * 100)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Handover Rate</span>
                  <span className="text-lg font-bold">
                    {Math.round(performanceData.handoverRate * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Satisfaction Score</span>
                  <span className="text-lg font-bold">
                    {performanceData.satisfactionScore.toFixed(1)}/5.0
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fast (&lt;1s)</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(performanceData.responseTimeDistribution.fast / performanceData.totalInteractions) * 100} 
                      className="w-20" 
                    />
                    <span className="text-sm font-medium">
                      {performanceData.responseTimeDistribution.fast}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium (1-3s)</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(performanceData.responseTimeDistribution.medium / performanceData.totalInteractions) * 100} 
                      className="w-20" 
                    />
                    <span className="text-sm font-medium">
                      {performanceData.responseTimeDistribution.medium}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Slow (&gt;3s)</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(performanceData.responseTimeDistribution.slow / performanceData.totalInteractions) * 100} 
                      className="w-20" 
                    />
                    <span className="text-sm font-medium">
                      {performanceData.responseTimeDistribution.slow}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="averageConfidence" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Avg Confidence"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Handover Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="handoverRate" 
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="Handover Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
