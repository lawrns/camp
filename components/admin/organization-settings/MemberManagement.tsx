/**
 * Member Management Component
 *
 * Handles team member invitations, role management, and member operations
 * for organization settings.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { Crown, Eye, Mail, MoreVertical, Shield, UserPlus, Users } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { useToast } from "@/hooks/use-toast";
import { InviteData, Member, MEMBER_ROLES } from "./types";

interface MemberManagementProps {
  members: Member[];
  onInvite?: (data: InviteData) => Promise<void>;
  onUpdateRole?: (userId: string, role: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

export function MemberManagement({ members, onInvite, onUpdateRole, onRemoveMember }: MemberManagementProps) {
  const [inviteData, setInviteData] = useState<InviteData>({
    email: "",
    role: "member",
    message: "",
  });
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email) return;

    setIsInviting(true);
    try {
      await onInvite?.(inviteData);
      setInviteData({ email: "", role: "member", message: "" });
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteData.email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await onUpdateRole?.(userId, newRole);
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await onRemoveMember?.(userId);
      toast({
        title: "Member removed",
        description: "Member has been removed from the organization",
      });
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "member":
        return <Users className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite New Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-ds-2">
                          {getRoleIcon(role.value)}
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="invite-message">Personal Message (Optional)</Label>
              <Input
                id="invite-message"
                placeholder="Welcome to our team!"
                value={inviteData.message}
                onChange={(e) => setInviteData((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={isInviting} className="w-full md:w-auto">
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || member.email.split("@")[0].slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name || member.email.split("@")[0]}</div>
                    <div className="text-sm text-[var(--fl-color-text-muted)]">{member.email}</div>
                    {member.lastActive && (
                      <div className="text-tiny text-gray-400">
                        Last active: {member.lastActive.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </div>
                  </Badge>

                  {member.status && (
                    <Badge
                      variant={
                        member.status === "active" ? "success" : member.status === "pending" ? "warning" : "secondary"
                      }
                    >
                      {member.status}
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleRoleUpdate(member.id, "admin")}
                        disabled={member.role === "owner"}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleUpdate(member.id, "member")}
                        disabled={member.role === "owner"}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleUpdate(member.id, "viewer")}
                        disabled={member.role === "owner"}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Make Viewer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={member.role === "owner"}
                        className="text-red-600"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
                No team members yet. Invite your first member above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
