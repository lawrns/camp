/**
 * UI feature preferences storage utilities
 * Manages saving and loading UI feature settings from client-side storage
 */

import { defaultUIFeatures, UIFeatureFlags } from "./index";

const STORAGE_KEY = "campfire-ui-features";

/**
 * Saves the UI feature preferences to localStorage
 *
 * @param features Current UI feature flags
 */
export const saveUIFeatures = (features: UIFeatureFlags): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
  } catch (error) {}
};

/**
 * Loads UI feature preferences from localStorage
 *
 * @returns Saved UI feature flags or default values if none found
 */
export const loadUIFeatures = (): UIFeatureFlags => {
  if (typeof window === "undefined") return defaultUIFeatures;

  try {
    const savedFeatures = localStorage.getItem(STORAGE_KEY);
    if (!savedFeatures) return defaultUIFeatures;

    const parsedFeatures = JSON.parse(savedFeatures) as Partial<UIFeatureFlags>;

    // Merge with default features to ensure all properties exist
    return {
      ...defaultUIFeatures,
      ...parsedFeatures,
    };
  } catch (error) {
    return defaultUIFeatures;
  }
};

/**
 * Resets UI feature preferences to default values
 */
export const resetUIFeatures = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {}
};
