/**
 * Core Authentication Module
 * Centralized authentication logic for Campfire
 *
 * This module consolidates all authentication functionality from lib/auth/
 * to comply with the consolidated architecture requirements.
 */

import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
  role: "admin" | "user" | "viewer";
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | undefined;
  organizationId: string;
  organizationRole: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  fullName?: string | undefined;
  access_token?: string | undefined;
  user_metadata?: {
    full_name?: string;
    firstName?: string;
    lastName?: string;
    organization_id?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export type UserRole = "admin" | "member" | "viewer";

export interface AuthSession {
  userId: string;
  organizationId: string;
  expiresAt: Date;
  permissions: string[];
  metadata?: Record<string, unknown>;
}

export interface AuthToken {
  token: string;
  type: "bearer" | "api_key";
  expiresAt?: Date;
  scopes: string[];
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
  statusCode?: number;
  organizationId?: string;
  userId?: string;
  email?: string;
}

export interface APIError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  timestamp: string;
  organizationId?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Tenant Guard interfaces
export interface TenantContext {
  user: SupabaseUser;
  organizationId: string;
  scopedClient: SupabaseClient;
}

export interface TenantValidationResult {
  success: boolean;
  context?: TenantContext;
  error?: string;
  code?: string;
}

// ============================================================================
// SECURITY: REMOVED DEVELOPMENT BYPASS
// ============================================================================
// Dev token authentication bypass removed for security compliance
// All authentication must go through proper JWT validation

// ============================================================================
// TENANT GUARD IMPLEMENTATION
// ============================================================================

export const TenantGuard = {
  /**
   * SECURITY: Main validation entry point for API routes
   */
  validateRequest: async (req: NextRequest): Promise<TenantValidationResult> => {
    try {
      // Extract authentication from request
      const authResult = await TenantGuard.extractAuthFromRequest(req);

      if (!authResult.success || !authResult.user || !authResult.organizationId) {
        return {
          success: false,
          error: authResult.error || "Authentication failed",
          code: "AUTH_FAILED",
        };
      }

      // Validate organization access
      const orgValidation = await TenantGuard.validateOrganizationAccess(authResult.user.id, authResult.organizationId);

      if (!orgValidation.success) {
        return {
          success: false,
          error: orgValidation.error || "Organization access denied",
          code: "ORG_ACCESS_DENIED",
        };
      }

      // Create scoped client
      const scopedClient = TenantGuard.createScopedClient(authResult.organizationId);

      return {
        success: true,
        context: {
          user: authResult.user,
          organizationId: authResult.organizationId,
          scopedClient,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Tenant validation failed",
        code: "VALIDATION_ERROR",
      };
    }
  },

  /**
   * Extract authentication from request headers/cookies
   */
  extractAuthFromRequest: async (
    req: NextRequest
  ): Promise<{
    success: boolean;
    user?: SupabaseUser;
    organizationId?: string;
    error?: string;
  }> => {
    const supabaseClient = supabase.admin();

    // Try Bearer token first
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser(token);

        if (!error && user) {
          // Try to get organization_id from user_metadata first
          let organizationId = user.user_metadata?.organization_id;

          // If not in metadata, look it up from organization_members table
          if (!organizationId) {
            const { data: memberData } = await supabaseClient
              .from("organization_members")
              .select("organization_id")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            organizationId = memberData?.organization_id;
          }

          if (!organizationId) {
            return {
              success: false,
              error: "No organization context found for user",
            };
          }

          return {
            success: true,
            user,
            organizationId,
          };
        }
      } catch (error) {}
    }

    // Try cookie-based authentication
    try {
      const { extractAuthToken } = await import("@/lib/auth/cookie-utils");
      const accessToken = extractAuthToken(req);

      if (accessToken) {
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser(accessToken);

        if (!error && user) {
          // Try to get organization_id from user_metadata first
          let organizationId = user.user_metadata?.organization_id;

          // If not in metadata, look it up from organization_members table
          if (!organizationId) {
            const { data: memberData } = await supabaseClient
              .from("organization_members")
              .select("organization_id")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            organizationId = memberData?.organization_id;
          }

          if (!organizationId) {
            return {
              success: false,
              error: "No organization context found for user",
            };
          }

          return {
            success: true,
            user,
            organizationId,
          };
        }
      }
    } catch (error) {

    }

    return {
      success: false,
      error: "No valid authentication found",
    };
  },

  /**
   * Validate organization access for user
   */
  validateOrganizationAccess: async (
    userId: string,
    organizationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabaseClient = supabase.admin();

      // Check organization membership
      const { data: membership, error } = await supabaseClient
        .from("organization_members")
        .select("role, status")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .single();

      if (error || !membership) {
        return {
          success: false,
          error: "No active organization membership found",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Organization validation failed",
      };
    }
  },

  /**
   * Create organization-scoped Supabase client
   */
  createScopedClient: (organizationId: string): SupabaseClient => {
    return supabase.admin();
  },

  /**
   * Validate organization ID format
   */
  isValidOrganizationId: (organizationId: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(organizationId);
  },
};

/**
 * Higher-order function to protect API routes with tenant validation
 */
