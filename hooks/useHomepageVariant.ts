"use client";

import { HOMEPAGE_VARIANT } from "@/env.mjs";

/**
 * Hook to access the homepage variant feature flag
 * Returns "legacy" or "commie" based on environment configuration
 */
export function useHomepageVariant() {
  return HOMEPAGE_VARIANT;
} 