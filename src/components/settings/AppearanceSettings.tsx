"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle as AlertTriangle, Clock, Download, Eye, Image, Palette, FloppyDisk as Save, Trash, Upload,  } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { Icon } from "@/lib/ui/Icon";

// Appearance settings schema
const appearanceSettingsSchema = z.object({
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  brandName: z.string().max(50, "Brand name too long"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  borderRadius: z.number().min(0).max(20),
  fontFamily: z.enum(["inter", "roboto", "open-sans", "montserrat", "lato"]),
});

type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;

interface AppearanceSettingsProps {
  settings: unknown;
  isLoading: boolean;
  error: Error | null;
  organizationId: string;
}

const colorPresets = [
  { name: "Campfire Blue", primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" },
  { name: "Forest Green", primary: "#10B981", secondary: "#059669", accent: "#34D399" },
  { name: "Sunset Orange", primary: "#F97316", secondary: "#EA580C", accent: "#FB923C" },
  { name: "Royal Purple", primary: "#8B5CF6", secondary: "#7C3AED", accent: "#A78BFA" },
  { name: "Rose Pink", primary: "#EC4899", secondary: "#DB2777", accent: "#F472B6" },
  { name: "Slate Gray", primary: "#64748B", secondary: "#475569", accent: "#94A3B8" },
];

const fontOptions = [
  { value: "inter", label: "Inter", preview: "font-sans" },
  { value: "roboto", label: "Roboto", preview: "font-sans" },
  { value: "open-sans", label: "Open Sans", preview: "font-sans" },
  { value: "montserrat", label: "Montserrat", preview: "font-sans" },
  { value: "lato", label: "Lato", preview: "font-sans" },
];

export function AppearanceSettings({ settings, isLoading, error, organizationId }: AppearanceSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const { updateMultipleSettings } = useOrganizationSettings({ organizationId });

  const form = useForm<AppearanceSettingsFormData>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      logoUrl: "",
      brandName: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      accentColor: "#60A5FA",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      borderRadius: 8,
      fontFamily: "inter",
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
    if (settings?.appearance) {
      const appearanceData = {
        logoUrl: settings.appearance?.logoUrl || "",
        brandName: settings.appearance?.brandName || settings.general?.name || "",
        primaryColor: settings.appearance?.primaryColor || "#3B82F6",
        secondaryColor: settings.appearance?.secondaryColor || "#1E40AF",
        accentColor: settings.appearance?.accentColor || "#60A5FA",
        backgroundColor: settings.appearance?.backgroundColor || "#FFFFFF",
        textColor: settings.appearance?.textColor || "#1F2937",
        borderRadius: settings.appearance?.borderRadius || 8,
        fontFamily: settings.appearance?.fontFamily || "inter",
      };
      reset(appearanceData);
      setLogoPreview(appearanceData.logoUrl);
    }
  }, [settings, reset]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: AppearanceSettingsFormData) => {
    setIsSaving(true);
    try {
      await updateMultipleSettings({
        appearance: {
          brandName: data.brandName,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          borderRadius: data.borderRadius,
          fontFamily: data.fontFamily,
          ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
        },
      });

      toast.success("Appearance settings updated successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to update appearance settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLogoPreview(dataUrl);
        setValue("logoUrl", dataUrl, { shouldDirty: true });
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setValue("primaryColor", preset.primary, { shouldDirty: true });
    setValue("secondaryColor", preset.secondary, { shouldDirty: true });
    setValue("accentColor", preset.accent, { shouldDirty: true });
    toast.success(`Applied ${preset.name} color scheme`);
  };

  if (isLoading) {
    return <AppearanceSettingsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="error">
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>Failed to load appearance settings: {(error instanceof Error ? error.message : String(error))}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Image} className="h-5 w-5" />
            Logo & Branding
          </CardTitle>
          <CardDescription>Upload your logo and set your brand name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-spacing-sm">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  {...register("brandName")}
                  placeholder="Your Company Name"
                  className={errors.brandName ? "border-brand-mahogany-500" : ""}
                />
                {errors.brandName && <p className="text-sm text-red-600">{errors.brandName.message}</p>}
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  {...register("logoUrl")}
                  placeholder="https://yoursite.com/logo.png"
                  className={errors.logoUrl ? "border-brand-mahogany-500" : ""}
                />
                {errors.logoUrl && <p className="text-sm text-red-600">{errors.logoUrl.message}</p>}
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="logoUpload">Upload Logo</Label>
                <input id="logoUpload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logoUpload")?.click()}
                  className="w-full"
                >
                  <Icon icon={Upload} className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="text-tiny text-[var(--fl-color-text-muted)]">Recommended: 200x60px, PNG or SVG format</p>
              </div>
            </div>

            <div className="space-y-spacing-sm">
              <Label>Logo Preview</Label>
              <div className="flex min-h-[120px] items-center justify-center rounded-ds-lg border bg-[var(--fl-color-background-subtle)] spacing-3">
                {logoPreview ? (
                  <div className="text-center">
                    <img src={logoPreview} alt="Logo preview" className="mx-auto mb-2 max-h-16 max-w-full" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoPreview("");
                        setValue("logoUrl", "", { shouldDirty: true });
                      }}
                      className="text-status-error hover:text-red-600-dark"
                    >
                      <Icon icon={Trash} className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Icon icon={Image} className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">No logo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Palette} className="h-5 w-5" />
            Color Scheme
          </CardTitle>
          <CardDescription>Customize your brand colors and theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center gap-3 rounded-ds-lg border spacing-3 text-left transition-colors hover:bg-[var(--fl-color-background-subtle)]"
                >
                  <div className="flex gap-1">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.primary }} />
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.secondary }} />
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
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
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  {...register("secondaryColor")}
                  className="h-10 w-16 cursor-pointer rounded border spacing-1"
                />
                <Input
                  value={watch("secondaryColor")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("secondaryColor", e.target.value, { shouldDirty: true })
                  }
                  placeholder="#1E40AF"
                  className="flex-1"
                />
              </div>
              {errors.secondaryColor && <p className="text-sm text-red-600">{errors.secondaryColor.message}</p>}
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-ds-2">
                <Input
                  id="accentColor"
                  type="color"
                  {...register("accentColor")}
                  className="h-10 w-16 cursor-pointer rounded border spacing-1"
                />
                <Input
                  value={watch("accentColor")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("accentColor", e.target.value, { shouldDirty: true })
                  }
                  placeholder="#60A5FA"
                  className="flex-1"
                />
              </div>
              {errors.accentColor && <p className="text-sm text-red-600">{errors.accentColor.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
        </CardContent>
      </Card>

      {/* Typography & Styling */}
      <Card>
        <CardHeader>
          <CardTitle>Typography & Styling</CardTitle>
          <CardDescription>Customize fonts and visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-spacing-sm">
              <Label htmlFor="fontFamily">Font Family</Label>
              <select
                {...register("fontFamily")}
                className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value} className={font.preview}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-spacing-sm">
              <Label htmlFor="borderRadius">Border Radius</Label>
              <div className="flex items-center gap-ds-2">
                <Input
                  id="borderRadius"
                  type="range"
                  min="0"
                  max="20"
                  {...register("borderRadius", { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono text-sm">{watch("borderRadius")}px</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-spacing-sm">
            <Label>Style Preview</Label>
            <div
              className="space-y-3 rounded-ds-lg border spacing-3"
              style={{
                backgroundColor: watch("backgroundColor"),
                color: watch("textColor"),
                borderRadius: `${watch("borderRadius")}px`,
                fontFamily: watch("fontFamily"),
              }}
            >
              <div className="flex items-center gap-3">
                {logoPreview && <img src={logoPreview} alt="Logo" className="h-8" />}
                <h3 className="font-semibold">{watch("brandName") || "Your Brand"}</h3>
              </div>

              <Button
                type="button"
                style={{
                  backgroundColor: watch("primaryColor"),
                  borderRadius: `${watch("borderRadius")}px`,
                }}
                className="border-0 text-white"
              >
                Primary Button
              </Button>

              <Button
                type="button"
                variant="outline"
                style={{
                  borderColor: watch("secondaryColor"),
                  color: watch("secondaryColor"),
                  borderRadius: `${watch("borderRadius")}px`,
                }}
              >
                Secondary Button
              </Button>

              <div
                className="inline-block rounded px-2 py-1 text-tiny"
                style={{
                  backgroundColor: watch("accentColor"),
                  color: "white",
                  borderRadius: `${watch("borderRadius") * 0.5}px`,
                }}
              >
                Accent Badge
              </div>
            </div>
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
              setLogoPreview("");
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

function AppearanceSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
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
