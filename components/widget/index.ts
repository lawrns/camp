/**
 * CAMPFIRE WIDGET - MAIN ENTRY POINT
 * 
 * This file serves as the main entry point for the Campfire widget system.
 * It exports both the legacy WidgetProvider for backward compatibility
 * and the new WidgetOrchestrator for enhanced functionality.
 */

// Legacy exports for backward compatibility
export { WidgetProvider } from './WidgetProvider';
export { WidgetContext } from './WidgetContext';
export { useWidget } from './useWidget';

// New architecture exports
export { WidgetOrchestrator } from './WidgetOrchestrator';
export type { WidgetOrchestratorProps } from './WidgetOrchestrator';

// Design system exports
export { UltimateWidget } from './design-system/UltimateWidget';
export type { UltimateWidgetConfig } from './design-system/types';
export { MessageBubble } from './design-system/MessageBubble';
export type { MessageBubbleProps } from './design-system/MessageBubble';
export { WidgetHeader } from './design-system/WidgetHeader';
export { WidgetInput } from './design-system/WidgetInput';
export { WidgetFileUpload } from './design-system/WidgetFileUpload';

// Utility exports
export { useWidgetRealtime } from './hooks/useWidgetRealtime';
export { useWidgetSound } from './hooks/useWidgetSound';
export { useAIHandover } from './hooks/useAIHandover';

// Token exports for customization
export { SPACING, COLORS, LAYOUT, ANIMATIONS, SHADOWS, RADIUS } from './design-system/tokens';