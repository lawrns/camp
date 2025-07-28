"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OnboardingStatusCard } from "@/components/dashboard/OnboardingStatusCard";
import { useAuth } from "@/hooks/useAuth";
import { useImprovedOnboarding } from "@/hooks/useImprovedOnboarding";

interface OnboardingIntegrationProps {
  children: React.ReactNode;
  showStatusCard?: boolean;
  enforceCompletion?: boolean;
}

/**
 * OnboardingIntegration Component
 *
 * This component handles:
 * 1. Automatic redirects to onboarding for incomplete users
 * 2. Showing onboarding status cards on dashboard
 * 3. Preventing access to protected features until onboarding is complete
 */
export function OnboardingIntegration({
  children,
  showStatusCard = false,
  enforceCompletion = false,
}: OnboardingIntegrationProps) {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const { progress, isLoading } = useImprovedOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading or no user
    if (isLoading || !user) return;

    // Don't redirect if already on onboarding pages
    if (pathname.startsWith("/onboarding")) return;

    // Don't redirect if onboarding is completed
    if (progress?.isComplete) return;

    // Check if user needs to create organization
    if (!organizationId) {
      router.push("/onboarding/organization");
      return;
    }

    // Check if user should be redirected to onboarding
    if (progress && !progress.isComplete) {
      // Only redirect from dashboard or protected routes
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/dashboard/inbox")) {
        router.push("/onboarding/enhanced");
        return;
      }
    }
  }, [user, organizationId, progress, isLoading, pathname, router]);

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
      </div>
    );
  }

  // If enforcing completion and onboarding is not complete, show enforcement message
  if (enforceCompletion && progress && !progress.isComplete && user && organizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="mx-auto max-w-md p-spacing-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Complete Your Setup</h2>
          <p className="text-foreground mb-6">
            Please complete your Campfire onboarding to access this feature. It only takes a few minutes and helps us
            customize your experience.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/onboarding/enhanced")}
              className="bg-primary w-full rounded-ds-lg px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Complete Setup ({Math.round((progress.completedSteps.length / progress.totalSteps) * 100)}% done)
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-foreground w-full px-6 py-3 transition-colors hover:text-gray-800"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Show onboarding status card if requested and not completed */}
      {showStatusCard && progress && !progress.isComplete && user && organizationId && (
        <div className="mb-6">
          <OnboardingStatusCard />
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Higher-order component for protecting routes that require completed onboarding
 */
export function withOnboardingRequired<P extends object>(Component: React.ComponentType<P>) {
  return function OnboardingRequiredComponent(props: P) {
    return (
      <OnboardingIntegration enforceCompletion={true}>
        <Component {...props} />
      </OnboardingIntegration>
    );
  };
}

/**
 * Hook for checking onboarding completion in components
 */
export function useOnboardingRequired() {
  const { progress, isLoading } = useImprovedOnboarding();
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const isComplete = progress?.isComplete || false;
  const isRequired = user && organizationId && !isComplete;

  return {
    isOnboardingComplete: isComplete,
    isOnboardingRequired: isRequired,
    isLoading,
    completionPercentage: Math.round(((progress?.completedSteps.length || 0) / (progress?.totalSteps || 1)) * 100) || 0,
    currentStep: progress?.currentStep,
  };
}

/**
 * Component for showing onboarding completion celebration
 */
export function OnboardingCompletionCelebration() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background mx-4 max-w-md radius-2xl p-spacing-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-success-subtle)]">
          <svg className="text-semantic-success-dark h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-4 text-3xl font-bold text-gray-900">🎉 Setup Complete!</h2>
        <p className="text-foreground mb-6">
          Congratulations! Your Campfire workspace is now fully configured and ready to provide amazing customer support
          experiences.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-primary w-full rounded-ds-lg px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push("/dashboard/inbox")}
            className="w-full rounded-ds-lg border border-[var(--fl-color-brand)] px-6 py-3 text-blue-600 transition-colors hover:bg-[var(--fl-color-info-subtle)]"
          >
            Start Handling Conversations
          </button>
        </div>
      </div>
    </div>
  );
}
