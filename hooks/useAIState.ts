import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AIState {
  // Core AI states
  isAIMode: boolean;
  aiMode: boolean; // Alias for compatibility
  isAIEnabled: boolean; // Another alias for compatibility
  confidence: number;
  hasRAGContext: boolean;
  hasSuggestion: boolean;
  isDrawerOpen: boolean;
  activeTab: "assistant" | "snippets" | "customer" | "insights";

  // Actions
  toggleAIMode: () => void;
  setAIMode: (enabled: boolean) => void;
  setConfidence: (confidence: number) => void;
  setRAGContext: (hasContext: boolean) => void;
  setSuggestion: (hasSuggestion: boolean) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setActiveTab: (tab: AIState["activeTab"]) => void;

  // Convenience methods
  resetAI: () => void;
}

export const useAIState = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAIMode: true,
      get aiMode() {
        return get().isAIMode;
      }, // Alias getter
      get isAIEnabled() {
        return get().isAIMode;
      }, // Another alias getter
      confidence: 0,
      hasRAGContext: false,
      hasSuggestion: false,
      isDrawerOpen: false,
      activeTab: "assistant",

      // Actions
      toggleAIMode: () => set((state) => ({ isAIMode: !state.isAIMode })),

      setAIMode: (enabled) => set({ isAIMode: enabled }),

      setConfidence: (confidence) => set({ confidence }),

      setRAGContext: (hasRAGContext) => set({ hasRAGContext }),

      setSuggestion: (hasSuggestion) => set({ hasSuggestion }),

      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      openDrawer: () => set({ isDrawerOpen: true }),

      closeDrawer: () => set({ isDrawerOpen: false }),

      setActiveTab: (activeTab) => set({ activeTab }),

      resetAI: () =>
        set({
          confidence: 0,
          hasRAGContext: false,
          hasSuggestion: false,
          isDrawerOpen: false,
          activeTab: "assistant",
        }),
    }),
    {
      name: "campfire-ai-mode",
      partialize: (state) => ({
        isAIMode: state.isAIMode,
        activeTab: state.activeTab,
      }), // Only persist user preferences
    }
  )
);

// STANDARD-001 FIX: Backward compatibility export
export const useAIMode = useAIState;
