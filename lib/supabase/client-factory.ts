/**
 * 🔥 UNIFIED SUPABASE CLIENT FACTORY
 * 
 * Centralized client creation with proper error handling,
 * environment detection, and lifecycle management.
 * 
 * This factory ensures consistent client creation across
 * the application and prevents multiple GoTrueClient instances.
 */

import type { Database } from "@/types/supabase";
import { createBrowserClient as createSSRBrowserClient, createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJSClient } from "@supabase/supabase-js";
import { createServerComponentClient as createAuthHelpersServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Client types
export type ClientType = 'browser' | 'widget' | 'service' | 'server' | 'server-component';

// Client configuration
export interface ClientConfig {
  type: ClientType;
  cookies?: any;
  storageKey?: string;
  enableRealtime?: boolean;
  enableDebug?: boolean;
}

// Client creation result
export interface ClientResult {
  client: any;
  error?: string;
  instanceId?: string;
}

// Environment detection
const getEnvironment = () => {
  if (typeof window !== "undefined") {
    return 'browser';
  }
  return 'server';
};

// Environment variables
const getEnvVars = () => {
  const env = getEnvironment();
  
  if (env === 'browser') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceKey: undefined,
    };
  }
  
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
};

// Client registry for tracking instances
const clientRegistry = new Map<string, any>();
const instanceCounter = new Map<ClientType, number>();

// Generate unique instance ID
const generateInstanceId = (type: ClientType): string => {
  const count = (instanceCounter.get(type) || 0) + 1;
  instanceCounter.set(type, count);
  return `${type}-${count}-${Date.now()}`;
};

// Validate configuration
const validateConfig = (config: ClientConfig): string | null => {
  const env = getEnvironment();
  
  // Check environment compatibility
  if (config.type === 'browser' && env !== 'browser') {
    return 'Browser client cannot be used in server environment';
  }
  
  if (config.type === 'service' && env === 'browser') {
    return 'Service client cannot be used in browser environment';
  }
  
  if (config.type === 'server' && env === 'browser') {
    return 'Server client cannot be used in browser environment';
  }
  
  // Check required environment variables
  const envVars = getEnvVars();
  if (!envVars.url || !envVars.anonKey) {
    return 'Missing required Supabase environment variables';
  }
  
  if (config.type === 'service' && !envVars.serviceKey) {
    return 'Missing service role key for service client';
  }
  
  return null;
};

// Create browser client
const createBrowserClient = (config: ClientConfig): ClientResult => {
  try {
    const envVars = getEnvVars();
    const instanceId = generateInstanceId('browser');
    
    const client = createSSRBrowserClient<Database>(envVars.url, envVars.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: config.storageKey || `sb-${envVars.url.split('//')[1]?.split('.')[0]}-auth-token`,
        detectSessionInUrl: true,
      },
      realtime: config.enableRealtime ? {
        params: {
          eventsPerSecond: 10,
          apikey: envVars.anonKey,
          log_level: config.enableDebug ? 'debug' : 'info',
        },
        heartbeatIntervalMs: 25000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 15000,
      } : undefined,
      global: {
        headers: {
          'X-Client-Info': 'campfire-v2',
          'X-Client-Version': '2.0.0',
          'X-Client-Type': config.type,
        }
      }
    });
    
    clientRegistry.set(instanceId, client);
    
    if (config.enableDebug) {
      console.log(`🔗 Created browser client: ${instanceId}`);
    }
    
    return { client, instanceId };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to create browser client: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Create widget client
const createWidgetClient = (config: ClientConfig): ClientResult => {
  try {
    const envVars = getEnvVars();
    const instanceId = generateInstanceId('widget');
    
    const client = createSSRBrowserClient<Database>(envVars.url, envVars.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: config.storageKey || 'supabase-widget-session',
        detectSessionInUrl: false,
      },
      realtime: config.enableRealtime ? {
        params: {
          eventsPerSecond: 10,
          apikey: envVars.anonKey,
          log_level: config.enableDebug ? 'debug' : 'info',
          vsn: '1.0.0'
        },
        heartbeatIntervalMs: 25000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 15000
      } : undefined,
      global: {
        headers: {
          'X-Client-Info': 'campfire-widget',
          'X-Client-Version': '2.0.0',
          'X-Client-Type': config.type,
        }
      }
    });
    
    clientRegistry.set(instanceId, client);
    
    if (config.enableDebug) {
      console.log(`🔗 Created widget client: ${instanceId}`);
    }
    
    return { client, instanceId };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to create widget client: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Create service client
