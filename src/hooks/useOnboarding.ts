import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: string | null;
  completedSteps: string[];
  completionPercentage: number;
  estimatedTimeRemaining: number;
  totalSteps: number;
  summary?: {
    industry?: string;
    companySize?: string;
    supportVolume?: string;
    aiTone?: string;
    dashboardLayout?: string;
    widgetColor?: string;
  };
}

export function useOnboarding() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({
    isCompleted: false,
    currentStep: null,
    completedSteps: [],
    completionPercentage: 0,
    estimatedTimeRemaining: 0,
    totalSteps: 6,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch onboarding status
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/onboarding/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user?.id]);

  const completeStep = async (step: string) => {
    try {
      const response = await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ step, action: "complete" }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {}
  };

  const skipOnboarding = async () => {
    try {
      const response = await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "skip" }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {}
  };

  const refreshStatus = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    completeStep,
    skipOnboarding,
    refreshStatus,
  };
}
