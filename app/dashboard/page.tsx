'use client';

import { Suspense } from 'react';
import { InboxDashboard } from '@/components/InboxDashboard';
import { MemoryMonitor } from '@/components/MemoryMonitor';
import { useRealtimeDashboard } from '../app/hooks/useRealtimeDashboard';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { TrendingUp, TrendingDown, Users, Clock, Star, Ticket, CheckCircle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { metrics, activities, systemStatus } = useRealtimeDashboard();
  const { loading: metricsLoading, error } = metrics;

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

  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome back, {user?.email?.split('@')[0] || 'User'}!
        </h1>

        {/* Enhanced Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-4 text-center text-red-500">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              Error loading metrics: {error}
            </div>
          ) : (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Conversations</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.conversations}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% from last hour
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.responseTime}s</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -8% faster today
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Customer Satisfaction</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.satisfaction}/5</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +0.2 this week
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Resolved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.resolvedToday}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +15% vs yesterday
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<div>Loading inbox...</div>}>
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