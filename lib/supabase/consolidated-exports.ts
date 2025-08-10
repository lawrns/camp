/**
 * 🚨 CONSOLIDATED SUPABASE EXPORTS - SINGLE SOURCE OF TRUTH
 *
 * This file consolidates ALL Supabase client imports to prevent confusion.
 * ALL API routes and components should import from this file ONLY.
 *
 * ❌ DON'T IMPORT FROM:
 * - @/lib/supabase/service-role (DOESN'T EXIST)
 * - @/lib/supabase/client-factory (DEPRECATED)
 * - @/lib/supabase/index (INTERNAL USE ONLY)
 *
 * ✅ ALWAYS IMPORT FROM:
 * - @/lib/supabase/consolidated-exports
 */

// Re-export the main supabase object and all client functions
export { supabase } from "./index";
export {
  createServiceRoleClient,
  createBrowserSupabaseClient,
  createServerSupabase,
  createAdminSupabaseClient,
  getSupabaseService,
  getSupabase,
  useSupabase,
} from "./index";

// Re-export client factory functions for compatibility
export {
  createBrowserClient,
  createSupabaseClient,
  createServiceRoleClient as createServiceRole,
} from "./client-factory";

// Re-export widget-specific client
export { createWidgetClient } from "./widget-client";

// Re-export service role server client
export { createServiceRoleClient as createServiceRoleServer } from "./service-role-server";

/**
 * 🎯 RECOMMENDED USAGE PATTERNS:
 *
 * For API Routes (Server-side):
 * ```typescript
 * import { supabase } from "@/lib/supabase/consolidated-exports";
 * const client = supabase.admin(); // Service role client
 * ```
 *
 * For Components (Client-side):
 * ```typescript
 * import { supabase } from "@/lib/supabase/consolidated-exports";
 * const client = supabase.browser(); // Browser client
 * ```
 *
 * For Server Components:
 * ```typescript
 * import { supabase } from "@/lib/supabase/consolidated-exports";
 * import { cookies } from "next/headers";
 * const client = supabase.server(cookies()); // Server client with cookies
 * ```
 *
 * For Widget API Routes:
 * ```typescript
 * import { createWidgetClient } from "@/lib/supabase/consolidated-exports";
 * const client = createWidgetClient(); // Lightweight widget client
 * ```
 */

/**
 * 🔍 CLIENT TYPE REFERENCE:
 *
 * supabase.browser() - Client-side operations with auth persistence
 * supabase.admin() - Server-side operations with service role (bypasses RLS)
 * supabase.server(cookies) - Server-side operations with user auth
 * createWidgetClient() - Lightweight client for widget operations
 */

/**
 * 🚨 MIGRATION GUIDE:
 *
 * OLD: import { createServiceRoleClient } from "@/lib/supabase/service-role"
 * NEW: import { supabase } from "@/lib/supabase/consolidated-exports"; const client = supabase.admin();
 *
 * OLD: import { createServiceRoleClient } from "@/lib/supabase/client-factory"
 * NEW: import { supabase } from "@/lib/supabase/consolidated-exports"; const client = supabase.admin();
 *
 * OLD: import { createClient } from "@supabase/supabase-js"
 * NEW: import { supabase } from "@/lib/supabase/consolidated-exports"; const client = supabase.admin();
 */

// Type exports for TypeScript support
export type { Database } from "@/types/supabase";

// Environment validation
const validateSupabaseEnv = () => {
  // Skip validation in E2E mock or test environments
  if (process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test') {
    return;
  }
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(`Missing required Supabase environment variables: ${missing.join(", ")}`);
  }
};

// Validate environment on import (only in Node.js environment)
if (typeof window === "undefined") {
  validateSupabaseEnv();
}
