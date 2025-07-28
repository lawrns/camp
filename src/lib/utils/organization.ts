/**
 * Organization utilities for multi-tenant support
 * Provides functions to get user's organization context
 */

import { supabase } from "@/lib/supabase";
import { circuitBreakers } from "./circuit-breaker";

export interface UserOrganization {
  organizationId: string;
  mailboxId: number;
  role: "owner" | "admin" | "agent" | "viewer";
  status: "active" | "inactive" | "pending";
}

export class OrganizationError extends Error {
  constructor(
    message: string,
    public code: "NO_USER" | "NO_ORG" | "NO_MEMBERSHIP" | "ERROR"
  ) {
    super(message);
    this.name = "OrganizationError";
  }
}

// Cache for organization IDs to prevent repeated database calls
const orgIdCache = new Map<string, { orgId: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const QUERY_TIMEOUT = 10000; // 10 seconds

/**
 * Create a timeout promise for database queries
 */
function createTimeoutPromise(timeout: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new OrganizationError(`${operation} timed out after ${timeout}ms`, "ERROR"));
    }, timeout);
  });
}

/**
 * Get the user's primary organization ID from their profile or organization membership
 * Throws error if no organization found - no more fallbacks!
 * Uses caching to prevent memory leaks from repeated calls
 * Now includes timeout protection to prevent infinite loading
 */
export async function getUserOrganizationId(organizationId: string, userId?: string): Promise<string> {
  if (!userId) {
    throw new OrganizationError("User ID is required to get organization", "NO_USER");
  }

  // Check cache first
  const cached = orgIdCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.orgId;
  }

  // Use circuit breaker for database operations
  return circuitBreakers.database.execute(async () => {
    const supabaseClient = supabase.admin();

    try {
      // Reduced logging to prevent memory issues

      // First, try to get organization from user profile with timeout
      const profilePromise = supabaseClient
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        createTimeoutPromise(QUERY_TIMEOUT, "Profile query"),
      ]);

      if (!profileError && profile?.organization_id) {
        // Cache the result
        orgIdCache.set(userId, { orgId: profile.organization_id, timestamp: Date.now() });
        return profile.organization_id;
      }

      // If no profile organization, try organization_members table with timeout
      const membershipsPromise = supabaseClient
        .from("organization_members")
        .eq("organization_id", organizationId)
        .select("organization_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: memberships, error: membershipError } = await Promise.race([
        membershipsPromise,
        createTimeoutPromise(QUERY_TIMEOUT, "Membership query"),
      ]);

      // Handle array response
      if (!membershipError && memberships && memberships.length > 0) {
        const orgId = memberships[0].organization_id;
        // Cache the result
        orgIdCache.set(userId, { orgId, timestamp: Date.now() });
        return orgId;
      }

      // No organization found - throw error instead of using fallback

      throw new OrganizationError("No organization found for user", "NO_ORG");
    } catch (error) {
      if (error instanceof OrganizationError && error.message.includes("timed out")) {
      } else {
      }
      // Re-throw the error - no more fallbacks
      throw error;
    }
  });
}

// Clean up cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, cached] of orgIdCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      orgIdCache.delete(userId);
    }
  }
}, CACHE_DURATION);

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(organizationId: string, userId: string): Promise<UserOrganization[]> {
  const supabaseClient = supabase.admin();

  try {
    const { data: memberships, error } = await supabaseClient
      .from("organization_members")
      .eq("organization_id", organizationId)
      .select("organization_id, mailbox_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return memberships.map((membership: any) => ({
      organizationId: membership.organization_id,
      mailboxId: membership.mailbox_id,
      role: membership.role as "owner" | "admin" | "agent" | "viewer",
      status: membership.status as "active" | "inactive" | "pending",
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Check if user has access to a specific organization
 */
export async function hasOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const supabaseClient = supabase.admin();

  try {
    const { data: membership, error } = await supabaseClient
      .from("organization_members")
      .eq("organization_id", organizationId)
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .single();

    return !error && !!membership;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new organization for a user
 */
export async function createOrganization(
  organizationId: string,
  userId: string,
  name: string,
  metadata?: Record<string, any>
): Promise<string> {
  const supabaseClient = supabase.admin();

  try {
    const { data: org, error: orgError } = await supabaseClient
      .from("organizations")
      .insert({
        name,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error("Failed to create organization");
    }

    // Add user as owner
    const { error: memberError } = await supabaseClient.from("organization_members").insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
      status: "active",
      mailbox_id: 1,
    });

    if (memberError) {
      throw new Error("Failed to add user to organization");
    }

    // Update user profile
    await supabaseClient.from("profiles").update({ organization_id: org.id }).eq("user_id", userId);

    return org.id;
  } catch (error) {
    throw error;
  }
}
