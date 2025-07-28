/**
 * Feature Flags
 * Centralized feature flag management
 */

export type FeatureFlag = {
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  enabledForOrganizations?: string[];
  enabledForUsers?: string[];
};

export const FEATURES = {
  // AI Features
  AI_CONFIDENCE_ANALYTICS: {
    enabled: true,
    description: "AI confidence scoring and analytics dashboard",
  },
  AI_SENTIMENT_ANALYSIS: {
    enabled: true,
    description: "Real-time sentiment analysis for conversations",
  },
  AI_AUTO_HANDOVER: {
    enabled: true,
    description: "Automatic handover from AI to human agents",
  },
  AI_SMART_ROUTING: {
    enabled: true,
    description: "Intelligent routing based on query complexity",
  },
  AI_KNOWLEDGE_PROFILES: {
    enabled: true,
    description: "Multiple AI knowledge profiles for different use cases",
  },

  // Chat Features
  TYPING_INDICATORS: {
    enabled: true,
    description: "Real-time typing indicators in chat",
  },
  FILE_UPLOADS: {
    enabled: true,
    description: "File upload support in widget and dashboard",
  },
  EMOJI_REACTIONS: {
    enabled: false,
    description: "Emoji reactions on messages",
  },
  MESSAGE_EDITING: {
    enabled: false,
    description: "Allow editing sent messages",
  },

  // Widget Features
  WIDGET_CUSTOMIZATION: {
    enabled: true,
    description: "Advanced widget customization options",
  },
  WIDGET_PROACTIVE_MESSAGES: {
    enabled: true,
    description: "Proactive chat messages based on user behavior",
  },
  WIDGET_OFFLINE_MODE: {
    enabled: false,
    description: "Offline message collection when agents unavailable",
  },
  WIDGET_VOICE_INPUT: {
    enabled: false,
    description: "Voice input support in widget",
  },

  // Integration Features
  SLACK_INTEGRATION: {
    enabled: true,
    description: "Slack integration for notifications and chat",
  },
  GITHUB_INTEGRATION: {
    enabled: true,
    description: "GitHub integration for issue creation",
  },
  SALESFORCE_INTEGRATION: {
    enabled: false,
    description: "Salesforce CRM integration",
  },
  ZAPIER_INTEGRATION: {
    enabled: false,
    description: "Zapier workflow automation",
  },

  // Analytics Features
  ADVANCED_ANALYTICS: {
    enabled: true,
    description: "Advanced analytics and reporting",
  },
  CUSTOM_REPORTS: {
    enabled: false,
    description: "Custom report builder",
  },
  EXPORT_DATA: {
    enabled: true,
    description: "Export conversation and analytics data",
  },

  // Security Features
  SSO_SAML: {
    enabled: false,
    description: "SAML-based single sign-on",
  },
  TWO_FACTOR_AUTH: {
    enabled: false,
    description: "Two-factor authentication",
  },
  IP_ALLOWLIST: {
    enabled: false,
    description: "IP address allowlisting",
  },

  // Experimental Features
  VOICE_CALLS: {
    enabled: false,
    description: "Voice call support (experimental)",
  },
  VIDEO_CALLS: {
    enabled: false,
    description: "Video call support (experimental)",
  },
  AI_VOICE_ASSISTANT: {
    enabled: false,
    description: "AI-powered voice assistant (experimental)",
  },
  COBROWSING: {
    enabled: false,
    description: "Co-browsing support (experimental)",
  },
} as const satisfies Record<string, FeatureFlag>;

export type FeatureName = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: FeatureName,
  context?: {
    organizationId?: string;
    userId?: string;
  }
): boolean {
  const featureConfig = FEATURES[feature];

  if (!featureConfig.enabled) {
    return false;
  }

  // Check organization-specific enablement
  if (featureConfig.enabledForOrganizations && context?.organizationId) {
    return featureConfig.enabledForOrganizations.includes(context.organizationId);
  }

  // Check user-specific enablement
  if (featureConfig.enabledForUsers && context?.userId) {
    return featureConfig.enabledForUsers.includes(context.userId);
  }

  // Check rollout percentage
  if (featureConfig.rolloutPercentage !== undefined && context?.userId) {
    // Simple hash-based rollout
    const hash = context.userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const userPercentage = hash % 100;
    return userPercentage < featureConfig.rolloutPercentage;
  }

  return featureConfig.enabled;
}

/**
 * Get all enabled features for a context
 */
export function getEnabledFeatures(context?: { organizationId?: string; userId?: string }): FeatureName[] {
  return (Object.keys(FEATURES) as FeatureName[]).filter((feature) => isFeatureEnabled(feature, context));
}

/**
 * Feature flag React hook helper type
 */
export type UseFeatureFlag = (feature: FeatureName) => boolean;

/**
 * Environment-based feature overrides
 */
export function getFeatureOverrides(): Partial<Record<FeatureName, boolean>> {
  const overrides: Partial<Record<FeatureName, boolean>> = {};

  // Development environment overrides
  if (process.env.NODE_ENV === "development") {
    // Enable all experimental features in development
    (Object.keys(FEATURES) as FeatureName[]).forEach((feature) => {
      if (FEATURES[feature].description.includes("experimental")) {
        overrides[feature] = true;
      }
    });
  }

  // Environment variable overrides
  // Example: NEXT_PUBLIC_FEATURE_VOICE_CALLS=true
  (Object.keys(FEATURES) as FeatureName[]).forEach((feature) => {
    const envVar = `NEXT_PUBLIC_FEATURE_${feature}`;
    const envValue = process.env[envVar];
    if (envValue !== undefined) {
      overrides[feature] = envValue === "true";
    }
  });

  return overrides;
}

/**
 * Apply feature overrides
 */
export function applyFeatureOverrides(): void {
  const overrides = getFeatureOverrides();
  Object.entries(overrides).forEach(([feature, enabled]) => {
    if (feature in FEATURES) {
      (FEATURES as any)[feature].enabled = enabled;
    }
  });
}

// Apply overrides on module load
applyFeatureOverrides();