const createServiceClient = (config: ClientConfig): ClientResult => {
  try {
    const envVars = getEnvVars();
    const instanceId = generateInstanceId('service');
    
    const client = createSupabaseJSClient(envVars.url, envVars.serviceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: config.enableRealtime ? {
        params: {
          eventsPerSecond: 10,
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
        timeout: 20000,
      } : undefined,
      global: {
        headers: {
          'X-Client-Info': 'campfire-v2-service',
          'X-Client-Version': '2.0.0',
          'X-Client-Type': config.type,
        }
      }
    });
    
    clientRegistry.set(instanceId, client);
    
    if (config.enableDebug) {
      console.log(`🔗 Created service client: ${instanceId}`);
    }
    
    return { client, instanceId };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to create service client: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Create server client
const createServerClient = (config: ClientConfig): ClientResult => {
  try {
    const envVars = getEnvVars();
    const instanceId = generateInstanceId('server');
    
    const client = createSSRServerClient<Database>(envVars.url, envVars.anonKey, {
      cookies: {
        getAll() {
          return config.cookies?.getAll?.() || [];
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              config.cookies?.set?.(name, value, options);
            });
          } catch {
            // Ignore - server component
          }
        },
      },
    });
    
    clientRegistry.set(instanceId, client);
    
    if (config.enableDebug) {
      console.log(`🔗 Created server client: ${instanceId}`);
    }
    
    return { client, instanceId };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to create server client: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Create server component client
const createServerComponentClient = (config: ClientConfig): ClientResult => {
  try {
    const instanceId = generateInstanceId('server-component');
    
    const client = createAuthHelpersServerComponentClient<Database>({ 
      cookies: () => config.cookies || { getAll: () => [], setAll: () => {} }
    });
    
    clientRegistry.set(instanceId, client);
    
    if (config.enableDebug) {
      console.log(`🔗 Created server component client: ${instanceId}`);
    }
    
    return { client, instanceId };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to create server component client: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Unified client factory
 * Creates Supabase clients with proper error handling and lifecycle management
 */
export function createSupabaseClientFactory(config: ClientConfig): ClientResult {
  // Validate configuration
  const validationError = validateConfig(config);
  if (validationError) {
    return { client: null, error: validationError };
  }
  
  // Create client based on type
  switch (config.type) {
    case 'browser':
      return createBrowserClient(config);
    case 'widget':
      return createWidgetClient(config);
    case 'service':
      return createServiceClient(config);
    case 'server':
      return createServerClient(config);
    case 'server-component':
      return createServerComponentClient(config);
    default:
      return { client: null, error: `Unknown client type: ${config.type}` };
  }
}

/**
 * Cleanup client instance
 */
export function cleanupClient(instanceId: string): boolean {
  const client = clientRegistry.get(instanceId);
  if (!client) {
    return false;
  }
  
  try {
    // Remove all channels
    client.removeAllChannels?.();
    
    // Remove from registry
    clientRegistry.delete(instanceId);
    
    return true;
  } catch (error) {
    console.warn(`Error cleaning up client ${instanceId}:`, error);
    return false;
  }
}

/**
 * Cleanup all clients
 */
export function cleanupAllClients(): void {
  const instanceIds = Array.from(clientRegistry.keys());
  
  instanceIds.forEach(instanceId => {
    cleanupClient(instanceId);
  });
  
  // Reset counters
  instanceCounter.clear();
}

/**
 * Get client registry info
 */
export function getClientRegistryInfo() {
  return {
    totalClients: clientRegistry.size,
    clientTypes: Array.from(clientRegistry.keys()).map(id => id.split('-')[0]),
    instanceCounts: Object.fromEntries(instanceCounter.entries()),
  };
}

/**
 * Check if client exists
 */
export function hasClient(instanceId: string): boolean {
  return clientRegistry.has(instanceId);
}

/**
 * Get client by instance ID
 */
export function getClient(instanceId: string): any {
  return clientRegistry.get(instanceId);
}

// Convenience functions for common client types
export const createBrowserSupabaseClient = (config?: Partial<ClientConfig>) => 
  createSupabaseClientFactory({ type: 'browser', enableRealtime: true, enableDebug: process.env.NODE_ENV === 'development', ...config });

export const createWidgetSupabaseClient = (config?: Partial<ClientConfig>) => 
  createSupabaseClientFactory({ type: 'widget', enableRealtime: true, enableDebug: process.env.NODE_ENV === 'development', ...config });

export const createServiceSupabaseClient = (config?: Partial<ClientConfig>) => 
  createSupabaseClientFactory({ type: 'service', enableRealtime: false, enableDebug: process.env.NODE_ENV === 'development', ...config });

export const createServerSupabaseClient = (cookies: any, config?: Partial<ClientConfig>) => 
  createSupabaseClientFactory({ type: 'server', cookies, enableRealtime: false, enableDebug: process.env.NODE_ENV === 'development', ...config });

export const createServerComponentSupabaseClient = (cookies: any, config?: Partial<ClientConfig>) => 
  createSupabaseClientFactory({ type: 'server-component', cookies, enableRealtime: false, enableDebug: process.env.NODE_ENV === 'development', ...config });
