"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Button } from "@/components/unified-ui/components/Button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { api } from "@/lib/trpc/provider";

// RBAC imports
import { 
  PermissionGuard, 
  RoleGuard, 
  AdminOnly, 
  RoleBadge,
  PermissionButton,
  PermissionStatus 
} from "@/lib/rbac/components";
import { 
  usePermission, 
  useRole, 
  useUserPermissionSummary, 
  useSystemRoles,
  useRoleManagement 
} from "@/lib/rbac/hooks";
import { SystemRole } from "@/lib/rbac/types";

// Import icons
import {
  Shield,
  Users,
  Gear as Settings,
  Plus,
  PencilSimple as Edit,
  Trash,
  Eye,
  Warning,
  CheckCircle,
  Clock,
  Crown,
  UserGear,
  Key,
  Lock,
  LockOpen,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  permissions?: any[];
}

export default function RolesManagementPage() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [showPermissionEditor, setShowPermissionEditor] = useState(false);

  // RBAC hooks
  const { role: currentUserRole, isAdmin, isManager } = useRole();
  const { summary: permissionSummary } = useUserPermissionSummary();
  const { roles: systemRoles } = useSystemRoles();
  const { assignRole, grantPermission, isLoading: roleManagementLoading } = useRoleManagement();

  // Permission checks
  const { allowed: canManageRoles } = usePermission('manage', 'roles');
  const { allowed: canViewTeam } = usePermission('read', 'team');
  const { allowed: canAssignRoles } = usePermission('assign', 'roles');

  // Fetch team members
  const { data: teamMembers, isLoading: membersLoading, refetch: refetchMembers } = api.mailbox.members.list.useQuery(
    { mailboxSlug: "test-mailbox-dev" },
    {
      enabled: canViewTeam,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Transform team members data
  const members: TeamMember[] = useMemo(() => {
    if (!teamMembers?.members) return [];
    
    return teamMembers.members.map(member => ({
      id: member.id,
      name: member.name || member.email,
      email: member.email,
      role: member.role || 'agent',
      status: member.status || 'active',
      lastActive: member.lastActiveAt || new Date().toISOString(),
    }));
  }, [teamMembers]);

  // Role statistics
  const roleStats = useMemo(() => {
    const stats = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([role, count]) => ({
      role,
      count,
      percentage: Math.round((count / members.length) * 100),
    }));
  }, [members]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await assignRole(memberId, newRole);
      await refetchMembers();
      setShowRoleEditor(false);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case SystemRole.SUPER_ADMIN: return Crown;
      case SystemRole.ADMIN: return Shield;
      case SystemRole.MANAGER: return UserGear;
      case SystemRole.AGENT: return Users;
      case SystemRole.VIEWER: return Eye;
      default: return Users;
    }
  };

  const getRoleDescription = (role: string) => {
    const roleData = systemRoles.find(r => r.value === role);
    return roleData?.description || 'Custom role';
  };

  if (!canViewTeam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Icon icon={Lock} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view team roles.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-1">Manage team roles and permissions</p>
          </div>
          <div className="flex items-center gap-4">
            <PermissionGuard action="manage" resource="roles">
              <Button
                onClick={() => setShowRoleEditor(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon icon={Plus} className="mr-2 h-4 w-4" />
                Manage Roles
              </Button>
            </PermissionGuard>
            
            <Button
              variant="outline"
              onClick={() => refetchMembers()}
              disabled={membersLoading}
            >
              <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={UserGear} className="h-5 w-5" />
              Your Access Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <RoleBadge role={currentUserRole || undefined} />
                <div>
                  <p className="font-medium">Current Role: {currentUserRole}</p>
                  <p className="text-sm text-gray-600">{getRoleDescription(currentUserRole || '')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <PermissionStatus action="manage" resource="roles" showText />
                <PermissionStatus action="assign" resource="roles" showText />
                <PermissionStatus action="read" resource="team" showText />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={Shield} className="h-5 w-5" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {roleStats.map(({ role, count, percentage }) => {
                const RoleIcon = getRoleIcon(role);
                return (
                  <div key={role} className="text-center p-4 border border-gray-200 rounded-lg">
                    <Icon icon={RoleIcon} className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-600">{role}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={Users} className="h-5 w-5" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon icon={RefreshCw} className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2">Loading team members...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon icon={RoleIcon} className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <RoleBadge role={member.role} />
                        
                        <Badge 
                          variant={member.status === 'active' ? 'success' : 'warning'}
                        >
                          {member.status}
                        </Badge>

                        <div className="text-right">
                          <p className="text-xs text-gray-500">Last active</p>
                          <p className="text-sm">
                            {new Date(member.lastActive).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <PermissionButton
                            action="assign"
                            resource="roles"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member.id);
                              setShowRoleEditor(true);
                            }}
                          >
                            <Icon icon={Edit} className="h-4 w-4" />
                          </PermissionButton>

                          <PermissionButton
                            action="manage"
                            resource="permissions"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member.id);
                              setShowPermissionEditor(true);
                            }}
                          >
                            <Icon icon={Key} className="h-4 w-4" />
                          </PermissionButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Only Section */}
        <AdminOnly>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Settings} className="h-5 w-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Icon icon={Shield} className="h-4 w-4" />
                  Role Templates
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Icon icon={Key} className="h-4 w-4" />
                  Permission Matrix
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Icon icon={Warning} className="h-4 w-4" />
                  Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </AdminOnly>

        {/* Permission Summary */}
        {permissionSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={Key} className="h-5 w-5" />
                Your Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissionSummary.resourceAccess.map((access) => (
                  <div key={access.resource} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{access.resource}</span>
                      <Badge 
                        variant={
                          access.level === 'admin' || access.level === 'owner' ? 'success' :
                          access.level === 'write' ? 'warning' : 'secondary'
                        }
                      >
                        {access.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {access.level === 'admin' ? 'Full management access' :
                       access.level === 'write' ? 'Create and edit access' :
                       access.level === 'read' ? 'View only access' : 'No access'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
