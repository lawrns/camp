import { useState, useCallback } from 'react';
import { MobilePanelState, PanelNavigationState } from './types';

export function usePanelNavigation() {
  const [state, setState] = useState<PanelNavigationState>({
    currentPanel: { isOpen: false, panelType: 'conversation' },
    history: [],
    canGoBack: false,
  });

  const navigateTo = useCallback((panel: MobilePanelState) => {
    setState(prev => ({
      currentPanel: panel,
      history: [...prev.history, prev.currentPanel],
      canGoBack: prev.history.length > 0,
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      
      const newHistory = [...prev.history];
      const previousPanel = newHistory.pop()!;
      
      return {
        currentPanel: previousPanel,
        history: newHistory,
        canGoBack: newHistory.length > 0,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      currentPanel: { isOpen: false, panelType: 'conversation' },
      history: [],
      canGoBack: false,
    });
  }, []);

  return {
    currentPanel: state.currentPanel,
    canGoBack: state.canGoBack,
    navigateTo,
    goBack,
    reset,
  };
} 