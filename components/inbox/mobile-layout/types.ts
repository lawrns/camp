/**
 * Mobile Layout Types and Configuration
 * 
 * Defines all types and configuration for the mobile inbox layout system
 */

export interface MobileInboxLayoutProps {
  // Panel content
  conversationList: React.ReactNode;
  chatPanel: React.ReactNode;
  detailsPanel: React.ReactNode;

  // State
  selectedConversationId?: string;
  hasSelectedConversation: boolean;

  // Callbacks
  onBackToList?: () => void;

  // Metadata
  conversationTitle?: string;
  unreadCount?: number;

  // Improved features
  enableSwipeGestures?: boolean;
  currentPanel?: "list" | "chat" | "details";
  onPanelChange?: (panel: "list" | "chat" | "details") => void;
}

export interface MobileLayoutConfig {
  // Transition configuration
  transition: {
    duration: number;
    easing: string;
    hapticFeedback: boolean;
  };

  // Swipe configuration
  swipe: {
    threshold: number;
    velocity: number;
    direction: "horizontal" | "vertical";
    enableHapticFeedback: boolean;
  };

  // Panel configuration
  panels: {
    list: {
      width: string;
      zIndex: number;
    };
    chat: {
      width: string;
      zIndex: number;
    };
    details: {
      width: string;
      zIndex: number;
    };
  };

  // General settings
  enableKeyboardShortcuts: boolean;
  enableSwipeGestures: boolean;
  enableHapticFeedback: boolean;
}

export interface PanelNavigationState {
  activePanel: "list" | "chat" | "details";
  panelOrder: ("list" | "chat" | "details")[];
  isTransitioning: boolean;
  canNavigateBack: boolean;
}

export interface SwipeState {
  isSwiping: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: "left" | "right" | "up" | "down" | null;
}

export interface PanelTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  isTransitioning: boolean;
  direction: "left" | "right" | "none";
  duration?: number;
  className?: string;
}

export interface SwipeablePanelContainerProps {
  panels: Array<{
    key: "list" | "chat" | "details";
    content: React.ReactNode;
  }>;
  activePanel: "list" | "chat" | "details";
  isTransitioning: boolean;
  enableSwipeGestures: boolean;
  swipeState: SwipeState;
  onSwipeStart: (e: React.TouchEvent) => void;
  onSwipeProgress: (e: React.TouchEvent) => void;
  onSwipeEnd: (e: React.TouchEvent) => void;
  className?: string;
}

export interface MobileHeaderProps {
  activePanel: "list" | "chat" | "details";
  onNavigateBack: () => void;
  canNavigateBack: boolean;
  title: string;
  unreadCount: number;
  onSearch: (query: string) => void;
  onFilterChange: (filters: string[]) => void;
  onRefresh: () => void;
  onNewConversation: () => void;
  showSearch: boolean;
  showFilters: boolean;
}

// Default configuration
export const DEFAULT_MOBILE_CONFIG: MobileLayoutConfig = {
  transition: {
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    hapticFeedback: true,
  },
  swipe: {
    threshold: 50,
    velocity: 0.3,
    direction: "horizontal",
    enableHapticFeedback: true,
  },
  panels: {
    list: {
      width: "100%",
      zIndex: 10,
    },
    chat: {
      width: "100%",
      zIndex: 20,
    },
    details: {
      width: "100%",
      zIndex: 30,
    },
  },
  enableKeyboardShortcuts: true,
  enableSwipeGestures: true,
  enableHapticFeedback: true,
}; 