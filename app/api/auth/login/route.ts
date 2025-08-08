import { createErrorResponse, withPublic } from "@/lib/api/unified-auth";
import { authLoginRateLimit } from "@/lib/middleware/restRateLimit";
import { applySecurityHeaders, generateCsrfToken } from "@/lib/middleware/securityHeaders";
import { NextRequest, NextResponse } from "next/server";

// Organization member with joined organization data
interface OrganizationMembershipResponse {
  organization_id: string;
  role: string;
  organizations: {
    name: string;
  } | null;
}

// Type for metadata updates
interface UserMetadataUpdate {
  organization_id?: string;
  [key: string]: unknown;
}

interface AppMetadataUpdate {
  organization_id?: string;
  organization_name?: string;
  organization_role?: string;
  [key: string]: unknown;
}

export const POST = withPublic(async (request: NextRequest) => {
  // Apply strict rate limiting for login (5 attempts/min)
  const rateLimitResponse = authLoginRateLimit(request, async () => NextResponse.next());
  if (rateLimitResponse instanceof NextResponse && rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return createErrorResponse("Email and password are required", 400, "MISSING_CREDENTIALS");
    }

    // Get cookies for server-side session management
    const { cookies } = await import("next/headers");
    const { supabase } = await import("@/lib/supabase");
    const { AUTH_COOKIE_NAMES, getCookieOptions, createSessionCookieValue } = await import("@/lib/auth/cookie-utils");
    const cookieStore = await cookies();

    // Debug: Received credentials

    // Get request metadata for audit logging
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create server client with cookie handling
    const supabaseClient = supabase.server(cookieStore);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    // Debug: Supabase response

    if (error) {

      // Audit log failed login attempt
      try {
        const { auditLog, AuditEventType, AuditSeverity } = await import("@/lib/security/audit-logging");
        await auditLog(AuditEventType.LOGIN_FAILURE, "Login attempt failed", {
          severity: AuditSeverity.HIGH,
          actor: {
            ipAddress,
            userAgent,
          },
          outcome: "failure",
          details: {
            email,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (_auditError) {

      }

      return createErrorResponse(error.message, 401, "AUTH_FAILED");
    }

    // Debug: User authenticated, ID:
    if (data.user) {
      try {
        // Get user's organization from organization_members table
        const { data: membership } = await supabaseClient
          .from("organization_members")
          .select("organization_id, role, organizations(name)")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .single() as { data: OrganizationMembershipResponse | null };

        if (membership) {
          // Update user metadata with organization context
          const adminClient = supabase.admin();
          const userMetadata: UserMetadataUpdate = {
            ...(data.user.user_metadata || {}),
            organization_id: membership.organization_id,
          };
          
          const appMetadata: AppMetadataUpdate = {
            ...(data.user.app_metadata || {}),
            organization_id: membership.organization_id,
            organization_name: membership.organizations?.name || null,
            organization_role: membership.role,
          };
          
          const { error: updateError } = await adminClient.auth.admin.updateUserById(data.user.id, {
            user_metadata: userMetadata,
            app_metadata: appMetadata,
          });
          
          if (updateError) {
            console.error("Failed to update user metadata:", updateError);
          }

          // Audit log successful login with organization context
          try {
            const { auditLog, AuditEventType, AuditSeverity } = await import("@/lib/security/audit-logging");
            await auditLog(AuditEventType.LOGIN_SUCCESS, "User logged in successfully", {
              severity: AuditSeverity.MEDIUM,
              actor: {
                userId: data.user.id,
                ipAddress,
                userAgent,
                organizationId: membership.organization_id,
              },
              outcome: "success",
              details: {
                email: data.user.email,
                organizationName: membership.organizations?.name || null,
                organizationRole: membership.role,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (_auditError) {

          }
        }
      } catch (_orgError) {
        // Don't fail login if organization context fails
      }
    }

    // Create NextResponse with session data
    // Include organization context in the user object
    const userWithOrg = {
      ...data.user,
      user_metadata: {
        ...data.user.user_metadata,
        organization_id: data.user.user_metadata?.organization_id || data.user.app_metadata?.organization_id,
      },
      app_metadata: {
        ...data.user.app_metadata,
      }
    };
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: userWithOrg,
        session: data.session,
      },
    });

    // PHASE 0 HOTFIX: Set auth cookies with atomic operations and consistent expiration
    if (data.session) {
      // Use consistent 7-day expiration for all auth cookies to prevent desync
      const cookieExpiration = 60 * 60 * 24 * 7; // 7 days for all cookies

      // Set HTTP-only cookies for server-side API calls
      response.cookies.set(
        AUTH_COOKIE_NAMES.ACCESS_TOKEN,
        data.session.access_token,
        getCookieOptions(cookieExpiration)
      );

      response.cookies.set(
        AUTH_COOKIE_NAMES.REFRESH_TOKEN,
        data.session.refresh_token,
        getCookieOptions(cookieExpiration) // Fixed: Same expiration as access token
      );

      // Set simplified auth token cookie that works everywhere
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expiresAt: data.session.expiresAt || Math.floor(Date.now() / 1000) + 3600, // Default to 1 hour from now
        token_type: data.session.token_type,
        user: data.user,
      };

      response.cookies.set(AUTH_COOKIE_NAMES.AUTH_TOKEN, createSessionCookieValue(sessionData), {
        ...getCookieOptions(cookieExpiration),
        httpOnly: false, // Allow browser access for Supabase client
      });

      // Also set Supabase-compatible cookie for backward compatibility
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
        if (projectRef) {
          response.cookies.set(`sb-${projectRef}-auth-token`, createSessionCookieValue(sessionData), {
            ...getCookieOptions(cookieExpiration), // Fixed: Consistent expiration
            httpOnly: false, // Allow browser access
          });
        }
      }

      // PHASE 0 HOTFIX: Generate CSRF token for authenticated session
      const sessionId = `${data.user.id}_${Date.now()}`;
      const csrfToken = generateCsrfToken(sessionId);

      // Add CSRF token to response for client-side use
      response.headers.set("X-CSRF-Token", csrfToken);
      response.headers.set("X-Session-ID", sessionId);

      // Audit log successful login
      try {
        const { auditLog, AuditEventType, AuditSeverity } = await import("@/lib/security/audit-logging");
        await auditLog(AuditEventType.LOGIN_SUCCESS, "User logged in successfully", {
          severity: AuditSeverity.MEDIUM,
          actor: {
            userId: data.user.id,
            ipAddress,
            userAgent,
            organizationId: data.user.app_metadata?.organization_id,
          },
          outcome: "success",
          details: {
            email: data.user.email,
            organizationName: data.user.app_metadata?.organization_name,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (_auditError) {

      }
    }

    return applySecurityHeaders(response);
  } catch (_error) {
    return createErrorResponse("Invalid request", 400, "INVALID_REQUEST");
  }
});
