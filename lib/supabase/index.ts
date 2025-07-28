/**
 * 🔥 CLEAN SUPABASE FOUNDATION
 *
 * Simple, working client system
 * No circular dependencies, no over-engineering
 */

import type { Database } from "@/types/supabase";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Environment variables - server-side only
const getEnv = () => {
  if (typeof window !== "undefined") {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceKey: undefined, // Never expose service key to browser
    };
  }

  // Server-side - use env file or environment variables
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
};

// Browser client singleton with enhanced isolation
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let browserClientInitialized = false;

// Service client singleton
let serviceClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Get browser client (client-side only)
 * Enhanced with singleton protection to prevent multiple GoTrueClient instances
 */
export function getBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Browser client can only be used in browser environment");
  }

  // Prevent multiple instances by checking global state
  if (browserClientInitialized && browserClient) {
    return browserClient;
  }

  // Check if another instance exists globally
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT__) {
    browserClient = (window as any).__SUPABASE_CLIENT__;
    browserClientInitialized = true;
    return browserClient;
  }

  if (!browserClient) {
    const env = getEnv();

    browserClient = createBrowserClient<Database>(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: `sb-${env.url.split('//')[1]?.split('.')[0]}-auth-token`,
      },
      global: {
        headers: {
          'X-Client-Info': 'campfire-v2'
        }
      }
    });

    // Store globally to prevent multiple instances
    if (typeof window !== 'undefined') {
      (window as any).__SUPABASE_CLIENT__ = browserClient;
    }

    browserClientInitialized = true;
  }

  return browserClient;
}

/**
 * Get service client (server-side only)
 */
function getServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("Service client cannot be used in browser environment");
  }

  if (!serviceClient) {
    const env = getEnv();
    serviceClient = createSupabaseClient<Database>(env.url, env.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
}

/**
 * Get server client (server-side only)
 */
function getServerClient(cookies: any) {
  if (typeof window !== "undefined") {
    throw new Error("Server client cannot be used in browser environment");
  }

  const env = getEnv();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookies?.getAll?.() || [];
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            cookies?.set?.(name, value, options);
          });
        } catch {
          // Ignore - server component
        }
      },
    },
  });
}

// Main export - simple and clean
export const supabase = {
  browser: getBrowserClient,
  server: getServerClient,
  admin: getServiceClient,
};

// Legacy compatibility
export const createCampfireClient = getBrowserClient;
export const createBrowserSupabaseClient = getBrowserClient;
export const createServiceRoleClient = getServiceClient;
export const getSupabaseService = getServiceClient;
export const getSupabase = supabase;

// Additional legacy exports
export const createServerSupabase = getServerClient;
export const createAdminSupabaseClient = getServiceClient;
export const getSupabaseLegacy = getBrowserClient;
export const createImprovedRealtimeClient = getBrowserClient;
export const useSupabase = getBrowserClient;

// Channel name utilities
export function createChannelName(organizationId: string, resourceType: string, resourceId?: string): string {
  if (resourceId) {
    return `org:${organizationId}:${resourceType}:${resourceId}`;
  }
  return `org:${organizationId}:${resourceType}`;
}

// Config validation utility
export function hasValidSupabaseConfig(): boolean {
  const env = getEnv();
  return !!(env.url && env.anonKey);
}

// API client creator (server-side safe)
export function createApiClient() {
  if (typeof window === "undefined") {
    // Server-side: use service client
    return getServiceClient();
  } else {
    // Browser-side: use browser client
    return getBrowserClient();
  }
}

// Client factory for server components
export function createClient() {
  return getServiceClient();
}

// RealtimeMessage type for compatibility
export interface RealtimeMessage {
  type: string;
  event: string;
  payload: any;
  sent_at: string;
}

// Re-export realtime channel type
export type RealtimeChannel = any;

// Type exports
export type { SupabaseClient } from "@supabase/supabase-js";
export type { Database };

