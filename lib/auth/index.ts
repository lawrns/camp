/**
 * 🔥 HELPER2-STYLE AUTH SYSTEM
 *
 * Single auth function, simple and effective.
 * Based on helper2's successful pattern.
 */

import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Helper2-style: ONE auth function that works everywhere
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  // Get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Authentication required");
  }

  const token = authHeader.substring(7);

  // Verify with Supabase
  const client = supabase.admin();
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Invalid token");
  }

  return user;
}

/**
 * Optional: Get user without throwing (for optional auth)
 */
export async function getUser(request: NextRequest): Promise<User | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Legacy compatibility - will be removed after migration
 */
export const authService = {
  getCurrentUser: getUser,
  requireAuth,
};

export const withAuth = (handler: any) => {
  return async (request: NextRequest, context?: any) => {
    const user = await requireAuth(request);
    return handler(request, { ...context, user });
  };
};

export const withTenantGuard = withAuth; // Alias for compatibility

// Re-export the core auth provider and hooks for components
export { AuthProvider, useAuth, useUser } from "../src/lib/core/auth-provider";

// Re-export auth utilities and types
export * from "../src/lib/core/auth";
