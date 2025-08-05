"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Buildings as Building2, Spinner as Loader2, Sparkle as Sparkles } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { apiPost } from "@/lib/utils/api-client";

export default function WelcomePage() {
  const { user } = useAuth();
  const organizationId = user && "organizationId" in user ? user.organizationId : undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");

  // Check if user already has an organization and redirect to setup
  useEffect(() => {
    if (user && organizationId) {
      router.push(`/onboarding/setup?org=${organizationId}`);
    }
  }, [user, organizationId, router]);

  async function handleCreateOrganization() {
    if (!organizationName.trim()) {
      setError("Please enter an organization name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiPost("/api/organizations", {
        name: organizationName.trim(),
        description: `${organizationName} support team`,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to parse response" }));

        throw new Error(data.error || `Failed to create organization (${response.status})`);
      }

      const responseData = await response.json();

      const { data } = responseData;
      const { organization } = data;

      if (!organization?.id) {
        throw new Error("Organization created but no ID returned");
      }

      // Small delay to ensure organization is fully created
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to onboarding steps
      router.push(`/onboarding/setup?org=${organization.id}`);
    } catch (error) {
      setError(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <Card className="border-0 bg-white shadow-xl">
        <CardHeader className="pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-600 to-blue-700">
            <Icon icon={Sparkles} className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Welcome to Campfire! 🔥</CardTitle>
          <CardDescription className="mt-2 text-lg text-gray-600">
            Let's set up your organization to get started with AI-powered support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
            <p className="text-gray-700">
              Hello <span className="font-semibold">{user?.email}</span>! We're excited to have you on board. First,
              let's create your organization.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-base font-medium">
                Organization Name
              </Label>
              <div className="relative">
                <Icon
                  icon={Building2}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                />
                <Input
                  id="orgName"
                  placeholder="Acme Inc."
                  value={organizationName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setOrganizationName(e.target.value);
                    setError("");
                  }}
                  className="h-12 pl-10 text-base"
                  disabled={loading}
                />
              </div>
              <p className="text-sm text-[var(--fl-color-text-muted)]">
                This is how your team will identify your workspace
              </p>
            </div>

            {error && (
              <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCreateOrganization}
              disabled={loading || !organizationName.trim()}
              className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-base font-medium text-white hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              {loading ? (
                <>
                  <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                  Creating Organization...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-center text-sm text-[var(--fl-color-text-muted)]">
              Already have an organization? Contact your admin to get invited.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
