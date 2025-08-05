"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { ArrowRight, Buildings as Building2, CheckCircle, Spinner as Loader2, Settings as Settings, Users,  } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

export default function EnhancedOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data for different steps
  const [businessInfo, setBusinessInfo] = useState({
    industry: "",
    companySize: "",
    supportVolume: "",
  });

  const [teamInfo, setTeamInfo] = useState({
    teamSize: "",
    currentTools: "",
    challenges: "",
  });

  const [preferences, setPreferences] = useState({
    aiTone: "professional",
    widgetColor: "#3b82f6",
    enableNotifications: true,
  });

  const steps: OnboardingStep[] = [
    {
      id: "business",
      title: "Business Information",
      description: "Tell us about your business to customize your experience",
      icon: Building2,
      completed: false,
    },
    {
      id: "team",
      title: "Team Setup",
      description: "Configure your team and support workflow",
      icon: Users,
      completed: false,
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Customize AI behavior and widget appearance",
      icon: Settings,
      completed: false,
    },
    {
      id: "complete",
      title: "Complete",
      description: "You're all set! Welcome to Campfire",
      icon: CheckCircle,
      completed: false,
    },
  ];

  // Redirect to organization creation if no org ID
  useEffect(() => {
    if (!orgId && user) {
      router.push("/onboarding/welcome");
    }
  }, [orgId, user, router]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError("");

    try {
      // Save onboarding preferences
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...businessInfo,
          ...teamInfo,
          ...preferences,
          organizationId: orgId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // Mark onboarding as complete
      const statusResponse = await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: true,
          organizationId: orgId,
        }),
      });

      if (!statusResponse.ok) {
      }

      // Set completion flag in localStorage
      localStorage.setItem("campfire-onboarding-completed", "true");

      // Redirect to dashboard with onboarding completion flag
      router.push("/dashboard?from=onboarding");
    } catch (error) {
      setError("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Business Information
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, E-commerce, Healthcare"
                value={businessInfo.industry}
                onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <select
                id="companySize"
                className="w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={businessInfo.companySize}
                onChange={(e) => setBusinessInfo({ ...businessInfo, companySize: e.target.value })}
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportVolume">Monthly Support Volume</Label>
              <select
                id="supportVolume"
                className="w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={businessInfo.supportVolume}
                onChange={(e) => setBusinessInfo({ ...businessInfo, supportVolume: e.target.value })}
              >
                <option value="">Select volume</option>
                <option value="<100">Less than 100 tickets</option>
                <option value="100-500">100-500 tickets</option>
                <option value="500-2000">500-2000 tickets</option>
                <option value="2000+">2000+ tickets</option>
              </select>
            </div>
          </div>
        );

      case 1: // Team Setup
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Support Team Size</Label>
              <select
                id="teamSize"
                className="w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={teamInfo.teamSize}
                onChange={(e) => setTeamInfo({ ...teamInfo, teamSize: e.target.value })}
              >
                <option value="">Select team size</option>
                <option value="1">Just me</option>
                <option value="2-5">2-5 people</option>
                <option value="6-15">6-15 people</option>
                <option value="16+">16+ people</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTools">Current Support Tools</Label>
              <Input
                id="currentTools"
                placeholder="e.g., Zendesk, Intercom, Email"
                value={teamInfo.currentTools}
                onChange={(e) => setTeamInfo({ ...teamInfo, currentTools: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Main Support Challenges</Label>
              <Textarea
                id="challenges"
                placeholder="What are your biggest support challenges?"
                value={teamInfo.challenges}
                onChange={(e) => setTeamInfo({ ...teamInfo, challenges: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 2: // Preferences
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="aiTone">AI Response Tone</Label>
              <select
                id="aiTone"
                className="w-full rounded-ds-md border border-[var(--fl-color-border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.aiTone}
                onChange={(e) => setPreferences({ ...preferences, aiTone: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="widgetColor">Widget Color</Label>
              <Input
                id="widgetColor"
                type="color"
                value={preferences.widgetColor}
                onChange={(e) => setPreferences({ ...preferences, widgetColor: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="notifications"
                type="checkbox"
                checked={preferences.enableNotifications}
                onChange={(e) => setPreferences({ ...preferences, enableNotifications: e.target.checked })}
                className="rounded border-[var(--fl-color-border-strong)] text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="notifications">Enable email notifications</Label>
            </div>
          </div>
        );

      case 3: // Complete
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-success-subtle)]">
              <Icon icon={CheckCircle} className="text-semantic-success-dark h-8 w-8" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">You're all set!</h3>
              <p className="text-gray-600">
                Welcome to Campfire! Your AI-powered support system is ready to help you deliver exceptional customer
                experiences.
              </p>
            </div>
            <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-4">
              <h4 className="mb-2 font-medium text-blue-900">What's next?</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Explore your dashboard and analytics</li>
                <li>• Set up your chat widget</li>
                <li>• Invite team members</li>
                <li>• Configure your knowledge base</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user || !orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-ds-full ${index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-[var(--fl-color-text-muted)]"
                    }`}
                >
                  {index < currentStep ? (
                    <Icon icon={CheckCircle} className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-2 h-1 w-16 ${index < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Main content */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
              {steps[currentStep] &&
                React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-blue-600" })}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{steps[currentStep]?.title || ""}</CardTitle>
            <CardDescription className="text-lg">{steps[currentStep]?.description || ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}

            {error && (
              <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep === steps.length - 1 ? "Completing..." : "Processing..."}
                  </>
                ) : (
                  <>
                    {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
                    {currentStep < steps.length - 1 && <Icon icon={ArrowRight} className="ml-2 h-4 w-4" />}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
