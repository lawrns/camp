import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/unified-auth";
import type { GetUserAvailableOrganizationsResult, SetActiveOrganizationResult } from "@/types/database-extensions";

// Request validation schema
const SetOrganizationSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
});

// Response types
interface SetOrganizationSuccess {
  success: true;
  organization: {
    id: string;
    name: string;
    role: string;
  };
  message: string;
}

interface SetOrganizationError {
  success: false;
  error: string;
}

type SetOrganizationResponse = SetOrganizationSuccess | SetOrganizationError;

/**
 * POST /api/auth/set-organization
 *
 * Sets the user's active organization context by updating their JWT claims.
 * This enables proper RLS policy evaluation for organization-scoped resources.
 *
 * @param request - Contains organizationId in the request body
 * @returns Updated organization context or error
 */
export const POST = withAuth(async (request: NextRequest, { params }, { user, organizationId, scopedClient }) => {
  try {
    const userId = user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = SetOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: "Invalid request: " + validation.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { organizationId: targetOrgId } = validation.data;

    // Call the database function to set active organization using the scoped client
    // Note: This function returns a boolean, not a structured object
    const { data: isSuccess, error } = (await scopedClient.rpc("set_user_active_organization", {
      org_id: targetOrgId,
    })) as { data: boolean | null; error: any };

    if (error) {
      console.error('[set-organization] Database function error:', error);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: `Failed to update organization context: ${error.message || 'Unknown database error'}`,
        },
        { status: 500 }
      );
    }

    // Check if the function returned false (user doesn't have access)
    if (!isSuccess) {
      console.warn('[set-organization] Function returned false - user may not have access to organization:', targetOrgId);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: "Failed to set organization - user may not have access to this organization",
        },
        { status: 403 }
      );
    }

    // Function returned true, now fetch organization details to construct the response
    const { data: orgDetails, error: orgError } = await scopedClient
      .from('organizations')
      .select('id, name')
      .eq('id', targetOrgId)
      .single();

    if (orgError || !orgDetails) {
      console.error('[set-organization] Failed to fetch organization details:', orgError);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: "Organization was set but failed to fetch details",
        },
        { status: 500 }
      );
    }

    // Fetch user's role in the organization
    const { data: memberDetails, error: memberError } = await scopedClient
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', targetOrgId)
      .single();

    if (memberError || !memberDetails) {
      console.error('[set-organization] Failed to fetch member details:', memberError);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: "Organization was set but failed to fetch user role",
        },
        { status: 500 }
      );
    }

    // Log successful organization switch (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[set-organization] Successfully set organization:', {
        userId,
        organizationId: targetOrgId,
        organizationName: orgDetails.name,
        role: memberDetails.role
      });
    }

    // Return success response with fetched details
    return NextResponse.json<SetOrganizationSuccess>(
      {
        success: true,
        organization: {
          id: orgDetails.id,
          name: orgDetails.name,
          role: memberDetails.role,
        },
        message: "Organization set successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[set-organization] Unexpected error:', error);
    return NextResponse.json<SetOrganizationError>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/auth/set-organization
 *
 * Gets the user's available organizations and current active organization.
 *
 * @returns List of organizations the user can switch to
 */
export const GET = withAuth(async (request: NextRequest, context, { user, organizationId, scopedClient }) => {
  try {
    const userId = user.id;

    // Get Supabase client
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const { supabase } = await import("@/lib/supabase");
    const supabaseClient = supabase.server(cookieStore);

    // Get user's available organizations
    const { data, error } = (await (supabaseClient as any).rpc("get_user_available_organizations")) as {
      data: GetUserAvailableOrganizationsResult[] | null;
      error: any;
    };

    if (error) {

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch organizations",
        },
        { status: 500 }
      );
    }

    // Transform the data for the response
    const organizations =
      data?.map((org: GetUserAvailableOrganizationsResult) => ({
        id: org.organization_id,
        name: org.organization_name,
        slug: org.organization_slug,
        role: org.role,
        status: org.status,
        permissions: org.permissions,
        isCurrent: org.is_current,
      })) || [];

    const currentOrganization = organizations.find((org) => org.isCurrent);

    return NextResponse.json(
      {
        success: true,
        organizations,
        currentOrganization,
        totalCount: organizations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Set organization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
});
