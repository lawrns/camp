/**
 * Onboarding Guard Middleware
 * Ensures users complete onboarding before accessing protected routes
 */

import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface OnboardingStatus {
  isCompleted: boolean;
  hasOrganization: boolean;
  currentStep: string;
  completionPercentage: number;
}

export async function checkOnboardingStatus(request: NextRequest): Promise<OnboardingStatus | null> {
  try {
    const cookieStore = request.cookies;
    const supabaseClient = supabase.server({
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options?: unknown) => { },
      remove: (name: string, options?: unknown) => { },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // Check if user has an organization
    const { data: orgMember } = await supabaseClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const hasOrganization = !!orgMember?.organization_id;

    if (!hasOrganization) {
      return {
        isCompleted: false,
        hasOrganization: false,
        currentStep: "organization",
        completionPercentage: 0,
      };
    }

    // Check onboarding completion status
    const { data: progress } = await supabaseClient
      .from("onboarding_completion_tracking")
      .select("*")
      .eq("organization_id", orgMember.organization_id)
      .eq("user_id", user.id)
      .single();

    if (!progress) {
      return {
        isCompleted: false,
        hasOrganization: true,
        currentStep: "business",
        completionPercentage: 0,
      };
    }

    return {
      isCompleted: progress.is_completed || false,
      hasOrganization: true,
      currentStep: progress.current_step || "business",
      completionPercentage: progress.completion_percentage || 0,
    };
  } catch (error) {
    return null;
  }
}

export function shouldRedirectToOnboarding(
  pathname: string,
  status: OnboardingStatus | null
): { shouldRedirect: boolean; redirectPath?: string } {
  // Don't redirect if status check failed
  if (!status) {
    return { shouldRedirect: false };
  }

  // Don't redirect if already completed
  if (status.isCompleted) {
    return { shouldRedirect: false };
  }

  // Don't redirect if already on onboarding pages
  if (pathname.startsWith("/onboarding")) {
    return { shouldRedirect: false };
  }

  // Don't redirect for auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth")) {
    return { shouldRedirect: false };
  }

  // Don't redirect for API routes
  if (pathname.startsWith("/api")) {
    return { shouldRedirect: false };
  }

  // Don't redirect for public assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return { shouldRedirect: false };
  }

  // Redirect to organization creation if no organization
  if (!status.hasOrganization) {
    return {
      shouldRedirect: true,
      redirectPath: "/onboarding/organization",
    };
  }

  // Redirect to improved onboarding if not completed
  return {
    shouldRedirect: true,
    redirectPath: "/onboarding/enhanced",
  };
}

export async function onboardingMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Check onboarding status
  const status = await checkOnboardingStatus(request);

  // Determine if redirect is needed
  const { shouldRedirect, redirectPath } = shouldRedirectToOnboarding(pathname, status);

  if (shouldRedirect && redirectPath) {
    const url = request.nextUrl.clone();
    url.pathname = redirectPath;

    // Preserve query parameters if redirecting to improved onboarding
    if (redirectPath === "/onboarding/enhanced" && status?.hasOrganization) {
      // We could add the organization ID here if needed
      // url.searchParams.set('step', status.currentStep);
    }

    return NextResponse.redirect(url);
  }

  return null;
}

/**
 * Helper function to get onboarding progress for client-side use
 */
export function getOnboardingProgress(
  completedSteps: string[],
  totalSteps: number = 6
): {
  percentage: number;
  nextStep: string | null;
  isCompleted: boolean;
} {
  const stepOrder = ["business", "challenges", "goals", "team", "integrations", "setup"];
  const completedCount = completedSteps.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const isCompleted = percentage >= 100;

  const nextStep = stepOrder.find((step) => !completedSteps.includes(step)) || null;

  return {
    percentage,
    nextStep,
    isCompleted,
  };
}

/**
 * Helper function to estimate time remaining
 */
export function estimateTimeRemaining(completedSteps: string[], totalSteps: number = 6): number {
  const remainingSteps = totalSteps - completedSteps.length;
  const minutesPerStep = 5; // Average 5 minutes per step
  return Math.max(0, remainingSteps * minutesPerStep);
}

/**
 * Helper function to determine if a step is accessible
 */
export function isStepAccessible(stepId: string, completedSteps: string[]): boolean {
  const stepOrder = ["business", "challenges", "goals", "team", "integrations", "setup"];
  const stepIndex = stepOrder.indexOf(stepId);

  if (stepIndex === -1) return false;
  if (stepIndex === 0) return true; // First step is always accessible

  // Check if previous step is completed
  const previousStep = stepOrder[stepIndex - 1]!;
  return completedSteps.includes(previousStep);
}

/**
 * Helper function to get step completion status
 */
export function getStepCompletionStatus(completedSteps: string[]): Record<string, boolean> {
  const stepOrder = ["business", "challenges", "goals", "team", "integrations", "setup"];
  const status: Record<string, boolean> = {};

  stepOrder.forEach((step: unknown) => {
    status[step] = completedSteps.includes(step);
  });

  return status;
}
