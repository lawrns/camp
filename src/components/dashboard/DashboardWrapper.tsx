"use client";

import { useWelcomeDashboard } from "@/lib/features/dashboard-flags";
import { WelcomeDashboard } from "./WelcomeDashboard";

export function DashboardWrapper() {
  const shouldUseWelcomeDashboard = useWelcomeDashboard();

  // Always use WelcomeDashboard since RealDashboard was removed during consolidation
  return <WelcomeDashboard />;
}
