"use client";

import { useEffect } from 'react';

/**
 * ConsoleManager - Client-side component that handles proper error logging
 * This component runs on the client and provides structured error reporting
 * FIXED: Removed error suppression anti-pattern (Critical Issue C004)
 */
export function ConsoleManager() {
  useEffect(() => {
    // Set up proper error handling instead of suppression
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
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

    console.warn = (...args) => {
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
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
