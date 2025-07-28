"use client";

import { useEffect } from "react";
import { cleanConsole, disableConsoleCompletely, silenceConsole } from "@/lib/console-cleanup";
import { logger, onlyCriticalErrors, suppressAllLogs } from "@/lib/logger";

interface ConsoleManagerProps {
  mode?: "silent" | "clean" | "critical" | "disable" | "development";
  suppressPatterns?: RegExp[];
  children?: React.ReactNode;
}

export function ConsoleManager({
  mode = process.env.NODE_ENV === "production" ? "silent" : "clean",
  suppressPatterns = [],
  children,
}: ConsoleManagerProps) {
  useEffect(() => {
    // Clear existing console on mount
    console.clear();

    switch (mode) {
      case "silent":
        silenceConsole();
        suppressAllLogs();
        break;

      case "clean":
        cleanConsole();
        logger.configure({ level: "warn" });
        break;

      case "critical":
        silenceConsole();
        onlyCriticalErrors();
        break;

      case "disable":
        disableConsoleCompletely();
        break;

      case "development":
        // Keep all logs in development
        logger.configure({ level: "debug", enableInProduction: false });
        break;
    }

    // Add custom suppress patterns
    if (suppressPatterns.length > 0 && typeof window !== "undefined") {
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        const message = args.join(" ");
        if (!suppressPatterns.some((pattern: any) => pattern.test(message))) {
          originalLog(...args);
        }
      };

      console.warn = (...args) => {
        const message = args.join(" ");
        if (!suppressPatterns.some((pattern: any) => pattern.test(message))) {
          originalWarn(...args);
        }
      };

      console.error = (...args) => {
        const message = args.join(" ");
        if (!suppressPatterns.some((pattern: any) => pattern.test(message))) {
          originalError(...args);
        }
      };
    }

    // Suppress specific noisy errors including browser extension errors
    const errorHandler = (event: ErrorEvent) => {
      const noisyErrors = [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
        "WifiHighHighError when attempting to fetch resource",
        "Failed to fetch",
        "Load failed",
        // Browser extension errors
        "Could not establish connection. Receiving end does not exist",
        "DeviceTrust: access denied",
        "Extension context invalidated",
        "Unchecked runtime.lastError",
        "chrome-extension://",
        "moz-extension://",
        "safari-extension://",
        "1password",
        "lastpass",
        "bitwarden",
        "dashlane",
        // JWT enrichment errors (often caused by extensions)
        "Failed to enrich JWT: {}",
        "Error enriching JWT",
        "JWT enrichment failed",
      ];

      if (noisyErrors.some((err: any) => event.message.includes(err))) {
        event.preventDefault();
        return;
      }
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const noisyRejections = [
        "WifiHighHighError",
        "Failed to fetch",
        "Firebase",
        "Supabase",
        "AbortError",
        // Browser extension rejections
        "Could not establish connection",
        "DeviceTrust: access denied",
        "Extension context invalidated",
        "chrome-extension://",
        "moz-extension://",
        "1password",
        "lastpass",
        "bitwarden",
        "dashlane",
        // JWT enrichment rejections
        "Failed to enrich JWT",
        "Error enriching JWT",
        "JWT enrichment failed",
      ];

      const reason = event.reason?.toString() || "";
      if (noisyRejections.some((err: any) => reason.includes(err))) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", unhandledRejectionHandler);

    // Cleanup
    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler);
    };
  }, [mode, suppressPatterns]);

  return <>{children}</>;
}

// Hook for runtime console control
export function useConsoleControl() {
  return {
    silence: () => silenceConsole(),
    clean: () => cleanConsole(),
    disable: () => disableConsoleCompletely(),
    clear: () => console.clear(),
    restore: () => window.location.reload(), // Only way to fully restore
    showOnly: (patterns: RegExp[]) => {
      cleanConsole();
      // Additional filtering logic
    },
  };
}
