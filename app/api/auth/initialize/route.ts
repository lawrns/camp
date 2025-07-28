import { createErrorResponse, withAuth } from "@/lib/api/unified-auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Initialize user session with organization context
 * This endpoint ensures users have proper organization assignment
 */
export const POST = withAuth(async (request: NextRequest, context, { user, organizationId, scopedClient }) => {
  try {
    // If user already has organizationId, we're good
    if (organizationId) {
      return NextResponse.json({
        success: true,
        message: "User already initialized",
        organizationId,
      });
    }

    // Check if user has an organization membership
    const { data: membership } = await scopedClient
      .from("organization_members")
      .select("organization_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      // For now, return error. In future, could auto-create organization
      return createErrorResponse(
        "No organization membership found. Please contact support.",
        403,
        "NO_ORGANIZATION"
      );
    }

    // Update user metadata with organization context
    const adminClient = supabase.admin();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        organization_id: membership.organization_id,
      },
      app_metadata: {
        ...user.app_metadata,
        organization_id: membership.organization_id,
        organization_role: membership.role,
      },
    });

    if (updateError) {
      console.error("Failed to update user metadata:", updateError);
      return createErrorResponse(
        "Failed to initialize user session",
        500,
        "UPDATE_FAILED"
      );
    }

    return NextResponse.json({
      success: true,
      message: "User initialized successfully",
      organizationId: membership.organization_id,
      role: membership.role,
    });
  } catch (error) {
    console.error("User initialization error:", error);
    return createErrorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
});