/**
 * Feature flags for MASS UPGRADE operator model
 * Allows gradual rollout of the unified operators system
 */

export const OPERATOR_UPGRADE_FLAGS = {
  // Master switch for entire upgrade
  UNIFIED_OPERATORS_ENABLED: process.env.NEXT_PUBLIC_UNIFIED_OPERATORS_ENABLED === "true",

  // Individual feature toggles
  TYPING_SIMULATION_ENABLED: process.env.NEXT_PUBLIC_TYPING_SIMULATION_ENABLED === "true",
  CHARACTER_PREVIEW_ENABLED: process.env.NEXT_PUBLIC_CHARACTER_PREVIEW_ENABLED === "true",
  REMOVE_AI_INDICATORS: process.env.NEXT_PUBLIC_REMOVE_AI_INDICATORS === "true",
  USE_OPERATOR_TABLE: process.env.NEXT_PUBLIC_USE_OPERATOR_TABLE === "true",
  NATURAL_TYPING_DELAYS: process.env.NEXT_PUBLIC_NATURAL_TYPING_DELAYS === "true",

  // Rollout percentage (0-100)
  ROLLOUT_PERCENTAGE: parseInt(process.env.NEXT_PUBLIC_OPERATOR_ROLLOUT_PERCENTAGE || "0", 10),
} as const;

/**
 * Check if upgrade features should be enabled for current user
 */
export function isOperatorUpgradeEnabled(userId?: string): boolean {
  // Master switch check
  if (!OPERATOR_UPGRADE_FLAGS.UNIFIED_OPERATORS_ENABLED) {
    return false;
  }

  // Full rollout
  if (OPERATOR_UPGRADE_FLAGS.ROLLOUT_PERCENTAGE >= 100) {
    return true;
  }

  // No rollout
  if (OPERATOR_UPGRADE_FLAGS.ROLLOUT_PERCENTAGE <= 0) {
    return false;
  }

  // Percentage-based rollout using user ID hash
  if (userId) {
    const hash = userId.split("").reduce((acc: any, char: any) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return hash % 100 < OPERATOR_UPGRADE_FLAGS.ROLLOUT_PERCENTAGE;
  }

  // Random rollout for anonymous users
  return Math.random() * 100 < OPERATOR_UPGRADE_FLAGS.ROLLOUT_PERCENTAGE;
}

/**
 * Get current feature configuration
 */
export function getOperatorFeatures(userId?: string) {
  const enabled = isOperatorUpgradeEnabled(userId);

  return {
    // Use new unified operators model
    useOperators: enabled && OPERATOR_UPGRADE_FLAGS.USE_OPERATOR_TABLE,

    // Enable typing simulation
    typingSimulation: enabled && OPERATOR_UPGRADE_FLAGS.TYPING_SIMULATION_ENABLED,

    // Show character-by-character preview
    characterPreview: enabled && OPERATOR_UPGRADE_FLAGS.CHARACTER_PREVIEW_ENABLED,

    // Remove all AI/bot visual indicators
    hideAIIndicators: enabled && OPERATOR_UPGRADE_FLAGS.REMOVE_AI_INDICATORS,

    // Use natural typing delays
    naturalTyping: enabled && OPERATOR_UPGRADE_FLAGS.NATURAL_TYPING_DELAYS,

    // Overall enabled state
    enabled,
  };
}
