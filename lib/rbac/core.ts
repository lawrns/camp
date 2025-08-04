/**
 * Core RBAC Service
 * Central service for role-based access control operations
 */

import { createApiClient } from "@/lib/supabase";
import type {
  Permission,
  PermissionContext,
  PermissionResult,
  UserRole,
  Role,
  SystemRole,
  PermissionAction,
  ResourceType,
  PermissionScope,
  UserPermissionSummary,
  PermissionAuditLog,
  RBACConfig,
} from "./types";

// Default RBAC configuration
const DEFAULT_CONFIG: RBACConfig = {
  enableRoleHierarchy: true,
  enableConditionalPermissions: true,
  enablePermissionCaching: true,
  cacheTimeout: 300000, // 5 minutes
  auditPermissionChecks: true,
};

// In-memory cache for permissions (in production, use Redis)
const permissionCache = new Map<string, { permissions: Permission[]; timestamp: number }>();

/**
 * Core RBAC Service Class
 */
export class RBACService {
  private config: RBACConfig;
  private supabase = createApiClient();

  constructor(config: Partial<RBACConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    context: PermissionContext,
    action: PermissionAction,
    resource: ResourceType,
    scope: PermissionScope = 'organization'
  ): Promise<PermissionResult> {
    try {
      console.log(`[RBAC] Checking permission: ${action} on ${resource} for user ${context.userId}`);

      // Get user permissions
      const userPermissions = await this.getUserPermissions(context.userId, context.organizationId);

      // Check for matching permission
      const hasPermission = userPermissions.some(permission => 
        permission.action === action &&
        permission.resource === resource &&
        this.checkScope(permission.scope, scope, context)
      );

      // Audit the permission check
      if (this.config.auditPermissionChecks) {
        await this.auditPermissionCheck(context, { action, resource, scope }, hasPermission);
      }

      return {
        allowed: hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Permission denied',
        grantedPermissions: userPermissions,
      };
    } catch (error) {
      console.error('[RBAC] Error checking permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permission',
      };
    }
  }

