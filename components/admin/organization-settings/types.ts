/**
 * OrganizationSettings Types
 *
 * Type definitions for the organization settings system including
 * general settings, billing, branding, and member management.
 */

import type { Database } from "@/types/supabase";

export type Org = Database["public"]["Tables"]["organizations"]["Row"];

export interface OrganizationData {
  general: {
    name: string;
    description: string;
    website: string;
    size: string;
    timezone: string;
    language: string;
    currency: string;
    logo?: string;
  };
  contact: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
  };
  billing: {
    plan: string;
    seats: number;
    usedSeats: number;
    billingCycle: string;
    nextBilling: Date;
    paymentMethod: string;
    invoiceEmail: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    customDomain?: string;
    whiteLabel: boolean;
  };
  features: {
    aiAssistant: boolean;
    knowledgeBase: boolean;
    analytics: boolean;
    integrations: boolean;
    customFields: boolean;
    apiAccess: boolean;
    sso: boolean;
    auditLogs: boolean;
  };
}

export interface OrganizationSettingsProps {
  organization?: OrganizationData;
  onUpdate?: (updates: Partial<OrganizationData>) => void;
}

export interface Member {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatar?: string;
  joinedAt?: Date;
  lastActive?: Date;
  status?: "active" | "pending" | "inactive";
}

export interface InviteData {
  email: string;
  role: string;
  message?: string;
}

export interface BillingInfo {
  plan: string;
  seats: number;
  usedSeats: number;
  billingCycle: "monthly" | "yearly";
  nextBilling: Date;
  paymentMethod: string;
  invoiceEmail: string;
  amount: number;
  currency: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  whiteLabel: boolean;
  customCss?: string;
  emailTemplate?: string;
}

export interface FeatureFlags {
  aiAssistant: boolean;
  knowledgeBase: boolean;
  analytics: boolean;
  integrations: boolean;
  customFields: boolean;
  apiAccess: boolean;
  sso: boolean;
  auditLogs: boolean;
  advancedReporting: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
}

export interface GeneralSettings {
  name: string;
  description: string;
  website: string;
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  timezone: string;
  language: string;
  currency: string;
  logo?: string;
  industry?: string;
  foundedYear?: number;
}

export interface ContactInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  supportEmail?: string;
  salesEmail?: string;
}

// Utility types for form handling
export type SettingsSection = keyof OrganizationData;
export type SettingsUpdateHandler = (section: SettingsSection, key: string, value: unknown) => void;

// Constants
export const ORGANIZATION_SIZES = [
  { value: "startup", label: "Startup (1-10 employees)" },
  { value: "small", label: "Small (11-50 employees)" },
  { value: "medium", label: "Medium (51-200 employees)" },
  { value: "large", label: "Large (201-1000 employees)" },
  { value: "enterprise", label: "Enterprise (1000+ employees)" },
] as const;

export const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const MEMBER_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
] as const;

export const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Australia/Sydney", label: "Sydney" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
] as const;

export const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
] as const;

// Feature descriptions for help text
export const FEATURE_DESCRIPTIONS: Record<keyof FeatureFlags, string> = {
  aiAssistant: "AI-powered assistance for customer support and automation",
  knowledgeBase: "Create and manage a comprehensive knowledge base",
  analytics: "Advanced analytics and reporting capabilities",
  integrations: "Connect with third-party tools and services",
  customFields: "Create custom fields for conversations and contacts",
  apiAccess: "Full REST API access for custom integrations",
  sso: "Single Sign-On integration with your identity provider",
  auditLogs: "Comprehensive audit logging for security and compliance",
  advancedReporting: "Advanced reporting with custom dashboards",
  customBranding: "White-label branding and custom domains",
  prioritySupport: "Priority customer support with dedicated assistance",
};
