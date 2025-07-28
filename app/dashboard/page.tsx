'use client';

import { Suspense } from 'react';
import { InboxDashboard } from '@/components/InboxDashboard';
import { MetricCard } from '@/components/MetricCard';
import { MemoryMonitor } from '@/components/MemoryMonitor';
import { useDashboardData } from '@/hooks/useDashboardData';
import { redirect } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { metrics, loading: metricsLoading } = useDashboardData();

  useEffect(() => {
    const supabase = createClientComponentClient();

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        redirect('/login');
      }
    }

    checkSession();
  }, []);

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metricsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))
          ) : metrics ? (
            <>
              <MetricCard
                title="Active Conversations"
                value={metrics.activeConversations.value}
                change={metrics.activeConversations.change}
                trend={metrics.activeConversations.trend}
              />
              <MetricCard
                title="Response Time"
                value={parseFloat(metrics.responseTime.value)}
                change={metrics.responseTime.change}
                trend={metrics.responseTime.trend}
              />
              <MetricCard
                title="AI Resolution Rate"
                value={parseFloat(metrics.aiResolutionRate.value)}
                change={metrics.aiResolutionRate.change}
                trend={metrics.aiResolutionRate.trend}
              />
              <MetricCard
                title="Customer Satisfaction"
                value={parseFloat(metrics.customerSatisfaction.value)}
                change={metrics.customerSatisfaction.change}
                trend={metrics.customerSatisfaction.trend}
              />
            </>
          ) : (
            // Fallback if no metrics
            <div className="col-span-4 text-center text-gray-500">
              Unable to load metrics
            </div>
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
    </div>
  );
}