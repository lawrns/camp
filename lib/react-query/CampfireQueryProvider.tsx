/**
 * Campfire Query Provider
 * Improved React Query provider with cache persistence and dev tools
 */

"use client";

import { ReactNode, useState } from "react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createQueryClient } from "./config";

// CRITICAL FIX: Completely disable DevTools for now to prevent crashes
// TODO: Properly configure DevTools later
// let ReactQueryDevtools: unknown = null;
// if (process.env.NODE_ENV === 'development') {
//   try {
//     ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools;
//   } catch {
//     // DevTools not available, that's fine
//   }
// }

// Create persister for localStorage
const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : null,
  key: "campfire-query-cache",
});

interface CampfireQueryProviderProps {
  children: ReactNode;
}

export function CampfireQueryProvider({ children }: CampfireQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
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

  // Use PersistQueryClientProvider for cache persistence
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        buster: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0", // Cache buster for updates
      }}
    >
      {children}
      {/* CRITICAL FIX: DevTools disabled to prevent crashes */}
      {/* TODO: Re-enable with proper configuration later */}
      {/* {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )} */}
    </PersistQueryClientProvider>
  );
}
