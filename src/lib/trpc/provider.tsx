/**
 * tRPC Provider Component
 * Wraps the app with tRPC and React Query providers
 */

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "./root";

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
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            return {};
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
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
