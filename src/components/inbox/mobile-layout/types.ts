export interface MobilePanelState {
  isOpen: boolean;
  panelType: 'conversation' | 'details' | 'composer';
  conversationId?: string;
}

export interface SwipeGestureConfig {
  threshold: number;
  velocity: number;
  direction: 'horizontal' | 'vertical';
}

export interface PanelNavigationState {
  currentPanel: MobilePanelState;
  history: MobilePanelState[];
  canGoBack: boolean;
} 