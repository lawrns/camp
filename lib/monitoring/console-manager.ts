/**
 * Console Manager - Handles noisy console errors and provides clean logging
 */

// Patterns to suppress from console output
const NOISY_ERROR_PATTERNS = [
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

// Patterns to downgrade from error to warning
const DOWNGRADE_TO_WARNING = [
  "JWT enrichment",
  "Extension interference",
];

export function setupConsoleManager() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');
    
    // Check if this is a noisy error we should suppress
    const shouldSuppress = NOISY_ERROR_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      return; // Suppress the error
    }
    
    // Check if this should be downgraded to a warning
    const shouldDowngrade = DOWNGRADE_TO_WARNING.some(pattern => 
      message.includes(pattern)
    );
    
    if (shouldDowngrade) {
      originalWarn.apply(console, args);
      return;
    }
    
    // Log the original error
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Check if this is a noisy warning we should suppress
    const shouldSuppress = NOISY_ERROR_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      return; // Suppress the warning
    }
    
    // Log the original warning
    originalWarn.apply(console, args);
  };
}

// Auto-setup when this module is imported
if (typeof window !== 'undefined') {
  setupConsoleManager();
} 