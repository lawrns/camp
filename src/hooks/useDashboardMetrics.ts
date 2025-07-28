"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

export interface DashboardMetrics {
  totalConversations: number;
  openConversations: number;
  resolvedToday: number;
  responseTime: string;
  activeAgents: number;
  satisfactionRate: number;
  messagesToday: number;
  messagesByHour: number[];
  lastUpdated: string;
}

interface UseDashboardMetricsOptions {
  range?: "today" | "week" | "month";
  refreshInterval?: number;
}

export function useDashboardMetrics(options: UseDashboardMetricsOptions = {}) {
  const { range = "today", refreshInterval = 60000 } = options; // Default 1 minute refresh
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!organizationId) return;

    try {
      // Import the authenticated API client
      const { apiGet } = await import("@/lib/utils/api-client");

      const response = await apiGet(`/api/dashboard/metrics?organizationId=${organizationId}&range=${range}`);

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, range]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();

    // Log only once when the hook is first used

  }, [fetchMetrics]);

  // REMOVED: Auto refresh polling replaced with real-time subscription
  // This eliminates the 60-second polling interval that was causing periodic API calls
  // Real-time updates will be handled by the dashboard metrics manager

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
