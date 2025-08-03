"use client";

import React, { useEffect, useState } from "react";
import { Building2, Calendar, Copy, Shield, Users } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { getUserOrganizationId } from "@/lib/utils/organization";

export function OrganizationDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const orgId = await getUserOrganizationId(user.id);
        setOrganizationId(orgId);
      } catch (err) {
        setError("Failed to load organization details");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [user?.id]);

  const copyOrganizationId = () => {
    if (organizationId) {
      navigator.clipboard.writeText(organizationId);
      toast({
        title: "Copied!",
        description: "Organization ID copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Loading organization information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription className="text-red-600">{error || "No organization found"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-ds-2">
              <Icon icon={Building2} className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>Your organization information and settings</CardDescription>
          </div>
          <Badge variant="secondary">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Organization ID */}
        <div className="space-y-spacing-sm">
          <label className="text-foreground text-sm font-medium">Organization ID</label>
          <div className="flex items-center gap-ds-2">
            <code className="bg-background flex-1 rounded-ds-md px-3 py-2 font-mono text-sm">
              {organizationId}
            </code>
            <Button size="sm" variant="outline" onClick={copyOrganizationId} className="flex items-center gap-1">
              <Icon icon={Copy} className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        {/* Additional Organization Info */}
        <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Icon icon={Calendar} className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-[var(--fl-color-text-muted)]">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Icon icon={Users} className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Team Size</p>
              <p className="text-sm text-[var(--fl-color-text-muted)]">1 member</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Icon icon={Shield} className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Plan</p>
              <p className="text-sm text-[var(--fl-color-text-muted)]">Free Tier</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-4">
          <Button variant="outline" className="w-full">
            Manage Organization Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
