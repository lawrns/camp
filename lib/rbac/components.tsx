/**
 * RBAC React Components
 * Reusable components for role-based access control
 */

"use client";

import React, { ReactNode } from "react";
import { usePermission, useRole, usePermissions } from "./hooks";
import type { PermissionAction, ResourceType, PermissionScope, SystemRole } from "./types";

// Props for permission-based components
interface PermissionGuardProps {
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
}

interface RoleGuardProps {
  roles: (string | SystemRole)[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Permission Guard Component
 * Renders children only if user has the required permission
 */
export function PermissionGuard({
  action,
  resource,
  scope = 'organization',
  children,
  fallback = null,
  showLoading = false,
}: PermissionGuardProps) {
  const { allowed, isLoading } = usePermission(action, resource, scope);

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoading && !showLoading) {
    return null;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Role Guard Component
 * Renders children only if user has one of the required roles
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { role, hasAnyRole, hasRole } = useRole();

  if (!role) {
    return <>{fallback}</>;
  }

  const hasAccess = requireAll 
    ? roles.every(targetRole => hasRole(targetRole))
    : hasAnyRole(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Admin Only Component
 * Shorthand for admin-level access
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <RoleGuard 
      roles={[SystemRole.SUPER_ADMIN, SystemRole.ADMIN]} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Manager Plus Component
 * For manager-level access and above
 */
export function ManagerPlus({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <RoleGuard 
      roles={[SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER]} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Conditional Render Component
 * Simple conditional rendering with fallback
 */
export function ConditionalRender({
  condition,
  children,
  fallback = null,
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * Permission Button Component
 * Button that's only enabled if user has permission
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
  children: ReactNode;
  disabledText?: string;
}

export function PermissionButton({
  action,
  resource,
  scope = 'organization',
  children,
  disabledText = 'No permission',
  className = '',
  ...props
}: PermissionButtonProps) {
  const { allowed, isLoading } = usePermission(action, resource, scope);

  return (
    <button
      {...props}
      disabled={!allowed || isLoading || props.disabled}
      className={`${className} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!allowed ? disabledText : props.title}
    >
      {children}
    </button>
  );
}

/**
 * Permission Link Component
 * Link that's only clickable if user has permission
 */
interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
  children: ReactNode;
  disabledText?: string;
}

export function PermissionLink({
  action,
  resource,
  scope = 'organization',
  children,
  disabledText = 'No permission',
  className = '',
  onClick,
  ...props
}: PermissionLinkProps) {
  const { allowed } = usePermission(action, resource, scope);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!allowed) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      {...props}
      onClick={handleClick}
      className={`${className} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!allowed ? disabledText : props.title}
    >
      {children}
    </a>
  );
}

/**
 * Multi-Permission Guard Component
 * Renders children only if user has all specified permissions
 */
interface MultiPermissionGuardProps {
  permissions: Array<{
    action: PermissionAction;
    resource: ResourceType;
    scope?: PermissionScope;
  }>;
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function MultiPermissionGuard({
  permissions,
  children,
  fallback = null,
  requireAll = true,
}: MultiPermissionGuardProps) {
  const { results, isLoading } = usePermissions(permissions);

  if (isLoading) {
    return null;
  }

  const permissionKeys = permissions.map(p => 
    `${p.action}:${p.resource}:${p.scope || 'organization'}`
  );

  const hasAccess = requireAll
    ? permissionKeys.every(key => results[key])
    : permissionKeys.some(key => results[key]);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Permission Status Indicator
 * Shows visual indicator of permission status
 */
interface PermissionStatusProps {
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
  showText?: boolean;
  className?: string;
}

export function PermissionStatus({
  action,
  resource,
  scope = 'organization',
  showText = false,
  className = '',
}: PermissionStatusProps) {
  const { allowed, isLoading } = usePermission(action, resource, scope);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
        {showText && <span className="ml-2 text-sm text-gray-500">Checking...</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div 
        className={`h-2 w-2 rounded-full ${
          allowed ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {showText && (
        <span className={`ml-2 text-sm ${
          allowed ? 'text-green-700' : 'text-red-700'
        }`}>
          {allowed ? 'Allowed' : 'Denied'}
        </span>
      )}
    </div>
  );
}

/**
 * Role Badge Component
 * Displays user's role with styling
 */
interface RoleBadgeProps {
  role?: string;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  if (!role) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case SystemRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case SystemRole.ADMIN:
        return 'bg-red-100 text-red-800 border-red-200';
      case SystemRole.MANAGER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case SystemRole.AGENT:
        return 'bg-green-100 text-green-800 border-green-200';
      case SystemRole.VIEWER:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case SystemRole.GUEST:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role)} ${className}`}
    >
      {formatRoleName(role)}
    </span>
  );
}

/**
 * Permission Debug Component
 * Shows permission information for debugging (dev only)
 */
interface PermissionDebugProps {
  action: PermissionAction;
  resource: ResourceType;
  scope?: PermissionScope;
}

export function PermissionDebug({
  action,
  resource,
  scope = 'organization',
}: PermissionDebugProps) {
  const { allowed, reason, isLoading } = usePermission(action, resource, scope);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono max-w-sm">
      <div className="font-bold mb-2">Permission Debug</div>
      <div>Action: {action}</div>
      <div>Resource: {resource}</div>
      <div>Scope: {scope}</div>
      <div>Status: {isLoading ? 'Loading...' : (allowed ? 'ALLOWED' : 'DENIED')}</div>
      {reason && <div>Reason: {reason}</div>}
    </div>
  );
}
