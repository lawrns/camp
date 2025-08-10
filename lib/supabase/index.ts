/**
 * 🔥 CLEAN SUPABASE FOUNDATION
 *
 * Simple, working client system
 * No circular dependencies, no over-engineering
 */

import type { Database } from "@/types/supabase-generated";
import type { SupabaseClient as SupabaseJsClient, RealtimeChannel as SupabaseRealtimeChannel } from "@supabase/supabase-js";
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
let serviceClient: ReturnType<typeof createSupabaseClient<Database>> | undefined;

// validateAuthToken is imported from ./auth-validation - removed duplicate definition

/**
 * Get environment-appropriate client (SPAM ELIMINATION FIX)
 * Automatically returns server client in server context, browser client in browser
 */
export function getClient() {
  if (typeof window === "undefined") {
    // Server environment: Use server component client for realtime cleanup
    try {
      // Import using require to avoid top-level await issues in SSR chunks
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cookies } = require('next/headers') as { cookies: () => { getAll(): Array<{ name: string; value: string }>; set(name: string, value: string, options?: unknown): void } };
      return getServerClient(cookies());
    } catch (error) {
      // Fallback to simple server client if cookies not available
      return getSimpleServerClient();
    }
  } else {
    // Browser environment: Use existing browser client
    return getBrowserClientInternal();
  }
}

/**
 * Get browser client (client-side only) - UPDATED to use getClient
 * Enhanced with singleton protection and auth validation
 */
