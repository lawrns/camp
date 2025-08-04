import { useCallback, useEffect, useState } from "react";

interface PanelState {
  isCollapsed: boolean;
  width: number;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

interface UseCollapsiblePanelsOptions {
  defaultPanels?: Record<string, Partial<PanelState>>;
  storageKey?: string;
  onPanelChange?: (panelId: string, state: PanelState) => void;
}

export function useCollapsiblePanels(options: UseCollapsiblePanelsOptions = {}) {
  const { defaultPanels = {}, storageKey = "collapsible-panels", onPanelChange } = options;

  // Initialize panel states
  const [panelStates, setPanelStates] = useState<Record<string, PanelState>>(() => {
    const initialStates: Record<string, PanelState> = {};

    // Load from localStorage if available
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedStates = JSON.parse(saved);
          Object.keys(defaultPanels).forEach((panelId: unknown) => {
            const defaultPanel = defaultPanels[panelId];
            const savedPanel = parsedStates[panelId];

            initialStates[panelId] = {
              isCollapsed: savedPanel?.isCollapsed ?? defaultPanel?.isCollapsed ?? false,
              width: savedPanel?.width ?? defaultPanel?.width ?? defaultPanel?.defaultWidth ?? 320,
              defaultWidth: defaultPanel?.defaultWidth ?? 320,
              minWidth: defaultPanel?.minWidth ?? 280,
              maxWidth: defaultPanel?.maxWidth ?? 600,
            };
          });
          return initialStates;
        }
      } catch (error) {}
    }

    // Use default states
    Object.keys(defaultPanels).forEach((panelId: unknown) => {
      const defaultPanel = defaultPanels[panelId];
      initialStates[panelId] = {
        isCollapsed: defaultPanel?.isCollapsed ?? false,
        width: defaultPanel?.width ?? defaultPanel?.defaultWidth ?? 320,
        defaultWidth: defaultPanel?.defaultWidth ?? 320,
        minWidth: defaultPanel?.minWidth ?? 280,
        maxWidth: defaultPanel?.maxWidth ?? 600,
      };
    });

    return initialStates;
  });

  // Save to localStorage when states change
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(panelStates));
      } catch (error) {}
    }
  }, [panelStates, storageKey]);

  // Toggle panel collapse state
  const togglePanel = useCallback(
    (panelId: string) => {
      setPanelStates((prev) => {
        const currentState = prev[panelId];
        if (!currentState) return prev;

        const newState = {
          ...currentState,
          isCollapsed: !currentState.isCollapsed,
        };

        onPanelChange?.(panelId, newState);

        return {
          ...prev,
          [panelId]: newState,
        };
      });
    },
    [onPanelChange]
  );

  // Set panel width
  const setPanelWidth = useCallback(
    (panelId: string, width: number) => {
      setPanelStates((prev) => {
        const currentState = prev[panelId];
        if (!currentState) return prev;

        const clampedWidth = Math.max(currentState.minWidth, Math.min(currentState.maxWidth, width));

        const newState = {
          ...currentState,
          width: clampedWidth,
        };

        onPanelChange?.(panelId, newState);

        return {
          ...prev,
          [panelId]: newState,
        };
      });
    },
    [onPanelChange]
  );

  // Collapse panel
  const collapsePanel = useCallback(
    (panelId: string) => {
      setPanelStates((prev) => {
        const currentState = prev[panelId];
        if (!currentState || currentState.isCollapsed) return prev;

        const newState = {
          ...currentState,
          isCollapsed: true,
        };

        onPanelChange?.(panelId, newState);

        return {
          ...prev,
          [panelId]: newState,
        };
      });
    },
    [onPanelChange]
  );

  // Expand panel
  const expandPanel = useCallback(
    (panelId: string) => {
      setPanelStates((prev) => {
        const currentState = prev[panelId];
        if (!currentState || !currentState.isCollapsed) return prev;

        const newState = {
          ...currentState,
          isCollapsed: false,
        };

        onPanelChange?.(panelId, newState);

        return {
          ...prev,
          [panelId]: newState,
        };
      });
    },
    [onPanelChange]
  );

  // Reset panel to default width
  const resetPanelWidth = useCallback(
    (panelId: string) => {
      setPanelStates((prev) => {
        const currentState = prev[panelId];
        if (!currentState) return prev;

        const newState = {
          ...currentState,
          width: currentState.defaultWidth,
        };

        onPanelChange?.(panelId, newState);

        return {
          ...prev,
          [panelId]: newState,
        };
      });
    },
    [onPanelChange]
  );

  // Get panel state
  const getPanelState = useCallback(
    (panelId: string): PanelState | undefined => {
      return panelStates[panelId];
    },
    [panelStates]
  );

  // Check if panel is collapsed
  const isPanelCollapsed = useCallback(
    (panelId: string): boolean => {
      return panelStates[panelId]?.isCollapsed ?? false;
    },
    [panelStates]
  );

  // Get panel width
  const getPanelWidth = useCallback(
    (panelId: string): number => {
      return panelStates[panelId]?.width ?? 320;
    },
    [panelStates]
  );

  return {
    panelStates,
    togglePanel,
    setPanelWidth,
    collapsePanel,
    expandPanel,
    resetPanelWidth,
    getPanelState,
    isPanelCollapsed,
    getPanelWidth,
  };
}
