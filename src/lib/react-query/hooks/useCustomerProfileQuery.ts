/**
 * React Query Hook for Customer Profiles
 * Handles fetching and caching customer profile data
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CACHE_TIMES, queryKeys } from "../config";

interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_seen_at?: string;
  total_conversations: number;
  total_messages: number;
  metadata?: {
    company?: string;
    location?: string;
    timezone?: string;
    [key: string]: any;
  };
  tags?: string[];
  notes?: Array<{
    id: string;
    content: string;
    created_at: string;
    author: string;
  }>;
}

// Fetch customer profile
async function fetchCustomerProfile(email: string): Promise<CustomerProfile> {
  const response = await fetch(`/api/customers/${encodeURIComponent(email)}/profile`);
  if (!response.ok) {
    throw new Error("Failed to fetch customer profile");
  }
  return response.json();
}

// Hook for fetching customer profile
export function useCustomerProfileQuery(email: string | null) {
  return useQuery({
    queryKey: queryKeys.customerProfile(email || ""),
    queryFn: () => fetchCustomerProfile(email!),
    enabled: !!email,
    staleTime: CACHE_TIMES.USER_PROFILE,
    retry: 1, // Only retry once for user profiles
  });
}

// Hook for updating customer profile
export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, updates }: { email: string; updates: Partial<CustomerProfile> }) => {
      const response = await fetch(`/api/customers/${encodeURIComponent(email)}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer profile");
      }

      return response.json();
    },
    onSuccess: (data: any, variables: any) => {
      // Update cache
      queryClient.setQueryData(queryKeys.customerProfile(variables.email), data);
    },
  });
}

// Hook for adding customer note
export function useAddCustomerNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, note }: { email: string; note: string }) => {
      const response = await fetch(`/api/customers/${encodeURIComponent(email)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note }),
      });

      if (!response.ok) {
        throw new Error("Failed to add customer note");
      }

      return response.json();
    },
    onSuccess: (data: any, variables: any) => {
      // Invalidate customer profile to refetch with new note
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerProfile(variables.email),
      });
    },
  });
}
