/**
 * Account and subscription constants
 */

// Free trial configuration
export const FREE_TRIAL_PERIOD_DAYS = 14;
export const FREE_TRIAL_MESSAGE_LIMIT = 100;
export const FREE_TRIAL_CONVERSATION_LIMIT = 50;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  STARTER: "starter",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
} as const;

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    messages: 100,
    conversations: 50,
    agents: 1,
    knowledge_articles: 10,
  },
  [SUBSCRIPTION_TIERS.STARTER]: {
    messages: 1000,
    conversations: 500,
    agents: 3,
    knowledge_articles: 100,
  },
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    messages: 10000,
    conversations: 5000,
    agents: 10,
    knowledge_articles: 1000,
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    messages: -1, // unlimited
    conversations: -1,
    agents: -1,
    knowledge_articles: -1,
  },
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];
