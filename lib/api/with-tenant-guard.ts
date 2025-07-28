/**
 * Tenant Guard Middleware - Simplified
 *
 * Provides organization/tenant isolation for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { Auth } from "@/lib/auth";

export type TenantGuardHandler = (
  req: NextRequest,
  params: {
    organizationId: string;
    user?: any;
  }
) => Promise<NextResponse>;

/**
 * Simplified tenant guard wrapper
 * Ensures requests have valid organization context
 */
export function withTenantGuard(handler: TenantGuardHandler) {
  return async (req: NextRequest) => {
    try {
      // Check for organization ID in headers (for widget/public endpoints)
      const orgIdFromHeader = req.headers.get("X-Organization-ID");

      if (orgIdFromHeader) {
        // Widget/public endpoint - just verify org ID exists
        return handler(req, { organizationId: orgIdFromHeader });
      }

      // For authenticated endpoints, get from auth
      const authResult = await Auth.authenticateRequest(req);

      if (!authResult.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return handler(req, {
        organizationId: authResult.organizationId!,
        user: authResult.user,
      });
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// Also export a simple requireAuth for backward compatibility
export async function requireAuth(req: NextRequest) {
  const authResult = await Auth.authenticateRequest(req);
  return {
    success: authResult.success,
    user: authResult.user,
    organizationId: authResult.organizationId,
  };
}
