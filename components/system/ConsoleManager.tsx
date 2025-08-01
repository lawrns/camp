"use client";

import { useEffect, useState } from 'react';

/**
 * ConsoleManager - Client-side component that handles proper error logging
 * This component runs on the client and provides structured error reporting
 * FIXED: Removed error suppression anti-pattern (Critical Issue C004)
 * FIXED: Added hydration safety to prevent SSR errors
 */
export function ConsoleManager() {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Set up proper error handling instead of suppression
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Categorize errors for better debugging
      const errorCategories = {
        jwt: ["Failed to enrich JWT", "Error enriching JWT", "JWT enrichment failed"],
        extensions: ["chrome-extension", "moz-extension", "1password", "lastpass", "bitwarden"],
        hydration: ["Warning: Text content did not match", "Warning: Expected server HTML"],
        network: ["Failed to fetch", "NetworkError", "ERR_NETWORK"]
      };
      
      // Categorize the error
      let category = 'unknown';
      for (const [cat, patterns] of Object.entries(errorCategories)) {
        if (patterns.some(pattern => message.includes(pattern))) {
          category = cat;
          break;
        }
      }
      
      // Log with category for better debugging (instead of suppressing)
      originalError(`[${category.toUpperCase()}]`, ...args);
      
      // Send to error tracking service in production
      // Use window.location to detect production environment safely
      const isProduction = typeof window !== 'undefined' && 
        (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
      
      if (isProduction && category !== 'extensions') {
        // TODO: Implement proper error tracking (e.g., Sentry, LogRocket)
        console.info('Error would be sent to tracking service:', { category, message });
      }
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Apply same categorization to warnings
      const warningCategories = {
        jwt: ["Failed to enrich JWT", "Error enriching JWT", "JWT enrichment failed"],
        extensions: ["chrome-extension", "moz-extension"],
        hydration: ["Warning: Text content did not match", "Warning: Expected server HTML"]
      };
      
      let category = 'unknown';
      for (const [cat, patterns] of Object.entries(warningCategories)) {
        if (patterns.some(pattern => message.includes(pattern))) {
          category = cat;
          break;
        }
      }
      
      // Log with category (instead of suppressing)
      originalWarn(`[${category.toUpperCase()}]`, ...args);
    };

    // Cleanup function to restore original console methods
    return () => {
      if (isMounted) {
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  }, [isMounted]);

  // This component doesn't render anything
  return null;
}
