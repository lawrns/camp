"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Default onboarding page that redirects to welcome
 * This handles cases where users access /onboarding directly
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the welcome page
    router.replace("/onboarding/welcome");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-blue-500" />
        <p className="text-gray-600">Redirecting to onboarding...</p>
      </div>
    </div>
  );
}
