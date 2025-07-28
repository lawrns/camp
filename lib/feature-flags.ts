/**
 * Feature Flags System
 * Provides feature flag management for the application
 */

export interface FeatureFlags {
  // UI Component Flags
  useNewUIComponents: boolean;
  useFlameUI: boolean;
  usePhoenixUI: boolean;
  useGlassMorphism: boolean;

  // AI Feature Flags
  enableAIAssistant: boolean;
  enableAutonomousAI: boolean;
  enableAIResponseGeneration: boolean;
  enableAISummaries: boolean;
  enableAIAnalytics: boolean;

  // Performance Flags
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableOptimizedAnimations: boolean;
  enableServiceWorker: boolean;

  // Realtime Flags
  enableRealtimeSync: boolean;
  enablePresenceIndicators: boolean;
  enableTypingIndicators: boolean;
  enableLiveCollaboration: boolean;
  REALTIME_ONLY: boolean;
  ENABLE_REALTIME_V2: boolean;

  // Integration Flags
  enableSlackIntegration: boolean;
  enableEmailIntegration: boolean;
  enableWebhooks: boolean;
  enableAPIAccess: boolean;

  // Client Flags
  USE_NEW_SUPABASE_CLIENT: boolean;

  // Experimental Flags
  enableExperimentalFeatures: boolean;
  enableBetaFeatures: boolean;
  enableDebugMode: boolean;
}

// Default feature flags
export const defaultFeatureFlags: FeatureFlags = {
  // UI Component Flags
  useNewUIComponents: true,
  useFlameUI: true,
  usePhoenixUI: false,
  useGlassMorphism: false,

  // AI Feature Flags
  enableAIAssistant: true,
  enableAutonomousAI: false, // Not activated yet
  enableAIResponseGeneration: true,
  enableAISummaries: true,
  enableAIAnalytics: true,

  // Performance Flags
  enableVirtualization: true,
  enableLazyLoading: true,
  enableOptimizedAnimations: true,
  enableServiceWorker: false,

  // Realtime Flags
  enableRealtimeSync: true,
  enablePresenceIndicators: true,
  enableTypingIndicators: true,
  enableLiveCollaboration: true,
  REALTIME_ONLY: false,
  ENABLE_REALTIME_V2: false,

  // Integration Flags
  enableSlackIntegration: false,
  enableEmailIntegration: true,
  enableWebhooks: false,
  enableAPIAccess: true,

  // Client Flags
  USE_NEW_SUPABASE_CLIENT: true,

  // Experimental Flags
  enableExperimentalFeatures: false,
  enableBetaFeatures: false,
  enableDebugMode: process.env.NODE_ENV === "development",
};

// Environment-based overrides
const environmentOverrides: Partial<FeatureFlags> = {
  // Production overrides
  ...(process.env.NODE_ENV === "production" && {
    enableDebugMode: false,
    enableExperimentalFeatures: false,
  }),

  // Development overrides
  ...(process.env.NODE_ENV === "development" && {
    enableDebugMode: true,
    enableBetaFeatures: true,
  }),

  // Test overrides
  ...(process.env.NODE_ENV === "test" && {
    enableRealtimeSync: false,
    enableAIAssistant: false,
  }),
};

// Merge flags with overrides
export const featureFlags: FeatureFlags = {
  ...defaultFeatureFlags,
  ...environmentOverrides,
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  return featureFlags[flag];
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

/**
 * Hook for using new UI components
 */
export function useNewUIComponents(): boolean {
  return isFeatureEnabled("useNewUIComponents");
}

/**
 * Hook for checking AI features
 */
export function useAIFeatures() {
  return {
    isAIAssistantEnabled: isFeatureEnabled("enableAIAssistant"),
    isAutonomousAIEnabled: isFeatureEnabled("enableAutonomousAI"),
    isAIResponseGenerationEnabled: isFeatureEnabled("enableAIResponseGeneration"),
    isAISummariesEnabled: isFeatureEnabled("enableAISummaries"),
    isAIAnalyticsEnabled: isFeatureEnabled("enableAIAnalytics"),
  };
}

/**
 * Hook for checking realtime features
 */
export function useRealtimeFeatures() {
  return {
    isRealtimeSyncEnabled: isFeatureEnabled("enableRealtimeSync"),
    arePresenceIndicatorsEnabled: isFeatureEnabled("enablePresenceIndicators"),
    areTypingIndicatorsEnabled: isFeatureEnabled("enableTypingIndicators"),
    isLiveCollaborationEnabled: isFeatureEnabled("enableLiveCollaboration"),
  };
}

/**
 * Hook for checking performance features
 */
export function usePerformanceFeatures() {
  return {
    isVirtualizationEnabled: isFeatureEnabled("enableVirtualization"),
    isLazyLoadingEnabled: isFeatureEnabled("enableLazyLoading"),
    areOptimizedAnimationsEnabled: isFeatureEnabled("enableOptimizedAnimations"),
    isServiceWorkerEnabled: isFeatureEnabled("enableServiceWorker"),
  };
}

/**
 * Hook for checking integration features
 */
export function useIntegrationFeatures() {
  return {
    isSlackIntegrationEnabled: isFeatureEnabled("enableSlackIntegration"),
    isEmailIntegrationEnabled: isFeatureEnabled("enableEmailIntegration"),
    areWebhooksEnabled: isFeatureEnabled("enableWebhooks"),
    isAPIAccessEnabled: isFeatureEnabled("enableAPIAccess"),
  };
}

/**
 * Runtime feature flag override (for testing/debugging)
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    (featureFlags as any)[flag] = value;
  } else {
  }
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    Object.assign(featureFlags, defaultFeatureFlags, environmentOverrides);
  }
}

/**
 * Feature flag context for React
 */
export interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isEnabled: <K extends keyof FeatureFlags>(flag: K) => FeatureFlags[K];
  setFlag: <K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]) => void;
}

/**
 * Get feature flags for organization (future enhancement)
 */
export async function getOrganizationFeatureFlags(organizationId: string): Promise<Partial<FeatureFlags>> {
  // Mock implementation - in real app, this would fetch from database
  // Different organizations might have different feature access
  return {};
}

/**
 * Feature flag utilities
 */
export const FeatureFlagUtils = {
  isEnabled: isFeatureEnabled,
  getAll: getAllFeatureFlags,
  set: setFeatureFlag,
  reset: resetFeatureFlags,
  logEnabledFlags: () => {},
  isNewUIEnabled: () => isFeatureEnabled("useNewUIComponents"),
  canUseNewSupabaseClient: () => isFeatureEnabled("useFlameUI"),
  shouldLazyLoad: () => isFeatureEnabled("enableLazyLoading"),

  // Convenience methods
  ai: useAIFeatures,
  realtime: useRealtimeFeatures,
  performance: usePerformanceFeatures,
  integrations: useIntegrationFeatures,
};

// Export legacy function names for backward compatibility
export const getFeatureFlag = isFeatureEnabled;
export const getUIFeatureFlag = isFeatureEnabled;
export type FeatureFlagKey = keyof FeatureFlags;
export type UIFeatureFlagKey = keyof FeatureFlags;
