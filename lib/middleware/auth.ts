import {
  AUTH_COOKIE_NAMES,
  createSessionCookieValue,
  extractAuthToken,
  getAuthCookieOptions,
} from "@/lib/auth/cookie-utils";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Standardized Authentication Middleware
 * Provides consistent auth validation across all API routes
 */

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthContext;
}

export type AuthenticatedHandler<T = any> = (req: AuthenticatedRequest, context: T) => Promise<NextResponse>;

/**
 * Validates authentication and returns user context
 */
export async function validateAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    // SECURITY: Development bypass removed for production security
    // All authentication must go through proper JWT validation

    // Extract token from cookies using our standardized utility
    const token = extractAuthToken(request);
    if (!token) {
      return null;
    }

    // Validate tokens in production and when not using test bypass

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Verify token and get user
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Get organization context from user metadata or JWT claims
    const organizationId = user.user_metadata?.organization_id || user.app_metadata?.organization_id;

    if (!organizationId) {
      // Try to get from organization members
      const { data: membership } = await supabaseClient
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) {

        return null;
      }

      return {
        userId: user.id,
        organizationId: membership.organization_id,
        role: membership.role,
        email: user.email!,
      };
    }

    // Get user role from organization members
    const { data: member } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!member) {
      // No organization membership bypass - all users must be properly assigned

      return null;
    }

    return {
      userId: user.id,
      organizationId,
      role: member.role,
      email: user.email!,
    };
  } catch (error) {

    return null;
  }
}

/**
 * Higher-order function that wraps API handlers with authentication
 */
export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>,
  options?: {
    allowedRoles?: string[];
    requireOwner?: boolean;
  }
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    const authContext = await validateAuth(req);

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized", message: "Authentication required" }, { status: 401 });
    }

    // Check role permissions if specified
    if (options?.allowedRoles && !options.allowedRoles.includes(authContext.role)) {
      return NextResponse.json({ error: "Forbidden", message: "Insufficient permissions" }, { status: 403 });
    }

    if (options?.requireOwner && authContext.role !== "owner") {
      return NextResponse.json({ error: "Forbidden", message: "Owner access required" }, { status: 403 });
    }

    // Attach user info to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = authContext;

    // Call the original handler
    return handler(authenticatedReq, context);
  };
}

/**
 * Optional authentication middleware (doesn't require auth but provides user if available)
 */
export function withOptionalAuth<T = any>(
  handler: (req: NextRequest & { user?: AuthContext }, context: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    const authContext = await validateAuth(req);

    // Attach optional user info to request
    const requestWithUser = req as NextRequest & { user?: AuthContext };
    if (authContext) {
      requestWithUser.user = authContext;
    }

    // Call the original handler
    return handler(requestWithUser, context);
  };
}

/**
 * Sets authentication cookies with consistent expiration times
 */
export async function setAuthCookies(session: { access_token: string; refresh_token: string; expires_at?: number }) {
  const cookieStore = cookies();
  const authCookieOptions = getAuthCookieOptions();

  // Set access token cookie with consistent 7-day expiration
  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, session.access_token, authCookieOptions);

  // Set refresh token cookie with consistent 7-day expiration (FIXED: was 30 days)
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, session.refresh_token, authCookieOptions);

  // Set combined auth token for backward compatibility
  const sessionData: Parameters<typeof createSessionCookieValue>[0] = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };

  if (session.expires_at !== undefined) {
    sessionData.expires_at = session.expires_at;
  }

  const sessionValue = createSessionCookieValue(sessionData);

  // Use consistent cookie options for auth token
  cookieStore.set(AUTH_COOKIE_NAMES.AUTH_TOKEN, sessionValue, authCookieOptions);
}

/**
 * Clears authentication cookies
 */
export async function clearAuthCookies() {
  const cookieStore = cookies();

  cookieStore.delete(AUTH_COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(AUTH_COOKIE_NAMES.REFRESH_TOKEN);
  cookieStore.delete(AUTH_COOKIE_NAMES.AUTH_TOKEN);

  // Also clear any legacy Supabase cookies
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie: any) => {
    if (cookie.name.includes("sb-") && cookie.name.includes("-auth-token")) {
      cookieStore.delete(cookie.name);
    }
  });
}

/**
 * Refresh authentication tokens
 */
export async function refreshAuth(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return null;
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
    };
  } catch (error) {

    return null;
  }
}

/**
 * Validates organization access
 */
export async function validateOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole?: string
): Promise<boolean> {
  // No development bypasses - all access must be properly validated

  const cookieStore = await cookies();
  const supabaseClient = supabase.server(cookieStore);

  const { data: member } = await supabaseClient
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (!member) {

    return false;
  }

  if (requiredRole) {
    const roleHierarchy = ["viewer", "member", "admin", "owner"];
    const memberRoleIndex = roleHierarchy.indexOf(member.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    return memberRoleIndex >= requiredRoleIndex;
  }

  return true;
}
