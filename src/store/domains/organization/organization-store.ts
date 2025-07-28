/**
 * Organization Domain Store
 * Manages organization context and settings
 */

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OrganizationSettings {
  aiEnabled: boolean;
  ragEnabled: boolean;
  autoHandoff: boolean;
  [key: string]: any;
}

export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
}

export interface OrganizationState {
  organization: Organization | null;
}

export interface OrganizationActions {
  setOrganization: (organization: Organization) => void;
  updateOrganizationSettings: (settings: Partial<OrganizationSettings>) => void;
  clearOrganization: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useOrganizationStore = create<OrganizationState & OrganizationActions>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        // Initial state
        organization: null,

        // Actions
        setOrganization: (organization) =>
          set((draft) => {
            draft.organization = organization;
          }),

        updateOrganizationSettings: (settings) =>
          set((draft) => {
            if (draft.organization) {
              Object.assign(draft.organization.settings, settings);
            }
          }),

        clearOrganization: () =>
          set((draft) => {
            draft.organization = null;
          }),
      }))
    ),
    {
      name: "Organization Store",
    }
  )
);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Listen to auth events to reset organization state
if (typeof window !== "undefined") {
  // Clear organization when auth is cleared
  window.addEventListener("auth:clear", () => {
    useOrganizationStore.getState().clearOrganization();
  });

  // Also clear on logout
  window.addEventListener("auth:logout", () => {
    useOrganizationStore.getState().clearOrganization();
  });
}

// ============================================================================
// TYPED HOOKS
// ============================================================================

export const useOrganization = () => useOrganizationStore((state) => state.organization);
export const useOrganizationId = () => useOrganizationStore((state) => state.organization?.id);
export const useOrganizationName = () => useOrganizationStore((state) => state.organization?.name);
export const useOrganizationSettings = () => useOrganizationStore((state) => state.organization?.settings);

// Settings-specific hooks
export const useIsAIEnabled = () => useOrganizationStore((state) => state.organization?.settings?.aiEnabled ?? false);
export const useIsRAGEnabled = () => useOrganizationStore((state) => state.organization?.settings?.ragEnabled ?? false);
export const useIsAutoHandoffEnabled = () =>
  useOrganizationStore((state) => state.organization?.settings?.autoHandoff ?? false);

// Actions hooks
export const useSetOrganization = () => useOrganizationStore((state) => state.setOrganization);
export const useUpdateOrganizationSettings = () => useOrganizationStore((state) => state.updateOrganizationSettings);
export const useClearOrganization = () => useOrganizationStore((state) => state.clearOrganization);

// ============================================================================
// SELECTORS
// ============================================================================

export const organizationSelectors = {
  getOrganization: (state: OrganizationState) => state.organization,
  getOrganizationId: (state: OrganizationState) => state.organization?.id,
  getOrganizationName: (state: OrganizationState) => state.organization?.name,
  getOrganizationSettings: (state: OrganizationState) => state.organization?.settings,
  isAIEnabled: (state: OrganizationState) => state.organization?.settings?.aiEnabled ?? false,
  isRAGEnabled: (state: OrganizationState) => state.organization?.settings?.ragEnabled ?? false,
  isAutoHandoffEnabled: (state: OrganizationState) => state.organization?.settings?.autoHandoff ?? false,
};
