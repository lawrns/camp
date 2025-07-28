/**
 * Custom hook for widget settings management using tRPC
 * Connects to the proper widget settings backend endpoints
 */

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api as trpc } from "@/trpc/react";

interface WidgetSettings {
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
  };
  position: {
    bottom: number;
    right: number;
  };
  behavior: {
    autoOpen: boolean;
    showWelcomeMessage: boolean;
    enableNotifications: boolean;
  };
  branding: {
    showPoweredBy: boolean;
    customLogo?: string;
    companyName: string;
  };
}

interface UseWidgetSettingsOptions {
  mailboxId?: number;
  autoLoad?: boolean;
}

interface UseWidgetSettingsReturn {
  // Data
  settings: WidgetSettings | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  updateSettings: (updates: Partial<WidgetSettings>) => Promise<void>;
  refreshSettings: () => void;

  // Utilities
  isUpdating: boolean;
}

export function useWidgetSettings(options: UseWidgetSettingsOptions = {}): UseWidgetSettingsReturn {
  const { mailboxId = 1, autoLoad = true } = options;
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch widget settings using tRPC
  const {
    data: settings,
    isLoading,
    error,
    refetch: refreshSettings,
  } = trpc.widget.getSettings.useQuery(
    { mailboxId },
    {
      enabled: autoLoad,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );

  // Update widget settings mutation
  const updateSettingsMutation = trpc.widget.updateSettings.useMutation({
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: (updatedSettings: WidgetSettings) => {
      // Update cache optimistically
      queryClient.setQueryData([["widget", "getSettings"], { input: { mailboxId }, type: "query" }], updatedSettings);

      toast.success("Widget settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update widget settings: ${error.message}`);
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  // Update settings function
  const updateSettings = useCallback(
    async (updates: Partial<WidgetSettings>) => {
      await updateSettingsMutation.mutateAsync({
        mailboxId,
        ...updates,
      });
    },
    [mailboxId, updateSettingsMutation]
  );

  return {
    // Data
    settings: settings || null,
    isLoading,
    error: error as Error | null,

    // Actions
    updateSettings,
    refreshSettings,

    // Utilities
    isUpdating,
  };
}
