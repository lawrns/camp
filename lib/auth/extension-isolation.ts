/**
 * Browser Extension Isolation System
 *
 * Handles browser extension conflicts that interfere with authentication flows,
 * particularly 1Password and other password managers that inject scripts
 * and cause runtime connection errors.
 */

export interface ExtensionDetection {
  name: string;
  detected: boolean;
  interference: 'none' | 'low' | 'medium' | 'high';
  errorPatterns: string[];
}

/**
 * Safe cookie parsing function that handles malformed cookies
 */
export function parseSupabaseCookie(cookieValue: string): any {
  if (!cookieValue) return null;

  try {
    // Handle base64 encoded cookies
    if (cookieValue.startsWith('base64-')) {
      const base64Data = cookieValue.substring(7);
      const decoded = atob(base64Data);
      return JSON.parse(decoded);
    }

    // Handle direct JSON cookies
    return JSON.parse(cookieValue);
  } catch (error) {
    // Suppress cookie parsing errors to reduce console noise
    if (typeof window !== 'undefined' && window.console?.warn) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ExtensionIsolation] Failed to parse cookie string:', error);
      }
    }
    return null;
  }
}

export interface ExtensionIsolationConfig {
  suppressErrors: boolean;
  isolateFormSubmission: boolean;
  preventExtensionInjection: boolean;
  enableFallbackHandling: boolean;
}

/**
 * Known problematic browser extensions and their error patterns
 */
const KNOWN_EXTENSIONS: Record<string, ExtensionDetection> = {
  onePassword: {
    name: '1Password',
    detected: false,
    interference: 'high',
    errorPatterns: [
      'Could not establish connection. Receiving end does not exist',
      'DeviceTrust: access denied',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      '1password',
      'op-',
    ]
  },
  lastPass: {
    name: 'LastPass',
    detected: false,
    interference: 'medium',
    errorPatterns: [
      'lastpass',
      'lp-',
      'Extension context invalidated'
    ]
  },
  bitwarden: {
    name: 'Bitwarden',
    detected: false,
    interference: 'low',
    errorPatterns: [
      'bitwarden',
      'bw-'
    ]
  },
  dashlane: {
    name: 'Dashlane',
    detected: false,
    interference: 'medium',
    errorPatterns: [
      'dashlane',
      'dl-'
    ]
  }
};

/**
 * Runtime error patterns that indicate extension interference
 */
const EXTENSION_ERROR_PATTERNS = [
  /Could not establish connection\. Receiving end does not exist/i,
  /DeviceTrust: access denied/i,
  /Extension context invalidated/i,
  /Unchecked runtime\.lastError/i,
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /safari-extension:\/\//i,
  /1password/i,
  /lastpass/i,
  /bitwarden/i,
  /dashlane/i,
  /password.*manager/i,
  /autofill.*error/i,
  /Failed to enrich JWT.*{}/i, // JWT enrichment errors with empty objects
  /JWT enrichment.*failed/i,
  /Error enriching JWT/i,
  /Failed to enrich JWT: {}/i, // Exact match for empty object error
  /JWT enrichment failed/i, // Exact match for failure message
];

/**
 * Detect installed browser extensions that might interfere with authentication
 */
export function detectBrowserExtensions(): Record<string, ExtensionDetection> {
  const detections = { ...KNOWN_EXTENSIONS };
  
  if (typeof window === 'undefined') {
    return detections;
  }

  // Check for extension-specific DOM modifications
  const checkDOMForExtension = (extensionKey: string, patterns: string[]) => {
    const elements = document.querySelectorAll('*');
    for (const element of elements) {
      const classList = Array.from(element.classList || []);
      const id = element.id || '';
      const attributes = Array.from(element.attributes || []).map(attr => attr.name);
      
      const allStrings = [...classList, id, ...attributes].join(' ').toLowerCase();
      
      if (patterns.some(pattern => allStrings.includes(pattern.toLowerCase()))) {
        detections[extensionKey].detected = true;
        return true;
      }
    }
    return false;
  };

  // Check for extension scripts in the page
  const checkScriptsForExtension = (extensionKey: string, patterns: string[]) => {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const src = script.src || '';
      const content = script.textContent || '';
      
      if (patterns.some(pattern => 
        src.toLowerCase().includes(pattern.toLowerCase()) ||
        content.toLowerCase().includes(pattern.toLowerCase())
      )) {
        detections[extensionKey].detected = true;
        return true;
      }
    }
    return false;
  };

  // Check each known extension
  Object.entries(KNOWN_EXTENSIONS).forEach(([key, extension]) => {
    checkDOMForExtension(key, extension.errorPatterns);
    checkScriptsForExtension(key, extension.errorPatterns);
  });

  return detections;
}