export function getBrowserClient() {
  if (typeof window === "undefined") {
    // Server environment: Use getClient which handles this properly
    return getClient();
  }
  // E2E MOCK: return a stubbed client that never reaches external Supabase
  if (process.env.NEXT_PUBLIC_E2E_MOCK === 'true' || (typeof process !== 'undefined' && (process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test'))) {
    return createMockBrowserClient();
  }
  return getBrowserClientInternal();
}

/**
 * Internal browser client function (renamed from getBrowserClient)
 */
function getBrowserClientInternal() {

  // Prevent multiple instances by checking global state
  if (browserClientInitialized && browserClient) {
    return browserClient;
  }

  // Check if another instance exists globally
  if (typeof window !== 'undefined' && (window as unknown).__SUPABASE_CLIENT__) {
    browserClient = (window as unknown).__SUPABASE_CLIENT__;
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
      (window as unknown).__SUPABASE_CLIENT__ = browserClient;
    }

    browserClientInitialized = true;
  }

  return browserClient;
}

// ----------------------------------------------------------------------------
// E2E MOCK BROWSER CLIENT
// ----------------------------------------------------------------------------
function createMockBrowserClient(): any {
  const storePromise = import("@/lib/testing/e2e-mock-store");

  const mockChannel = () => {
    const channel = {
      on() { return channel; },
      subscribe: async () => {
        // Return a subscription object with proper unsubscribe method
        return {
          status: 'ok',
          unsubscribe: async () => ({ status: 'ok' })
        };
      },
      send: async () => ({ status: 'ok' }),
      unsubscribe: async () => ({ status: 'ok' }),
    };
    return channel;
  };

  const buildQuery = (table: string) => {
    const filters: Record<string, any> = {};
    let _limit: number | undefined;
    let _offset = 0;
    let _ascending = true;
    let _orderCol = 'created_at';
    let _selectColumns = '*';

    const executeQuery = async () => {
      const store = await storePromise;
      try {
        let data: any[] = [];
        if (table === 'conversations') {
          const orgId = filters['organization_id'] || store.getTestOrgId();
          data = store.listConversations(orgId);
          // apply pagination and ordering
          data = data.sort((a, b) => _ascending ? (a[_orderCol] || '').localeCompare(b[_orderCol] || '') : (b[_orderCol] || '').localeCompare(a[_orderCol] || ''));
          data = data.slice(_offset, _limit ? _offset + _limit : undefined);
        } else if (table === 'messages') {
          const orgId = filters['organization_id'] || store.getTestOrgId();
          const convId = filters['conversation_id'];
          data = convId ? store.listMessages(orgId, convId, { ascending: _ascending, limit: _limit, offset: _offset }) : [];
        } else if (table === 'organization_members') {
          const orgId = filters['organization_id'] || store.getTestOrgId();
          data = [{ user_id: filters['user_id'] || (process.env.E2E_USER_ID || '6f9916c7-3575-4a81-b58e-624ab066bebc'), organization_id: orgId, role: 'admin', status: 'active' }];
        } else if (table === 'profiles') {
          data = [];
        }
        return { data, error: null };
      } catch (e) {
        return { data: null, error: e as any };
      }
    };

    const queryBuilder = {
      select(columns?: string) {
        _selectColumns = columns || '*';
        // Return a new object that has both query methods AND can be awaited
        const selectBuilder = {
          eq(col: string, val: any) { filters[col] = val; return selectBuilder; },
          gte(col: string, val: any) { filters[col] = { gte: val }; return selectBuilder; },
          lt(col: string, val: any) { filters[col] = { lt: val }; return selectBuilder; },
          lte(col: string, val: any) { filters[col] = { lte: val }; return selectBuilder; },
          neq(col: string, val: any) { filters[col] = { neq: val }; return selectBuilder; },
          in(col: string, vals: any[]) { filters[col] = { in: vals }; return selectBuilder; },
          or(_expression: string) { /* no-op filter support for E2E */ return selectBuilder; },
          order(col: string, opts?: { ascending?: boolean }) { _orderCol = col; _ascending = opts?.ascending ?? true; return selectBuilder; },
          limit(n: number) { _limit = n; return selectBuilder; },
          range(from: number, to: number) { _offset = from; _limit = (to - from + 1); return selectBuilder; },
          single: async () => {
            const res = await executeQuery();
            return { data: res.data ? res.data[0] : null, error: res.error };
          },
          then: (resolve: any, reject: any) => executeQuery().then(resolve, reject),
          catch: (reject: any) => executeQuery().catch(reject),
        };
        return selectBuilder;
      },
      eq(col: string, val: any) { filters[col] = val; return queryBuilder; },
      gte(col: string, val: any) { filters[col] = { gte: val }; return queryBuilder; },
      lt(col: string, val: any) { filters[col] = { lt: val }; return queryBuilder; },
      lte(col: string, val: any) { filters[col] = { lte: val }; return queryBuilder; },
      neq(col: string, val: any) { filters[col] = { neq: val }; return queryBuilder; },
      in(col: string, vals: any[]) { filters[col] = { in: vals }; return queryBuilder; },
      or(_expression: string) { /* no-op filter support for E2E */ return queryBuilder; },
      order(col: string, opts?: { ascending?: boolean }) { _orderCol = col; _ascending = opts?.ascending ?? true; return queryBuilder; },
      limit(n: number) { _limit = n; return queryBuilder; },
      range(from: number, to: number) { _offset = from; _limit = (to - from + 1); return queryBuilder; },
      single: async () => {
        const res = await executeQuery();
        return { data: res.data ? res.data[0] : null, error: res.error };
      },
      insert: async (payload: any) => {
        const store = await storePromise;
        try {
          if (table === 'messages') {
            const msg = store.addMessage({
              conversationId: payload.conversation_id,
              organizationId: payload.organization_id || store.getTestOrgId(),
              content: payload.content,
              senderType: payload.sender_type || 'visitor',
              senderId: payload.sender_id || null,
              senderEmail: payload.sender_email || null,
              senderName: payload.sender_name || null,
              messageType: payload.message_type || 'text',
              contentType: payload.content_type || 'text',
              metadata: payload.metadata || {},
            });
            return { data: [msg], error: null };
          }
          return { data: null, error: null };
        } catch (e) {
          return { data: null, error: e as any };
        }
      },
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    };

    return queryBuilder;
  };

  const authApi = {
    getSession: async () => {
      const tokenCookie = document.cookie.split(/;\s*/).find(c => c.startsWith('sb-auth-token='));
      return { data: { session: tokenCookie ? {} : null }, error: tokenCookie ? null : { message: 'no session' } } as any;
    },
    getUser: async () => {
      return { data: { user: { id: process.env.E2E_USER_ID || '6f9916c7-3575-4a81-b58e-624ab066bebc', email: 'jam@jam.com', user_metadata: { organization_id: (window as any).CampfireWidgetConfig?.organizationId || 'b5e80170-004c-4e82-a88c-3e2166b169dd' }, app_metadata: {} } }, error: null } as any;
    },
    refreshSession: async () => ({ data: { session: { access_token: 'mock', refresh_token: 'mock', expires_in: 3600 } }, error: null } as any),
    signInWithPassword: async () => ({ data: { user: { id: 'mock' } }, error: null } as any),
    updateUser: async () => ({ data: { user: { id: 'mock' } }, error: null } as any),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock auth state change - immediately call with signed in state
      setTimeout(() => {
        callback('SIGNED_IN', {
          access_token: 'mock-token',
          user: {
            id: process.env.E2E_USER_ID || '6f9916c7-3575-4a81-b58e-624ab066bebc',
            email: 'jam@jam.com',
            user_metadata: { organization_id: (window as any).CampfireWidgetConfig?.organizationId || 'b5e80170-004c-4e82-a88c-3e2166b169dd' }
          }
        });
      }, 100);

      // Return unsubscribe function
      return {
        data: { subscription: { unsubscribe: () => {} } },
        error: null
      };
    },
  };

  const client = {
    channel: (_name: string) => mockChannel(),
    getChannel: (_name: string) => null, // Return null to indicate channel doesn't exist
    removeChannel: (_channel: any) => ({ status: 'ok' }),
    from: (table: string) => buildQuery(table),
    auth: authApi,
  };

  return client;
}