  /**
   * Get all permissions for a user in an organization
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<Permission[]> {
    const cacheKey = `${userId}:${organizationId}`;
    
    // Check cache first
    if (this.config.enablePermissionCaching) {
      const cached = permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.permissions;
      }
    }

    try {
      // Get user's role and permissions from database
      const { data: memberData, error } = await this.supabase
        .from('organization_members')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (error || !memberData) {
        console.warn(`[RBAC] No active membership found for user ${userId} in org ${organizationId}`);
        return [];
      }

      // Get role-based permissions
      const rolePermissions = await this.getRolePermissions(memberData.role);
      
      // Get custom permissions from the permissions JSON field
      const customPermissions = this.parseCustomPermissions(memberData.permissions);

      // Combine permissions
      const allPermissions = [...rolePermissions, ...customPermissions];

      // Cache the result
      if (this.config.enablePermissionCaching) {
        permissionCache.set(cacheKey, {
          permissions: allPermissions,
          timestamp: Date.now(),
        });
      }

      return allPermissions;
    } catch (error) {
      console.error('[RBAC] Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(role: string): Promise<Permission[]> {
    // Define system role permissions
    const systemRolePermissions: Record<SystemRole, Permission[]> = {
      [SystemRole.SUPER_ADMIN]: [
        { action: 'manage', resource: 'organization', scope: 'all' },
        { action: 'manage', resource: 'users', scope: 'all' },
        { action: 'manage', resource: 'roles', scope: 'all' },
        { action: 'manage', resource: 'permissions', scope: 'all' },
        { action: 'manage', resource: 'settings', scope: 'all' },
        { action: 'manage', resource: 'billing', scope: 'all' },
        { action: 'manage', resource: 'integrations', scope: 'all' },
        { action: 'manage', resource: 'analytics', scope: 'all' },
      ],
      [SystemRole.ADMIN]: [
        { action: 'manage', resource: 'team', scope: 'organization' },
        { action: 'manage', resource: 'conversations', scope: 'organization' },
        { action: 'manage', resource: 'tickets', scope: 'organization' },
        { action: 'manage', resource: 'knowledge', scope: 'organization' },
        { action: 'read', resource: 'analytics', scope: 'organization' },
        { action: 'configure', resource: 'settings', scope: 'organization' },
        { action: 'invite', resource: 'users', scope: 'organization' },
        { action: 'assign', resource: 'roles', scope: 'organization' },
      ],
      [SystemRole.MANAGER]: [
        { action: 'read', resource: 'team', scope: 'team' },
        { action: 'assign', resource: 'conversations', scope: 'team' },
        { action: 'assign', resource: 'tickets', scope: 'team' },
        { action: 'create', resource: 'knowledge', scope: 'team' },
        { action: 'update', resource: 'knowledge', scope: 'team' },
        { action: 'read', resource: 'analytics', scope: 'team' },
        { action: 'escalate', resource: 'conversations', scope: 'team' },
        { action: 'moderate', resource: 'conversations', scope: 'team' },
      ],
      [SystemRole.AGENT]: [
        { action: 'read', resource: 'conversations', scope: 'own' },
        { action: 'update', resource: 'conversations', scope: 'own' },
        { action: 'create', resource: 'tickets', scope: 'own' },
        { action: 'update', resource: 'tickets', scope: 'own' },
        { action: 'read', resource: 'knowledge', scope: 'organization' },
        { action: 'create', resource: 'knowledge', scope: 'own' },
        { action: 'read', resource: 'team', scope: 'organization' },
        { action: 'escalate', resource: 'conversations', scope: 'own' },
      ],
      [SystemRole.VIEWER]: [
        { action: 'read', resource: 'conversations', scope: 'own' },
        { action: 'read', resource: 'tickets', scope: 'own' },
        { action: 'read', resource: 'knowledge', scope: 'organization' },
        { action: 'read', resource: 'team', scope: 'organization' },
      ],
      [SystemRole.GUEST]: [
        { action: 'read', resource: 'knowledge', scope: 'organization' },
      ],
    };

    return systemRolePermissions[role as SystemRole] || [];
  }

  /**
   * Parse custom permissions from JSON field
   */
  private parseCustomPermissions(permissionsJson: unknown): Permission[] {
    if (!permissionsJson) return [];
    
    try {
      if (Array.isArray(permissionsJson)) {
        return permissionsJson as Permission[];
      }
      return [];
    } catch (error) {
      console.error('[RBAC] Error parsing custom permissions:', error);
      return [];
    }
  }

  /**
   * Check if permission scope matches required scope
   */
  private checkScope(
    permissionScope: PermissionScope,
    requiredScope: PermissionScope,
    context: PermissionContext
  ): boolean {
    // Scope hierarchy: all > organization > team > own
    const scopeHierarchy = ['own', 'team', 'organization', 'all'];
    const permissionLevel = scopeHierarchy.indexOf(permissionScope);
    const requiredLevel = scopeHierarchy.indexOf(requiredScope);
    
    return permissionLevel >= requiredLevel;
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    organizationId: string,
    role: string,
    assignedBy: string
  ): Promise<boolean> {
    try {
      console.log(`[RBAC] Assigning role ${role} to user ${userId} in org ${organizationId}`);

      const { error } = await this.supabase
        .from('organization_members')
        .update({ 
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('[RBAC] Error assigning role:', error);
        return false;
      }

      // Clear cache for this user
      const cacheKey = `${userId}:${organizationId}`;
      permissionCache.delete(cacheKey);

      // Audit the role assignment
      await this.auditRoleChange(userId, organizationId, 'assign', role, assignedBy);

      return true;
    } catch (error) {
      console.error('[RBAC] Error in assignRole:', error);
      return false;
    }
  }

  /**
   * Grant custom permission to user
   */
  async grantPermission(
    userId: string,
    organizationId: string,
    permission: Permission,
    grantedBy: string
  ): Promise<boolean> {
    try {
      console.log(`[RBAC] Granting permission ${permission.action} on ${permission.resource} to user ${userId}`);

      // Get current permissions
      const { data: memberData, error: fetchError } = await this.supabase
        .from('organization_members')
        .select('permissions')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError) {
        console.error('[RBAC] Error fetching current permissions:', fetchError);
        return false;
      }

      // Add new permission
      const currentPermissions = this.parseCustomPermissions(memberData?.permissions) || [];
      const updatedPermissions = [...currentPermissions, permission];

      // Update in database
      const { error } = await this.supabase
        .from('organization_members')
        .update({ 
          permissions: updatedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('[RBAC] Error granting permission:', error);
        return false;
      }

      // Clear cache
      const cacheKey = `${userId}:${organizationId}`;
      permissionCache.delete(cacheKey);

      return true;
    } catch (error) {
      console.error('[RBAC] Error in grantPermission:', error);
      return false;
    }
  }

  /**
   * Get user permission summary
   */
  async getUserPermissionSummary(userId: string, organizationId: string): Promise<UserPermissionSummary | null> {
    try {
      const { data: memberData, error } = await this.supabase
        .from('organization_members')
        .select('role, permissions, updated_at')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !memberData) {
        return null;
      }

      const permissions = await this.getUserPermissions(userId, organizationId);
      
      return {
        userId,
        organizationId,
        role: memberData.role,
        permissions,
        resourceAccess: this.generateResourceAccess(permissions),
        lastUpdated: new Date(memberData.updated_at || Date.now()),
      };
    } catch (error) {
      console.error('[RBAC] Error getting user permission summary:', error);
      return null;
    }
  }

