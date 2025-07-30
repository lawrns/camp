/**
 * tRPC Provider Component
 * Wraps the app with tRPC and React Query providers
 */

"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/trpc/root";
import { useAuthStore } from "@/lib/auth/auth-store";
import { authLink } from "@/lib/trpc/auth-link";

// Component to initialize auth store
function AuthStoreInitializer() {
  console.log('[AuthStoreInitializer] Component mounted');
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    console.log('[AuthStoreInitializer] useEffect called, initializing auth store...');
    initialize();
  }, [initialize]);

  return null;
}

// CRITICAL FIX: Completely disable DevTools for now to prevent crashes
// TODO: Properly configure DevTools later
// let ReactQueryDevtools: any = null;
// if (process.env.NODE_ENV === 'development') {
//   try {
//     ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools;
//   } catch {
//     // DevTools not available, that's fine
//   }
// }

// Create tRPC React client
export const api = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

// Component to handle automatic token refresh and query invalidation
function TokenRefreshHandler({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const initializeTokens = async () => {
      console.log('[tRPC] TokenRefreshHandler: Initializing tokens...');

      // First check if tokens are expired and clear them if needed
      const clearedExpiredTokens = checkAndClearExpiredTokens();
      if (clearedExpiredTokens) {
        // Page will reload, so return early
        return;
      }

      const { token, isExpired } = getCurrentTokenFromStorage();

      console.log('[tRPC] TokenRefreshHandler: Token status:', {
        hasToken: !!token,
        isExpired,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });

      // Implement comprehensive token recovery strategy
      console.log('[tRPC] TokenRefreshHandler: Implementing comprehensive token recovery...');
      try {
        const supabaseClient = supabase.browser();

        // Step 1: Try to get current session first
        console.log('[tRPC] Step 1: Checking current session...');
        const { data: { session: currentSession }, error: currentError } = await supabaseClient.auth.getSession();

        if (!currentError && currentSession?.access_token) {
          // Check if current token is valid (not expired)
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = currentSession.expires_at || 0;

          if (expiresAt > now + 60) { // Token valid for at least 1 more minute
            console.log('[tRPC] Current session is valid, using it');
            cachedValidToken = currentSession.access_token;
            return;
          }
        }

        // Step 2: Force refresh the session
        console.log('[tRPC] Step 2: Force refreshing session...');
        const { data: { session }, error } = await supabaseClient.auth.refreshSession();

        if (!error && session?.access_token) {
          console.log('[tRPC] Session refreshed successfully!');
          cachedValidToken = session.access_token;

          // Invalidate queries to refetch with new token
          setTimeout(() => {
            queryClient.invalidateQueries();
          }, 500);
          return;
        }

        // Step 3: If refresh fails, check if we have any valid session at all
        console.log('[tRPC] Step 3: Refresh failed, checking session validity...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
          console.error('[tRPC] No valid user session found. Clearing storage and redirecting...');

          // Clear all auth storage
          if (typeof window !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('sb-') || key.includes('auth'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Force redirect to login
            console.log('[tRPC] Redirecting to login page...');
            window.location.href = '/auth/login';
          }
        } else {
          console.log('[tRPC] User exists but session refresh failed. Using fallback token if available.');
          if (currentSession?.access_token) {
            cachedValidToken = currentSession.access_token;
          }
        }

      } catch (error) {
        console.error('[tRPC] Error during comprehensive token recovery:', error);
      }
    };

    // Listen for storage changes (token updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('auth-token')) {
        console.log('[tRPC] Auth token updated in storage, invalidating queries...');
        // Invalidate all tRPC queries to refetch with new token
        queryClient.invalidateQueries();
      }
    };

    // Listen for Supabase auth state changes
    const supabaseClient = supabase.browser();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('[tRPC] Auth state change:', event, !!session);
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        console.log('[tRPC] Token refreshed or signed in, updating cached token and invalidating queries...');
        cachedValidToken = session?.access_token || null;
        // Invalidate all tRPC queries to refetch with new token
        setTimeout(() => {
          queryClient.invalidateQueries();
        }, 100);
      }
    });

    window.addEventListener('storage', handleStorageChange);
    initializeTokens();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            // PERFORMANCE: Reduce network requests in production
            refetchOnWindowFocus: process.env.NODE_ENV === "development",
            retry: process.env.NODE_ENV === "production" ? 3 : 1,
          },
          mutations: {
            retry: process.env.NODE_ENV === "production" ? 1 : 0,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        authLink,
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers(opts) {
            // Use headers from context (set by authLink)
            return opts.opList[0]?.context?.headers || {};
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthStoreInitializer />
        {children}
        {/* CRITICAL FIX: DevTools disabled to prevent crashes */}
        {/* TODO: Re-enable with proper configuration later */}
        {/* {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
          <ReactQueryDevtools initialIsOpen={false} />
        )} */}
      </QueryClientProvider>
    </api.Provider>
  );
}
