// For backward compatibility, also export common auth functions
import { createServerClient } from "@/lib/core/auth";

/**
 * API Authentication - Consolidated Redirect
 *
 * This file redirects to the consolidated auth system in lib/core/auth.ts
 * as part of the Campfire architecture consolidation.
 */

// Re-export everything from the consolidated auth module
export * from "@/lib/core/auth";

export { createServerClient };
export { createServerClient as getServerClient };

// Common auth utilities that API routes expect
export const requireAuth = async (req: Request) => {
  const client = createServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return { user, client };
};

// Type for Next.js API route handler context
type RouteContext = {
  params?: Promise<Record<string, string | string[]>>;
};

// Type for the auth handler function
type AuthHandler = (req: Request, context: RouteContext, auth: { user: any; client: any }) => Promise<Response>;

export const withAuth = (handler: AuthHandler) => {
  return async (req: Request, context: RouteContext) => {
    try {
      const auth = await requireAuth(req);
      return handler(req, context, auth);
    } catch (error) {
      return new Response("Unauthorized", { status: 401 });
    }
  };
};
// Legacy authenticateRequest function for compatibility
export const authenticateRequest = async (req: Request) => {
  return requireAuth(req);
};