  /**
   * Generate resource access summary from permissions
   */
  private generateResourceAccess(permissions: Permission[]) {
    const resourceMap = new Map();
    
    permissions.forEach(permission => {
      const current = resourceMap.get(permission.resource);
      const newLevel = this.actionToAccessLevel(permission.action);
      
      if (!current || this.isHigherAccessLevel(newLevel, current.level)) {
        resourceMap.set(permission.resource, {
          resource: permission.resource,
          level: newLevel,
          conditions: permission.conditions,
        });
      }
    });

    return Array.from(resourceMap.values());
  }

  /**
   * Convert permission action to access level
   */
  private actionToAccessLevel(action: PermissionAction): 'none' | 'read' | 'write' | 'admin' | 'owner' {
    switch (action) {
      case 'read': return 'read';
      case 'create':
      case 'update':
      case 'delete': return 'write';
      case 'manage':
      case 'configure': return 'admin';
      case 'assign':
      case 'invite': return 'admin';
      default: return 'read';
    }
  }

  /**
   * Check if access level is higher than current
   */
  private isHigherAccessLevel(newLevel: string, currentLevel: string): boolean {
    const levels = ['none', 'read', 'write', 'admin', 'owner'];
    return levels.indexOf(newLevel) > levels.indexOf(currentLevel);
  }

  /**
   * Audit permission check
   */
  private async auditPermissionCheck(
    context: PermissionContext,
    permission: { action: PermissionAction; resource: ResourceType; scope: PermissionScope },
    result: boolean
  ): Promise<void> {
    try {
      // In a real implementation, this would write to an audit log table
      console.log(`[RBAC Audit] User ${context.userId} ${result ? 'GRANTED' : 'DENIED'} ${permission.action} on ${permission.resource}`);
    } catch (error) {
      console.error('[RBAC] Error auditing permission check:', error);
    }
  }

  /**
   * Audit role changes
   */
  private async auditRoleChange(
    userId: string,
    organizationId: string,
    action: string,
    role: string,
    changedBy: string
  ): Promise<void> {
    try {
      console.log(`[RBAC Audit] Role ${action}: User ${userId} ${action}ed role ${role} by ${changedBy}`);
    } catch (error) {
      console.error('[RBAC] Error auditing role change:', error);
    }
  }

  /**
   * Clear permission cache for user
   */
  clearUserCache(userId: string, organizationId: string): void {
    const cacheKey = `${userId}:${organizationId}`;
    permissionCache.delete(cacheKey);
  }

  /**
   * Clear all permission cache
   */
  clearAllCache(): void {
    permissionCache.clear();
  }
}

// Export singleton instance
export const rbacService = new RBACService();
