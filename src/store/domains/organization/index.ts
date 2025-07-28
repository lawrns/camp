/**
 * Organization Domain Store - Public API
 * Re-exports all types, hooks, and utilities from the organization store
 */

export * from "./organization-store";

// Create aliases for missing exports that the store index expects
export {
  useOrganization as useCurrentOrganization,
  useOrganizationStore as useOrganizationState,
} from "./organization-store";

// Create a combined actions object
export const useOrganizationActions = () => {
  const setOrganization = useOrganizationStore((state) => state.setOrganization);
  const updateOrganizationSettings = useOrganizationStore((state) => state.updateOrganizationSettings);
  const clearOrganization = useOrganizationStore((state) => state.clearOrganization);

  return {
    setOrganization,
    updateOrganizationSettings,
    clearOrganization,
  };
};

// Import the store for the actions function
import { useOrganizationStore } from "./organization-store";
