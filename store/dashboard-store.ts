import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  resolvedToday: number;
  avgResponseTime: number;
  satisfactionScore: number;
  aiHandovers: number;
  lastUpdated: string;
}

export interface DashboardMetrics {
  todayStats: DashboardStats;
  weeklyStats: DashboardStats;
  monthlyStats: DashboardStats;
  trends: {
    conversations: number[];
    responseTime: number[];
    satisfaction: number[];
  };
}

export interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: string | null;
  organizationId: string | null;
}

export interface DashboardActions {
  setMetrics: (metrics: DashboardMetrics) => void;
  updateStats: (period: "today" | "weekly" | "monthly", stats: Partial<DashboardStats>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOrganizationId: (orgId: string) => void;
  refreshMetrics: () => Promise<void>;
  resetDashboard: () => void;

  // Realtime update handlers
  handleStatsUpdate: (payload: unknown) => void;
  handleConversationUpdate: (payload: unknown) => void;
  handleMetricUpdate: (metric: string, value: number) => void;
}

const initialState: DashboardState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastRefresh: null,
  organizationId: null,
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setMetrics: (metrics) =>
          set((draft) => {
            draft.metrics = metrics;
            draft.lastRefresh = new Date().toISOString();
            draft.error = null;
          }),

        updateStats: (period, stats) =>
          set((draft) => {
            if (draft.metrics) {
              const periodKey = `${period}Stats` as keyof DashboardMetrics;
              if (draft.metrics[periodKey]) {
                Object.assign(draft.metrics[periodKey], {
                  ...stats,
                  lastUpdated: new Date().toISOString(),
                });
              }
            }
          }),

        setLoading: (loading) =>
          set((draft) => {
            draft.isLoading = loading;
          }),

        setError: (error) =>
          set((draft) => {
            draft.error = error;
            draft.isLoading = false;
          }),

        setOrganizationId: (orgId) =>
          set((draft) => {
            draft.organizationId = orgId;
          }),

        refreshMetrics: async () => {
          const state = get();
          if (!state.organizationId) {
            set((draft) => {
              draft.error = "No organization ID available";
            });
            return;
          }

          set((draft) => {
            draft.isLoading = true;
            draft.error = null;
          });

          try {
            // Import the authenticated API client
            const { apiGet } = await import("@/lib/utils/api-client");

            const response = await apiGet(`/api/dashboard/metrics?organization_id=${state.organizationId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch metrics: ${response.status}`);
            }

            const data = await response.json();

            set((draft) => {
              draft.metrics = data.metrics;
              draft.lastRefresh = new Date().toISOString();
              draft.isLoading = false;
            });
          } catch (error) {
            set((draft) => {
              draft.error = error instanceof Error ? error.message : "Failed to load dashboard metrics";
              draft.isLoading = false;
            });
          }
        },

        resetDashboard: () =>
          set((draft) => {
            draft.metrics = null;
            draft.error = null;
            draft.lastRefresh = null;
            draft.isLoading = false;
          }),

        // Realtime update handlers
        handleStatsUpdate: (payload) =>
          set((draft) => {
            if (!draft.metrics) return;

            const { period = "today", stats } = payload;
            const periodKey = `${period}Stats` as keyof DashboardMetrics;

            if (draft.metrics[periodKey]) {
              Object.assign(draft.metrics[periodKey], {
                ...stats,
                lastUpdated: new Date().toISOString(),
              });
            }
          }),

        handleConversationUpdate: (payload) =>
          set((draft) => {
            if (!draft.metrics) return;

            const { action, conversation } = payload;

            switch (action) {
              case "created":
                draft.metrics.todayStats.totalConversations++;
                draft.metrics.todayStats.activeConversations++;
                break;

              case "resolved":
                draft.metrics.todayStats.resolvedToday++;
                if (draft.metrics.todayStats.activeConversations > 0) {
                  draft.metrics.todayStats.activeConversations--;
                }
                break;

              case "assigned":
                // Update assignment metrics if needed
                break;
            }

            draft.metrics.todayStats.lastUpdated = new Date().toISOString();
          }),

        handleMetricUpdate: (metric, value) =>
          set((draft) => {
            if (!draft.metrics) return;

            switch (metric) {
              case "avgResponseTime":
                draft.metrics.todayStats.avgResponseTime = value;
                break;

              case "satisfactionScore":
                draft.metrics.todayStats.satisfactionScore = value;
                break;

              case "aiHandovers":
                draft.metrics.todayStats.aiHandovers = value;
                break;
            }

            draft.metrics.todayStats.lastUpdated = new Date().toISOString();
          }),
      })),
      {
        name: "dashboard-store",
        // Only persist organization ID and last refresh time
        partialize: (state) => ({
          organizationId: state.organizationId,
          lastRefresh: state.lastRefresh,
        }),
      }
    ),
    {
      name: "Dashboard Store",
    }
  )
);

// Selectors for performance optimization
export const selectDashboardMetrics = (state: DashboardState & DashboardActions) => state.metrics;
export const selectDashboardLoading = (state: DashboardState & DashboardActions) => state.isLoading;
export const selectDashboardError = (state: DashboardState & DashboardActions) => state.error;
export const selectTodayStats = (state: DashboardState & DashboardActions) => state.metrics?.todayStats;
