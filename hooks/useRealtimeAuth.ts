import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

/**
 * CRITICAL-003 FIX: Hook to handle real-time authentication updates
 * Implements supabase.realtime.setAuth() on SIGNED_IN events
 */
export function useRealtimeAuth() {
  const { session, user } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;

    // Set auth token for realtime connections
    const setRealtimeAuth = async () => {
      try {
        const client = supabase.browser();
        
        // Set auth for realtime channels
        await client.realtime.setAuth(session.access_token);
        
        console.log('[RealtimeAuth] Auth token set for realtime channels');
      } catch (error) {
        console.error('[RealtimeAuth] Failed to set realtime auth:', error);
      }
    };

    setRealtimeAuth();
  }, [session?.access_token]);

  // Listen for auth state changes and update realtime auth
  useEffect(() => {
    const client = supabase.browser();
    
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[RealtimeAuth] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.access_token) {
          try {
            // CRITICAL-003 FIX: Set auth token on SIGNED_IN events
            await client.realtime.setAuth(session.access_token);
            console.log('[RealtimeAuth] Realtime auth updated on SIGNED_IN');
          } catch (error) {
            console.error('[RealtimeAuth] Failed to update realtime auth on SIGNED_IN:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          try {
            // Clear auth token on sign out
            await client.realtime.setAuth(null);
            console.log('[RealtimeAuth] Realtime auth cleared on SIGNED_OUT');
          } catch (error) {
            console.error('[RealtimeAuth] Failed to clear realtime auth on SIGNED_OUT:', error);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          try {
            // Update auth token on refresh
            await client.realtime.setAuth(session.access_token);
            console.log('[RealtimeAuth] Realtime auth updated on TOKEN_REFRESHED');
          } catch (error) {
            console.error('[RealtimeAuth] Failed to update realtime auth on TOKEN_REFRESHED:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    isAuthenticated: !!session,
    userId: user?.id,
    accessToken: session?.access_token,
  };
}

/**
 * CRITICAL-003 FIX: Enhanced fetch function with proper authentication headers
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const client = supabase.browser();
  const { data: { session } } = await client.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if we have a session
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for additional auth
  });
}