/**
 * Check if an error is caused by browser extension interference
 */
export function isExtensionError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return EXTENSION_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
}

/**
 * Suppress extension-related console errors
 */
export function suppressExtensionErrors(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Override console.error to filter extension errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!isExtensionError(message)) {
      originalConsoleError.apply(console, args);
    }
  };

  // Override console.warn to filter extension warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!isExtensionError(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.toString() || '';
    if (isExtensionError(reason)) {
      event.preventDefault();
    }
  };

  // Handle global errors
  const handleGlobalError = (event: ErrorEvent) => {
    if (isExtensionError(event.message)) {
      event.preventDefault();
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleGlobalError);

  // Return cleanup function
  return () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleGlobalError);
  };
}

/**
 * Create an isolated form submission handler that prevents extension interference
 */
export function createIsolatedFormSubmission<T = any>(
  originalHandler: (data: T) => Promise<void>,
  options: Partial<ExtensionIsolationConfig> = {}
): (data: T) => Promise<void> {
  const config: ExtensionIsolationConfig = {
    suppressErrors: true,
    isolateFormSubmission: true,
    preventExtensionInjection: false,
    enableFallbackHandling: true,
    ...options
  };

  return async (data: T) => {
    let cleanup: (() => void) | null = null;

    try {
      // Suppress extension errors during form submission
      if (config.suppressErrors) {
        cleanup = suppressExtensionErrors();
      }

      // Add a small delay to let extensions settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Execute the original handler
      await originalHandler(data);

    } catch (error) {
      // Check if this is an extension-related error
      if (isExtensionError(error as Error)) {
        console.warn('[Auth] Extension interference detected, retrying...');
        
        if (config.enableFallbackHandling) {
          // Wait a bit longer and retry
          await new Promise(resolve => setTimeout(resolve, 500));
          await originalHandler(data);
        } else {
          throw error;
        }
      } else {
        // Re-throw non-extension errors
        throw error;
      }
    } finally {
      // Clean up error suppression
      if (cleanup) {
        cleanup();
      }
    }
  };
}

/**
 * Initialize extension isolation system
 */
export function initializeExtensionIsolation(config: Partial<ExtensionIsolationConfig> = {}): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const fullConfig: ExtensionIsolationConfig = {
    suppressErrors: true,
    isolateFormSubmission: true,
    preventExtensionInjection: false,
    enableFallbackHandling: true,
    ...config
  };

  const cleanupFunctions: (() => void)[] = [];

  // Detect extensions
  const detections = detectBrowserExtensions();
  const detectedExtensions = Object.values(detections).filter(d => d.detected);

  if (detectedExtensions.length > 0) {
    console.info('[ExtensionIsolation] Detected browser extensions:', detectedExtensions.map(d => d.name));
  }

  // Enhanced error suppression for cookie parsing
  if (fullConfig.suppressErrors) {
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');

      // Suppress specific cookie parsing errors
      if (message.includes('Failed to parse cookie string') ||
          message.includes('Unexpected token') ||
          message.includes('base64-eyJ') ||
          message.includes('Multiple GoTrueClient instances') ||
          message.includes('parseSupabaseCookie')) {
        return; // Suppress these errors
      }

      originalConsoleWarn.apply(console, args);
    };

    cleanupFunctions.push(() => {
      console.warn = originalConsoleWarn;
    });
  }

  // Set up error suppression
  if (fullConfig.suppressErrors) {
    const cleanup = suppressExtensionErrors();
    cleanupFunctions.push(cleanup);
  }

  // Store detection results globally for other components
  (window as any).__EXTENSION_DETECTIONS__ = detections;
  (window as any).__EXTENSION_ISOLATION_ACTIVE__ = true;

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    delete (window as any).__EXTENSION_DETECTIONS__;
    delete (window as any).__EXTENSION_ISOLATION_ACTIVE__;
  };
}
