"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Icon } from "@/lib/ui/Icon";

interface OnboardingStatusCardProps {
  className?: string;
  showDismiss?: boolean;
}

export function OnboardingStatusCard({ className, showDismiss = true }: OnboardingStatusCardProps) {
  const router = useRouter();
  const { status, isLoading, refreshStatus } = useOnboarding();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if completed or dismissed
  if (status?.isCompleted || isDismissed || isLoading) {
    return null;
  }

  // Don't show if no status data
  if (!status) {
    return null;
  }

  const handleContinueOnboarding = () => {
    router.push("/onboarding/enhanced");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage
    localStorage.setItem("campfire-onboarding-card-dismissed", "true");
  };

  const getStepIcon = (stepId: string) => {
    const icons: Record<string, any> = {
      business: Settings,
      challenges: Clock,
      goals: CheckCircle2,
      team: Settings,
      integrations: Settings,
      setup: Sparkles,
    };
    return icons[stepId] || Settings;
  };

  const getStepTitle = (stepId: string) => {
    const titles: Record<string, string> = {
      business: "Business Profile",
      challenges: "Support Challenges",
      goals: "Success Goals",
      team: "Team Structure",
      integrations: "Integrations",
      setup: "Technical Setup",
    };
    return titles[stepId] || stepId;
  };

  const completedCount = status.completedSteps?.length || 0;
  const totalSteps = status.totalSteps || 6;
  const CurrentStepIcon = getStepIcon(status.currentStep?.toString() || "business");

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className="border-status-info-light bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-ds-lg">
                  <Icon icon={Sparkles} className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-gray-900">Complete Your Setup</CardTitle>
                  <CardDescription>
                    Finish configuring Campfire to get the most out of your customer support platform
                  </CardDescription>
                </div>
              </div>
              {showDismiss && (
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="hover:text-foreground text-gray-400">
                  <Icon icon={X} className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Progress Overview */}
            <div className="space-y-spacing-sm">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Progress</span>
                <span className="font-medium text-gray-900">
                  {completedCount} of {totalSteps} steps completed
                </span>
              </div>
              <Progress value={status.completionPercentage} className="h-2" />
              <div className="flex justify-between text-tiny text-[var(--fl-color-text-muted)]">
                <span>{status.completionPercentage}% complete</span>
                {status.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
                  <span>~{status.estimatedTimeRemaining} min remaining</span>
                )}
              </div>
            </div>

            {/* Current Step */}
            <div className="bg-background flex items-center gap-3 rounded-ds-lg border border-blue-100 spacing-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-ds-lg bg-[var(--fl-color-info-subtle)]">
                <CurrentStepIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Next: {getStepTitle(status.currentStep?.toString() || "business")}
                </p>
                <p className="text-foreground text-sm">Continue where you left off</p>
              </div>
              <Badge variant="secondary" className="text-status-info-dark bg-[var(--fl-color-info-subtle)]">
                Current
              </Badge>
            </div>

            {/* Completed Steps Preview */}
            {status.completedSteps && status.completedSteps.length > 0 && (
              <div className="space-y-spacing-sm">
                <p className="text-foreground text-sm font-medium">Completed Steps</p>
                <div className="flex flex-wrap gap-ds-2">
                  {status.completedSteps?.map((stepId: unknown) => {
                    const StepIcon = getStepIcon(stepId);
                    return (
                      <div
                        key={stepId}
                        className="flex items-center gap-ds-2 rounded-ds-md bg-[var(--fl-color-success-subtle)] px-2 py-1 text-sm"
                      >
                        <Icon icon={CheckCircle2} className="text-semantic-success-dark h-3 w-3" />
                        <span className="text-green-600-dark">{getStepTitle(stepId)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {status.summary && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {status.summary.industry && (
                  <div className="bg-background rounded border border-[var(--fl-color-border-subtle)] p-spacing-sm text-center">
                    <p className="text-tiny text-[var(--fl-color-text-muted)]">Industry</p>
                    <p className="text-sm font-medium capitalize">{status.summary.industry}</p>
                  </div>
                )}
                {status.summary.companySize && (
                  <div className="bg-background rounded border border-[var(--fl-color-border-subtle)] p-spacing-sm text-center">
                    <p className="text-tiny text-[var(--fl-color-text-muted)]">Team Size</p>
                    <p className="text-sm font-medium">{status.summary.companySize}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleContinueOnboarding}
                className="bg-primary flex-1 text-white hover:bg-blue-700"
              >
                Continue Setup
                <Icon icon={ArrowRight} className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={refreshStatus} className="px-3">
                <Icon icon={RefreshCw} className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}
