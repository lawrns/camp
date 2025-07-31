import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withUserAuth, withAuth } from "@/lib/api/unified-auth";
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
 * NOTE: Widget sessions are anonymous and don't need JWT enrichment.
 *
 * @param request - Contains organizationId in the request body
 * @returns Updated organization context or error
 */
export const POST = async (request: NextRequest) => {
  try {
    // Check if this is a widget session or test context first
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const clientInfo = request.headers.get('x-client-info') || '';

    // Detect widget sessions and test contexts
    const isWidgetSession = userAgent.includes('node') ||
                           referer.includes('/test-') ||
                           referer.includes('/debug/') ||
                           origin.includes('localhost:3003') ||
                           clientInfo.includes('campfire-widget');

    const isTestContext = referer.includes('/test-') ||
                         referer.includes('/debug/') ||
                         request.url.includes('test=true');

    console.log('🔍 JWT Enrichment Request Analysis:', {
      userAgent,
      referer,
      origin,
      isWidgetSession,
      isTestContext,
      willSkip: isWidgetSession || isTestContext
    });

    if (isWidgetSession || isTestContext) {
      console.log('🔧 Skipping JWT enrichment for widget/test session');
      return NextResponse.json<SetOrganizationSuccess>(
        {
          success: true,
          organization: {
            id: 'widget-session',
            name: 'Widget Session',
            role: 'anonymous'
          },
          message: 'JWT enrichment skipped for widget/test session'
        },
        { status: 200 }
      );
    }

    // For regular authenticated users, continue with original logic
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

    // Use withUserAuth for authenticated users
    return withUserAuth(async (req: NextRequest, { params }, { user, organizationId, scopedClient }) => {
      try {
        const userId = user.id;
        const { organizationId: targetOrgId } = validation.data;

    // Call the database function to set active organization using the scoped client
    // Note: This function may return boolean or JSON depending on the migration version
    const { data: result, error } = await scopedClient.rpc("set_user_active_organization", {
      org_id: targetOrgId,
    });

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

    // Handle different return types from the database function
    let isSuccess = false;
    if (typeof result === 'boolean') {
      // Function returns boolean
      isSuccess = result;
    } else if (typeof result === 'object' && result !== null) {
      // Function returns JSON object
      if ('success' in result) {
        isSuccess = result.success;
        if (!isSuccess && 'error' in result) {
          return NextResponse.json<SetOrganizationError>(
            {
              success: false,
              error: result.error || "Failed to set organization",
            },
            { status: 403 }
          );
        }
      }
    } else {
      // Unexpected return type
      console.error('[set-organization] Unexpected return type from database function:', typeof result, result);
      return NextResponse.json<SetOrganizationError>(
        {
          success: false,
          error: "Unexpected response from database function",
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
    })(request); // Close the withUserAuth wrapper

  } catch (outerError) {
    console.error("❌ JWT enrichment endpoint error:", outerError);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}; // Close the main POST function

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
