"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Warning as AlertTriangle,
  Buildings as Building,
  Clock,
  Globe,
  Envelope as Mail,
  FloppyDisk as Save,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Switch } from "@/components/unified-ui/components/switch";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { Icon } from "@/lib/ui/Icon";

// Form validation schema
const generalSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  timeFormat: z.enum(["12", "24"]),
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralSettingsFormProps {
  settings: any;
  isLoading: boolean;
  error: Error | null;
  organizationId: string;
}

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export function GeneralSettingsForm({ settings, isLoading, error, organizationId }: GeneralSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { updateMultipleSettings } = useOrganizationSettings({ organizationId });

  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      timezone: "UTC",
      language: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12",
      emailNotifications: true,
      marketingEmails: false,
      slug: "",
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
    if (settings?.general) {
      reset({
        name: settings.general?.name || "",
        description: settings.general?.description || "",
        website: settings.general?.website || "",
        timezone: settings.general?.timezone || "UTC",
        language: settings.general?.language || "en",
        dateFormat: settings.general?.dateFormat || "MM/DD/YYYY",
        timeFormat: settings.general?.timeFormat || "12",
        emailNotifications: settings.notifications?.emailNotifications ?? true,
        marketingEmails: settings.notifications?.marketingEmails ?? false,
        slug: settings.general?.slug || "",
      });
    }
  }, [settings, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setIsSaving(true);
    try {
      await updateMultipleSettings({
        general: {
          name: data.name,
          ...(data.description && { description: data.description }),
          ...(data.website && { website: data.website }),
          timezone: data.timezone,
          language: data.language,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
        },
        notifications: {
          emailNotifications: data.emailNotifications,
          smsNotifications: settings?.notifications?.smsNotifications || false,
          marketingEmails: data.marketingEmails,
        },
      });

      toast.success("General settings updated successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <GeneralSettingsFormSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Building} className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-spacing-sm">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter organization name"
                className={errors.name ? "border-brand-mahogany-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="slug">Organization Slug *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="acme-inc"
                className={errors.slug ? "border-brand-mahogany-500" : ""}
              />
              {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
              <p className="text-sm text-[var(--fl-color-text-muted)]">
                Used in URLs and identifiers (cannot be changed later)
              </p>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Icon icon={Globe} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://yourcompany.com"
                  className={`pl-10 ${errors.website ? "border-brand-mahogany-500" : ""}`}
                />
              </div>
              {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
            </div>
          </div>

          <div className="space-y-spacing-sm">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your organization..."
              rows={3}
              className={errors.description ? "border-brand-mahogany-500" : ""}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            <p className="text-tiny text-[var(--fl-color-text-muted)]">
              {watch("description")?.length || 0}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Globe} className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>Configure timezone, language, and date formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-spacing-sm">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select
                value={watch("timezone")}
                onValueChange={(value) => setValue("timezone", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz: string) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && <p className="text-sm text-red-600">{errors.timezone.message}</p>}
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="language">Language *</Label>
              <Select
                value={watch("language")}
                onValueChange={(value: string) => setValue("language", value, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && <p className="text-sm text-red-600">{errors.language.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-spacing-sm">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={watch("dateFormat")}
                onValueChange={(value: string) =>
                  setValue("dateFormat", value as "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD", { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select
                value={watch("timeFormat")}
                onValueChange={(value: string) => setValue("timeFormat", value as "12" | "24", { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Mail} className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-foreground text-sm">Receive notifications about conversations and system updates</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={watch("emailNotifications")}
              onCheckedChange={(checked: boolean) => setValue("emailNotifications", checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-foreground text-sm">Receive updates about new features and product announcements</p>
            </div>
            <Switch
              id="marketingEmails"
              checked={watch("marketingEmails")}
              onCheckedChange={(checked: boolean) => setValue("marketingEmails", checked, { shouldDirty: true })}
            />
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

function GeneralSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="space-y-spacing-sm">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
