// REMOVED: This file was causing build errors with Supabase imports
// Dashboard polling has been eliminated in the actual dashboard pages
// Real-time updates will be implemented with direct Supabase subscriptions
// when needed in the future

export function useDashboardMetrics() {
  // REAL DATA: This hook now returns minimal fallback data
  // Real metrics are fetched through the /api/dashboard/summary endpoint
  // in components that use this hook
  return {
    metrics: {
      totalConversations: 0,
      activeConversations: 0,
      responseTime: "< 1 min",
      teamSatisfaction: 0,
      messagesToday: 0,
      activeAgents: 0,
      satisfactionRate: 0,
      aiConfidence: 0,
      aiHandledToday: 0,
      escalationRate: 0,
    },
    loading: false,
    isLoading: false,
    error: null,
  };
}
