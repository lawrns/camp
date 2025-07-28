/**
 * Tenant Hook
 * Provides organization context for multi-tenant operations
 */

"use client";

import { useAuth } from "@/hooks/useAuth";

export interface TenantContext {
  organizationId: string;
  user: {
    id: string;
    email: string;
    organizationId: string;
    organizationRole: string;
  } | null;
}

export function useTenant(): TenantContext {
  const { user } = useAuth();

  return {
    organizationId: user?.organizationId || "",
    user,
  };
}
