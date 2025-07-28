'use client';

import { useEffect, ReactNode } from 'react';
import { initializeExtensionIsolation } from '@/lib/auth/extension-isolation';
import { initializeConsoleErrorSuppression } from '@/lib/utils/console-error-suppression';

interface ExtensionIsolationProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * Global provider that initializes browser extension isolation
 * for the entire application. Should be placed high in the component tree.
 */
export function ExtensionIsolationProvider({
  children,
  enabled = true
}: ExtensionIsolationProviderProps) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // Initialize console error suppression first
    const consoleCleanup = initializeConsoleErrorSuppression();

    // Initialize extension isolation with global settings
    const extensionCleanup = initializeExtensionIsolation({
      suppressErrors: true,
      isolateFormSubmission: false, // Let individual forms handle this
      preventExtensionInjection: false,
      enableFallbackHandling: true,
    });

    // Log initialization for debugging
    console.info('[ExtensionIsolation] Global extension isolation initialized');

    return () => {
      consoleCleanup();
      extensionCleanup();
    };
  }, [enabled]);

  return <>{children}</>;
}
