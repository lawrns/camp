"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Warning as AlertTriangle,
  Clock,
  Code,
  Eye,
  ChatCircle as MessageSquare,
  Monitor,
  Palette,
  FloppyDisk as Save,
  Gear as Settings,
  DeviceMobile as Smartphone,
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
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { Icon } from "@/lib/ui/Icon";

// Widget settings schema
const widgetSettingsSchema = z.object({
  enabled: z.boolean(),
  welcomeMessage: z.string().max(200, "Welcome message too long"),
  placeholderText: z.string().max(100, "Placeholder too long"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  buttonSize: z.enum(["small", "medium", "large"]),
  theme: z.enum(["light", "dark", "auto"]),
  showAgentAvatars: z.boolean(),
  showTypingIndicator: z.boolean(),
  enableSounds: z.boolean(),
  collectEmail: z.boolean(),
  requireEmail: z.boolean(),
  showPoweredBy: z.boolean(),
});

type WidgetSettingsFormData = z.infer<typeof widgetSettingsSchema>;

interface WidgetSettingsFormProps {
  settings: {
    widget?: Partial<WidgetSettingsFormData>;
  } | null;
  isLoading: boolean;
  error: Error | null;
  organizationId: string;
  mailboxId?: number;
}

const positions = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

const buttonSizes = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto (System)" },
];

