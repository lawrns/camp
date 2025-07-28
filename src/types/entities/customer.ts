/**
 * Centralized Customer type definitions
 * Single source of truth for all customer-related types
 */

export type CustomerStatus = "active" | "inactive" | "blocked" | "vip";
export type CustomerChannel = "email" | "chat" | "phone" | "social" | "web";

export interface CustomerMetadata {
  source?: string;
  referrer?: string;
  campaign?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  preferences?: CustomerPreferences;
  [key: string]: any;
}

export interface CustomerPreferences {
  contactMethod?: CustomerChannel;
  language?: string;
  timezone?: string;
  doNotDisturb?: boolean;
  marketingOptIn?: boolean;
}

export interface CustomerMetrics {
  totalConversations?: number;
  totalMessages?: number;
  averageResponseTime?: number;
  satisfactionScore?: number;
  lifetimeValue?: number;
  lastContactDate?: string | Date;
}

/**
 * Core Customer interface
 * Represents a customer/end-user
 */
export interface Customer {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  status?: CustomerStatus;

  // Organization association
  organizationId?: string;
  externalId?: string; // Customer ID in external system

  // Contact information
  alternateEmails?: string[];
  socialProfiles?: {
    platform: string;
    handle: string;
    url?: string;
  }[];

  // Location data
  location?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };

  // Customer data
  company?: string;
  jobTitle?: string;
  industry?: string;
  website?: string;

  // Metrics and analytics
  metrics?: CustomerMetrics;

  // Timestamps
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastSeenAt?: string | Date;
  verifiedAt?: string | Date;

  // Metadata
  metadata?: CustomerMetadata;

  // Legacy support
  customer_email?: string; // Use email instead
  customer_name?: string; // Use name instead
  avatar_url?: string; // Use avatarUrl instead
}

/**
 * Customer profile for detailed views
 */
export interface CustomerProfile extends Customer {
  conversations?: {
    total: number;
    open: number;
    resolved: number;
    recent: Array<{
      id: string;
      subject?: string;
      lastMessageAt: string | Date;
      status: string;
    }>;
  };
  notes?: CustomerNote[];
  attachments?: CustomerAttachment[];
  customFields?: Record<string, any>;
}

/**
 * Customer note
 */
export interface CustomerNote {
  id: string;
  customerId: string;
  authorId: string;
  authorName?: string;
  content: string;
  isPrivate?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

/**
 * Customer attachment
 */
export interface CustomerAttachment {
  id: string;
  customerId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string | Date;
}

/**
 * Customer for list views (optimized)
 */
export interface CustomerListItem {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  lastContactDate?: string | Date;
  totalConversations?: number;
  status?: CustomerStatus;
  tags?: string[];
}

/**
 * Database customer record
 */
export interface CustomerRecord {
  id: string;
  organization_id: string;
  email: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  external_id?: string | null;
  status?: CustomerStatus;
  metadata?: CustomerMetadata;
  created_at: string;
  updated_at: string;
  last_seen_at?: string | null;
  verified_at?: string | null;
}

/**
 * Customer session data (for widget/chat)
 */
export interface CustomerSession {
  customerId?: string;
  sessionId: string;
  visitorId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  currentPage?: string;
  sessionStart: string | Date;
  lastActivity: string | Date;
  pageViews?: number;
  metadata?: Record<string, any>;
}
