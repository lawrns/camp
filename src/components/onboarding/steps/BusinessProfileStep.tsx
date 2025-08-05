"use client";

import { useEffect, useState } from "react";
import { Icon, Icons } from '@/lib/icons/standardized-icons';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";

import { apiGet, apiPost } from "@/lib/utils/api-client";

interface BusinessProfileData {
  industry: string;
  companySize: string;
  supportVolume: string;
  currentSolution: string;
  website: string;
}

interface BusinessProfileStepProps {
  organizationId: string;
  onComplete: (data?: unknown) => void;
  onSkip: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const industryOptions = [
  { value: "technology", label: "Technology & Software" },
  { value: "ecommerce", label: "E-commerce & Retail" },
  { value: "saas", label: "SaaS & Cloud Services" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "finance", label: "Finance & Banking" },
  { value: "education", label: "Education & Training" },
  { value: "consulting", label: "Consulting & Professional Services" },
  { value: "manufacturing", label: "Manufacturing & Industrial" },
  { value: "real-estate", label: "Real Estate & Property" },
  { value: "travel", label: "Travel & Hospitality" },
  { value: "media", label: "Media & Entertainment" },
  { value: "nonprofit", label: "Non-profit & Government" },
  { value: "other", label: "Other" },
];

const companySizeOptions = [
  { value: "1-10", label: "1-10 employees (Startup)" },
  { value: "11-50", label: "11-50 employees (Small business)" },
  { value: "51-200", label: "51-200 employees (Growing company)" },
  { value: "201-1000", label: "201-1000 employees (Mid-size company)" },
  { value: "1000+", label: "1000+ employees (Enterprise)" },
];

const supportVolumeOptions = [
  { value: "low", label: "Low (< 50 tickets/month)" },
  { value: "medium", label: "Medium (50-200 tickets/month)" },
  { value: "high", label: "High (200-1000 tickets/month)" },
  { value: "very-high", label: "Very High (1000+ tickets/month)" },
];

export function BusinessProfileStep({
  organizationId,
  onComplete,
  onSkip,
  onBack,
  isLoading,
}: BusinessProfileStepProps) {
  const [profile, setProfile] = useState<BusinessProfileData>({
    industry: "",
    companySize: "",
    supportVolume: "",
    currentSolution: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing data on mount
  useEffect(() => {
    loadExistingData();
  }, [organizationId]);

  const loadExistingData = async () => {
    try {
      const response = await apiGet("/api/onboarding/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile({
            industry: data.profile.industry || "",
            companySize: data.profile.company_size || "",
            supportVolume: data.profile.support_volume || "",
            currentSolution: data.profile.current_solution || "",
            website: data.profile.website || "",
          });
        }
      }
    } catch (error) {
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profile.industry) {
      newErrors.industry = "Please select your industry";
    }
    if (!profile.companySize) {
      newErrors.companySize = "Please select your company size";
    }
    if (!profile.supportVolume) {
      newErrors.supportVolume = "Please select your support volume";
    }
    if (profile.website && !isValidUrl(profile.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost("/api/onboarding/profile", profile);

      if (response.ok) {
        onComplete(profile);
      } else {
        const errorData = await response.json();

        setErrors({ general: "Failed to save profile. Please try again." });
      }
    } catch (error) {
      setErrors({ general: "Failed to save profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: keyof BusinessProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon icon={Icons.loading} className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-foreground">Loading your business profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Industry */}
        <div className="space-y-spacing-sm">
          <Label htmlFor="industry" className="flex items-center gap-ds-2">
            <Icon icon={Icons.building} className="h-4 w-4" />
            Industry *
          </Label>
          <Select value={profile.industry} onValueChange={(value: string) => updateProfile("industry", value)}>
            <SelectTrigger className={errors.industry ? "border-[var(--fl-color-danger-muted)]" : ""}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-brand-mahogany-500 text-sm">{errors.industry}</p>}
        </div>

        {/* Company Size */}
        <div className="space-y-spacing-sm">
          <Label htmlFor="companySize" className="flex items-center gap-ds-2">
            <Icon icon={Icons.users} className="h-4 w-4" />
            Company Size *
          </Label>
          <Select value={profile.companySize} onValueChange={(value: string) => updateProfile("companySize", value)}>
            <SelectTrigger className={errors.companySize ? "border-[var(--fl-color-danger-muted)]" : ""}>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {companySizeOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && <p className="text-brand-mahogany-500 text-sm">{errors.companySize}</p>}
        </div>

        {/* Support Volume */}
        <div className="space-y-spacing-sm">
          <Label htmlFor="supportVolume" className="flex items-center gap-ds-2">
            <Icon icon={Icons.trending} className="h-4 w-4" />
            Monthly Support Volume *
          </Label>
          <Select
            value={profile.supportVolume}
            onValueChange={(value: string) => updateProfile("supportVolume", value)}
          >
            <SelectTrigger className={errors.supportVolume ? "border-[var(--fl-color-danger-muted)]" : ""}>
              <SelectValue placeholder="Select support volume" />
            </SelectTrigger>
            <SelectContent>
              {supportVolumeOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supportVolume && <p className="text-brand-mahogany-500 text-sm">{errors.supportVolume}</p>}
        </div>

        {/* Website */}
        <div className="space-y-spacing-sm">
          <Label htmlFor="website" className="flex items-center gap-ds-2">
            <Icon icon={Icons.globe} className="h-4 w-4" />
            Website URL
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourcompany.com"
            value={profile.website}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProfile("website", e.target.value)}
            className={errors.website ? "border-[var(--fl-color-danger-muted)]" : ""}
          />
          {errors.website && <p className="text-brand-mahogany-500 text-sm">{errors.website}</p>}
        </div>
      </div>

      {/* Current Solution */}
      <div className="space-y-spacing-sm">
        <Label htmlFor="currentSolution">Current Support Solution</Label>
        <Textarea
          id="currentSolution"
          placeholder="Tell us about your current customer support setup (e.g., Zendesk, Intercom, email, etc.)"
          value={profile.currentSolution}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProfile("currentSolution", e.target.value)}
          rows={3}
        />
        <p className="text-sm text-[var(--fl-color-text-muted)]">
          This helps us understand how to best integrate with your existing workflow
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {loading || isLoading ? (
            <>
              <Icon icon={Icons.loading} className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
