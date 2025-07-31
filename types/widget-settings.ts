/**
 * Unified Widget Settings Types
 * Single source of truth for widget configuration types
 */

export interface BusinessHoursSchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedule: {
    monday: BusinessHoursSchedule;
    tuesday: BusinessHoursSchedule;
    wednesday: BusinessHoursSchedule;
    thursday: BusinessHoursSchedule;
    friday: BusinessHoursSchedule;
    saturday: BusinessHoursSchedule;
    sunday: BusinessHoursSchedule;
  };
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  options?: string[]; // for select type
}

export interface AIHandoffTriggers {
  lowConfidenceThreshold: number; // 0-1
  userRequestsHuman: boolean;
  maxAIResponses: number;
  keywords: string[];
}

export interface WidgetSettings {
  // Branding & Appearance
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;

  // Widget Behavior
  welcomeMessage: string;
  placeholderText: string;
  autoOpenDelay: number;
  showTypingIndicator: boolean;
  enableSoundNotifications: boolean;

  // Positioning & Size
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;

  // Business Hours & Availability
  businessHours: BusinessHours;
  offlineMessage: string;

  // Pre-chat Form
  requireEmail: boolean;
  requireName: boolean;
  customFields: CustomField[];

  // AI Settings
  enableAI: boolean;
  aiWelcomeMessage: string;
  aiHandoffTriggers: AIHandoffTriggers;

  // GDPR & Privacy
  showGDPRNotice: boolean;
  gdprNoticeText: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;

  // Advanced Configuration
  customCSS?: string;
  customJS?: string;
  webhookUrl?: string;
  allowFileUploads: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];

  // Metadata
  isActive: boolean;
}

export type WidgetSettingsUpdate = Partial<WidgetSettings>;

// Legacy type for backward compatibility
export interface LegacyWidgetConfig {
  appearance: {
    primaryColor: string;
    position: "bottom-right" | "bottom-left";
    buttonSize: "small" | "medium" | "large";
    welcomeMessage: string;
    placeholderText: string;
  };
  behavior: {
    autoOpenDelay: number;
    soundEnabled: boolean;
    emailRequired: boolean;
    nameRequired: boolean;
    showTypingIndicator: boolean;
    enableFileUploads: boolean;
    maxFileSize: number;
  };
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: Array<{
      dayOfWeek: number;
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    }>;
    outOfOfficeMessage: string;
  };
  security: {
    allowedDomains: string[];
    enableRateLimiting: boolean;
    maxMessagesPerMinute: number;
    requireAuthentication: boolean;
  };
} 