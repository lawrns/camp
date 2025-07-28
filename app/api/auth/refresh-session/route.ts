/**
 * Session Refresh API Endpoint
 *
 * Handles session refresh requests with security validation
 * and audit logging
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/unified-auth";
import { withAuditLogging, AuditConfigs } from "@/lib/middleware/audit-middleware";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response-utils";
import { supabase } from "@/lib/supabase/consolidated-exports";

// POST /api/auth/refresh-session - Refresh user session
export const POST = withAuditLogging(
  withAuth(async (req: NextRequest, context, { user, organizationId, scopedClient }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { reason = "manual", extendBy } = body;

      // Validate user session
      if (!user || !user.id) {
        return createErrorResponse("Invalid session", 401, "INVALID_SESSION");
      }

      // Get current user info (more secure than getSession)
      const adminClient = supabase.admin();
      const {
        data: { user: currentUser },
        error: userError,
      } = await adminClient.auth.getUser();

      if (userError || !currentUser) {
        return createErrorResponse("User not found", 401, "USER_NOT_FOUND");
      }

      // Check if session is still valid
      const now = new Date();
      const sessionExpiry = new Date(session.expires_at || 0);

      if (sessionExpiry <= now) {
        return createErrorResponse("Session already expired", 401, "SESSION_EXPIRED");
      }

      // Refresh the session
      const { data: refreshData, error: refreshError } = await adminClient.auth.refreshSession();

      if (refreshError || !refreshData.session) {

        return createErrorResponse("Failed to refresh session", 500, "REFRESH_FAILED");
      }

      // Update user's last activity
      const { error: updateError } = await scopedClient
        .from("profiles")
        .update({
          last_activity: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {

        // Don't fail the request for this
      }

      // Calculate new expiry time
      const newExpiry = new Date(refreshData.session.expires_at || 0);
      const timeExtended = newExpiry.getTime() - sessionExpiry.getTime();

      // Log session refresh for security monitoring
      const auditDetails = {
        reason,
        previous_expiry: sessionExpiry.toISOString(),
        new_expiry: newExpiry.toISOString(),
        time_extended_ms: timeExtended,
        user_agent: req.headers.get("user-agent"),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        session_id: refreshData.session.access_token.slice(-8), // Last 8 chars for identification
      };

      return createSuccessResponse({
        message: "Session refreshed successfully",
        session: {
          expires_at: refreshData.session.expires_at,
          expires_in: refreshData.session.expires_in,
          access_token: refreshData.session.access_token,
          refresh_token: refreshData.session.refresh_token,
        },
        user: refreshData.user,
        extended_by_ms: timeExtended,
        new_expiry: newExpiry.toISOString(),
      });
    } catch (error) {

      return createErrorResponse(
        `Failed to refresh session: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "INTERNAL_ERROR"
      );
    }
  }),
  {
    action: "auth.refresh_session",
    resourceType: "auth",
    detailsExtractor: (req, params, body) => ({
      reason: body?.reason || "manual",
      extend_by: body?.extendBy,
      user_agent: req?.headers.get("user-agent"),
      ip_address: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip"),
    }),
  }
);

// GET /api/auth/refresh-session - Get session status
export const GET = withAuth(async (req: NextRequest, { params }, { user, organizationId, scopedClient }) => {
  try {
    // Get current user info (more secure than getSession)
    const adminClient = supabase.admin();
    const {
      data: { user: currentUser },
      error: userError,
    } = await adminClient.auth.getUser();

    if (userError || !currentUser) {
      return createErrorResponse("User not found", 401, "USER_NOT_FOUND");
    }

    const now = new Date();
    // For user-based auth, we'll use a default session duration
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const userCreatedAt = new Date(currentUser.created_at);
    const sessionExpiry = new Date(userCreatedAt.getTime() + sessionDuration);
    const timeRemaining = sessionExpiry.getTime() - now.getTime();
    const isExpired = sessionExpiry <= now;

    // Get user's last activity
    const { data: profile } = await scopedClient
      .from("profiles")
      .select("last_activity, created_at")
      .eq("id", user.id)
      .single();

    const lastActivity = profile?.last_activity ? new Date(profile.last_activity) : new Date(profile?.created_at || 0);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();

    return createSuccessResponse({
      session_status: {
        is_valid: !isExpired,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        time_remaining_ms: Math.max(0, timeRemaining),
        time_remaining_formatted: formatDuration(timeRemaining),
        is_expired: isExpired,
        last_activity: lastActivity.toISOString(),
        time_since_activity_ms: timeSinceActivity,
        time_since_activity_formatted: formatDuration(timeSinceActivity),
        should_warn: timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0, // 5 minutes
        should_refresh: timeRemaining <= 2 * 60 * 1000 && timeRemaining > 0, // 2 minutes
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_activity: lastActivity.toISOString(),
      },
    });
  } catch (error) {

    return createErrorResponse(
      `Failed to get session status: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
