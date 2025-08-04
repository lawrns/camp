// Design System Types for Campfire Widget

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  type?: 'text' | 'file' | 'image' | 'system';
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  mimeType?: string;
  reactions?: Reaction[];
  threadId?: string;
  parentMessageId?: string;
  isThread?: boolean;
  threadCount?: number;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName?: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isGroup?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadProgress?: number;
  status?: 'uploading' | 'uploaded' | 'failed';
}

export interface WidgetContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  organizationId?: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

export interface RealtimeMessage {
  id: string;
  content: string;
  timestamp: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  retryCount?: number;
}

export interface WidgetDimensions {
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
}

export interface WidgetPosition {
  bottom?: number;
  right?: number;
  left?: number;
  top?: number;
}

export interface WidgetConfig {
  organizationName?: string;
  organizationLogo?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  welcomeMessage?: string;
  showWelcomeMessage?: boolean;
  enableHelp?: boolean;
  enableNotifications?: boolean;
  enableFileUpload?: boolean;
  enableReactions?: boolean;
  enableThreading?: boolean;
  enableSoundNotifications?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  theme?: 'light' | 'dark' | 'auto';
  soundEnabled?: boolean;
  showAgentTyping?: boolean;
  zIndex?: number;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onViewThread?: (messageId: string) => void;
  className?: string;
}

export interface NotificationType {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface WidgetTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  badge?: number;
  disabled?: boolean;
}

export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}

export type WidgetState = 'closed' | 'minimized' | 'open' | 'expanded';
export type WidgetTabId = 'chat' | 'help' | 'home' | 'files' | 'settings';
export type MessageType = 'text' | 'file' | 'image' | 'system' | 'typing';
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';
export type ThemeMode = 'light' | 'dark' | 'auto';

// Event types
export interface WidgetEvent {
  type: string;
  payload?: any;
  timestamp: number;
  source: string;
}

export interface MessageEvent extends WidgetEvent {
  type: 'message:send' | 'message:receive' | 'message:update' | 'message:delete';
  payload: Message;
}

export interface ConnectionEvent extends WidgetEvent {
  type: 'connection:connected' | 'connection:disconnected' | 'connection:error';
  payload: ConnectionStatus;
}

export interface FileUploadEvent extends WidgetEvent {
  type: 'file:upload:start' | 'file:upload:progress' | 'file:upload:success' | 'file:upload:error';
  payload: {
    file: File;
    progress?: number;
    error?: string;
    url?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface WidgetError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface ValidationError extends WidgetError {
  code: 'VALIDATION_ERROR';
  field?: string;
  value?: any;
}

export interface NetworkError extends WidgetError {
  code: 'NETWORK_ERROR';
  status?: number;
  url?: string;
}

export interface FileError extends WidgetError {
  code: 'FILE_ERROR';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}