/**
 * tRPC Client Configuration
 * Following Helper.ai's approach for type-safe API calls
 */

import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import { type AppRouter } from "./root";

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3001}`; // dev SSR should use localhost
}

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts: any) =>
            process.env.NODE_ENV === "development" || (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers: () => {
            // Get auth token from Supabase session
            if (typeof window !== 'undefined') {
              try {
                // Try multiple possible localStorage keys for Supabase auth
                const possibleKeys = [
                  'sb-yvntokkncxbhapqjesti-auth-token',
                  'supabase.auth.token',
                  'sb-auth-token'
                ];

                for (const key of possibleKeys) {
                  const authData = localStorage.getItem(key);
                  if (authData) {
                    try {
                      const parsed = JSON.parse(authData);
                      if (parsed?.access_token) {
                        console.log(`[tRPC] Using auth token from ${key}`);
                        return {
                          authorization: `Bearer ${parsed.access_token}`,
                        };
                      }
                    } catch (parseError) {
                      // Try next key
                      continue;
                    }
                  }
                }

                // Also check for any key containing 'supabase' and 'auth'
                const allKeys = Object.keys(localStorage);
                for (const key of allKeys) {
                  if (key.includes('supabase') && key.includes('auth')) {
                    try {
                      const authData = localStorage.getItem(key);
                      if (authData) {
                        const parsed = JSON.parse(authData);
                        if (parsed?.access_token) {
                          console.log(`[tRPC] Using auth token from dynamic key: ${key}`);
                          return {
                            authorization: `Bearer ${parsed.access_token}`,
                          };
                        }
                      }
                    } catch (parseError) {
                      // Continue to next key
                    }
                  }
                }

                console.warn('[tRPC] No valid auth token found in localStorage');
              } catch (error) {
                console.warn('[tRPC] Failed to get auth token:', error);
              }
            }
            return {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount: any, error: any) => {
              // Don't retry on 4xx errors
              if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      },
    };
  },
  ssr: false,
});

// Export for compatibility
export { api as trpc };
