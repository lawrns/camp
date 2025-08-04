"use client";

import { useAuth } from "@/hooks/useAuth";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import {
  ArrowRight,
  Buildings as Building,
  ChatCircle as MessageSquare,
  Sparkle as Sparkles,
  Users,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrganizationData {
  name: string;
  description: string;
  timezone: string;
  language: string;
}

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const auth = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: "",
    description: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: "en",
  });

  const handleCreateOrganization = async () => {
    if (!orgData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session?.access_token || ""}`,
        },
        body: JSON.stringify({
          name: orgData.name,
          description: orgData.description,
          settings: {
            timezone: orgData.timezone,
            language: orgData.language,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create organization");
      }

      // Organization created successfully, move to next step
      setStep(2);
    } catch (error: unknown) {
      setError((error instanceof Error ? error.message : String(error)) || "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToSetup = () => {
    // Redirect to the improved onboarding setup with the organization ID
    router.push(`/onboarding/enhanced?org=${auth.user?.organizationId}`);
  };

  // Check for 'already belongs' error
  const alreadyInOrg = !!(error && error.toLowerCase().includes("already belongs to an organization"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 spacing-4">
      <div className="w-full max-w-xl">
        <OptimizedAnimatePresence mode="wait">
          {step === 1 && (
            <OptimizedMotion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="radius-2xl border border-[var(--fl-color-border)] bg-white/95 spacing-6 shadow-xl md:spacing-8"
            >
              {/* Progress Indicator */}
              <div className="text-status-info-dark mb-2 text-xs font-semibold">Step 1 of 2</div>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center radius-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <Icon icon={Building} className="h-7 w-7 text-white" />
                </div>
                <h1 className="mb-1 text-2xl font-bold text-gray-900">Create Your Organization</h1>
                <p className="text-sm text-gray-600">
                  Set up your workspace to start providing amazing customer support with Campfire.
                </p>
              </div>

              {/* Actionable Error State */}
              {alreadyInOrg && (
                <div
                  className="border-status-error-light mb-4 rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-4 text-center"
                  aria-live="assertive"
                >
                  <p className="mb-2 text-sm text-red-600">You already belong to an organization.</p>
                  <div className="flex flex-col gap-2 md:flex-row md:justify-center">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => router.push("/onboarding/switch-org")}
                      className="rounded bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Switch Organization
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display (inline, only if not alreadyInOrg) */}
              {!alreadyInOrg && error && (
                <div
                  className="border-status-error-light mb-4 rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3 text-center"
                  aria-live="assertive"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Form Card (disabled if already in org) */}
              <div className={alreadyInOrg ? "pointer-events-none opacity-60" : ""}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="orgName" className="mb-1 block text-sm font-medium text-gray-700">
                      Organization Name *
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      value={orgData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOrgData({ ...orgData, name: e.target.value })
                      }
                      className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] px-4 py-2 text-base transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                      placeholder="Acme Inc."
                      disabled={alreadyInOrg || isLoading}
                    />
                    <p className="mt-1 text-xs text-[var(--fl-color-text-muted)]">Organization name must be unique.</p>
                  </div>

                  <div>
                    <label htmlFor="orgDescription" className="mb-1 block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <textarea
                      id="orgDescription"
                      value={orgData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setOrgData({ ...orgData, description: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] px-4 py-2 text-base transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about your organization..."
                      disabled={alreadyInOrg || isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="timezone" className="mb-1 block text-sm font-medium text-gray-700">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        value={orgData.timezone}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setOrgData({ ...orgData, timezone: e.target.value })
                        }
                        className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] px-4 py-2 text-base transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                        disabled={alreadyInOrg || isLoading}
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Australia/Sydney">Sydney</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="language" className="mb-1 block text-sm font-medium text-gray-700">
                        Language
                      </label>
                      <select
                        id="language"
                        value={orgData.language}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setOrgData({ ...orgData, language: e.target.value })
                        }
                        className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] px-4 py-2 text-base transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                        disabled={alreadyInOrg || isLoading}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    onClick={handleCreateOrganization}
                    disabled={isLoading || !orgData.name.trim() || alreadyInOrg}
                    className="flex w-full items-center justify-center gap-2 rounded-ds-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-ds-full border-b-2 border-white"></div>
                        Creating Organization...
                      </>
                    ) : (
                      <>
                        Create Organization
                        <Icon icon={ArrowRight} className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </OptimizedMotion.div>
          )}

          {step === 2 && (
            <OptimizedMotion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-8 text-center shadow-xl"
            >
              {/* Success State */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center radius-2xl bg-[var(--fl-color-success-subtle)]">
                <Icon icon={Sparkles} className="text-semantic-success-dark h-8 w-8" />
              </div>

              <h2 className="mb-4 text-2xl font-bold text-gray-900">Organization Created Successfully!</h2>
              <p className="mb-8 text-gray-600">
                Your workspace is ready. Let's continue setting up your team, chat widget, and AI assistant.
              </p>

              {/* Next Steps Preview */}
              <div className="mb-8 grid grid-cols-3 gap-4">
                <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-4">
                  <Icon icon={Users} className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Invite Team</p>
                </div>
                <div className="rounded-ds-lg bg-purple-50 spacing-4">
                  <Icon icon={MessageSquare} className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                  <p className="text-sm font-medium text-purple-900">Setup Widget</p>
                </div>
                <div className="rounded-ds-lg bg-[var(--fl-color-success-subtle)] spacing-4">
                  <Icon icon={Sparkles} className="text-semantic-success-dark mx-auto mb-2 h-6 w-6" />
                  <p className="text-sm font-medium text-green-900">Configure AI</p>
                </div>
              </div>

              <button
                onClick={handleContinueToSetup}
                className="flex w-full items-center justify-center gap-2 rounded-ds-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continue Setup
                <Icon icon={ArrowRight} className="h-5 w-5" />
              </button>
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </div>
    </div>
  );
}
