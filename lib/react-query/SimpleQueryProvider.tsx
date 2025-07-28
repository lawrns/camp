/**
 * Simple Query Provider
 * Basic React Query provider without persistence to avoid missing dependencies
 */

"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface SimpleQueryProviderProps {
  children: ReactNode;
}

export function SimpleQueryProvider({ children }: SimpleQueryProviderProps) {
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 