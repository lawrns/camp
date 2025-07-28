"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { defaultUIFeatures, UIFeatureFlags } from "./index";
import { loadUIFeatures, saveUIFeatures } from "./storage";

// Environment-based feature overrides
function getEnvironmentFeatures(): Partial<UIFeatureFlags> {
  const envFeatures: Partial<UIFeatureFlags> = {};

  // Check client-side environment variables
  if (typeof window !== "undefined") {
    // Realtime pilot features based on environment
    const realtimePilotEnabled = process.env.NEXT_PUBLIC_REALTIME_PILOT === "true";
    if (realtimePilotEnabled) {
      envFeatures.realtimePilot = true;
      envFeatures.enhancedRealtimeFeatures = true;
      envFeatures.seamlessAgentHandover = true;
    }
  }

  return envFeatures;
}

interface UIFeaturesContextType {
  features: UIFeatureFlags;
  // Layout features
  isImprovedLayoutEnabled: boolean;
  isResponsiveDesignEnabled: boolean;
  isStandardizedEmptyStatesEnabled: boolean;

  // Animation and interaction features
  isImprovedAnimationsEnabled: boolean;
  isImprovedMessageDeliveryEnabled: boolean;
  isImprovedTypingIndicatorsEnabled: boolean;

  // User experience features
  isOnboardingEnabled: boolean;
  isAccessibilityFeaturesEnabled: boolean;

  // Channel features
  isEmailChannelEnabled: boolean;

  // AI features
  isRagProfilesEnabled: boolean;

  // Realtime features
  isRealtimePilotEnabled: boolean;
  isImprovedRealtimeFeaturesEnabled: boolean;
  isSeamlessAgentHandoverEnabled: boolean;

  setFeature: (feature: keyof UIFeatureFlags, enabled: boolean) => void;
  isLoaded: boolean;

  // Helper methods
  isFeatureEnabled: (feature: keyof UIFeatureFlags) => boolean;
  enableFeature: (feature: keyof UIFeatureFlags) => void;
  disableFeature: (feature: keyof UIFeatureFlags) => void;
  resetFeatures: () => void;
}

const UIFeaturesContext = createContext<UIFeaturesContextType>({
  features: defaultUIFeatures,
  // Layout features
  isImprovedLayoutEnabled: false,
  isResponsiveDesignEnabled: false,
  isStandardizedEmptyStatesEnabled: false,

  // Animation and interaction features
  isImprovedAnimationsEnabled: false,
  isImprovedMessageDeliveryEnabled: false,
  isImprovedTypingIndicatorsEnabled: false,

  // User experience features
  isOnboardingEnabled: false,
  isAccessibilityFeaturesEnabled: false,

  // Channel features
  isEmailChannelEnabled: false,

  // AI features
  isRagProfilesEnabled: false,

  // Realtime features
  isRealtimePilotEnabled: false,
  isImprovedRealtimeFeaturesEnabled: false,
  isSeamlessAgentHandoverEnabled: false,

  setFeature: () => {},
  isLoaded: false,

  // Helper methods defaults
  isFeatureEnabled: () => false,
  enableFeature: () => {},
  disableFeature: () => {},
  resetFeatures: () => {},
});

interface UIFeaturesProviderProps {
  children: ReactNode;
  initialFeatures?: Partial<UIFeatureFlags>;
}

export function UIFeaturesProvider({ children, initialFeatures = {} }: UIFeaturesProviderProps) {
  const [features, setFeatures] = useState<UIFeatureFlags>({
    ...defaultUIFeatures,
    ...initialFeatures,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences on initial mount
  useEffect(() => {
    const loadedFeatures = loadUIFeatures();
    const envFeatures = getEnvironmentFeatures();

    setFeatures((prev: UIFeatureFlags) => ({
      ...prev,
      ...loadedFeatures,
      ...envFeatures, // Environment features override saved features
      // Keep any props passed directly via initialFeatures (highest priority)
      ...initialFeatures,
    }));

    // Mark as loaded after initial render to prevent hydration issues
    const timeoutId = setTimeout(() => {
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []); // Remove initialFeatures dependency to prevent infinite loops

  const setFeature = useCallback((feature: keyof UIFeatureFlags, enabled: boolean) => {
    setFeatures((prev: UIFeatureFlags) => {
      const updatedFeatures = {
        ...prev,
        [feature]: enabled,
      };

      // Save to storage whenever a feature is toggled
      saveUIFeatures(updatedFeatures);

      return updatedFeatures;
    });
  }, []);

  // Helper methods
  const isFeatureEnabled = useCallback(
    (feature: keyof UIFeatureFlags) => {
      return features[feature] === true;
    },
    [features]
  );

  const enableFeature = useCallback(
    (feature: keyof UIFeatureFlags) => {
      setFeature(feature, true);
    },
    [setFeature]
  );

  const disableFeature = useCallback(
    (feature: keyof UIFeatureFlags) => {
      setFeature(feature, false);
    },
    [setFeature]
  );

  const resetFeatures = useCallback(() => {
    setFeatures(defaultUIFeatures);
    saveUIFeatures(defaultUIFeatures);
  }, []);

  return (
    <UIFeaturesContext.Provider
      value={{
        features,
        // Layout features
        isImprovedLayoutEnabled: features.enhancedLayout,
        isResponsiveDesignEnabled: features.responsiveDesign,
        isStandardizedEmptyStatesEnabled: features.standardizedEmptyStates,

        // Animation and interaction features
        isImprovedAnimationsEnabled: features.enhancedAnimations,
        isImprovedMessageDeliveryEnabled: features.enhancedMessageDelivery,
        isImprovedTypingIndicatorsEnabled: features.enhancedTypingIndicators,

        // User experience features
        isOnboardingEnabled: features.onboardingEnabled,
        isAccessibilityFeaturesEnabled: features.accessibilityFeatures,

        // Channel features
        isEmailChannelEnabled: features.cf_email_channel,

        // AI features
        isRagProfilesEnabled: features.cf_rag_profiles,

        // Realtime features
        isRealtimePilotEnabled: features.realtimePilot,
        isImprovedRealtimeFeaturesEnabled: features.enhancedRealtimeFeatures,
        isSeamlessAgentHandoverEnabled: features.seamlessAgentHandover,

        setFeature,
        isLoaded,

        // Helper methods
        isFeatureEnabled,
        enableFeature,
        disableFeature,
        resetFeatures,
      }}
    >
      {children}
    </UIFeaturesContext.Provider>
  );
}

export function useUIFeatures() {
  return useContext(UIFeaturesContext);
}

// Alias for backward compatibility during rebranding
export const useFeatureFlags = useUIFeatures;
