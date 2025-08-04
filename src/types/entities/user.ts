/**
 * Centralized User type definitions
 * Single source of truth for all user-related types
 */

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "owner" | "admin" | "agent" | "member" | "viewer";
export type UserStatus = "online" | "away" | "busy" | "offline";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  bio?: string;
  metadata?: Record<string, any>;
}

/**
 * Core User interface
 * Extends Supabase User with additional application-specific fields
 */
export interface User extends SupabaseUser {
  organizationId?: string;
  organizationRole?: UserRole;
  profile?: UserProfile;
  status?: UserStatus;
  lastSeenAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Application User (for internal use)
 * Used for displaying user information in the UI
 */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  lastSeenAt?: string | Date;
  isOnline?: boolean;

  // Agent-specific fields
  workload?: number;
  currentConversations?: number;
  maxConversations?: number;
  expertise?: string[];

  // Legacy support
  avatar?: string; // Use avatarUrl instead
  avatar_url?: string; // Use avatarUrl instead
}

/**
 * User authentication state
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Authentication error
 */
export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: "light" | "dark" | "auto";
  notifications?: {
    email?: boolean;
    desktop?: boolean;
    sound?: boolean;
    vibrate?: boolean;
  };
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: "12h" | "24h";
}

/**
 * Database profile type
 */
export interface ProfileRecord {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  role: UserRole;
  organization_id?: string | null;
  status?: UserStatus;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Organization member (user within organization context)
 */
export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  user: AppUser;
  joinedAt: string | Date;
  invitedBy?: string;
  permissions?: string[];
}

/**
 * User session data
 */
export interface UserSession {
  user: User;
  session: Session;
  organizationId?: string;
  permissions?: string[];
  preferences?: UserPreferences;
}
