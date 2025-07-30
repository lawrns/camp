/**
 * RBAC React Hooks
 * Custom hooks for role-based access control in React components
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { rbacService } from "./core";
import type {
  Permission,
  PermissionAction,
  ResourceType,
  PermissionScope,
  PermissionResult,
  UserPermissionSummary,
  SystemRole,
} from "./types";

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(
  action: PermissionAction,
  resource: ResourceType,
  scope: PermissionScope = 'organization'
) {
  const { user } = useAuth();
  const [result, setResult] = useState<PermissionResult>({ allowed: false });
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    if (!user?.organizationId) {
      setResult({ allowed: false, reason: 'No organization context' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const permissionResult = await rbacService.hasPermission(
        {
          userId: user.id,
          organizationId: user.organizationId,
        },
        action,
        resource,
        scope
      );
      setResult(permissionResult);
    } catch (error) {
      console.error('[usePermission] Error checking permission:', error);
      setResult({ allowed: false, reason: 'Error checking permission' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId, action, resource, scope]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    allowed: result.allowed,
    reason: result.reason,
    isLoading,
    refetch: checkPermission,
  };
}

/**
 * Hook to get all user permissions
 */
export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user?.organizationId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userPermissions = await rbacService.getUserPermissions(
        user.id,
        user.organizationId
      );
      setPermissions(userPermissions);
    } catch (err) {
      console.error('[useUserPermissions] Error fetching permissions:', err);
      setError('Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    isLoading,
    error,
    refetch: fetchPermissions,
  };
}

/**
 * Hook to get user permission summary
 */
export function useUserPermissionSummary() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<UserPermissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!user?.organizationId) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const permissionSummary = await rbacService.getUserPermissionSummary(
        user.id,
        user.organizationId
      );
      setSummary(permissionSummary);
    } catch (err) {
      console.error('[useUserPermissionSummary] Error fetching summary:', err);
      setError('Failed to fetch permission summary');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(permissionChecks: Array<{
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
}>) {
  const { user } = useAuth();
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    if (!user?.organizationId) {
      setResults({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const permissionResults: Record<string, boolean> = {};
      
      await Promise.all(
        permissionChecks.map(async (check) => {
          const key = `${check.action}:${check.resource}:${check.scope || 'organization'}`;
          const result = await rbacService.hasPermission(
            {
              userId: user.id,
              organizationId: user.organizationId,
            },
            check.action,
            check.resource,
            check.scope
          );
          permissionResults[key] = result.allowed;
        })
      );

      setResults(permissionResults);
    } catch (error) {
      console.error('[usePermissions] Error checking permissions:', error);
      setResults({});
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId, permissionChecks]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Helper function to check a specific permission
  const hasPermission = useCallback((
    action: PermissionAction,
    resource: ResourceType,
    scope: PermissionScope = 'organization'
  ) => {
    const key = `${action}:${resource}:${scope}`;
    return results[key] || false;
  }, [results]);

  return {
    results,
    hasPermission,
    isLoading,
    refetch: checkPermissions,
  };
}

/**
 * Hook to check if user has a specific role
 */
export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
      setIsLoading(false);
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [user?.role]);

  const hasRole = useCallback((targetRole: string | SystemRole) => {
    return role === targetRole;
  }, [role]);

  const hasAnyRole = useCallback((targetRoles: (string | SystemRole)[]) => {
    return role ? targetRoles.includes(role) : false;
  }, [role]);

  const isAdmin = useMemo(() => {
    return hasAnyRole([SystemRole.SUPER_ADMIN, SystemRole.ADMIN]);
  }, [hasAnyRole]);

  const isManager = useMemo(() => {
    return hasAnyRole([SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER]);
  }, [hasAnyRole]);

  return {
    role,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isLoading,
  };
}

/**
 * Hook for role management operations
 */
export function useRoleManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignRole = useCallback(async (
    targetUserId: string,
    role: string
  ) => {
    if (!user?.organizationId) {
      throw new Error('No organization context');
    }

    setIsLoading(true);
    setError(null);
    try {
      const success = await rbacService.assignRole(
        targetUserId,
        user.organizationId,
        role,
        user.id
      );
      
      if (!success) {
        throw new Error('Failed to assign role');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  const grantPermission = useCallback(async (
    targetUserId: string,
    permission: Permission
  ) => {
    if (!user?.organizationId) {
      throw new Error('No organization context');
    }

    setIsLoading(true);
    setError(null);
    try {
      const success = await rbacService.grantPermission(
        targetUserId,
        user.organizationId,
        permission,
        user.id
      );
      
      if (!success) {
        throw new Error('Failed to grant permission');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant permission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  return {
    assignRole,
    grantPermission,
    isLoading,
    error,
  };
}

/**
 * Hook to get available system roles
 */
export function useSystemRoles() {
  const roles = useMemo(() => [
    { value: SystemRole.SUPER_ADMIN, label: 'Super Admin', description: 'Full system access' },
    { value: SystemRole.ADMIN, label: 'Admin', description: 'Organization management' },
    { value: SystemRole.MANAGER, label: 'Manager', description: 'Team management' },
    { value: SystemRole.AGENT, label: 'Agent', description: 'Customer support' },
    { value: SystemRole.VIEWER, label: 'Viewer', description: 'Read-only access' },
    { value: SystemRole.GUEST, label: 'Guest', description: 'Limited access' },
  ], []);

  return { roles };
}
