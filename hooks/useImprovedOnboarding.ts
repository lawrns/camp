import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface OnboardingPreferences {
  aiAssistance: boolean;
  notifications: boolean;
  teamCollaboration: boolean;
  analytics: boolean;
}

export function useImprovedOnboarding() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    aiAssistance: true,
    notifications: true,
    teamCollaboration: true,
    analytics: true,
  });

  const updatePreference = useCallback((key: keyof OnboardingPreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const savePreferences = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("Preferences saved successfully!");

      // Complete onboarding
      await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "complete" }),
      });

      // Redirect to dashboard with onboarding completion flag
      router.push("/dashboard?from=onboarding");
    } catch (error) {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [preferences, router]);

  const skipOnboarding = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "skip" }),
      });

      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to skip onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  return {
    preferences,
    updatePreference,
    savePreferences,
    skipOnboarding,
    isSubmitting,
  };
}
