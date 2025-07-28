/**
 * React Hook for Feature Flags
 *
 * Provides a clean interface for components to use feature flags
 * with React patterns like hooks and conditional rendering.
 */

"use client";

import { useEffect, useState } from "react";
import {
  FeatureFlagUtils,
  getFeatureFlag,
  getUIFeatureFlag,
  useNewUIComponents,
  type FeatureFlagKey,
  type UIFeatureFlagKey,
} from "@/lib/feature-flags";

/**
 * Hook to use a feature flag in React components
 */
export function useFeatureFlag(flag: FeatureFlagKey, fallback: boolean = false): boolean {
  const [isEnabled, setIsEnabled] = useState(() => getFeatureFlag(flag) ?? fallback);

  // In development, allow hot reloading of feature flags
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const checkFlag = () => setIsEnabled(getFeatureFlag(flag) ?? fallback);

      // Check every 5 seconds in development for env var changes
      const interval = setInterval(checkFlag, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [flag, fallback]);

  return isEnabled;
}

/**
 * Hook to use a UI-specific feature flag
 */
export function useUIFeatureFlag(flag: UIFeatureFlagKey, fallback: boolean = false): boolean {
  const [isEnabled, setIsEnabled] = useState(() => getUIFeatureFlag(flag) ?? fallback);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const checkFlag = () => setIsEnabled(getUIFeatureFlag(flag) ?? fallback);
      const interval = setInterval(checkFlag, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [flag, fallback]);

  return isEnabled;
}

/**
 * Hook to check if new UI components should be used
 */
export function useNewUI(): boolean {
  const [shouldUseNew, setShouldUseNew] = useState(() => useNewUIComponents());

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const checkNewUI = () => setShouldUseNew(useNewUIComponents());
      const interval = setInterval(checkNewUI, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, []);

  return shouldUseNew;
}

/**
 * Hook for development debugging of feature flags
 */
export function useFeatureFlagDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      FeatureFlagUtils.logEnabledFlags();
    }
  }, []);

  return {
    logFlags: FeatureFlagUtils.logEnabledFlags,
    isNewUIEnabled: FeatureFlagUtils.isNewUIEnabled,
    canUseNewSupabaseClient: FeatureFlagUtils.canUseNewSupabaseClient,
    shouldLazyLoad: FeatureFlagUtils.shouldLazyLoad,
  };
}

/**
 * Hook for conditional Supabase client usage (useful for WIRE-CLIENT task)
 */
export function useSupabaseClientStrategy() {
  const canUseNew = useUIFeatureFlag("USE_NEW_SUPABASE_CLIENT", true);
  const enableRealtimeV2 = useUIFeatureFlag("ENABLE_REALTIME_V2", false);

  return {
    useNewClient: canUseNew,
    enableRealtimeV2,
    // This will be useful when implementing WIRE-CLIENT
    getClientPreference: () => ({
      client: canUseNew ? "new" : "legacy",
      realtime: enableRealtimeV2 ? "v2" : "v1",
    }),
  };
}

/**
 * Component wrapper for feature-flagged rendering
 */
export function FeatureFlag({
  flag,
  fallback = false,
  children,
  fallbackComponent = null,
}: {
  flag: FeatureFlagKey;
  fallback?: boolean;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag, fallback);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallbackComponent}</>;
}

/**
 * Component wrapper for UI feature-flagged rendering
 */
export function UIFeatureFlag({
  flag,
  fallback = false,
  children,
  fallbackComponent = null,
}: {
  flag: UIFeatureFlagKey;
  fallback?: boolean;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}) {
  const isEnabled = useUIFeatureFlag(flag, fallback);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallbackComponent}</>;
}
