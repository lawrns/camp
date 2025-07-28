import { useCallback, useEffect, useState } from "react";

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  status: "online" | "away" | "offline";
  company: string | null;
  title: string | null;
  location: string | null;
  timezone: string;
  notes: string | null;
  tags: string[];
  totalConversations: number;
  averageResponseTime: string | null;
  satisfaction: number | null;
  createdAt: string;
  lastSeen: string;
  openConversations: number;
  closedConversations: number;
}

export interface CustomerProfileState {
  profile: CustomerProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

export interface CustomerProfileActions {
  loadProfile: (email: string) => Promise<void>;
  updateProfile: (email: string, updates: Partial<CustomerProfile>) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing customer profiles
 * Integrates with the existing customer profile API
 */
export function useCustomerProfile(): CustomerProfileState & CustomerProfileActions {
  const [state, setState] = useState<CustomerProfileState>({
    profile: null,
    isLoading: false,
    isUpdating: false,
    error: null,
  });

  /**
   * Load customer profile by email
   */
  const loadProfile = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/customers/${encodeURIComponent(email)}`, {
        headers: {
          Authorization: "Bearer dev-token-jam@jam.com",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load customer profile: ${response.status}`);
      }

      const result = await response.json();
      const profile = result.data;

      if (!profile) {
        throw new Error("No profile data returned");
      }

      setState((prev) => ({
        ...prev,
        profile,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load customer profile",
      }));
    }
  }, []);

  /**
   * Update customer profile
   */
  const updateProfile = useCallback(async (email: string, updates: Partial<CustomerProfile>) => {
    setState((prev) => ({ ...prev, isUpdating: true, error: null }));

    try {
      const response = await fetch(`/api/customers/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-token-jam@jam.com",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update customer profile: ${response.status}`);
      }

      const result = await response.json();
      const updatedProfile = result.data;

      if (!updatedProfile) {
        throw new Error("No updated profile data returned");
      }

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
        isUpdating: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : "Failed to update customer profile",
      }));
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadProfile,
    updateProfile,
    clearError,
  };
}
