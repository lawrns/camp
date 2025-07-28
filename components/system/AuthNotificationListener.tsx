"use client";

import { useEffect } from "react";
import { toast } from "@/components/unified-ui/components/Toast";

/**
 * AuthNotificationListener
 *
 * Listens for auth-notification custom events and displays them using the toast system
 */
export function AuthNotificationListener() {
  useEffect(() => {
    const handleAuthNotification = (event: CustomEvent) => {
      const { message, type } = event.detail;

      // Map auth notification types to toast variants
      const variantMap: Record<string, "default" | "destructive"> = {
        info: "default",
        warning: "default",
        error: "destructive",
      };

      const variant = variantMap[type] || "default";

      // Only show notifications in development or for non-401 errors
      // 401 errors during auth initialization are expected and shouldn't spam users
      if (process.env.NODE_ENV === "development" || type !== "warning") {
        toast({
          title: type === "error" ? "Authentication Error" : "Authentication",
          description: message,
          variant,
          duration: type === "error" ? 5000 : 3000,
        });
      }

      // Always log to console in development
      if (process.env.NODE_ENV === "development") {

      }
    };

    // Listen for auth notification events
    window.addEventListener("auth-notification", handleAuthNotification as EventListener);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("auth-notification", handleAuthNotification as EventListener);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
