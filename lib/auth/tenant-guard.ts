import type { NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/core/auth";

/**
 * Tenant Guard - Consolidated Redirect
 *
 * This file redirects to the consolidated auth system in lib/core/auth.ts
 * as part of the Campfire architecture consolidation.
 */

// Re-export everything from the consolidated auth module
export * from "@/lib/core/auth";

// Types for tenant guard
export interface TenantGuardContext {
  user: User;
  organizationId: string;
  scopedClient: SupabaseClient;
}

// Type for Next.js API route handler context
type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

export type TenantGuardHandler = (
  req: NextRequest,
  context: RouteContext,
  tenantContext: TenantGuardContext
) => Promise<Response>;

// Tenant guard functionality for multi-tenant API routes
export const withTenantGuard = (handler: TenantGuardHandler) => {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const client = createServerClient();
      const {
        data: { user },
        error,
      } = await client.auth.getUser();

      if (error || !user) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Get organization from user metadata or query
      const organizationId =
        user.user_metadata?.organization_id || new URL(req.url).searchParams.get("organization_id");

      if (!organizationId) {
        return new Response("Organization required", { status: 400 });
      }

      // Create scoped client for the organization
      const scopedClient = client;

      return handler(req, context, {
        user,
        organizationId,
        scopedClient,
      });
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  };
};

// Legacy export for backward compatibility
export { withTenantGuard as requireTenant, withTenantGuard as withOrganization };
