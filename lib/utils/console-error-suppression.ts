/**
 * Console Error Suppression System
 * 
 * Suppresses known non-critical errors to reduce console noise
 * while preserving important error information for debugging.
 */

interface ErrorPattern {
  pattern: string | RegExp;
  description: string;
  level: 'warn' | 'error' | 'log';
}

// Known error patterns to suppress
const SUPPRESSED_PATTERNS: ErrorPattern[] = [
  // Cookie parsing errors
  {
    pattern: /Failed to parse cookie string/,
    description: 'Supabase cookie parsing errors',
    level: 'warn'
  },
  {
    pattern: /Unexpected token 'b', "base64-eyJ"/,
    description: 'Base64 cookie parsing errors',
    level: 'warn'
  },
  {
    pattern: /parseSupabaseCookie/,
    description: 'Supabase cookie parsing function errors',
    level: 'warn'
  },

  // Multiple client instance warnings
  {
    pattern: /Multiple GoTrueClient instances detected/,
    description: 'Multiple Supabase client instances warning',
    level: 'warn'
  },

  // Extension-related errors (ENHANCED FOR YOUR SPECIFIC ERRORS)
  {
    pattern: /Extension context invalidated/,
    description: 'Browser extension context errors',
    level: 'warn'
  },
  {
    pattern: /DeviceTrust access denied/,
    description: '1Password extension conflicts',
    level: 'warn'
  },
  {
    pattern: /runtime\.connect/,
    description: 'Browser extension runtime errors',
    level: 'warn'
  },
  {
    pattern: /Could not establish connection\. Receiving end does not exist\./,
    description: 'Browser extension connection errors',
    level: 'error'
  },
  {
    pattern: /The message port closed before a response was received\./,
    description: 'Browser extension message port errors',
    level: 'error'
  },
  {
    pattern: /Failed to request.*accounts in requestAndUnlockAccountsFromApp/,
    description: '1Password extension account request errors',
    level: 'error'
  },
  {
    pattern: /Could not get default saving location, resetting location\./,
    description: '1Password extension saving location errors',
    level: 'error'
  },
  {
    pattern: /A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received/,
    description: 'Browser extension async response errors',
    level: 'error'
  },
  {
    pattern: /\[LM\] Lock monitor stopped, without clearing alarm\./,
    description: 'Browser extension lock monitor errors',
    level: 'error'
  },
  {
    pattern: /Failed to refresh keysets/,
    description: 'Browser extension keyset refresh errors',
    level: 'error'
  },

  // WebSocket connection errors (non-critical)
  {
    pattern: /WebSocket connection to .* failed: WebSocket is closed/,
    description: 'WebSocket connection closed errors',
    level: 'warn'
  },

  // PostHog analytics (non-critical)
  {
    pattern: /PostHog analytics disabled/,
    description: 'PostHog configuration warnings',
    level: 'warn'
  },

  // React DevTools suggestion
  {
    pattern: /Download the React DevTools/,
    description: 'React DevTools suggestion',
    level: 'log'
  },

  // Injected script errors
  {
    pattern: /Caught error handling <hide-notification> message/,
    description: 'Browser extension injected script errors',
    level: 'warn'
  },

  // Background script errors (common in extensions)
  {
    pattern: /background\.js/,
    description: 'Browser extension background script errors',
    level: 'error'
  }
];

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

/**
 * Check if a message should be suppressed
 */
function shouldSuppressMessage(message: string, level: 'log' | 'warn' | 'error'): boolean {
  return SUPPRESSED_PATTERNS.some(pattern => {
    if (pattern.level !== level) return false;
    
    if (typeof pattern.pattern === 'string') {
      return message.includes(pattern.pattern);
    } else {
      return pattern.pattern.test(message);
    }
  });
}

/**
 * Create a filtered console method
 */
function createFilteredConsoleMethod(
  originalMethod: (...args: any[]) => void,
  level: 'log' | 'warn' | 'error'
) {
  return (...args: any[]) => {
    const message = args.join(' ');
    
    // Only suppress in production or when explicitly enabled
    const shouldFilter = process.env.NODE_ENV === 'production' || 
                        process.env.NEXT_PUBLIC_SUPPRESS_CONSOLE_ERRORS === 'true';
    
    if (shouldFilter && shouldSuppressMessage(message, level)) {
      // Optionally log to a debug store for development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        if (!(window as any).__SUPPRESSED_LOGS__) {
          (window as any).__SUPPRESSED_LOGS__ = [];
        }
        (window as any).__SUPPRESSED_LOGS__.push({
          level,
          message,
          timestamp: new Date().toISOString(),
          args
        });
      }
      return;
    }
    
    originalMethod.apply(console, args);
  };
}

/**
 * Initialize console error suppression
 */
export function initializeConsoleErrorSuppression(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Replace console methods with filtered versions
  console.log = createFilteredConsoleMethod(originalConsole.log, 'log');
  console.warn = createFilteredConsoleMethod(originalConsole.warn, 'warn');
  console.error = createFilteredConsoleMethod(originalConsole.error, 'error');

  // Add debug helper to window
  if (process.env.NODE_ENV === 'development') {
    (window as any).__CONSOLE_DEBUG__ = {
      showSuppressed: () => {
        console.table((window as any).__SUPPRESSED_LOGS__ || []);
      },
      clearSuppressed: () => {
        (window as any).__SUPPRESSED_LOGS__ = [];
      },
      restore: () => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
      }
    };
  }

  // Return cleanup function
  return () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    
    if (typeof window !== 'undefined') {
      delete (window as any).__CONSOLE_DEBUG__;
      delete (window as any).__SUPPRESSED_LOGS__;
    }
  };
}

/**
 * Add a custom error pattern to suppress
 */
export function addSuppressionPattern(pattern: ErrorPattern): void {
  SUPPRESSED_PATTERNS.push(pattern);
}

/**
 * Remove a suppression pattern
 */
export function removeSuppressionPattern(patternToRemove: string | RegExp): void {
  const index = SUPPRESSED_PATTERNS.findIndex(p => 
    p.pattern === patternToRemove || 
    (p.pattern instanceof RegExp && p.pattern.source === (patternToRemove as RegExp).source)
  );
  
  if (index > -1) {
    SUPPRESSED_PATTERNS.splice(index, 1);
  }
}

/**
 * Get current suppression patterns
 */
export function getSuppressionPatterns(): readonly ErrorPattern[] {
  return SUPPRESSED_PATTERNS;
}
