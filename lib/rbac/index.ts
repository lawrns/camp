/**
 * RBAC (Role-Based Access Control) System
 * Comprehensive role and permission management for Campfire
 */

// Core exports
export { rbacService, RBACService } from './core';

// Type exports
export type {
  Permission,
  PermissionAction,
  ResourceType,
  PermissionScope,
  PermissionContext,
  PermissionResult,
  Role,
  UserRole,
  UserPermissionSummary,
  PermissionAuditLog,
  RBACConfig,
  PermissionCondition,
  RoleHierarchy,
  PermissionTemplate,
  BulkPermissionOperation,
  PermissionValidation,
  ResourceAccess,
  AccessLevel,
  PermissionMatrix,
  RoleComparison,
  PermissionInheritance,
  PermissionStats,
  PermissionChangeRequest,
  EmergencyAccess,
  RoleTemplate,
  PermissionDependency,
  RBACHealthCheck,
} from './types';

export { SystemRole } from './types';

// Hook exports
export {
  usePermission,
  useUserPermissions,
  useUserPermissionSummary,
  usePermissions,
  useRole,
  useRoleManagement,
  useSystemRoles,
} from './hooks';

// Component exports
export {
  PermissionGuard,
  RoleGuard,
  AdminOnly,
  ManagerPlus,
  ConditionalRender,
  PermissionButton,
  PermissionLink,
  MultiPermissionGuard,
  PermissionStatus,
  RoleBadge,
  PermissionDebug,
} from './components';

// Utility functions
export const RBAC_UTILS = {
  /**
   * Check if a role has higher privileges than another
   */
  isHigherRole: (role1: string, role2: string): boolean => {
    const hierarchy = ['guest', 'viewer', 'agent', 'manager', 'admin', 'super_admin'];
    return hierarchy.indexOf(role1) > hierarchy.indexOf(role2);
  },

  /**
   * Get all roles that are lower than the given role
   */
  getLowerRoles: (role: string): string[] => {
    const hierarchy = ['guest', 'viewer', 'agent', 'manager', 'admin', 'super_admin'];
    const roleIndex = hierarchy.indexOf(role);
    return roleIndex > 0 ? hierarchy.slice(0, roleIndex) : [];
  },

  /**
   * Get all roles that are higher than the given role
   */
  getHigherRoles: (role: string): string[] => {
    const hierarchy = ['guest', 'viewer', 'agent', 'manager', 'admin', 'super_admin'];
    const roleIndex = hierarchy.indexOf(role);
    return roleIndex < hierarchy.length - 1 ? hierarchy.slice(roleIndex + 1) : [];
  },

  /**
   * Format role name for display
   */
  formatRoleName: (role: string): string => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  },

  /**
   * Get role color for UI
   */
  getRoleColor: (role: string): string => {
    switch (role) {
      case 'super_admin': return 'purple';
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'agent': return 'green';
      case 'viewer': return 'gray';
      case 'guest': return 'yellow';
      default: return 'gray';
    }
  },

  /**
   * Validate permission object
   */
  validatePermission: (permission: any): boolean => {
    return (
      permission &&
      typeof permission.action === 'string' &&
      typeof permission.resource === 'string' &&
      typeof permission.scope === 'string'
    );
  },

  /**
   * Create permission key for caching/comparison
   */
  createPermissionKey: (action: string, resource: string, scope: string): string => {
    return `${action}:${resource}:${scope}`;
  },

  /**
   * Parse permission key back to components
   */
  parsePermissionKey: (key: string): { action: string; resource: string; scope: string } | null => {
    const parts = key.split(':');
    if (parts.length !== 3) return null;
    return {
      action: parts[0],
      resource: parts[1],
      scope: parts[2],
    };
  },
};

// Constants
export const RBAC_CONSTANTS = {
  // Default cache timeout (5 minutes)
  DEFAULT_CACHE_TIMEOUT: 5 * 60 * 1000,
  
  // System roles in hierarchy order
  ROLE_HIERARCHY: ['guest', 'viewer', 'agent', 'manager', 'admin', 'super_admin'],
  
  // Common permission actions
  ACTIONS: {
    CREATE: 'create' as const,
    READ: 'read' as const,
    UPDATE: 'update' as const,
    DELETE: 'delete' as const,
    MANAGE: 'manage' as const,
    ASSIGN: 'assign' as const,
    INVITE: 'invite' as const,
    EXPORT: 'export' as const,
    CONFIGURE: 'configure' as const,
    MODERATE: 'moderate' as const,
    ESCALATE: 'escalate' as const,
    ARCHIVE: 'archive' as const,
  },
  
  // System resources
  RESOURCES: {
    CONVERSATIONS: 'conversations' as const,
    TICKETS: 'tickets' as const,
    KNOWLEDGE: 'knowledge' as const,
    TEAM: 'team' as const,
    ANALYTICS: 'analytics' as const,
    SETTINGS: 'settings' as const,
    INTEGRATIONS: 'integrations' as const,
    BILLING: 'billing' as const,
    ORGANIZATION: 'organization' as const,
    USERS: 'users' as const,
    ROLES: 'roles' as const,
    PERMISSIONS: 'permissions' as const,
    REPORTS: 'reports' as const,
    AI_SETTINGS: 'ai_settings' as const,
    WORKFLOWS: 'workflows' as const,
    AUTOMATIONS: 'automations' as const,
  },
  
  // Permission scopes
  SCOPES: {
    OWN: 'own' as const,
    TEAM: 'team' as const,
    ORGANIZATION: 'organization' as const,
    ALL: 'all' as const,
  },
  
  // Access levels
  ACCESS_LEVELS: {
    NONE: 'none' as const,
    READ: 'read' as const,
    WRITE: 'write' as const,
    ADMIN: 'admin' as const,
    OWNER: 'owner' as const,
  },
};

// Error classes
export class RBACError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RBACError';
  }
}

export class PermissionDeniedError extends RBACError {
  constructor(action: string, resource: string, scope?: string) {
    super(`Permission denied: ${action} on ${resource}${scope ? ` (${scope})` : ''}`);
    this.code = 'PERMISSION_DENIED';
  }
}

export class RoleNotFoundError extends RBACError {
  constructor(role: string) {
    super(`Role not found: ${role}`);
    this.code = 'ROLE_NOT_FOUND';
  }
}

export class InvalidPermissionError extends RBACError {
  constructor(permission: any) {
    super(`Invalid permission: ${JSON.stringify(permission)}`);
    this.code = 'INVALID_PERMISSION';
  }
}

// Default export
export default {
  service: rbacService,
  utils: RBAC_UTILS,
  constants: RBAC_CONSTANTS,
  errors: {
    RBACError,
    PermissionDeniedError,
    RoleNotFoundError,
    InvalidPermissionError,
  },
};
