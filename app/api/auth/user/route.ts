import { createErrorResponse, withAuth } from "@/lib/api/unified-auth";
import { applySecurityHeaders } from "@/lib/middleware/securityHeaders";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (request: NextRequest, context, { user, organizationId, scopedClient: supabase }) => {
  try {

    // Get user's organization membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select(
        `
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug,
          settings
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // Use organizationId from auth context or membership
    const userOrgId = organizationId || membership?.organization_id || user.user_metadata?.organization_id;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
        organizationId: userOrgId,
        organizationRole: membership?.role || user.app_metadata?.organization_role || "viewer",
        organization: membership?.organizations,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        user_metadata: user.user_metadata,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        fullName: user.user_metadata?.full_name,
      },
      session: {
        isValid: true,
        expiresAt: user.app_metadata?.expires_at,
      },
    });

    return applySecurityHeaders(response);
  } catch (error) {

    return createErrorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
});

export const POST = withAuth(
  async (request: NextRequest, context, { user, organizationId, scopedClient: supabase }) => {
    try {
      const { action, data } = await request.json();

      switch (action) {
        case "update_profile":
          // Update user profile
          const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            data: {
              ...user.user_metadata,
              ...data,
              updated_at: new Date().toISOString(),
            },
          });

          if (updateError) {
            throw new Error("Failed to update user profile");
          }

          const response = NextResponse.json({
            success: true,
            message: "User profile updated successfully",
            user: updateData.user,
          });

          return applySecurityHeaders(response);

        default:
          return createErrorResponse("Invalid action", 400, "INVALID_ACTION");
      }
    } catch (error) {

      return createErrorResponse((error as Error).message || "Internal server error", 500, "INTERNAL_ERROR");
    }
  }
);
