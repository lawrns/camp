import type { WidgetSettings } from "./widget-settings";

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
 * Widget Configuration
 * Uses unified WidgetSettings from types/widget-settings.ts
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

  // Settings (using unified WidgetSettings)
  settings: WidgetSettings;

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
    settings: WidgetSettings;
  };
}

// Widget session configuration (from /api/widget/config)
export interface WidgetSessionConfig {
  mailboxSlug: string;
  mailboxName: string;
  settings: WidgetSettings;
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
 * Widget embed configuration for client-side usage
 */
export interface WidgetEmbedConfig {
  mailboxSlug: string;
  apiHost?: string;
  config?: Partial<WidgetConfig>;
  settings?: Partial<WidgetSettings>;
  // Legacy properties for backward compatibility
  position?: WidgetSettings["position"];
  theme?: "light" | "dark" | "auto";
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
