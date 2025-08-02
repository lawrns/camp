/**
 * CAMPFIRE WIDGET DESIGN SYSTEM
 * 
 * Pixel-perfect, meticulously crafted design system for the Campfire widget
 * Following Intercom standards with 8px grid system and consistent typography
 */

// ============================================================================
// DESIGN TOKENS
// ============================================================================
export * from './tokens';

// ============================================================================
// CORE COMPONENTS
// ============================================================================
export { MessageBubble, MessageGroup } from './MessageBubble';
export type { MessageBubbleProps, MessageGroupProps } from './MessageBubble';

export { MessageContainer } from './MessageContainer';
export type { MessageContainerProps } from './MessageContainer';

export { WidgetInput } from './WidgetInput';
export type { WidgetInputProps } from './WidgetInput';

export { PixelPerfectChatInterface } from './PixelPerfectChatInterface';
export type { PixelPerfectChatInterfaceProps } from './PixelPerfectChatInterface';

export { UltimateWidget } from './UltimateWidget';
export type { UltimateWidgetProps, UltimateWidgetConfig } from './UltimateWidget';

// ============================================================================
// UI COMPONENTS
// ============================================================================
export { WidgetButton, WidgetIconButton } from './WidgetButton';
export type { WidgetButtonProps, WidgetIconButtonProps } from './WidgetButton';

export { WidgetHeader, CompactWidgetHeader } from './WidgetHeader';
export type { WidgetHeaderProps, CompactWidgetHeaderProps } from './WidgetHeader';

export { WidgetTabs, WidgetBottomTabs } from './WidgetTabs';
export type { WidgetTabsProps, WidgetBottomTabsProps, WidgetTab } from './WidgetTabs';

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================
export {
  useResponsive,
  useWidgetDimensions,
  useWidgetPosition,
  useResponsiveTypography,
  useResponsiveTouchTargets
} from './useResponsive';
export type { ResponsiveState, ResponsiveBreakpoints } from './useResponsive';

// ============================================================================
// DEFAULT EXPORT - Main Chat Interface
// ============================================================================
export { default } from './PixelPerfectChatInterface';
