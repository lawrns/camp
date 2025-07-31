// Enhanced Messaging Components
// Comprehensive messaging system with modern UX and advanced features

// Core Components
export { EnhancedComposer } from './EnhancedComposer';
export { EnhancedMessageBubble } from './EnhancedMessageBubble';
export { EnhancedMessageList } from './EnhancedMessageList';
export { EnhancedEmojiPicker } from './EnhancedEmojiPicker';
export { EnhancedTypingIndicator, SimpleTypingIndicator } from './EnhancedTypingIndicator';
export { MessageFormatter, SimpleTextFormatter } from './MessageFormatter';
export { ReadReceiptIndicator, SimpleStatusIndicator } from './ReadReceiptIndicator';
export { MessageThread, ThreadPreview } from './MessageThread';
export { PresenceIndicator, ConnectionStatusIndicator } from './PresenceIndicator';
export { NotificationSystem, useNotifications } from './NotificationSystem';
export { useRealTimeMessaging } from './useRealTimeMessaging';
export {
  MessageSkeleton,
  MessageListSkeleton,
  TypingSkeleton,
  ComposerSkeleton,
  ConnectionLoader,
  EmptyState,
  ErrorState,
  LoadingOverlay,
  UploadProgress
} from './LoadingStates';
export {
  ScreenReaderAnnouncement,
  LiveRegion,
  useKeyboardNavigation,
  FocusTrap,
  SkipLink,
  AccessibleButton,
  AccessibleFormField,
  useHighContrastMode,
  useReducedMotion,
  AccessibleTooltip,
  AccessibleProgress
} from './AccessibilityEnhancements';
export {
  useBreakpoint,
  ResponsiveContainer,
  ResponsiveGrid,
  MobileDrawer,
  MobileComposer,
  TouchButton,
  ResponsiveNavigation,
  ResponsiveLayout
} from './ResponsiveLayout';
export {
  MemoizedMessage,
  VirtualizedMessageList,
  useDebouncedSearch,
  useThrottledTyping,
  useIntersectionObserver,
  LazyEmojiPickerWrapper,
  LazyImage,
  useMessageCache,
  useOptimizedRerender,
  useBatchedUpdates
} from './PerformanceOptimizations';
export { EnhancedMessagingDemo } from './EnhancedMessagingDemo';

// Types
export type { EnhancedComposerProps, AISuggestion, MentionUser } from './EnhancedComposer';
export type { MessageData, MessageAttachment, MessageReaction } from './EnhancedMessageBubble';
export type { TypingUser } from './EnhancedTypingIndicator';
export type { ReadStatus, ReadReceipt } from './ReadReceiptIndicator';
export type { PresenceStatus, ConnectionStatus, PresenceUser } from './PresenceIndicator';
export type { NotificationType, Notification } from './NotificationSystem';
export type { RealTimeMessagingConfig, RealTimeMessagingState, RealTimeMessagingActions } from './useRealTimeMessaging';

// Re-export commonly used types for convenience
export interface EnhancedMessagingConfig {
  enableRichText?: boolean;
  enableEmoji?: boolean;
  enableAttachments?: boolean;
  enableVoiceRecording?: boolean;
  enableAISuggestions?: boolean;
  enableDrafts?: boolean;
  enableMentions?: boolean;
  enableReactions?: boolean;
  enableEditing?: boolean;
  enableReplies?: boolean;
  enableVirtualization?: boolean;
  maxMessageLength?: number;
  maxAttachmentSize?: number;
  allowedFileTypes?: string[];
}

export interface MessagingTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

// Default configurations
export const DEFAULT_MESSAGING_CONFIG: EnhancedMessagingConfig = {
  enableRichText: false,
  enableEmoji: true,
  enableAttachments: true,
  enableVoiceRecording: false,
  enableAISuggestions: false,
  enableDrafts: true,
  enableMentions: false,
  enableReactions: true,
  enableEditing: true,
  enableReplies: true,
  enableVirtualization: true,
  maxMessageLength: 2000,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
};

export const LIGHT_THEME: MessagingTheme = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const DARK_THEME: MessagingTheme = {
  primary: '#60a5fa',
  secondary: '#9ca3af',
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  border: '#374151',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};
