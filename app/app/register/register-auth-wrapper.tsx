"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RegisterAuthWrapperProps {
  children: ReactNode;
}

// Restored auth wrapper with improved error handling
export function RegisterAuthWrapper({ children }: RegisterAuthWrapperProps) {
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Expose auth to window for legacy compatibility
    if (auth && typeof window !== "undefined") {
      (window as any).__CAMPFIRE_AUTH__ = auth;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__CAMPFIRE_AUTH__;
      }
    };
  }, [auth, auth?.loading]);

  // Show loading only if not mounted yet
  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-ds-full border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Mounting...</span>
      </div>
    );
  }

  // Show loading if auth is still loading (with timeout protection from auth provider)
  if (auth?.loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-ds-full border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading auth...</span>
      </div>
    );
  }

  // Show error state if auth failed
  if (auth?.error) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div className="mb-2 text-red-600">Auth Error</div>
          <div className="text-sm text-gray-600">{auth.error instanceof Error ? auth.error.message : String(auth.error)}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
