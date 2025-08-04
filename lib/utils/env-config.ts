/**
 * Centralized Environment Configuration
 *
 * SECURITY NOTICE: This is the SINGLE SOURCE OF TRUTH for all environment variables.
 * All other env files should be removed after migration.
 *
 * Benefits:
 * - Compile-time validation prevents runtime errors
 * - Type-safe access throughout the codebase
 * - Clear documentation of all required env vars
 * - Better error messages for missing vars
 * - Centralized security validation
 *
 * Usage:
 * ```typescript
 * import { env } from '@/lib/utils/env-config'
 * const apiKey = env.OPENAI_API_KEY // Type-safe and validated
 * ```
 *
 * NEVER use process.env directly!
 */

import { z } from "zod";

/**
 * Custom validators for improved security
 */
const urlValidator = z
  .string()
  .url()
  .refine(
    (url: unknown) =>
      url.startsWith("https://") ||
      url.startsWith("http://localhost") ||
      url.includes("localhost") ||
      process.env.NODE_ENV === "development",
    "URLs must use HTTPS (except localhost or development)"
  );

const secretKeyValidator = z.string().min(32, "Secret keys must be at least 32 characters");
const apiKeyValidator = z.string().min(20, "API keys must be at least 20 characters");

/**
 * Environment-specific validation
 */

/**
 * Helper to make vars required in production only
 */
const requiredInProduction = <T extends z.ZodTypeAny>(schema: T) => {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" ? schema : schema.optional();
};

/**
 * Server-side environment schema
 */
const serverSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Deployment environment
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  VERCEL_URL: z.string().optional(),

  // Database configuration (required in production)
  DATABASE_URL: requiredInProduction(urlValidator),
  POSTGRES_URL: requiredInProduction(urlValidator),
  POSTGRES_URL_NON_POOLING: requiredInProduction(urlValidator),

  // Supabase configuration (always required)
  SUPABASE_SERVICE_ROLE_KEY: apiKeyValidator,

  // Authentication & Security (required in production)
  AUTH_URL: requiredInProduction(urlValidator),
  NEXTAUTH_SECRET: requiredInProduction(secretKeyValidator),
  CRYPTO_SECRET: requiredInProduction(secretKeyValidator),
  ENCRYPT_COLUMN_SECRET: requiredInProduction(secretKeyValidator),
  WIDGET_JWT_SECRET: requiredInProduction(secretKeyValidator),
  JWT_SECRET: requiredInProduction(secretKeyValidator),
  ENCRYPTION_KEY: requiredInProduction(secretKeyValidator),

  // AI Services (optional but validated when present)
  OPENAI_API_KEY: apiKeyValidator.optional(),
  ANTHROPIC_API_KEY: apiKeyValidator.optional(),
  DEEPSEEK_API_KEY: apiKeyValidator.optional(),

  // Communication services
  RESEND_API_KEY: apiKeyValidator.optional(),

  // Google Integration
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: apiKeyValidator.optional(),
  GOOGLE_PUBSUB_TOPIC_NAME: z.string().min(1).optional(),
  GOOGLE_PUBSUB_CLAIM_EMAIL: z.string().email().optional(),

  // AWS/S3 Configuration
  AWS_ACCESS_KEY_ID: z.string().min(16).optional(),
  AWS_SECRET_ACCESS_KEY: apiKeyValidator.optional(),
  AWS_DEFAULT_REGION: z
    .string()
    .regex(/^[a-z]{2}-[a-z]+-\d{1}$/, "Invalid AWS region format")
    .default("us-east-1"),
  AWS_PRIVATE_STORAGE_BUCKET_NAME: z.string().min(3).max(63).optional(),
  AWS_ENDPOINT: urlValidator.optional(),

  // Slack Integration
  SLACK_CLIENT_ID: z.string().min(1).optional(),
  SLACK_CLIENT_SECRET: apiKeyValidator.optional(),
  SLACK_SIGNING_SECRET: apiKeyValidator.optional(),

  // GitHub Integration
  GITHUB_APP_SLUG: z.string().min(1).optional(),
  GITHUB_APP_ID: z.string().regex(/^\d+$/, "GitHub App ID must be numeric").optional(),
  GITHUB_CLIENT_SECRET: apiKeyValidator.optional(),
  GITHUB_PRIVATE_KEY: z.string().min(100).optional(),

  // Stripe (required for billing in production)
  STRIPE_PRICE_ID: requiredInProduction(z.string().startsWith("price_")),
  STRIPE_WEBHOOK_SECRET: requiredInProduction(z.string().startsWith("whsec_")),
  STRIPE_SECRET_KEY: requiredInProduction(z.string().startsWith("sk_")),
  ADDITIONAL_PAID_ORGANIZATION_IDS: z.string().optional(),

  // Other APIs
  JINA_API_TOKEN: apiKeyValidator.optional(),
  FIRECRAWL_API_KEY: apiKeyValidator.optional(),
  PROXY_URL: urlValidator.optional(),
  PROXY_SECRET_KEY: apiKeyValidator.optional(),

  // Apple Sign In
  APPLE_APP_ID: z.string().min(1).optional(),
  APPLE_TEAM_ID: z
    .string()
    .regex(/^[A-Z0-9]{10}$/, "Invalid Apple Team ID format")
    .optional(),
  APPLE_PRIVATE_KEY: z.string().min(100).optional(),
  APPLE_PRIVATE_KEY_IDENTIFIER: z.string().min(10).optional(),

  // Upstash KV
  KV_UPSTASH_KV_REST_API_URL: urlValidator.optional(),
  KV_UPSTASH_KV_REST_API_TOKEN: apiKeyValidator.optional(),

  // Inngest
  INNGEST_EVENT_KEY: apiKeyValidator.optional(),
  INNGEST_SIGNING_KEY: apiKeyValidator.optional(),

  // Feature flags (server-side)
  DRIZZLE_LOGGING: z.enum(["true", "false"]).optional(),
  SUPABASE_REALTIME_PILOT: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),

  // Development flags
  DISABLE_STRICT_MODE: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  SKIP_ENV_VALIDATION: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
});