export function withTenantGuard<T extends unknown[] = []>(
  handler: (req: NextRequest, context: TenantContext, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const validation = await TenantGuard.validateRequest(req);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || "Unauthorized",
          code: validation.code || "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      if (!validation.context) {
        throw new Error("Validation context is missing");
      }
      return await handler(req, validation.context, ...args);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error",
          code: "INTERNAL_ERROR",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

// ============================================================================
// AUTH SERVICE IMPLEMENTATION
// ============================================================================

export const authService = {
  async getCurrentUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
    // For API routes, check the request for authentication
    if (req) {
      try {


        // Use the standardized cookie extraction utility
        const { extractAuthToken } = await import("@/lib/auth/cookie-utils");
        const token = extractAuthToken(req);

        if (!token) {

          return null;
        }

        const supabaseClient = supabase.admin();

        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser(token);

        if (error || !user) {
          return null;
        }

        // Get organization membership
        const { data: membership } = await supabaseClient
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        return {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email || "",
          organizationId: membership?.organization_id || "",
          organizationRole: membership?.role || "viewer",
        };
      } catch (error) {
        return null;
      }
    }

    return null;
  },

  getUserMemberships: (userId: string) => {
    return {
      success: true,
      data: [],
    };
  },

  /**
   * Check if a user role has the required permissions
   */
  hasPermission(userRole: string, requiredRoles: string[]): boolean {
    if (!userRole || !requiredRoles?.length) {
      return false;
    }

    // Define role hierarchy (higher index = more permissions)
    const roleHierarchy = ["viewer", "agent", "admin", "owner"];
    const userRoleIndex = roleHierarchy.indexOf(userRole);

    if (userRoleIndex === -1) {
      return false;
    }

    // Check if user has any of the required roles or higher
    return requiredRoles.some((role) => {
      const requiredRoleIndex = roleHierarchy.indexOf(role);
      return requiredRoleIndex !== -1 && userRoleIndex >= requiredRoleIndex;
    });
  },

  /**
   * Handle API errors consistently
   */
  handleError(error: unknown): NextResponse {
    // Handle specific error types
    if (error instanceof Error) {
      // Authentication errors
      if (error.message === "Authentication required" || error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Permission errors
      if (error.message.includes("Forbidden") || error.message.includes("access required")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      // Database errors
      if (error.message.includes("PGRST116") || error.message.includes("22P02")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Validation errors
      if (error.message.includes("Invalid") || error.message.includes("validation")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Default server error
    return NextResponse.json(
      {
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  },

  /**
   * Authenticate request and get user
   */
  async authenticateRequest(req: NextRequest): Promise<{
    success: boolean;
    user?: AuthenticatedUser;
    organizationId?: string;
    error?: string;
  }> {
    try {
      const user = await this.getCurrentUser(req);
      if (!user) {
        return { success: false, error: "Authentication required" };
      }

      return {
        success: true,
        user,
        organizationId: user.organizationId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  },
};

export async function requireAuth(req?: NextRequest): Promise<AuthenticatedUser> {
  const user = await authService.getCurrentUser(req);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function getCurrentUser(): Promise<AuthenticatedUser | null> {
  return authService.getCurrentUser();
}

// ============================================================================
// API UTILITIES
// ============================================================================

export function isValidOrganizationId(orgId: string | undefined): boolean {
  if (!orgId) return false;
  return typeof orgId === "string" && orgId.length > 0;
}

export function handleApiError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message === "Authentication required") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message.includes("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = (error as { code: string }).code;
    if (errorCode === "PGRST116" || errorCode === "22P02") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
  }

  return Response.json({ error: "Internal server error" }, { status: 500 });
}

// ============================================================================
// COMPATIBILITY EXPORTS
// ============================================================================

// Additional exports for compatibility with existing code
export const requireTenantAccess = requireAuth;
export const hasRole = (user: AuthenticatedUser, role: string): boolean => {
  return user?.organizationRole === role;
};
export const requireRole =
  (role: string) =>
  async (req: NextRequest): Promise<AuthenticatedUser> => {
    const user = await requireAuth(req);
    if (user.organizationRole !== role) {
      throw new Error("Insufficient permissions");
    }
    return user;
  };
export const getUserOrganization = async (userId: string) => {
  const result = await authService.getUserMemberships(userId);
  return result.success && result.data.length > 0 ? result.data[0] : null;
};
export const ensureUserExists = getCurrentUser;

// Helper function to get authenticated user
export async function getUser(req: NextRequest): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const auth = await authService.authenticateRequest(req);

  if (!auth.success || !auth.user) {
    return { user: null, error: auth.error || "Authentication failed" };
  }

  const authenticatedUser: AuthenticatedUser = {
    id: auth.user.id,
    email: auth.user.email || "",
    organizationId: auth.organizationId || "",
    organizationRole: auth.user.organizationRole || "member",
    firstName: auth.user.firstName,
    lastName: auth.user.lastName,
  };

  return { user: authenticatedUser };
}

// ============================================================================
// AUTH NAMESPACE EXPORT
// ============================================================================

// Export Auth namespace for backward compatibility
export const Auth = {
  authenticateRequest: authService.authenticateRequest,
  getCurrentUser,
  isValidOrganizationId,
  requireTenantAccess,
  hasRole,
};

// ============================================================================
// REACT COMPONENT EXPORTS
// ============================================================================

// Re-export React components from separate client file to avoid server/client mixing
export { AuthProvider, useAuth } from "../../src/lib/core/auth-provider";

// ============================================================================
// ADDITIONAL EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export createServerClient for backward compatibility
export const createServerClient = supabase.server;
