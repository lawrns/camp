/**
 * Campfire Feature Flags Configuration
 *
 * Centralized feature flag management for enabling/disabling features
 * across the application with environment variable support.
 */

// Core feature flags
export const FEATURE_FLAGS = {
  // AI & RAG Features
  RAG_HUMAN_MODE: process.env.NEXT_PUBLIC_RAG_HUMAN_MODE === "true",
  AI_CONFIDENCE_SCORING: process.env.NEXT_PUBLIC_AI_CONFIDENCE_SCORING !== "false",
  AI_TYPING_SIMULATION: process.env.NEXT_PUBLIC_AI_TYPING_SIMULATION !== "false", // ACTIVATED
  AI_TONE_ADAPTATION: process.env.NEXT_PUBLIC_AI_TONE_ADAPTATION === "true",

  // Real-time Features
  REALTIME_TYPING_INDICATORS: process.env.NEXT_PUBLIC_REALTIME_TYPING !== "false",
  REALTIME_PARTIAL_MESSAGES: process.env.NEXT_PUBLIC_REALTIME_PARTIAL === "true",

  // Widget Features
  WIDGET_HUMAN_LIKE_AI: process.env.NEXT_PUBLIC_WIDGET_HUMAN_AI === "true",

  // Development & Testing
  AI_EVALUATION_MODE: process.env.NEXT_PUBLIC_AI_EVAL_MODE === "true",
  DEBUG_AI_RESPONSES: process.env.NODE_ENV === "development" && process.env.DEBUG_AI === "true",
} as const;

// Legacy exports for backward compatibility
export const RAG_HUMAN_MODE = FEATURE_FLAGS.RAG_HUMAN_MODE;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Feature flag configuration for different environments
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    RAG_HUMAN_MODE: true,
    AI_TYPING_SIMULATION: true,
    AI_TONE_ADAPTATION: true,
    DEBUG_AI_RESPONSES: true,
    AI_EVALUATION_MODE: true,
  },
  staging: {
    RAG_HUMAN_MODE: true,
    AI_TYPING_SIMULATION: true,
    AI_TONE_ADAPTATION: true,
    DEBUG_AI_RESPONSES: false,
    AI_EVALUATION_MODE: true,
  },
  production: {
    RAG_HUMAN_MODE: false, // Start disabled in production
    AI_TYPING_SIMULATION: false,
    AI_TONE_ADAPTATION: false,
    DEBUG_AI_RESPONSES: false,
    AI_EVALUATION_MODE: false,
  },
} as const;

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIGS;
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development;
}

/**
 * Human-like AI configuration constants
 */
export const HUMAN_AI_CONFIG = {
  // Typing simulation
  TYPING_WPM_MIN: 25,
  TYPING_WPM_MAX: 35,
  TYPING_JITTER_FACTOR: 0.2, // ±20% variation

  // Response timing
  MIN_RESPONSE_DELAY: 1000, // 1 second minimum
  MAX_RESPONSE_DELAY: 8000, // 8 seconds maximum
  COMPLEXITY_DELAY_FACTOR: 100, // ms per word

  // Partial messages
  PARTIAL_MESSAGE_PROBABILITY: 0.3, // 30% chance of partial message
  PARTIAL_MESSAGE_MIN_LENGTH: 20, // Minimum characters for partial

  // Typo injection (optional)
  TYPO_PROBABILITY: 0.02, // 2% chance of typos
  TYPO_CORRECTION_DELAY: 2000, // 2 seconds to correct typos

  // Quality thresholds
  CONFIDENCE_THRESHOLD: 0.7,
  ESCALATION_THRESHOLD: 0.5,

  // Cost controls
  MAX_TOKENS_PER_HOUR: 30000,
  MAX_RESPONSE_LATENCY: 4000, // 4 seconds max total time
} as const;

/**
 * Tone adaptation configuration
 */
export const TONE_CONFIG = {
  SENTIMENT_ANALYSIS_ENABLED: true,
  AVAILABLE_TONES: ["friendly", "empathetic", "technical", "professional"] as const,
  DEFAULT_TONE: "friendly" as const,

  // Sentiment mapping
  SENTIMENT_TONE_MAP: {
    frustrated: "empathetic",
    angry: "empathetic",
    confused: "helpful",
    happy: "friendly",
    neutral: "professional",
    technical: "technical",
  } as const,
} as const;

export type AvailableTone = (typeof TONE_CONFIG.AVAILABLE_TONES)[number];
export type SentimentType = keyof typeof TONE_CONFIG.SENTIMENT_TONE_MAP;

/**
 * Runtime feature flag checker with organization override
 */
export interface FeatureContext {
  organizationId?: string;
  userId?: string;
  environment?: string;
}

/**
 * Check if human-like AI is enabled for a specific context
 */
export async function isHumanAIEnabled(context: FeatureContext = {}): Promise<boolean> {
  // Base feature flag check
  if (!FEATURE_FLAGS.RAG_HUMAN_MODE) {
    return false;
  }

  // If no organization context, return base flag
  if (!context.organizationId) {
    return FEATURE_FLAGS.RAG_HUMAN_MODE;
  }

  // Organization-specific override will be checked in the helper function
  // This is a placeholder for the database check
  return FEATURE_FLAGS.RAG_HUMAN_MODE;
}

/**
 * Development utilities
 */
export const DEV_UTILS = {
  /**
   * Override feature flags for testing
   */
  overrideFeature(feature: keyof typeof FEATURE_FLAGS, enabled: boolean) {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Type-safe override for development only
    (FEATURE_FLAGS as any)[feature] = enabled;
  },

  /**
   * Log current feature flag status
   */
  logFeatureStatus() {
    if (process.env.NODE_ENV !== "development") return;
  },

  /**
   * Test human AI configuration
   */
  testHumanAIConfig() {
    if (process.env.NODE_ENV !== "development") return;
  },
} as const;

// Initialize feature flags logging in development
if (process.env.NODE_ENV === "development") {
  DEV_UTILS.logFeatureStatus();
}
