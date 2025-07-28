// Widget Configuration Types - Unified interface
export interface WidgetSupabaseConfig {
  url: string;
  anonKey: string;
  realtimeConfig: {
    channels: {
      conversation: string;
      global: string;
    };
    events: string[];
  };
}

/**
 * Unified Widget Configuration
 * Merges WidgetConfig and WidgetSettings from types/widget.ts
 */
export interface WidgetConfig {
  // Basic configuration
  id?: string;
  workspaceId?: string;
  organizationId?: string;
  publicKey?: string;
  apiEndpoint?: string;
  realtimeEndpoint?: string;
  supabase?: WidgetSupabaseConfig;
  enabled?: boolean;

  // Features (unified from both interfaces)
  features: {
    fileUpload: boolean;
    search: boolean;
    businessHours: boolean;
    aiResponses: boolean;
    readReceipts: boolean;
    allowFileUploads: boolean;
    showTypingIndicator: boolean;
    enableSoundNotifications: boolean;
    enableEmailCapture: boolean;
    allowScreenshots?: boolean;
    enableRealtime?: boolean;
  };

  // Appearance (unified from both interfaces)
  appearance: {
    primaryColor: string;
    backgroundColor?: string;
    textColor?: string;
    position: "bottom-right" | "bottom-left";
    size: "small" | "medium" | "large";
    theme?: "light" | "dark" | "auto";
    zIndex?: number;
    borderRadius?: number;
    fontFamily?: string;
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    customCSS?: string;
  };

  // Behavior (unified from both interfaces)
  behavior?: {
    autoOpen?: boolean;
    openDelay?: number;
    autoOpenDelay?: number;
    greeting?: string;
    placeholderText?: string;
    welcomeMessage?: string;
    offlineMessage?: string;
    aiWelcomeMessage?: string;
    gdprNoticeText?: string;
    showGDPRNotice?: boolean;
    privacyPolicyUrl?: string;
    maxFileSize?: number;
  };

  // Security
  security?: {
    allowedOrigins: string[];
    rateLimits: {
      messagesPerMinute: number;
      uploadsPerHour: number;
      searchesPerMinute: number;
    };
  };
}

// Widget initialization response
export interface WidgetInitResponse {
  token: string;
  config: {
    apiEndpoint: string;
    realtimeEndpoint: string;
    publicKey: string;
    supabase: WidgetSupabaseConfig;
    features: WidgetConfig["features"];
    appearance: WidgetConfig["appearance"];
    behavior?: WidgetConfig["behavior"];
  };
}

// Widget session configuration (from /api/widget/config)
export interface WidgetSessionConfig {
  mailboxSlug: string;
  mailboxName: string;
  theme?: WidgetConfig["appearance"];
  showWidget: boolean;
  isWhitelabel: boolean;
  config?: WidgetConfig;
  supabase: {
    url: string | undefined;
    anonKey: string | undefined;
    realtimeConfig: {
      channel: string;
      events: string[];
    };
  };
}

/**
 * Type alias for backward compatibility
 * Maps to the unified WidgetConfig
 */
export type WidgetSettings = WidgetConfig;

/**
 * Widget embed configuration for client-side usage
 */
export interface WidgetEmbedConfig {
  mailboxSlug: string;
  apiHost?: string;
  config?: Partial<WidgetConfig>;
  // Legacy properties for backward compatibility
  position?: WidgetConfig["appearance"]["position"];
  theme?: WidgetConfig["appearance"]["theme"];
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  autoOpen?: boolean;
  openDelay?: number;
  enableSounds?: boolean;
  locale?: string;
}
