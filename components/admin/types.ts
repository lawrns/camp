/**
 * Type definitions for admin components
 */

export interface WidgetConfig {
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

export type WidgetConfigSection = keyof WidgetConfig;

export type UpdateConfigFunction<T extends WidgetConfigSection> = (section: T, key: string, value: any) => void;

export interface BusinessHourUpdate {
  (dayIndex: number, field: keyof WidgetConfig["businessHours"]["schedule"][0], value: string | number | boolean): void;
}

export interface OrganizationSetting {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  type: "string" | "number" | "boolean" | "json";
  category: "general" | "billing" | "notifications" | "security" | "integrations";
  description?: string;
}

export interface OrganizationSettings {
  general: {
    name: string;
    logo?: string;
    website?: string;
    description?: string;
    timezone?: string;
    language?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
  billing: {
    plan: "free" | "starter" | "pro" | "enterprise";
    billingEmail?: string;
    autoRenew: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    webhookUrl?: string;
    marketingEmails?: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    ipWhitelist: string[];
    ssoEnabled: boolean;
  };
  integrations: {
    slack?: {
      enabled: boolean;
      webhookUrl?: string;
    };
    zapier?: {
      enabled: boolean;
      apiKey?: string;
    };
  };
  appearance?: {
    logoUrl?: string;
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    fontFamily?: "inter" | "roboto" | "open-sans" | "montserrat" | "lato";
  };
}
