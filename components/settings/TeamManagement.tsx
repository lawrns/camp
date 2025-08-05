"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle as AlertTriangle, CheckCircle, Clock, Crown, PencilSimple as Edit, Envelope as Mail, Shield, Trash, UserPlus, Users, XCircle,  } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Icon } from "@/lib/ui/Icon";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "agent" | "viewer";
  status: "active" | "pending" | "inactive";
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
}

interface TeamManagementProps {
  organizationId: string;
  isLoading: boolean;
  error: Error | null;
}

const roles = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access to everything",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Can manage team and settings",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "agent",
    label: "Agent",
    description: "Can handle conversations",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access",
    color: "bg-gray-100 text-gray-800",
  },
];

const statusIcons = {
  active: <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />,
  pending: <Icon icon={Clock} className="text-semantic-warning h-4 w-4" />,
  inactive: <Icon icon={XCircle} className="h-4 w-4 text-gray-400" />,
};

export function TeamManagement({ organizationId, isLoading: propsLoading, error: propsError }: TeamManagementProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch team members from real API
  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team-members", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      return response.json();
    },
    enabled: !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const teamMembers = teamData?.members || [];

  // Invite team member mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await fetch(`/api/organizations/${organizationId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) throw new Error("Failed to send invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", organizationId] });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("agent");
      setIsInviteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  const filteredMembers = teamMembers.filter((member: unknown) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const handleResendInvite = async (memberId: string) => {
    try {
      // TODO: Implement resend invitation API endpoint
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}/resend-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to resend invitation");
      }

      toast.success("Invitation resent");
    } catch (error) {
      toast.error("Failed to resend invitation");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }

      queryClient.invalidateQueries({ queryKey: ["team-members", organizationId] });
      toast.success("Team member removed");
    } catch (error) {
      toast.error(`Failed to remove team member: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      queryClient.invalidateQueries({ queryKey: ["team-members", organizationId] });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(`Failed to update role: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const getRoleInfo = (role: string) => {
    return (
      roles.find((r) => r.value === role) ||
      roles[3] || { value: "unknown", label: "Unknown", color: "bg-gray-100 text-gray-800" }
    );
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return "Never";
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return <TeamManagementSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load team members: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Users} className="h-5 w-5" />
                Team Members ({teamMembers.length})
              </CardTitle>
              <CardDescription>Manage your team members, roles, and permissions</CardDescription>
            </div>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger>
                <Icon icon={UserPlus} className="mr-2 h-4 w-4" />
                Invite Member
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation to join your team</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-spacing-sm">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-spacing-sm">
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter((role: unknown) => role.value !== "owner")
                          .map((role: unknown) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex flex-col">
                                <span>{role.label}</span>
                                <span className="text-tiny text-[var(--fl-color-text-muted)]">{role.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    disabled={inviteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Icon icon={Mail} className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role: unknown) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          <div className="space-y-3">
            {filteredMembers.map((member: unknown) => {
              const roleInfo = getRoleInfo(member.role);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-ds-lg border spacing-3 transition-colors hover:bg-[var(--fl-color-background-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n: unknown) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-ds-2">
                        <h4 className="font-medium">{member.name}</h4>
                        {member.role === "owner" && <Icon icon={Crown} className="text-semantic-warning h-4 w-4" />}
                        {statusIcons[member.status as keyof typeof statusIcons]}
                      </div>
                      <p className="text-foreground text-sm">{member.email}</p>
                      <p className="text-tiny text-[var(--fl-color-text-muted)]">
                        Last active: {formatLastActive(member.lastActive)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={roleInfo.color}>{roleInfo.label}</Badge>

                    <Badge
                      variant={
                        member.status === "active" ? "default" : member.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {member.status}
                    </Badge>

                    <div className="flex items-center gap-1">
                      {member.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(member.id)}
                          title="Resend invitation"
                        >
                          <Icon icon={Mail} className="h-4 w-4" />
                        </Button>
                      )}

                      {member.role !== "owner" && (
                        <Select value={member.role} onValueChange={(newRole) => handleRoleChange(member.id, newRole)}>
                          <SelectTrigger className="h-8 w-24 border-0 bg-transparent">
                            <Icon icon={Edit} className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter((role: unknown) => role.value !== "owner")
                              .map((role: unknown) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}

                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-status-error hover:text-red-600-dark hover:bg-[var(--fl-color-danger-subtle)]"
                          title="Remove member"
                        >
                          <Icon icon={Trash} className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
                <Icon icon={Users} className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No team members found</p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Shield} className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>Overview of what each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role: unknown) => (
              <div key={role.value} className="rounded-ds-lg border spacing-3">
                <div className="mb-2 flex items-center gap-ds-2">
                  <Badge className={role.color}>{role.label}</Badge>
                  {role.value === "owner" && <Icon icon={Crown} className="text-semantic-warning h-4 w-4" />}
                </div>
                <p className="text-foreground mb-3 text-sm">{role.description}</p>

                <div className="space-y-1 text-tiny">
                  {role.value === "owner" && (
                    <>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Full admin access</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Billing management</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Delete organization</span>
                      </div>
                    </>
                  )}

                  {(role.value === "owner" || role.value === "admin") && (
                    <>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Manage team</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Configure settings</span>
                      </div>
                    </>
                  )}

                  {(role.value === "owner" || role.value === "admin" || role.value === "agent") && (
                    <>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Handle conversations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                        <span>Access knowledge base</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-1">
                    <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                    <span>View {role.value === "viewer" ? "conversations" : "analytics"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamManagementSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="mt-2 h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>

          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-ds-full" />
                  <div>
                    <Skeleton className="mb-1 h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex gap-ds-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
