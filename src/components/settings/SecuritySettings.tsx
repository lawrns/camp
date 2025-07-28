"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Warning as AlertTriangle,
  Clock,
  Globe,
  Info,
  Key,
  Lock,
  Plus,
  FloppyDisk as Save,
  Shield,
  Trash,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Switch } from "@/components/unified-ui/components/switch";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { Icon } from "@/lib/ui/Icon";
import { ApiKeysManagement } from "./ApiKeysManagement";
import { WebhookManagement } from "./WebhookManagement";

// Security settings schema
const securitySettingsSchema = z.object({
  twoFactorRequired: z.boolean(),
  passwordMinLength: z.number().min(6).max(32),
  passwordRequireSpecialChars: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireUppercase: z.boolean(),
  sessionTimeout: z.number().min(15).max(1440), // 15 minutes to 24 hours
  ipWhitelist: z.array(z.string().ip("Invalid IP address")).optional(),
  ssoEnabled: z.boolean(),
  ssoProvider: z.enum(["google", "microsoft", "okta", "auth0"]).optional(),
  webhookUrl: z.string().url("Invalid webhook URL").optional().or(z.literal("")),
  webhookSecret: z.string().optional(),
  auditLogging: z.boolean(),
  dataRetentionDays: z.number().min(30).max(2555), // 30 days to 7 years
  allowedDomains: z.array(z.string()).optional(),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

interface SecuritySettingsProps {
  settings: any;
  isLoading: boolean;
  error: Error | null;
  organizationId: string;
}

const ssoProviders = [
  { value: "google", label: "Google Workspace", icon: "🔍" },
  { value: "microsoft", label: "Microsoft Azure AD", icon: "🏢" },
  { value: "okta", label: "Okta", icon: "🔐" },
  { value: "auth0", label: "Auth0", icon: "🔑" },
];

export function SecuritySettings({ settings, isLoading, error, organizationId }: SecuritySettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const { updateMultipleSettings } = useOrganizationSettings({ organizationId });

  const form = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorRequired: false,
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 480, // 8 hours
      ipWhitelist: [],
      ssoEnabled: false,
      ssoProvider: undefined,
      webhookUrl: "",
      webhookSecret: "",
      auditLogging: true,
      dataRetentionDays: 365,
      allowedDomains: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = form;

  // Update form when settings load
  useEffect(() => {
    if (settings?.security) {
      reset({
        twoFactorRequired: settings.security?.twoFactorRequired || false,
        passwordMinLength: settings.security?.passwordMinLength || 8,
        passwordRequireSpecialChars: settings.security?.passwordRequireSpecialChars ?? true,
        passwordRequireNumbers: settings.security?.passwordRequireNumbers ?? true,
        passwordRequireUppercase: settings.security?.passwordRequireUppercase ?? true,
        sessionTimeout: settings.security?.sessionTimeout || 480,
        ipWhitelist: settings.security?.ipWhitelist || [],
        ssoEnabled: settings.security?.ssoEnabled || false,
        ssoProvider: settings.security?.ssoProvider,
        webhookUrl: settings.security?.webhookUrl || "",
        webhookSecret: settings.security?.webhookSecret || "",
        auditLogging: settings.security?.auditLogging ?? true,
        dataRetentionDays: settings.security?.dataRetentionDays || 365,
        allowedDomains: settings.security?.allowedDomains || [],
      });
    }
  }, [settings, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: SecuritySettingsFormData) => {
    setIsSaving(true);
    try {
      await updateMultipleSettings({
        security: {
          twoFactorRequired: data.twoFactorRequired,
          ipWhitelist: data.ipWhitelist || [],
          ssoEnabled: data.ssoEnabled,
        },
      });

      toast.success("Security settings updated successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setIsSaving(false);
    }
  };

  const addIpAddress = () => {
    if (!newIpAddress.trim()) return;

    const currentList = watch("ipWhitelist") || [];
    if (currentList.includes(newIpAddress)) {
      toast.error("IP address already in whitelist");
      return;
    }

    setValue("ipWhitelist", [...currentList, newIpAddress], { shouldDirty: true });
    setNewIpAddress("");
    toast.success("IP address added to whitelist");
  };

  const removeIpAddress = (ip: string) => {
    const currentList = watch("ipWhitelist") || [];
    setValue(
      "ipWhitelist",
      currentList.filter((addr: string) => addr !== ip),
      { shouldDirty: true }
    );
    toast.success("IP address removed from whitelist");
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;

    const currentList = watch("allowedDomains") || [];
    if (currentList.includes(newDomain)) {
      toast.error("Domain already in allowed list");
      return;
    }

    setValue("allowedDomains", [...currentList, newDomain], { shouldDirty: true });
    setNewDomain("");
    toast.success("Domain added to allowed list");
  };

  const removeDomain = (domain: string) => {
    const currentList = watch("allowedDomains") || [];
    setValue(
      "allowedDomains",
      currentList.filter((d: string) => d !== domain),
      { shouldDirty: true }
    );
    toast.success("Domain removed from allowed list");
  };

  const generateWebhookSecret = () => {
    const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setValue("webhookSecret", secret, { shouldDirty: true });
    toast.success("New webhook secret generated");
  };

  if (isLoading) {
    return <SecuritySettingsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load security settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Authentication Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Lock} className="h-5 w-5" />
            Authentication Security
          </CardTitle>
          <CardDescription>Configure authentication and password requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="twoFactorRequired">Require Two-Factor Authentication</Label>
              <p className="text-foreground text-sm">Force all team members to enable 2FA</p>
            </div>
            <Switch
              id="twoFactorRequired"
              checked={watch("twoFactorRequired")}
              onCheckedChange={(checked: boolean) => setValue("twoFactorRequired", checked, { shouldDirty: true })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-spacing-sm">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <div className="flex items-center gap-ds-2">
                <Input
                  id="passwordMinLength"
                  type="range"
                  min="6"
                  max="32"
                  {...register("passwordMinLength", { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono text-sm">{watch("passwordMinLength")} chars</span>
              </div>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <div className="flex items-center gap-ds-2">
                <Input
                  id="sessionTimeout"
                  type="range"
                  min="15"
                  max="1440"
                  step="15"
                  {...register("sessionTimeout", { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="w-16 text-center font-mono text-sm">
                  {Math.floor(watch("sessionTimeout") / 60)}h {watch("sessionTimeout") % 60}m
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Password Requirements</Label>
            <div className="space-y-spacing-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm">Require special characters (!@#$%^&*)</span>
                <Switch
                  checked={watch("passwordRequireSpecialChars")}
                  onCheckedChange={(checked: boolean) =>
                    setValue("passwordRequireSpecialChars", checked, { shouldDirty: true })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require numbers (0-9)</span>
                <Switch
                  checked={watch("passwordRequireNumbers")}
                  onCheckedChange={(checked: boolean) =>
                    setValue("passwordRequireNumbers", checked, { shouldDirty: true })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require uppercase letters (A-Z)</span>
                <Switch
                  checked={watch("passwordRequireUppercase")}
                  onCheckedChange={(checked: boolean) =>
                    setValue("passwordRequireUppercase", checked, { shouldDirty: true })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Sign-On */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Key} className="h-5 w-5" />
            Single Sign-On (SSO)
          </CardTitle>
          <CardDescription>Configure SSO integration for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ssoEnabled">Enable SSO</Label>
              <p className="text-foreground text-sm">Allow team members to sign in with SSO</p>
            </div>
            <Switch
              id="ssoEnabled"
              checked={watch("ssoEnabled")}
              onCheckedChange={(checked: boolean) => setValue("ssoEnabled", checked, { shouldDirty: true })}
            />
          </div>

          {watch("ssoEnabled") && (
            <div className="ml-6 space-y-3 border-l-2 border-[var(--fl-color-border)] pl-4">
              <div className="space-y-spacing-sm">
                <Label>SSO Provider</Label>
                <div className="grid grid-cols-1 gap-ds-2 md:grid-cols-2">
                  {ssoProviders.map((provider) => (
                    <button
                      key={provider.value}
                      type="button"
                      onClick={() =>
                        setValue("ssoProvider", provider.value as "google" | "microsoft" | "okta" | "auth0", {
                          shouldDirty: true,
                        })
                      }
                      className={`flex items-center gap-3 rounded-ds-lg border spacing-3 text-left transition-colors ${
                        watch("ssoProvider") === provider.value
                          ? "border-[var(--fl-color-brand)] bg-[var(--fl-color-info-subtle)]"
                          : "border-[var(--fl-color-border)] hover:bg-[var(--fl-color-background-subtle)]"
                      }`}
                    >
                      <span className="text-3xl">{provider.icon}</span>
                      <span className="font-medium">{provider.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {watch("ssoProvider") && (
                <Alert>
                  <Icon icon={Info} className="h-4 w-4" />
                  <AlertDescription>
                    Contact support to complete your {ssoProviders.find((p) => p.value === watch("ssoProvider"))?.label}{" "}
                    integration.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Globe} className="h-5 w-5" />
            Access Control
          </CardTitle>
          <CardDescription>Restrict access by IP address and domain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* IP Whitelist */}
          <div className="space-y-3">
            <Label>IP Address Whitelist</Label>
            <p className="text-foreground text-sm">
              Only allow access from specific IP addresses. Leave empty to allow all IPs.
            </p>

            <div className="flex gap-ds-2">
              <Input
                placeholder="192.168.1.1"
                value={newIpAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIpAddress(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIpAddress())}
              />
              <Button type="button" onClick={addIpAddress} variant="outline">
                <Icon icon={Plus} className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-spacing-sm">
              {(watch("ipWhitelist") || []).map((ip: string) => (
                <div
                  key={ip}
                  className="flex items-center justify-between rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm"
                >
                  <span className="font-mono text-sm">{ip}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIpAddress(ip)}
                    className="text-status-error hover:text-red-600-dark"
                  >
                    <Icon icon={Trash} className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!watch("ipWhitelist") || watch("ipWhitelist")?.length === 0) && (
                <p className="text-sm italic text-[var(--fl-color-text-muted)]">No IP restrictions configured</p>
              )}
            </div>
          </div>

          {/* Allowed Domains */}
          <div className="space-y-3">
            <Label>Allowed Email Domains</Label>
            <p className="text-foreground text-sm">Only allow team members with email addresses from these domains.</p>

            <div className="flex gap-ds-2">
              <Input
                placeholder="company.com"
                value={newDomain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
              />
              <Button type="button" onClick={addDomain} variant="outline">
                <Icon icon={Plus} className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-spacing-sm">
              {(watch("allowedDomains") || []).map((domain: string) => (
                <div
                  key={domain}
                  className="flex items-center justify-between rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm"
                >
                  <span className="font-mono text-sm">@{domain}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDomain(domain)}
                    className="text-status-error hover:text-red-600-dark"
                  >
                    <Icon icon={Trash} className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!watch("allowedDomains") || watch("allowedDomains")?.length === 0) && (
                <p className="text-sm italic text-[var(--fl-color-text-muted)]">No domain restrictions configured</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Globe} className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>Configure webhooks to receive real-time notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookManagement organizationId={organizationId} />
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Key} className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>Manage API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysManagement organizationId={organizationId} />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Shield} className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>Configure data retention and audit logging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auditLogging">Audit Logging</Label>
              <p className="text-foreground text-sm">Log all user actions and security events</p>
            </div>
            <Switch
              id="auditLogging"
              checked={watch("auditLogging")}
              onCheckedChange={(checked: boolean) => setValue("auditLogging", checked, { shouldDirty: true })}
            />
          </div>

          <div className="space-y-spacing-sm">
            <Label htmlFor="dataRetentionDays">Data Retention Period</Label>
            <div className="flex items-center gap-ds-2">
              <Input
                id="dataRetentionDays"
                type="range"
                min="30"
                max="2555"
                step="30"
                {...register("dataRetentionDays", { valueAsNumber: true })}
                className="flex-1"
              />
              <span className="w-20 text-center font-mono text-sm">
                {Math.floor(watch("dataRetentionDays") / 365)} years{" "}
                {Math.floor((watch("dataRetentionDays") % 365) / 30)} months
              </span>
            </div>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">How long to keep conversation data and logs</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex items-center gap-ds-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-orange-600 text-orange-600">
              <Icon icon={Clock} className="mr-1 h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setHasUnsavedChanges(false);
            }}
            disabled={!hasUnsavedChanges || isSaving}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!hasUnsavedChanges || isSaving} className="min-w-[120px]">
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon={Save} className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SecuritySettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
