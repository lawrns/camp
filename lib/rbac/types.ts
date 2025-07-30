/**
 * Role-Based Access Control (RBAC) Types
 * Comprehensive type definitions for permissions, roles, and access control
 */

// Core permission actions
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage' 
  | 'assign' 
  | 'invite' 
  | 'export' 
  | 'configure'
  | 'moderate'
  | 'escalate'
  | 'archive';

// Resource types in the system
export type ResourceType = 
  | 'conversations'
  | 'tickets'
  | 'knowledge'
  | 'team'
  | 'analytics'
  | 'settings'
  | 'integrations'
  | 'billing'
  | 'organization'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'reports'
  | 'ai_settings'
  | 'workflows'
  | 'automations';

// Permission scope levels
export type PermissionScope = 'own' | 'team' | 'organization' | 'all';

// Individual permission definition
export interface Permission {
  action: PermissionAction;
  resource: ResourceType;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
}

// Conditional permissions based on context
export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

// Predefined system roles
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

// Role definition with permissions
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  isDefault: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User role assignment
export interface UserRole {
  userId: string;
  organizationId: string;
  role: string;
  permissions: Permission[];
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

// Permission check context
export interface PermissionContext {
  userId: string;
  organizationId: string;
  resource?: any;
  metadata?: Record<string, any>;
}

// Permission check result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  grantedPermissions?: Permission[];
}

// RBAC configuration
export interface RBACConfig {
  enableRoleHierarchy: boolean;
  enableConditionalPermissions: boolean;
  enablePermissionCaching: boolean;
  cacheTimeout: number;
  auditPermissionChecks: boolean;
}

// Audit log entry for permission changes
export interface PermissionAuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: 'grant' | 'revoke' | 'check' | 'deny';
  permission: Permission;
  context: PermissionContext;
  result: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Role hierarchy definition
export interface RoleHierarchy {
  parentRole: string;
  childRole: string;
  organizationId: string;
  inheritPermissions: boolean;
}

// Permission template for common role setups
export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  targetRole: SystemRole;
  category: 'customer_support' | 'management' | 'technical' | 'sales' | 'custom';
}

// Bulk permission operation
export interface BulkPermissionOperation {
  operation: 'grant' | 'revoke' | 'replace';
  userIds: string[];
  permissions: Permission[];
  organizationId: string;
  reason?: string;
}

// Permission validation result
export interface PermissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Resource access level
export type AccessLevel = 'none' | 'read' | 'write' | 'admin' | 'owner';

// Quick access level mapping
export interface ResourceAccess {
  resource: ResourceType;
  level: AccessLevel;
  conditions?: PermissionCondition[];
}

// User permission summary
export interface UserPermissionSummary {
  userId: string;
  organizationId: string;
  role: string;
  permissions: Permission[];
  resourceAccess: ResourceAccess[];
  lastUpdated: Date;
  effectiveUntil?: Date;
}

// Permission matrix for UI display
export interface PermissionMatrix {
  roles: string[];
  resources: ResourceType[];
  matrix: Record<string, Record<ResourceType, AccessLevel>>;
}

// Role comparison for analysis
export interface RoleComparison {
  role1: string;
  role2: string;
  commonPermissions: Permission[];
  uniqueToRole1: Permission[];
  uniqueToRole2: Permission[];
  conflictingPermissions: Permission[];
}

// Permission inheritance chain
export interface PermissionInheritance {
  userId: string;
  directPermissions: Permission[];
  inheritedPermissions: Permission[];
  roleChain: string[];
  effectivePermissions: Permission[];
}

// System-wide permission statistics
export interface PermissionStats {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  mostCommonRole: string;
  leastUsedPermissions: Permission[];
  overPrivilegedUsers: string[];
  underPrivilegedUsers: string[];
}

// Permission change request
export interface PermissionChangeRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  organizationId: string;
  requestedChanges: BulkPermissionOperation;
  justification: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewerId?: string;
  reviewedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

// Emergency access grant
export interface EmergencyAccess {
  id: string;
  userId: string;
  organizationId: string;
  grantedPermissions: Permission[];
  reason: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  auditTrail: PermissionAuditLog[];
}

// Role template for quick setup
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: Permission[];
  recommendedFor: string[];
  prerequisites: string[];
  isPopular: boolean;
}

// Permission dependency
export interface PermissionDependency {
  permission: Permission;
  requiredPermissions: Permission[];
  conflictingPermissions: Permission[];
  description: string;
}

// RBAC health check result
export interface RBACHealthCheck {
  isHealthy: boolean;
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'security' | 'performance' | 'usability' | 'compliance';
    description: string;
    recommendation: string;
  }[];
  metrics: {
    permissionCheckLatency: number;
    cacheHitRate: number;
    activeUsers: number;
    roleDistribution: Record<string, number>;
  };
}
