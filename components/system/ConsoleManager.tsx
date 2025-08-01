"use client";

import { useEffect } from 'react';

/**
 * ConsoleManager - Client-side component that handles console error suppression
 * This component runs on the client and suppresses noisy console errors
 */
export function ConsoleManager() {
  useEffect(() => {
    // Suppress JWT enrichment console errors
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(' ');
      
      // Patterns to suppress from console output
      const noisyErrorPatterns = [
        // JWT enrichment errors (often caused by extensions or network issues)
        "Failed to enrich JWT: {}",
        "Error enriching JWT",
        "JWT enrichment failed",
        "🚨 Failed to enrich JWT: {}",
        "🚨 Error enriching JWT",
        
        // Extension-related errors
        "chrome-extension",
        "moz-extension",
        "1password",
        "lastpass",
        "bitwarden",
        
        // Common React hydration warnings
        "Warning: Text content did not match",
        "Warning: Expected server HTML",
        
        // Network errors that are often temporary
        "Failed to fetch",
        "NetworkError",
        "ERR_NETWORK",
      ];
      
      // Check if this is a noisy error we should suppress
      const shouldSuppress = noisyErrorPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (shouldSuppress) {
        return; // Suppress the error
      }
      
      // Log the original error
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Check if this is a noisy warning we should suppress
      const noisyWarningPatterns = [
        "Failed to enrich JWT: {}",
        "Error enriching JWT",
        "JWT enrichment failed",
        "🚨 Failed to enrich JWT: {}",
        "🚨 Error enriching JWT",
      ];
      
      const shouldSuppress = noisyWarningPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (shouldSuppress) {
        return; // Suppress the warning
      }
      
      // Log the original warning
      originalWarn.apply(console, args);
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
