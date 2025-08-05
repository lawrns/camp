/**
 * Simplified organization settings component
 * Demonstrates proper separation of concerns
 */

import React, { useState } from "react";
import { AlertTriangle as AlertCircle, Bell, Buildings as Building, CreditCard, Link as Link2, Spinner as Loader2, FloppyDisk as Save, Shield,  } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationSettings } from "@/components/admin/types";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
// Import the custom hook
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { Icon } from "@/lib/ui/Icon";

interface SimplifiedOrganizationSettingsProps {
  organizationId: string;
}

/**
 * SimplifiedOrganizationSettings - Clean implementation with separated concerns
 *
 * This component focuses purely on UI rendering and form management.
 * All data fetching and business logic is handled by the custom hook.
 */
export function SimplifiedOrganizationSettings({ organizationId }: SimplifiedOrganizationSettingsProps) {
  // UI-only state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Use the custom hook for all data and business logic
  const { settings, isLoading, error, updateSetting, updateMultipleSettings, validateSettings } =
    useOrganizationSettings({ organizationId: organizationId });

  // Local form state for batched updates
  const [formData, setFormData] = useState(settings);

  // Update form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Handle individual field changes
  const handleFieldChange = <K extends keyof OrganizationSettings>(
    category: K,
    field: keyof OrganizationSettings[K],
    value: unknown
  ) => {
    if (!formData) return;

    const cleanedValue = value !== undefined ? value : "";
    setFormData((prev) => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [field]: cleanedValue,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveChanges = async () => {
    if (!formData) return;

    // Validate before saving
    const validation = validateSettings(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      await updateMultipleSettings(formData);
      setHasUnsavedChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-spacing-lg">
        <Icon icon={Loader2} className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertCircle} className="h-4 w-4" />
        <AlertDescription>Failed to load organization settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
      </Alert>
    );
  }

  if (!formData) return null;

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Organization Settings</h2>
        <Button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} className="min-w-[100px]">
          {isSaving ? (
            <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Icon icon={Save} className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="error">
          <Icon icon={AlertCircle} className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings tabs */}
      <Tabs defaultValue="general" className="space-y-3">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Icon icon={Building} className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="billing">
            <Icon icon={CreditCard} className="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Icon icon={Bell} className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Icon icon={Shield} className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Icon icon={Link2} className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={formData.general.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("general", "name", e.target.value)
                  }
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="org-website">Website</Label>
                <Input
                  id="org-website"
                  type="url"
                  value={formData.general.website || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("general", "website", e.target.value)
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={formData.general.description || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleFieldChange("general", "description", e.target.value)
                  }
                  placeholder="Brief description of your organization"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Manage your subscription and billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="billing-plan">Current Plan</Label>
                <Select
                  value={formData.billing.plan}
                  onValueChange={(value) => handleFieldChange("billing", "plan", value)}
                >
                  <SelectTrigger id="billing-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  value={formData.billing.billingEmail || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("billing", "billingEmail", e.target.value)
                  }
                  placeholder="billing@example.com"
                />
              </div>

              <div className="flex items-center space-x-spacing-sm">
                <Switch
                  id="auto-renew"
                  checked={formData.billing.autoRenew}
                  onChange={(e) => handleFieldChange("billing", "autoRenew", e.target.checked)}
                />
                <Label htmlFor="auto-renew">Enable auto-renewal</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would follow the same pattern... */}
      </Tabs>
    </div>
  );
}
