'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  getSupabaseLegacy,
  RealtimeChannel,
  supabase,
  isBrowser,
  handleSupabaseError,
  checkConnectionHealth,
  type SupabaseClient
} from "@/lib/supabase";

/**
 * Hook to listen to Supabase Realtime broadcast events
 */
export function useSupabaseEvent<T = Record<string, unknown>>(
  channelName: string,
  eventName: string,
  callback: (payload: T) => void,
  dependencies: unknown[] = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel
    const channel = getSupabaseLegacy().channel(channelName);
    channelRef.current = channel;

    // Subscribe to broadcast events
    channel.on("broadcast", { event: eventName }, ({ payload }: unknown) => {
      callback(payload as T);
    });

    // Subscribe to the channel
    channel.subscribe((status: unknown) => {
      if (status === "SUBSCRIBED") {
        // Successfully subscribed
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, eventName, ...dependencies]);

  return channelRef.current;
}

/**
 * Hook to listen to a Supabase event only once
 */
export function useSupabaseEventOnce<T = Record<string, unknown>>(
  channelName: string,
  eventName: string,
  callback: (payload: T) => void,
  dependencies: unknown[] = []
) {
  const hasTriggered = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (hasTriggered.current) return;

    const channel = getSupabaseLegacy().channel(channelName);
    channelRef.current = channel;

    channel.on("broadcast", { event: eventName }, ({ payload }: unknown) => {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        callback(payload as T);
      }
    });

    channel.subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, eventName, ...dependencies]);

  return channelRef.current;
}

/**
 * Hook to send broadcast events to a Supabase Realtime channel
 */
export function useSupabaseBroadcast() {
  const sendEvent = async (channelName: string, eventName: string, payload: unknown) => {
    const channel = getSupabaseLegacy().channel(channelName);

    await channel.subscribe();

    const result = await channel.send({
      type: "broadcast",
      event: eventName,
      payload,
    });

    return result;
  };

  return { sendEvent };
}

// ============================================================================
// SSR-SAFE AUTHENTICATION HOOK
// ============================================================================

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

/**
 * SSR-safe authentication hook
 */
export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const router = useRouter();
  const client = isBrowser() ? supabase.browser() : null;

  useEffect(() => {
    if (!client || !isBrowser()) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession();

        if (error) {
          setState(prev => ({ ...prev, error, loading: false }));
          return;
        }

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as AuthError,
          loading: false
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });

        // Handle auth events
        if (event === 'SIGNED_IN') {
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, router]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!client) throw new Error('Client not available');

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        loading: false
      }));
      throw error;
    }
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) throw new Error('Client not available');

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        loading: false
      }));
      throw error;
    }
  }, [client]);

  const refreshSession = useCallback(async () => {
    if (!client) throw new Error('Client not available');

    try {
      const { error } = await client.auth.refreshSession();

      if (error) {
        setState(prev => ({ ...prev, error }));
        throw error;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as AuthError
      }));
      throw error;
    }
  }, [client]);

  return {
    ...state,
    signIn,
    signOut,
    refreshSession,
  };
}

// ============================================================================
// SSR-SAFE DATABASE QUERY HOOK
// ============================================================================

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * SSR-safe database query hook
 */
export function useSupabaseQuery<T>(
  queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
  dependencies: any[] = []
): QueryState<T> {
  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  });

  const client = isBrowser() ? supabase.browser() : null;

  const executeQuery = useCallback(async () => {
    if (!client || !isBrowser()) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await queryFn(client);

      if (error) {
        const supabaseError = handleSupabaseError(error);
        setState({ data: null, loading: false, error: supabaseError });
        return;
      }

      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Query failed')
      });
    }
  }, [client, queryFn]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery, ...dependencies]);

  return {
    ...state,
    refetch: executeQuery,
  };
}

// ============================================================================
// CONNECTION HEALTH HOOK
// ============================================================================

interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  error?: string;
  lastChecked: Date | null;
}

/**
 * Monitor Supabase connection health
 */
export function useConnectionHealth(
  checkInterval: number = 30000 // 30 seconds
): ConnectionHealth & { checkNow: () => Promise<void> } {
  const [health, setHealth] = useState<ConnectionHealth>({
    isHealthy: false,
    latency: 0,
    lastChecked: null,
  });

  const client = isBrowser() ? supabase.browser() : null;

  const checkHealth = useCallback(async () => {
    if (!client || !isBrowser()) {
      return;
    }

    try {
      const result = await checkConnectionHealth(client);
      setHealth({
        ...result,
        lastChecked: new Date(),
      });
    } catch (error) {
      setHealth({
        isHealthy: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date(),
      });
    }
  }, [client]);

  useEffect(() => {
    if (!isBrowser()) return;

    // Initial check
    checkHealth();

    // Set up interval
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkHealth, checkInterval]);

  return {
    ...health,
    checkNow: checkHealth,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get SSR-safe Supabase client
 */
export function useSupabaseClient(): SupabaseClient<Database> | null {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    if (isBrowser()) {
      setClient(supabase.browser());
    }
  }, []);

  return client;
}

/**
 * Check if we're in browser environment
 */
export function useIsBrowser(): boolean {
  const [isBrowserState, setIsBrowserState] = useState(false);

  useEffect(() => {
    setIsBrowserState(isBrowser());
  }, []);

  return isBrowserState;
}
