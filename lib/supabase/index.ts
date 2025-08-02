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
 * PHASE 1 FIX: Auth validation for realtime connections
 * Validates and refreshes JWT token to prevent auth rejection
 */
async function validateAuthToken(client: any) {
  try {
    const { data: session, error } = await client.auth.getSession();

    if (error) {
      console.warn('🔐 [Auth] Session error:', error);
      return false;
    }

    if (!session?.session?.access_token) {
      console.warn('🔐 [Auth] No access token found - realtime may fail');
      return false;
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const expiresAt = session.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    if (expiresAt && (expiresAt - now) < fiveMinutes) {
      console.log('🔐 [Auth] Token expiring soon, refreshing...');
      const { data: refreshed, error: refreshError } = await client.auth.refreshSession();

      if (refreshError) {
        console.error('🔐 [Auth] Token refresh failed:', refreshError);
        return false;
      }

      console.log('🔐 [Auth] ✅ Token refreshed successfully');
      return true;
    }

    console.log('🔐 [Auth] ✅ Valid token found:', session.session.access_token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('🔐 [Auth] Validation error:', error);
    return false;
  }
}

/**
 * Get browser client (client-side only)
 * Enhanced with singleton protection and auth validation
 */
export function getBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Browser client can only be used in browser environment");
  }

  // Prevent multiple instances by checking global state
  if (browserClientInitialized && browserClient) {
    // PHASE 1 FIX: Validate auth token before returning existing client
    validateAuthToken(browserClient);
    return browserClient;
  }

  // Check if another instance exists globally
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT__) {
    browserClient = (window as any).__SUPABASE_CLIENT__;
    browserClientInitialized = true;
    // PHASE 1 FIX: Validate auth token for existing global client
    validateAuthToken(browserClient);
    return browserClient;
  }

  if (!browserClient) {
    const env = getEnv();

    browserClient = createBrowserClient<Database>(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: `sb-${env.url.split('//')[1]?.split('.')[0]}-auth-token`,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
          // Add apikey for WebSocket authentication
          apikey: env.anonKey,
          // ENHANCED: Enable debug logging for better troubleshooting
          log_level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        },
        // ENHANCED: Reduced heartbeat interval to prevent 30s idle timeouts
        heartbeatIntervalMs: 25000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        // ENHANCED: Reduced timeout for faster failure detection
        timeout: 15000,
      },
      global: {
        headers: {
          'X-Client-Info': 'campfire-v2',
          'X-Client-Version': '2.0.0'
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
 * Get widget client (browser-side only)
 */
function getWidgetClient() {
  if (typeof window === "undefined") {
    throw new Error("Widget client can only be used in browser environment");
  }

  const env = getEnv();

  // Create widget-specific client with dedicated storage key
  return createBrowserClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'supabase-widget-session',
      detectSessionInUrl: false, // Disable for widget context
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
        // CRITICAL: Add apikey for WebSocket authentication
        apikey: env.anonKey,
        // ENHANCED: Enable debug logging for widget troubleshooting
        log_level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        // Add version parameter
        vsn: '1.0.0'
      },
      // ENHANCED: Reduced heartbeat interval to prevent 30s idle timeouts
      heartbeatIntervalMs: 25000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      // ENHANCED: Reduced timeout for faster failure detection
      timeout: 15000,
      // Use default WebSocket transport without custom encoding
      transport: 'websocket'
      // REMOVED: Custom encode function that might interfere with WebSocket protocol
    },
    global: {
      headers: {
        'X-Client-Info': 'campfire-widget',
        'X-Client-Version': '2.0.0'
      }
    }
  });
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
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 20000,
      },
      global: {
        headers: {
          'X-Client-Info': 'campfire-v2-service',
          'X-Client-Version': '2.0.0'
        }
      }
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
  widget: getWidgetClient,
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

