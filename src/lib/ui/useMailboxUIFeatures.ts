"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc";
import { defaultUIFeatures, UIFeatureFlags } from "./index";

export function useMailboxUIFeatures(mailboxId?: number) {
  const [features, setFeatures] = useState<UIFeatureFlags>(defaultUIFeatures);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();
  const { data: preferencesData } = trpc.mailbox.preferences.get.useQuery(undefined, {
    enabled: !!mailboxId,
  });

  const updatePreferences = trpc.mailbox.preferences.update.useMutation({
    onSuccess: () => {
      utils.mailbox.preferences.get.invalidate();
    },
  });

  useEffect(() => {
    if (preferencesData?.preferences?.uiFeatures) {
      setFeatures({
        ...defaultUIFeatures,
        ...preferencesData.preferences.uiFeatures,
      });
    }
    setIsLoading(false);
  }, [preferencesData]);

  const updateFeature = async (feature: keyof UIFeatureFlags, enabled: boolean) => {
    if (!preferencesData?.preferences) return;

    const updatedFeatures = {
      ...features,
      [feature]: enabled,
    };

    setFeatures(updatedFeatures);

    await updatePreferences.mutateAsync({
      mailboxSlug: "default", // TODO: Get actual mailbox slug
      preferences: {
        ...preferencesData.preferences,
        uiFeatures: updatedFeatures,
      },
    });
  };

  return {
    features,
    isLoading,
    updateFeature,
    isImprovedLayoutEnabled: features.enhancedLayout,
    isImprovedAnimationsEnabled: features.enhancedAnimations,
    isImprovedMessageDeliveryEnabled: features.enhancedMessageDelivery,
    isImprovedTypingIndicatorsEnabled: features.enhancedTypingIndicators,
  };
}
