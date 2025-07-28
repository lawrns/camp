// Feature flags for dashboard components
export const DASHBOARD_FLAGS = {
  // Enable the new welcome dashboard instead of the old cluttered one
  USE_WELCOME_DASHBOARD: process.env.NEXT_PUBLIC_USE_WELCOME_DASHBOARD === "true" || true,

  // Enable improved metrics display
  ENHANCED_METRICS: true,

  // Enable AI insights section
  AI_INSIGHTS: true,

  // Enable real-time data refresh
  REALTIME_REFRESH: true,

  // Enable dashboard customization
  DASHBOARD_CUSTOMIZATION: false,
} as const;

export type DashboardFlag = keyof typeof DASHBOARD_FLAGS;

export function isDashboardFeatureEnabled(flag: DashboardFlag): boolean {
  return DASHBOARD_FLAGS[flag];
}

// Helper to check if we should use the new welcome dashboard
export function useWelcomeDashboard(): boolean {
  return isDashboardFeatureEnabled("USE_WELCOME_DASHBOARD");
}
