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

    const { organizationId } = validation.data;

    // Call the database function to set active organization using the scoped client
    const { data, error } = (await scopedClient.rpc("set_user_active_organization", {
      org_id: organizationId,
    })) as { data: SetActiveOrganizationResult | null; error: any };

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

    // Check if the function returned an error
    if (!data?.success) {
      console.warn('[set-organization] Function returned failure:', data);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: data?.error || "Failed to set organization - user may not have access",
        },
        { status: 400 }
      );
    }

    // Log successful organization switch

    // Return success response
    return NextResponse.json<SetOrganizationSuccess>(
      {
        success: true,
        organization: {
          id: data.organization_id || organizationId,
          name: data.organization_name || "Unknown",
          role: data.role || "member",
        },
        message: data.message || "Organization set successfully",
      },
      { status: 200 }
    );
  } catch (error) {

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
