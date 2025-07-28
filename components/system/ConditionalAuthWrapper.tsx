"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CriticalBoundary } from "@/components/error/CriticalErrorBoundary";
import { CommandPaletteProvider } from "@/components/shared/CommandPalette";
// AuthProvider is now handled at the root level
import { CampfireQueryProvider } from "@/lib/react-query/CampfireQueryProvider";

// Removed RealtimeProvider - using direct Supabase following Helper.ai approach

interface ConditionalAuthWrapperProps {
  children: ReactNode;
}

// Define which routes need authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/inbox",
  "/settings",
  "/profile",
  "/admin",
  "/onboarding",
  "/knowledge",
  "/analytics",
  "/test-notifications",
];
const AUTH_ROUTES = ["/login", "/register", "/reset-password", "/forgot-password"];

// Routes that need auth provider but not authentication
const AUTH_PROVIDER_ROUTES = [...PROTECTED_ROUTES, ...AUTH_ROUTES];

export function ConditionalAuthWrapper({ children }: ConditionalAuthWrapperProps) {
  const pathname = usePathname();

  // QueryClient is now created inside CampfireQueryProvider

  // Check if current route needs auth provider
  const needsAuthProvider = AUTH_PROVIDER_ROUTES.some((route) => pathname?.startsWith(route));

  // Homepage and marketing pages - NO AUTH OVERHEAD
  if (!needsAuthProvider) {
    return <CriticalBoundary context="Public Pages">{children}</CriticalBoundary>;
  }

  // Protected/auth routes - AuthProvider is handled at root level
  const isProtected = PROTECTED_ROUTES.some((route) => pathname?.startsWith(route));
  const content = (
    <CampfireQueryProvider>
      {isProtected ? <CommandPaletteProvider>{children}</CommandPaletteProvider> : children}
    </CampfireQueryProvider>
  );

  return <CriticalBoundary context="Authenticated Pages">{content}</CriticalBoundary>;
}
