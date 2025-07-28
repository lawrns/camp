/**
 * Custom hook for organization settings management
 * Separates data fetching and business logic from UI
 */

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrganizationSetting, OrganizationSettings } from "@/components/admin/types";

interface UseOrganizationSettingsOptions {
  organizationId: string;
  autoLoad?: boolean;
}

interface UseOrganizationSettingsReturn {
  // Data
  settings: OrganizationSettings | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  updateSetting: <K extends keyof OrganizationSettings>(
    category: K,
    key: keyof OrganizationSettings[K],
    value: OrganizationSettings[K][keyof OrganizationSettings[K]]
  ) => Promise<void>;

  updateMultipleSettings: (updates: Partial<OrganizationSettings>) => Promise<void>;
  refreshSettings: () => void;

  // Utilities
  getSetting: <K extends keyof OrganizationSettings>(
    category: K,
    key: keyof OrganizationSettings[K]
  ) => OrganizationSettings[K][keyof OrganizationSettings[K]] | undefined;

  validateSettings: (settings: Partial<OrganizationSettings>) => {
    isValid: boolean;
    errors: string[];
  };
}

// Default settings structure
const defaultSettings: OrganizationSettings = {
  general: {
    name: "",
    timezone: "UTC",
    language: "en",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24",
  },
  billing: {
    plan: "free",
    autoRenew: true,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
  },
  security: {
    twoFactorRequired: false,
    ipWhitelist: [],
    ssoEnabled: false,
  },
  integrations: {
    slack: {
      enabled: false,
    },
    zapier: {
      enabled: false,
    },
  },
  appearance: {
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#60A5FA",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: 8,
    fontFamily: "inter",
  },
};

export function useOrganizationSettings(options: UseOrganizationSettingsOptions): UseOrganizationSettingsReturn {
  const { organizationId, autoLoad = true } = options;
  const queryClient = useQueryClient();

  // Fetch organization settings
  const {
    data: settings,
    isLoading,
    error,
    refetch: refreshSettings,
  } = useQuery({
    queryKey: ["organization-settings", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load organization settings");
      }

      const data = await response.json();
      return data.settings as OrganizationSettings;
    },
    enabled: autoLoad && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: defaultSettings,
  });

  // Update single setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({
      category,
      key,
      value,
    }: {
      category: keyof OrganizationSettings;
      key: string;
      value: unknown;
    }) => {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          key,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ["organization-settings", organizationId],
        (oldData: OrganizationSettings | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            [variables.category]: {
              ...oldData[variables.category],
              [variables.key]: variables.value,
            },
          };
        }
      );

      toast.success("Setting updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });

  // Update multiple settings mutation
  const updateMultipleSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<OrganizationSettings>) => {
      const response = await fetch(`/api/organizations/${organizationId}/settings/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update settings: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["organization-settings", organizationId], data.settings);
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Update single setting
  const updateSetting = useCallback(
    async <K extends keyof OrganizationSettings>(
      category: K,
      key: keyof OrganizationSettings[K],
      value: OrganizationSettings[K][keyof OrganizationSettings[K]]
    ) => {
      await updateSettingMutation.mutateAsync({
        category,
        key: String(key),
        value,
      });
    },
    [organizationId]
  );

  // Update multiple settings
  const updateMultipleSettings = useCallback(
    async (updates: Partial<OrganizationSettings>) => {
      await updateMultipleSettingsMutation.mutateAsync(updates);
    },
    [organizationId]
  );

  // Get specific setting value
  const getSetting = useCallback(
    <K extends keyof OrganizationSettings>(category: K, key: keyof OrganizationSettings[K]) => {
      if (!settings) return undefined;
      const categorySettings = settings[category];
      if (!categorySettings) return undefined;
      return (categorySettings as Record<string, unknown>)[key as string];
    },
    [settings]
  );

  // Validate settings
  const validateSettings = useCallback((settingsToValidate: Partial<OrganizationSettings>) => {
    const errors: string[] = [];

    // Validate general settings
    if (settingsToValidate.general) {
      if (!settingsToValidate.general.name?.trim()) {
        errors.push("Organization name is required");
      }

      if (settingsToValidate.general.website && !isValidUrl(settingsToValidate.general.website)) {
        errors.push("Invalid website URL");
      }
    }

    // Validate billing settings
    if (settingsToValidate.billing) {
      if (settingsToValidate.billing.billingEmail && !isValidEmail(settingsToValidate.billing.billingEmail)) {
        errors.push("Invalid billing email");
      }
    }

    // Validate security settings
    if (settingsToValidate.security) {
      if (settingsToValidate.security.ipWhitelist) {
        const invalidIPs = settingsToValidate.security.ipWhitelist.filter((ip: string) => !isValidIP(ip));
        if (invalidIPs.length > 0) {
          errors.push(`Invalid IP addresses: ${invalidIPs.join(", ")}`);
        }
      }
    }

    // Validate integrations
    if (
      settingsToValidate.integrations?.slack?.webhookUrl &&
      !isValidUrl(settingsToValidate.integrations.slack.webhookUrl)
    ) {
      errors.push("Invalid Slack webhook URL");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  return {
    // Data
    settings: settings || null,
    isLoading,
    error: error as Error | null,

    // Actions
    updateSetting,
    updateMultipleSettings,
    refreshSettings,

    // Utilities
    getSetting,
    validateSettings,
  };
}

// Utility functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIP(ip: string): boolean {
  // Simple IPv4 validation
  return (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split(".").every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    })
  );
}
