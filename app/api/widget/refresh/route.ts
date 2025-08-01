import { NextRequest, NextResponse } from "next/server";
import { verifyWidgetToken, createWidgetAuthToken } from "@/lib/auth/widget-auth";
import { applySecurityHeaders } from "@/lib/middleware/securityHeaders";

/**
 * Widget Session Refresh Endpoint
 * 
 * Handles widget JWT token refresh for maintaining authentication
 * without requiring full re-authentication flow
 */

export async function POST(request: NextRequest) {
  try {
    // Extract authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing or invalid authorization header" 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { action, organizationId } = await request.json();

    if (action !== "refresh_session") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid action" 
        },
        { status: 400 }
      );
    }

    // Verify the current widget token
    let decodedToken;
    try {
      decodedToken = await verifyWidgetToken(token);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid or expired widget token" 
        },
        { status: 401 }
      );
    }

    // Extract information from the current token
    const currentOrgId = decodedToken.organization_id || decodedToken.user_metadata?.organization_id;
    const visitorId = decodedToken.user_metadata?.visitor_id;
    const metadata = decodedToken.user_metadata?.metadata || {};

    // Validate organization ID matches
    if (organizationId && organizationId !== currentOrgId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Organization ID mismatch" 
        },
        { status: 403 }
      );
    }

    // Create a new widget JWT with extended expiration
    const authResult = await createWidgetAuthToken(
      currentOrgId,
      visitorId,
      metadata
    );

    const response = NextResponse.json({
      success: true,
      token: authResult.token,
      userId: authResult.userId,
      visitorId: authResult.visitorId,
      organizationId: authResult.organizationId,
      message: "Widget session refreshed successfully",
      expiresAt: authResult.expiresAt.toISOString(),
    });

    return applySecurityHeaders(response);

  } catch (error) {
    console.error("[Widget Refresh] Error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error during token refresh" 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return applySecurityHeaders(response);
}
