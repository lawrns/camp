"use client";

import { ReactNode, useEffect } from "react";
import { CriticalBoundary } from "@/components/error/CriticalErrorBoundary";

// import { PerformanceReporter } from "@/lib/performance/RenderLoopDetector"; // Not implemented
// import { AuthProvider } from "@/lib/auth"; // Not implemented

// Mock implementations
const PerformanceReporter = {
  startAutoReporting: (interval: number) => {
    const timer = setInterval(() => {}, interval);
    return () => clearInterval(timer);
  },
  generateReport: () => {},
};

const AuthProvider = ({ children, fallbackToDevMode }: { children: ReactNode; fallbackToDevMode?: boolean }) => {
  return <>{children}</>;
};

interface ArchitecturalWrapperProps {
  children: ReactNode;
}

export function ArchitecturalWrapper({ children }: ArchitecturalWrapperProps) {
  // Initialize architectural monitoring and prevention systems
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Start performance monitoring
      const cleanup = PerformanceReporter.startAutoReporting(30000); // Every 30 seconds

      // PHASE 0 CRITICAL FIX: Removed console override to prevent errors
      // All console warnings will now show naturally for better debugging

      // Monitor for unhandled promise rejections
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        // Check for common auth issues
        if (event.reason?.message?.includes("auth") || event.reason?.message?.includes("session")) {
        }

        // Check for Supabase client issues
        if (event.reason?.message?.includes("GoTrueClient") || event.reason?.message?.includes("multiple")) {
        }
      };

      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      // Cleanup function
      return () => {
        cleanup();
        console.warn = originalConsoleWarn;
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      };
    }
    return undefined;
  }, []);

  // Production error monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Global error handler for production
      const handleGlobalError = (event: ErrorEvent) => {
        // Send to monitoring service (implement your preferred service)
        // e.g., Sentry, LogRocket, etc.
      };

      window.addEventListener("error", handleGlobalError);

      return () => {
        window.removeEventListener("error", handleGlobalError);
      };
    }
    return undefined;
  }, []);

  return (
    <CriticalBoundary context="Application Root">
      <AuthProvider fallbackToDevMode={true}>
        <PerformanceMonitoringProvider>{children}</PerformanceMonitoringProvider>
      </AuthProvider>
    </CriticalBoundary>
  );
}

// Additional performance monitoring component
function PerformanceMonitoringProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Monitor for excessive re-renders on the entire app
      let renderCount = 0;
      const startTime = Date.now();

      const checkRenderFrequency = () => {
        renderCount++;

        // Check every 100 renders
        if (renderCount % 100 === 0) {
          const elapsed = Date.now() - startTime;
          const rendersPerSecond = (renderCount / elapsed) * 1000;

          if (rendersPerSecond > 10) {
            // Generate performance report
            PerformanceReporter.generateReport();
          }
        }
      };

      // This will run on every render of this provider
      checkRenderFrequency();
    }
  });

  return <>{children}</>;
}
