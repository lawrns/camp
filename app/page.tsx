"use client";

import { useHomepageVariant } from '@/hooks/useHomepageVariant';
import LegacyHome from './LegacyHome';
import CommieHome from './CommieHome';

/**
 * Root Homepage Component
 * 
 * This component serves as the entry point for the homepage and conditionally
 * renders either the legacy or commie homepage based on the HOMEPAGE_VARIANT
 * feature flag. This allows for safe A/B testing and easy rollback.
 */
export default function HomePage() {
  const variant = useHomepageVariant();

  // Render the appropriate homepage variant based on feature flag
  if (variant === "commie") {
    return <CommieHome />;
  }

  // Default to legacy homepage
  return <LegacyHome />;
}