export function WidgetSettingsForm({
  settings,
  isLoading,
  error,
  organizationId,
  mailboxId = 1,
}: WidgetSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { updateSettings, isUpdating } = useWidgetSettings({ mailboxId });

  const form = useForm<WidgetSettingsFormData>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues: {
      enabled: true,
      welcomeMessage: "Hi! How can we help you today?",
      placeholderText: "Type your message...",
      primaryColor: "#3B82F6",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      position: "bottom-right",
      buttonSize: "medium",
      theme: "light",
      showAgentAvatars: true,
      showTypingIndicator: true,
      enableSounds: true,
      collectEmail: true,
      requireEmail: false,
      showPoweredBy: true,
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
    if (settings?.widget) {
      reset({
        enabled: settings.widget?.enabled ?? true,
        welcomeMessage: settings.widget?.welcomeMessage || "Hi! How can we help you today?",
        placeholderText: settings.widget?.placeholderText || "Type your message...",
        primaryColor: settings.widget?.primaryColor || "#3B82F6",
        backgroundColor: settings.widget?.backgroundColor || "#FFFFFF",
        textColor: settings.widget?.textColor || "#1F2937",
        position: settings.widget?.position || "bottom-right",
        buttonSize: settings.widget?.buttonSize || "medium",
        theme: settings.widget?.theme || "light",
        showAgentAvatars: settings.widget?.showAgentAvatars ?? true,
        showTypingIndicator: settings.widget?.showTypingIndicator ?? true,
        enableSounds: settings.widget?.enableSounds ?? true,
        collectEmail: settings.widget?.collectEmail ?? true,
        requireEmail: settings.widget?.requireEmail ?? false,
        showPoweredBy: settings.widget?.showPoweredBy ?? true,
      });
    }
  }, [settings, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: WidgetSettingsFormData) => {
    setIsSaving(true);
    try {
      // Map form data to tRPC widget settings format
      const widgetData = {
        mailboxId,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        welcomeMessage: data.welcomeMessage,
        placeholderText: data.placeholderText,
        position: data.position,
        showTypingIndicator: data.showTypingIndicator,
        enableSoundNotifications: data.enableSounds,
        isActive: data.enabled,
      };

      await updateSettings(widgetData);
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to update widget settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <WidgetSettingsFormSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load widget settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
      </Alert>
    );
  }

  const formData = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Widget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={MessageSquare} className="h-5 w-5" />
            Widget Status
          </CardTitle>
          <CardDescription>Enable or disable the chat widget on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Chat Widget</Label>
              <p className="text-foreground text-sm">Turn the chat widget on or off for your website</p>
            </div>
            <Switch
              id="enabled"
              checked={watch("enabled")}
              onCheckedChange={(checked: boolean) => setValue("enabled", checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Palette} className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your chat widget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-spacing-sm">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="primaryColor"
                  type="color"
                  {...register("primaryColor")}
                  className="h-10 w-16 cursor-pointer rounded border spacing-1"
                />
                <Input
                  value={watch("primaryColor")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("primaryColor", e.target.value, { shouldDirty: true })
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
              {errors.primaryColor && <p className="text-sm text-red-600">{errors.primaryColor.message}</p>}
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  {...register("backgroundColor")}
                  className="h-10 w-16 cursor-pointer rounded border spacing-1"
                />
                <Input
                  value={watch("backgroundColor")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("backgroundColor", e.target.value, { shouldDirty: true })
                  }
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
              {errors.backgroundColor && <p className="text-sm text-red-600">{errors.backgroundColor.message}</p>}
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="textColor"
                  type="color"
                  {...register("textColor")}
                  className="h-10 w-16 cursor-pointer rounded border spacing-1"
                />
                <Input
                  value={watch("textColor")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("textColor", e.target.value, { shouldDirty: true })
                  }
                  placeholder="#1F2937"
                  className="flex-1"
                />
              </div>
              {errors.textColor && <p className="text-sm text-red-600">{errors.textColor.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-spacing-sm">
              <Label htmlFor="position">Position</Label>
              <Select
                value={watch("position")}
                onValueChange={(value) =>
                  setValue("position", value as "bottom-right" | "bottom-left" | "top-right" | "top-left", {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="buttonSize">Button Size</Label>
              <Select
                value={watch("buttonSize")}
                onValueChange={(value) =>
                  setValue("buttonSize", value as "small" | "medium" | "large", { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buttonSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={watch("theme")}
                onValueChange={(value) => setValue("theme", value as "light" | "dark" | "auto", { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Customize the text shown to visitors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-spacing-sm">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              {...register("welcomeMessage")}
              placeholder="Hi! How can we help you today?"
              rows={2}
              className={errors.welcomeMessage ? "border-brand-mahogany-500" : ""}
            />
            {errors.welcomeMessage && <p className="text-sm text-red-600">{errors.welcomeMessage.message}</p>}
            <p className="text-tiny text-[var(--fl-color-text-muted)]">
              {watch("welcomeMessage")?.length || 0}/200 characters
            </p>
          </div>

          <div className="space-y-spacing-sm">
            <Label htmlFor="placeholderText">Input Placeholder</Label>
            <Input
              id="placeholderText"
              {...register("placeholderText")}
              placeholder="Type your message..."
              className={errors.placeholderText ? "border-brand-mahogany-500" : ""}
            />
            {errors.placeholderText && <p className="text-sm text-red-600">{errors.placeholderText.message}</p>}
            <p className="text-tiny text-[var(--fl-color-text-muted)]">
              {watch("placeholderText")?.length || 0}/100 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Settings} className="h-5 w-5" />
            Behavior
          </CardTitle>
          <CardDescription>Configure how the widget behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showAgentAvatars">Show Agent Avatars</Label>
                <p className="text-foreground text-sm">Display profile pictures of team members in chat</p>
              </div>
              <Switch
                id="showAgentAvatars"
                checked={watch("showAgentAvatars")}
                onCheckedChange={(checked: boolean) => setValue("showAgentAvatars", checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showTypingIndicator">Typing Indicator</Label>
                <p className="text-foreground text-sm">Show when agents are typing a response</p>
              </div>
              <Switch
                id="showTypingIndicator"
                checked={watch("showTypingIndicator")}
                onCheckedChange={(checked: boolean) => setValue("showTypingIndicator", checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableSounds">Notification Sounds</Label>
                <p className="text-foreground text-sm">Play sounds for new messages and notifications</p>
              </div>
              <Switch
                id="enableSounds"
                checked={watch("enableSounds")}
                onCheckedChange={(checked: boolean) => setValue("enableSounds", checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="collectEmail">Collect Email Addresses</Label>
                <p className="text-foreground text-sm">Ask visitors for their email address</p>
              </div>
              <Switch
                id="collectEmail"
                checked={watch("collectEmail")}
                onCheckedChange={(checked: boolean) => setValue("collectEmail", checked, { shouldDirty: true })}
              />
            </div>

            {watch("collectEmail") && (
              <div className="ml-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireEmail">Require Email</Label>
                  <p className="text-foreground text-sm">Make email address required to start chat</p>
                </div>
                <Switch
                  id="requireEmail"
                  checked={watch("requireEmail")}
                  onCheckedChange={(checked: boolean) => setValue("requireEmail", checked, { shouldDirty: true })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showPoweredBy">Show "Powered by Campfire"</Label>
                <p className="text-foreground text-sm">Display attribution link (required on free plan)</p>
              </div>
              <Switch
                id="showPoweredBy"
                checked={watch("showPoweredBy")}
                onCheckedChange={(checked: boolean) => setValue("showPoweredBy", checked, { shouldDirty: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Eye} className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>See how your widget will look to visitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} leftIcon={<Icon icon={Eye} className="h-4 w-4" />}>
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            <div className="text-foreground flex items-center gap-ds-2 text-sm">
              <Icon icon={Monitor} className="h-4 w-4" />
              <span>Desktop</span>
              <span>•</span>
              <Icon icon={Smartphone} className="h-4 w-4" />
              <span>Mobile</span>
            </div>
          </div>

          {showPreview && (
            <div className="relative min-h-[300px] rounded-ds-lg border bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mt-20 text-center text-[var(--fl-color-text-muted)]">
                <Icon icon={MessageSquare} className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Widget preview would appear here</p>
                <p className="text-sm">Preview functionality coming soon</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Code} className="h-5 w-5" />
            Installation Code
          </CardTitle>
          <CardDescription>Copy this code to your website to install the widget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-ds-lg bg-neutral-900 spacing-3 font-mono text-sm text-neutral-100">
            <pre>{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.campfire.ai/embed.js';
    script.setAttribute('data-widget-id', '${organizationId}');
    document.head.appendChild(script);
  })();
</script>`}</pre>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.campfire.ai/embed.js';
    script.setAttribute('data-widget-id', '${organizationId}');
    document.head.appendChild(script);
  })();
</script>`);
              toast.success("Installation code copied to clipboard");
            }}
          >
            Copy Code
          </Button>
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

function WidgetSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[...Array(3)].map((_, j) => (
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