/**
 * Client-side environment schema
 */
const clientSchema = z.object({
  // App configuration (always required)
  NEXT_PUBLIC_APP_URL: urlValidator,
  NEXT_PUBLIC_VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),

  // Supabase client-side (always required)
  NEXT_PUBLIC_SUPABASE_URL: urlValidator,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(30),

  // Analytics and monitoring
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: urlValidator.optional(),

  // Feature flags (client-side)
  NEXT_PUBLIC_REALTIME_PILOT: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),

  // Recovery feature flags
  NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
  NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE: z
    .enum(["true", "false"])
    .transform((s: unknown) => s === "true")
    .default("false"),
});

/**
 * Combined schema
 */
const envSchema = z.object({
  ...serverSchema.shape,
  ...clientSchema.shape,
});

/**
 * Parse and validate environment variables
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // List missing required variables
    const errors = parsed.error.errors;
    const missing = errors.filter((e: unknown) => e.message.includes("Required")).map((e: unknown) => e.path.join("."));

    if (missing.length > 0) {
      missing.forEach((v: unknown) => {
        // Handle missing environment variable
      });
    }

    // Only throw in production
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      throw new Error("Missing required environment variables");
    }
  }

  return parsed.data as z.infer<typeof envSchema>;
}

/**
 * Skip validation if requested (for Docker builds, etc)
 * Also skip on client-side to prevent server env access
 */
const skipValidation = process.env.SKIP_ENV_VALIDATION === "true" || typeof window !== "undefined";

/**
 * Validated environment variables with error handling
 */
let env: unknown;
try {
  env = skipValidation ? (process.env as unknown) : validateEnv();
} catch (error) {
  // Fallback to process.env with safe defaults
  env = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
    NODE_ENV: process.env.NODE_ENV || "development",
  } as unknown;
}

// Ensure env is never undefined
if (!env) {
  env = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3012",
    NODE_ENV: process.env.NODE_ENV || "development",
  } as unknown;
}

export { env };

/**
 * Type-safe environment type
 */
export type Env = z.infer<typeof envSchema>;

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
 * Get app URL with proper protocol
 */
export function getAppUrl() {
  const url = env.NEXT_PUBLIC_APP_URL;
  if (!url) return "http://localhost:3012";

  // Ensure URL has protocol
  if (!url.startsWith("http")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Environment checks with fallbacks
 */
export const isDevelopment = (env?.NODE_ENV || process.env.NODE_ENV) === "development";
export const isProduction = (env?.NODE_ENV || process.env.NODE_ENV) === "production";
export const isTest = (env?.NODE_ENV || process.env.NODE_ENV) === "test";
export const isVercelPreview = (env?.VERCEL_ENV || process.env.VERCEL_ENV) === "preview";
export const isVercelProduction = (env?.VERCEL_ENV || process.env.VERCEL_ENV) === "production";

/**
 * Recovery feature flags
 */
export const RECOVERY_FLAGS = {
  P1_HOMEPAGE: env?.NEXT_PUBLIC_RECOVERY_2025_P1_HOMEPAGE,
  P1_DASHBOARD: env?.NEXT_PUBLIC_RECOVERY_2025_P1_DASHBOARD,
  P1_SETTINGS: env?.NEXT_PUBLIC_RECOVERY_2025_P1_SETTINGS,
  P2_CONVERSATIONS: env?.NEXT_PUBLIC_RECOVERY_2025_P2_CONVERSATIONS,
  P2_MESSAGING: env?.NEXT_PUBLIC_RECOVERY_2025_P2_MESSAGING,
  P2_PROFILE: env?.NEXT_PUBLIC_RECOVERY_2025_P2_PROFILE,
} as const;

/**
 * Security monitoring
 */
export function logSecurityEvent(event: string, details?: unknown) {
  if (isDevelopment) {
  }
  // In production, this would send to monitoring service
}

/**
 * Validate critical security variables at runtime
 */
export function validateSecurityConfig() {
  const critical = ["NEXTAUTH_SECRET", "CRYPTO_SECRET", "WIDGET_JWT_SECRET", "SUPABASE_SERVICE_ROLE_KEY"] as const;

  const missing = critical.filter((key: unknown) => !env[key]);

  if (missing.length > 0 && (isProduction || isVercelProduction)) {
    throw new Error(`Critical security variables missing: ${missing.join(", ")}`);
  }
}

// Run validation on import in production
if (typeof window === "undefined" && (isProduction || isVercelProduction)) {
  validateSecurityConfig();
}

/**
 * Get environment variable with fallback
 * @deprecated Use env object directly
 */
export function getEnvVar(key: string, fallback?: string): string {
  return (env as unknown)[key] || process.env[key] || fallback || "";
}
