// Simple auth requirement utility stub
import { NextRequest, NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email?: string;
  organizationId?: string;
}

export interface AuthContext {
  user: AuthUser;
  organizationId: string;
}

export interface SimpleAuthOptions {
  requireOrganization?: boolean;
  allowedRoles?: string[];
  redirectUrl?: string;
}

// Function export for authenticateRequest
export async function authenticateRequest(
  request: NextRequest,
  options: SimpleAuthOptions = {}
): Promise<{ success: true; context: AuthContext } | { success: false; error: string }> {
  return SimpleRequireAuth.validateRequest(request, options);
}

export class SimpleRequireAuth {
  static async validateRequest(
    request: NextRequest,
    options: SimpleAuthOptions = {}
  ): Promise<{ success: true; context: AuthContext } | { success: false; error: string }> {
    // Stub implementation - always return success for build
    const mockUser: AuthUser = {
      id: "stub-user-id",
      email: "stub@example.com",
      organizationId: "stub-org-id",
    };

    const context: AuthContext = {
      user: mockUser,
      organizationId: mockUser.organizationId || "default-org",
    };

    // In a real implementation, this would:
    // 1. Extract auth token from request headers/cookies
    // 2. Validate token with auth service
    // 3. Check user permissions and organization access
    // 4. Return appropriate success/error response

    void request; // Suppress unused parameter warning
    void options; // Suppress unused parameter warning

    return { success: true, context };
  }

  static createUnauthorizedResponse(message: string = "Unauthorized"): NextResponse {
    return NextResponse.json({ error: message, code: "UNAUTHORIZED" }, { status: 401 });
  }

  static createForbiddenResponse(message: string = "Forbidden"): NextResponse {
    return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
  }
}

// Convenience function for API routes
export async function requireAuth(
  request: NextRequest,
  options?: SimpleAuthOptions
): Promise<{ success: true; context: AuthContext } | { success: false; response: NextResponse }> {
  const result = await SimpleRequireAuth.validateRequest(request, options);

  if (!result.success) {
    return {
      success: false,
      response: SimpleRequireAuth.createUnauthorizedResponse(result.error),
    };
  }

  return { success: true, context: result.context };
}

// Higher-order function for API route handlers
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>,
  options?: SimpleAuthOptions
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await requireAuth(request, options);

    if (!authResult.success) {
      return authResult.response;
    }

    return handler(request, authResult.context, ...args);
  };
}

export default SimpleRequireAuth;
