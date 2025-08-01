/**
 * Environment Variable Validation with @t3-oss/env-nextjs
 *
 * This file provides compile-time validation for all environment variables.
 * It replaces lib/env.ts with a type-safe, validated approach.
 *
 * Benefits:
 * - Compile-time validation prevents runtime errors
 * - Clear documentation of all required env vars
 * - Type-safe access throughout the codebase
 * - Better error messages for missing vars
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables
   * These are only available on the server and will be stripped from the client bundle
   */
  server: {
    // Node environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database configuration
    DATABASE_URL: z.string().url().optional(),
    POSTGRES_URL: z.string().url().optional(),
    POSTGRES_URL_NON_POOLING: z.string().url().optional(),

    // Auth configuration
    AUTH_URL: z.string().url().optional(),

    // Crypto/Security keys
    CRYPTO_SECRET: z.string().min(1).optional(),
    ENCRYPT_COLUMN_SECRET: z.string().min(1).optional(),
    WIDGET_JWT_SECRET: z.string().min(1).optional(),

    // AI API Keys
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    DEEPSEEK_API_KEY: z.string().min(1).optional(),

    // AI Configuration
    AI_PROCESSOR_AUTO_START: z
      .string()
      .transform((s) => s === "true")
      .default("false"),

    // Communication services
    RESEND_API_KEY: z.string().min(1).optional(),

    // Google Integration
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_PUBSUB_TOPIC_NAME: z.string().min(1).optional(),
    GOOGLE_PUBSUB_CLAIM_EMAIL: z.string().email().optional(),

    // AWS/S3 Configuration
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_DEFAULT_REGION: z.string().default("us-east-1"),
    AWS_PRIVATE_STORAGE_BUCKET_NAME: z.string().min(1).optional(),
    AWS_ENDPOINT: z.string().url().optional(),

    // Supabase server-side
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

    // Slack Integration
    SLACK_CLIENT_ID: z.string().min(1).optional(),
    SLACK_CLIENT_SECRET: z.string().min(1).optional(),
    SLACK_SIGNING_SECRET: z.string().min(1).optional(),

    // GitHub Integration
    GITHUB_APP_SLUG: z.string().min(1).optional(),
    GITHUB_APP_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_PRIVATE_KEY: z.string().min(1).optional(),

    // Stripe
    STRIPE_PRICE_ID: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    ADDITIONAL_PAID_ORGANIZATION_IDS: z.string().optional(),

    // Other APIs
    JINA_API_TOKEN: z.string().min(1).optional(),
    FIRECRAWL_API_KEY: z.string().min(1).optional(),
    PROXY_URL: z.string().url().optional(),
    PROXY_SECRET_KEY: z.string().min(1).optional(),

    // Apple
    APPLE_APP_ID: z.string().min(1).optional(),
    APPLE_TEAM_ID: z.string().min(1).optional(),
    APPLE_PRIVATE_KEY: z.string().min(1).optional(),
    APPLE_PRIVATE_KEY_IDENTIFIER: z.string().min(1).optional(),

    // Upstash KV
    KV_UPSTASH_KV_REST_API_URL: z.string().url().optional(),
    KV_UPSTASH_KV_REST_API_TOKEN: z.string().min(1).optional(),

    // Inngest
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),

    // Feature flags (server-side)
    DRIZZLE_LOGGING: z.string().optional(),
    SUPABASE_REALTIME_PILOT: z
      .string()
      .transform((s) => s === "true")
      .default("false"),

    // Development flags
    DISABLE_STRICT_MODE: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    SKIP_ENV_VALIDATION: z
      .string()
      .transform((s) => s === "true")
      .default("false"),

    // Vercel environment
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
  },

  /**
   * Client-side environment variables
   * These will be exposed to the browser and must be prefixed with NEXT_PUBLIC_
   */
  client: {
    // App configuration
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),

    // Supabase client-side (required for auth and realtime)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    // Analytics and monitoring
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

    // Feature flags (client-side)
    NEXT_PUBLIC_REALTIME_PILOT: z
      .string()
      .transform((s) => s === "true")
      .default("false"),

    // Recovery feature flags
    NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING: z
      .string()
      .transform((s) => s === "true")
      .default("false"),
    NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE: z
      .string()
      .transform((s) => s === "true")
      .default("false"),

    // Homepage variant feature flag
    NEXT_PUBLIC_HOMEPAGE_VARIANT: z
      .enum(["legacy", "commie"])
      .default("legacy"),
  },

  /**
   * Runtime environment mapping
   * Maps process.env to the above schemas
   */
  runtimeEnv: {
    // Server environment
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    AUTH_URL: process.env.AUTH_URL,
    CRYPTO_SECRET: process.env.CRYPTO_SECRET,
    ENCRYPT_COLUMN_SECRET: process.env.ENCRYPT_COLUMN_SECRET,
    WIDGET_JWT_SECRET: process.env.WIDGET_JWT_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    AI_PROCESSOR_AUTO_START: process.env.AI_PROCESSOR_AUTO_START,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_PUBSUB_TOPIC_NAME: process.env.GOOGLE_PUBSUB_TOPIC_NAME,
    GOOGLE_PUBSUB_CLAIM_EMAIL: process.env.GOOGLE_PUBSUB_CLAIM_EMAIL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
    AWS_PRIVATE_STORAGE_BUCKET_NAME: process.env.AWS_PRIVATE_STORAGE_BUCKET_NAME,
    AWS_ENDPOINT: process.env.AWS_ENDPOINT,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    ADDITIONAL_PAID_ORGANIZATION_IDS: process.env.ADDITIONAL_PAID_ORGANIZATION_IDS,
    JINA_API_TOKEN: process.env.JINA_API_TOKEN,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    PROXY_URL: process.env.PROXY_URL,
    PROXY_SECRET_KEY: process.env.PROXY_SECRET_KEY,
    APPLE_APP_ID: process.env.APPLE_APP_ID,
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
    APPLE_PRIVATE_KEY_IDENTIFIER: process.env.APPLE_PRIVATE_KEY_IDENTIFIER,
    KV_UPSTASH_KV_REST_API_URL: process.env.KV_UPSTASH_KV_REST_API_URL,
    KV_UPSTASH_KV_REST_API_TOKEN: process.env.KV_UPSTASH_KV_REST_API_TOKEN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    DRIZZLE_LOGGING: process.env.DRIZZLE_LOGGING,
    SUPABASE_REALTIME_PILOT: process.env.SUPABASE_REALTIME_PILOT,
    DISABLE_STRICT_MODE: process.env.DISABLE_STRICT_MODE,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,

    // Client environment
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_REALTIME_PILOT: process.env.NEXT_PUBLIC_REALTIME_PILOT,
    NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE: process.env.NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE,
    NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD: process.env.NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD,
    NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS: process.env.NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS,
    NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS: process.env.NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS,
    NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING: process.env.NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING,
    NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE: process.env.NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE,
    NEXT_PUBLIC_HOMEPAGE_VARIANT: process.env.NEXT_PUBLIC_HOMEPAGE_VARIANT,
  },

  /**
   * Skip validation during build if SKIP_ENV_VALIDATION is set
   * Useful for Docker builds or CI environments
   * Also skip validation on client-side to prevent server-side env access
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || typeof window !== "undefined",

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

/**
 * Helper functions for backward compatibility
 */
export function getSupabaseConfig() {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Server-only Supabase configuration
 * This function can only be called on the server side
 */
export function getServerSupabaseConfig() {
  if (typeof window !== "undefined") {
    throw new Error("getServerSupabaseConfig() can only be called on the server side");
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * AI configuration - server only
 * This function can only be called on the server side
 */
export function getAIConfig() {
  if (typeof window !== "undefined") {
    throw new Error("getAIConfig() can only be called on the server side");
  }
  return {
    openai: env.OPENAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    deepseek: env.DEEPSEEK_API_KEY,
  };
}

/**
 * Feature flag helpers
 */
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * Recovery feature flags
 */
export const RECOVERY_FLAGS = {
  P1_HOMEPAGE: env.NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE,
  P1_DASHBOARD: env.NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD,
  P1_SETTINGS: env.NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS,
  P2_CONVERSATIONS: env.NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS,
  P2_MESSAGING: env.NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING,
  P2_PROFILE: env.NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE,
};

/**
 * Homepage variant feature flag
 */
export const HOMEPAGE_VARIANT = env.NEXT_PUBLIC_HOMEPAGE_VARIANT;