/**
 * Get widget client (browser-side only)
 */
function getWidgetClient() {
  if (typeof window === "undefined") {
    throw new Error("Widget client can only be used in browser environment");
  }

  // E2E MOCK: return mock client for widget
  if (process.env.NEXT_PUBLIC_E2E_MOCK === 'true' || (typeof process !== 'undefined' && (process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test'))) {
    return createMockBrowserClient();
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
function getServiceClient(): ReturnType<typeof createSupabaseClient<Database>> {
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
 * Get simple server client for cleanup operations (no cookies needed)
 */
function getSimpleServerClient(): SupabaseJsClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("Server client cannot be used in browser environment");
  }

  const env = getEnv();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() { return []; },
      setAll() { /* no-op */ }
    }
  });
}

/**
 * Get server client (server-side only)
 */
type CookieStore = { getAll(): Array<{ name: string; value: string }>; set(name: string, value: string, options?: unknown): void };

function getServerClient(cookies: CookieStore): SupabaseJsClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("Server client cannot be used in browser environment");
  }

  const env = getEnv();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
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
  payload: unknown;
  sent_at: string;
}

// Re-export realtime channel type
export type RealtimeChannel = any;

// ============================================================================
// SSR SAFETY ENHANCEMENTS
// ============================================================================

/**
 * SSR-safe environment detection
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * SSR-safe client factory
 */
export function createSSRSafeClient() {
  if (isBrowser()) {
    return getBrowserClient();
  } else {
    return getSimpleServerClient();
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: unknown): SupabaseError {
  if (error?.code && error?.message) {
    return new SupabaseError(
      error.message,
      error.code,
      error.details,
      error.hint
    );
  }

  return new SupabaseError(
    error?.message || 'An unknown database error occurred'
  );
}

// ============================================================================
// CONNECTION HEALTH
// ============================================================================

export async function checkConnectionHealth(client: SupabaseJsClient<Database>): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { error } = await client
      .from('organizations')
      .select('id')
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        isHealthy: false,
        latency,
        error: error.message,
      };
    }

    return {
      isHealthy: true,
      latency,
    };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// REALTIME CONFIGURATION
// ============================================================================

export const realtimeConfig = {
  enabledTables: [
    'messages',
    'conversations',
    'typing_indicators',
    'presence_states',
  ],

  settings: {
    eventsPerSecond: 10,
    heartbeatIntervalMs: 25000,
    reconnectAfterMs: 1000,
    maxReconnectAttempts: 5,
    timeout: 15000,
  },

  getChannelName: (organizationId: string, conversationId?: string) => {
    if (conversationId) {
      return `org:${organizationId}:conv:${conversationId}`;
    }
    return `org:${organizationId}`;
  },
};

// Type exports
export type { SupabaseClient } from "@supabase/supabase-js";
export type { Database };

