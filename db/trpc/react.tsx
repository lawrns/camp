"use client";

import { lazy, Suspense, useState } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
// CRITICAL FIX: Completely disable DevTools for now to prevent crashes
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";
import { useRunOnce } from "@/hooks/useRunOnce";
import { getBaseUrl } from "@/lib/constants";
import { env } from "@/lib/utils/env-config";
import type { AppRouter } from "@/trpc";
import { createQueryClient } from "./queryClient";

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

export const api = createTRPCReact<AppRouter>();
// Alias for backward compatibility during rebranding
export const trpc = api;

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: SuperJSON,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              // authorization: getAuthCookie(),
            };
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
        {/* CRITICAL FIX: DevTools disabled to prevent crashes */}
        {/* TODO: Re-enable with proper configuration later */}
        {/* {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
          <ReactQueryDevtools initialIsOpen={false} />
        )} */}
      </api.Provider>
    </QueryClientProvider>
  );
}
