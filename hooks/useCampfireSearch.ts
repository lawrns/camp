import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { OPTIMIZATION_CONSTANTS } from "../lib/performance/optimizationUtils";

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type?: "conversation" | "message";
  timestamp?: string;
  sender?: {
    type: "customer" | "agent" | "ai";
    name?: string;
    email?: string;
  };
  hasAttachments?: boolean;
  hasLinks?: boolean;
}

export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  senderTypes?: Array<"customer" | "agent" | "ai">;
  messageTypes?: Array<"text" | "attachments" | "links" | "system">;
}

export const useCampfireSearch = (query: string, filters?: SearchFilters) => {
  // Debounce the query to avoid excessive API calls
  const debouncedQuery = useMemo(() => {
    return query.trim().length > 2 ? query.trim() : "";
  }, [query]);

  // Memoize filter params
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();

    if (filters?.dateRange) {
      params.append("startDate", filters.dateRange.start.toISOString());
      params.append("endDate", filters.dateRange.end.toISOString());
    }

    if (filters?.senderTypes?.length) {
      params.append("senderTypes", filters.senderTypes.join(","));
    }

    if (filters?.messageTypes?.length) {
      params.append("messageTypes", filters.messageTypes.join(","));
    }

    return params.toString();
  }, [filters]);

  const {
    data: results = [],
    isLoading,
    isError,
    error,
  } = useQuery<SearchResult[], Error>({
    queryKey: ["campfireSearch", debouncedQuery, filterParams],
    queryFn: async () => {
      if (!debouncedQuery) return [];

      const url = new URL("/api/campfire/search", window.location.origin);
      url.searchParams.append("query", debouncedQuery);

      // Add filter params
      if (filterParams) {
        const params = new URLSearchParams(filterParams);
        params.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
    placeholderData: (previousData) => previousData,
    staleTime: OPTIMIZATION_CONSTANTS.CACHE_TIME.SHORT,
    gcTime: OPTIMIZATION_CONSTANTS.CACHE_TIME.MEDIUM,
  });

  return {
    results,
    isLoading: isLoading && debouncedQuery.length > 0,
    isError,
    error,
    hasQuery: debouncedQuery.length > 0,
    filters,
  };
};
