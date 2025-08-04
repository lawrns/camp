/**
 * React Query Hook for Organization Data
 * Handles fetching and caching organization data and settings
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Organization } from "@/lib/supabase/types";
import { CACHE_TIMES, queryKeys } from "../config";

// Fetch organization data
async function fetchOrganization(orgId: string): Promise<Organization> {
  const response = await fetch(`/api/organizations/${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch organization");
  }
  return response.json();
}

// Hook for fetching organization data
export function useOrganizationQuery() {
  const { organizationId } = useAuth();

  return useQuery({
    queryKey: queryKeys.organizationData(organizationId || ""),
    queryFn: () => fetchOrganization(organizationId!),
    enabled: !!organizationId,
    staleTime: CACHE_TIMES.ORGANIZATION,
    gcTime: Infinity, // Keep organization data in cache indefinitely
  });
}

// Hook for updating organization settings
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<Organization["settings"]>) => {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to update organization settings");
      }

      return response.json();
    },
    onMutate: async (newSettings: unknown) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.organizationData(organizationId || ""),
      });

      // Get current data
      const previousData = queryClient.getQueryData<Organization>(queryKeys.organizationData(organizationId || ""));

      // Optimistically update
      if (previousData && organizationId) {
        queryClient.setQueryData(queryKeys.organizationData(organizationId), {
          ...previousData,
          settings: {
            ...previousData.settings,
            ...newSettings,
          },
        });
      }

      return { previousData };
    },
    onError: (err: unknown, newSettings: unknown, context: unknown) => {
      // Revert on error
      if (context?.previousData && organizationId) {
        queryClient.setQueryData(queryKeys.organizationData(organizationId), context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizationData(organizationId),
        });
      }
    },
  });
}
