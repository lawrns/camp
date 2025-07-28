/**
 * Feature Flag Configuration
 *
 * Centralized configuration for feature flags with environment-specific settings:
 * - Development: Local provider with debug mode
 * - Staging: LaunchDarkly with 20% rollout
 * - Production: LaunchDarkly with gradual rollout (1% -> 100%)
 */

import { FeatureFlagConfig } from "./index";

// Environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isStaging = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "staging";
const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";

// Feature flag rollout schedules
export const ROLLOUT_SCHEDULES = {
  // Widget consolidation rollout (7-day schedule)
  "widget-consolidation-enabled": {
    day1: 1, // 1% initial rollout
    day2: 5, // 5% if no issues
    day3: 10, // 10% gradual increase
    day4: 25, // 25% broader testing
    day5: 50, // 50% half rollout
    day6: 75, // 75% near full
    day7: 100, // 100% complete rollout
  },

  // Enhanced panel rollout removed - no longer needed

  // AI handover rollout (3-day schedule)
  "ai-handover-queue": {
    day1: 10, // 10% initial rollout
    day2: 50, // 50% if working well
    day3: 100, // 100% complete rollout
  },
};

// Development configuration
const developmentConfig: FeatureFlagConfig = {
  provider: "local",
  environment: "development",
  enableRealTimeUpdates: true,
  enableAnalytics: true,
  debug: true,
  fallbackFlags: {
    // Enable all features in development for testing
    "widget-consolidation-enabled": true,
    "ai-handover-queue": true,
    "performance-monitoring": true,
    "accessibility-enhancements": true,
    "bundle-optimization": true,
    "lazy-loading": true,
    "animation-reduction": false,
    "frame-rate-monitoring": true,
    "enterprise-security": true,
    "audit-logging": true,
    "user-feedback-system": true,
    "real-time-optimization": true,
    "new-welcome-flow": true,
    "improved-ai-responses": true,
    "enhanced-mobile-ui": true,
  },
};

// Staging configuration
const stagingConfig: FeatureFlagConfig = {
  provider: "launchdarkly",
  apiKey: process.env.LAUNCHDARKLY_CLIENT_KEY_STAGING,
  environment: "staging",
  enableRealTimeUpdates: true,
  enableAnalytics: true,
  debug: true,
  fallbackFlags: {
    // Conservative staging rollout
    "widget-consolidation-enabled": true,
    "ai-handover-queue": false,
    "performance-monitoring": true,
    "accessibility-enhancements": true,
    "bundle-optimization": true,
    "lazy-loading": true,
    "animation-reduction": false,
    "frame-rate-monitoring": true,
    "enterprise-security": false,
    "audit-logging": false,
    "user-feedback-system": true,
    "real-time-optimization": true,
    "new-welcome-flow": false,
    "improved-ai-responses": false,
    "enhanced-mobile-ui": false,
  },
};

// Production configuration
const productionConfig: FeatureFlagConfig = {
  provider: "launchdarkly",
  apiKey: process.env.LAUNCHDARKLY_CLIENT_KEY_PRODUCTION,
  environment: "production",
  enableRealTimeUpdates: true,
  enableAnalytics: true,
  debug: false,
  fallbackFlags: {
    // Conservative production rollout
    "widget-consolidation-enabled": false, // Start with 1% rollout
    "ai-handover-queue": false, // Start with 10% rollout
    "performance-monitoring": true, // Always enabled
    "accessibility-enhancements": true, // Always enabled
    "bundle-optimization": true, // Always enabled
    "lazy-loading": true, // Always enabled
    "animation-reduction": false, // Disabled by default
    "frame-rate-monitoring": true, // Always enabled
    "enterprise-security": false, // Gradual rollout
    "audit-logging": false, // Gradual rollout
    "user-feedback-system": false, // Gradual rollout
    "real-time-optimization": true, // Always enabled
    "new-welcome-flow": false, // A/B test
    "improved-ai-responses": false, // A/B test
    "enhanced-mobile-ui": false, // A/B test
  },
};

// Get configuration based on environment
export function getFeatureFlagConfig(
  userId?: string,
  organizationId?: string,
  userSegment?: string
): FeatureFlagConfig {
  let baseConfig: FeatureFlagConfig;

  if (isDevelopment) {
    baseConfig = developmentConfig;
  } else if (isStaging) {
    baseConfig = stagingConfig;
  } else {
    baseConfig = productionConfig;
  }

  // Add user context
  return {
    ...baseConfig,
    userId,
    organizationId,
  };
}

// Feature flag metadata for documentation
export const FEATURE_FLAG_METADATA = {
  "widget-consolidation-enabled": {
    description: "Enables the consolidated widget architecture",
    owner: "frontend-team",
    impact: "high",
    rolloutStrategy: "gradual",
    dependencies: ["bundle-optimization", "performance-monitoring"],
    metrics: ["widget_load_time", "error_rate", "user_satisfaction"],
  },

  "ai-handover-queue": {
    description: "Enables AI handover queue functionality",
    owner: "ai-team",
    impact: "medium",
    rolloutStrategy: "gradual",
    dependencies: ["widget-consolidation-enabled"],
    metrics: ["handover_success_rate", "ai_resolution_rate", "response_time"],
  },

  "performance-monitoring": {
    description: "Enables real-time performance monitoring",
    owner: "platform-team",
    impact: "low",
    rolloutStrategy: "immediate",
    dependencies: [],
    metrics: ["fps", "memory_usage", "core_web_vitals"],
  },

  "accessibility-enhancements": {
    description: "Enables WCAG 2.1 AA accessibility features",
    owner: "frontend-team",
    impact: "medium",
    rolloutStrategy: "immediate",
    dependencies: [],
    metrics: ["accessibility_score", "keyboard_navigation_usage"],
  },

  "enterprise-security": {
    description: "Enables enterprise security features (CSP, SRI)",
    owner: "security-team",
    impact: "high",
    rolloutStrategy: "gradual",
    dependencies: [],
    metrics: ["security_violations", "csp_reports"],
  },

  "user-feedback-system": {
    description: "Enables user feedback collection and correlation",
    owner: "product-team",
    impact: "medium",
    rolloutStrategy: "gradual",
    dependencies: ["performance-monitoring"],
    metrics: ["feedback_rate", "satisfaction_score", "performance_correlation"],
  },
};

// Rollout percentage calculator
export function getRolloutPercentage(flagKey: string, rolloutDay: number = 1): number {
  const schedule = ROLLOUT_SCHEDULES[flagKey as keyof typeof ROLLOUT_SCHEDULES];
  if (!schedule) return 0;

  const dayKey = `day${Math.min(rolloutDay, 7)}` as keyof typeof schedule;
  return schedule[dayKey] || 0;
}

// Feature flag validation
export function validateFeatureFlags(flags: Record<string, boolean>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check dependencies
  // enhanced-panel-v3 dependency removed - widget consolidation complete

  if (flags["ai-handover-queue"] && !flags["widget-consolidation-enabled"]) {
    errors.push("ai-handover-queue requires widget-consolidation-enabled");
  }

  if (flags["user-feedback-system"] && !flags["performance-monitoring"]) {
    warnings.push("user-feedback-system works best with performance-monitoring enabled");
  }

  // Check for conflicting flags
  if (flags["animation-reduction"] && flags["enhanced-mobile-ui"]) {
    warnings.push("animation-reduction may conflict with enhanced-mobile-ui");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default getFeatureFlagConfig;
