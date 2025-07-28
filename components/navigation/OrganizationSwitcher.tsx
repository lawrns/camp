/**
 * Organization Switcher Component
 *
 * Provides multi-tenant organization switching with proper JWT claims injection
 * Supports organization creation, switching, and role-based access control
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, LogOut, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { createClient } from "@/lib/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "pending" | "suspended";
  member_count?: number;
  created_at: string;
}

interface OrganizationSwitcherProps {
  currentOrganization?: Organization;
  className?: string;
}

export function OrganizationSwitcher({ currentOrganization, className }: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const router = useRouter();
  const supabase = createClient();

  // Load user's organizations
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Not authenticated");
      }

      // Get user's organization memberships
      const { data: memberships, error } = await supabase
        .from("organization_members")
        .select(
          `
          organization_id,
          role,
          status,
          organizations!inner (
            id,
            name,
            slug,
            description,
            email,
            created_at
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        throw new Error(`Failed to load organizations: ${error.message}`);
      }

      // Transform data
      const orgs: Organization[] = (memberships || []).map((membership) => ({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        description: membership.organizations.description,
        email: membership.organizations.email,
        role: membership.role,
        status: membership.status,
        created_at: membership.organizations.created_at,
      }));

      setOrganizations(orgs);
    } catch (error) {

      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      setSwitching(true);

      // Update JWT claims using PostgreSQL SECURITY DEFINER function
      const { error } = await supabase.rpc("update_user_organization_claims", {
        new_organization_id: organizationId,
      });

      if (error) {
        throw new Error(`Failed to switch organization: ${error.message}`);
      }

      // Refresh the session to get updated JWT
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {

      }

      toast.success("Organization switched successfully");

      // Redirect to dashboard to refresh context
      router.push("/dashboard");
      router.refresh();
    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Failed to switch organization");
    } finally {
      setSwitching(false);
    }
  };

  const createOrganization = async () => {
    if (!createForm.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setCreating(true);

      // Generate slug from name if not provided
      const slug =
        createForm.slug.trim() ||
        createForm.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: createForm.name.trim(),
          slug: slug,
          description: createForm.description.trim() || null,
        })
        .select()
        .single();

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Add user as owner
      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: org.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      });

      if (memberError) {
        throw new Error(`Failed to add user to organization: ${memberError.message}`);
      }

      toast.success("Organization created successfully");
      setShowCreateDialog(false);
      setCreateForm({ name: "", slug: "", description: "" });

      // Reload organizations and switch to new one
      await loadOrganizations();
      await switchOrganization(org.id);
    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-status-success text-status-success-dark";
      case "admin":
        return "bg-status-info text-status-info-dark";
      case "member":
        return "bg-neutral-100 text-neutral-700";
      case "viewer":
        return "bg-neutral-50 text-neutral-600";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`min-w-[200px] justify-between ${className}`}
            disabled={switching}
          >
            <div className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate">{currentOrganization?.name || "Select Organization"}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Organizations</p>
              <p className="text-tiny leading-none text-muted-foreground">Switch between your organizations</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Current Organization */}
          {currentOrganization && (
            <>
              <div className="px-2 py-1">
                <div className="mb-2 text-tiny font-medium text-muted-foreground">Current</div>
                <Card className="border-brand-blue-200 bg-brand-blue-50">
                  <CardContent className="spacing-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-spacing-sm">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-tiny">
                            {currentOrganization.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{currentOrganization.name}</div>
                          <div className="text-tiny text-muted-foreground">{currentOrganization.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-spacing-sm">
                        <Badge variant="secondary" className={getRoleColor(currentOrganization.role)}>
                          {currentOrganization.role}
                        </Badge>
                        <Check className="h-4 w-4 text-brand-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Other Organizations */}
          {organizations.filter((org) => org.id !== currentOrganization?.id).length > 0 && (
            <>
              <div className="px-2 py-1">
                <div className="mb-2 text-tiny font-medium text-muted-foreground">Switch to</div>
                {organizations
                  .filter((org) => org.id !== currentOrganization?.id)
                  .map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      className="cursor-pointer p-0"
                      onClick={() => switchOrganization(org.id)}
                    >
                      <div className="flex w-full items-center justify-between p-spacing-sm">
                        <div className="flex items-center space-x-spacing-sm">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-tiny">
                              {org.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{org.name}</div>
                            <div className="text-tiny text-muted-foreground">{org.slug}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className={getRoleColor(org.role)}>
                          {org.role}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Create New Organization */}
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>Create a new organization to manage your team and projects.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="grid gap-ds-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-ds-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input
                id="slug"
                placeholder="acme-inc"
                value={createForm.slug}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
              <p className="text-tiny text-muted-foreground">Used in URLs. Will be auto-generated if not provided.</p>
            </div>

            <div className="grid gap-ds-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your organization..."
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createOrganization} disabled={creating}>
              {creating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
