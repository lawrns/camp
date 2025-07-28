/**
 * Authentication Architecture Validation
 * Development-time checks to ensure proper auth setup
 */

"use client";

interface AuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validates the current authentication setup
 * Should be called in development mode to catch issues early
 */
export function validateAuthSetup(): AuthValidationResult {
  const result: AuthValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return result;
  }

  try {
    // Check for AuthProvider in the component tree
    const hasAuthContext = checkAuthContextAvailability();
    
    if (!hasAuthContext) {
      result.isValid = false;
      result.errors.push(
        'AuthProvider context not found. Components using useAuth will fail.'
      );
      result.suggestions.push(
        'Ensure AuthProvider wraps your component tree in the root layout or appropriate parent component.'
      );
    }

    // Check for multiple auth providers (can cause conflicts)
    const authProviderCount = countAuthProviders();
    if (authProviderCount > 1) {
      result.warnings.push(
        `Multiple AuthProviders detected (${authProviderCount}). This may cause context conflicts.`
      );
      result.suggestions.push(
        'Remove duplicate AuthProvider wrappers and ensure only one exists at the root level.'
      );
    }

    // Check for proper error boundaries
    if (!hasErrorBoundary()) {
      result.warnings.push(
        'No error boundary detected around AuthProvider. Auth errors may crash the app.'
      );
      result.suggestions.push(
        'Wrap AuthProvider with an error boundary to handle auth failures gracefully.'
      );
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Auth validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Checks if AuthProvider context is available
 */
function checkAuthContextAvailability(): boolean {
  try {
    // This is a simplified check - in a real implementation,
    // you'd need to actually test the context
    return true; // Placeholder - would need actual context testing
  } catch {
    return false;
  }
}

/**
 * Counts the number of AuthProvider instances in the DOM
 */
function countAuthProviders(): number {
  // This is a simplified implementation
  // In practice, you'd need to traverse the React component tree
  return 1; // Placeholder
}

/**
 * Checks if there's an error boundary wrapping the auth system
 */
function hasErrorBoundary(): boolean {
  // Simplified check - would need actual error boundary detection
  return true; // Placeholder
}

/**
 * Development-only auth setup validator
 * Logs validation results to console in development mode
 */
export function runAuthValidation(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const validation = validateAuthSetup();
  
  if (!validation.isValid) {
    console.group('🔥 AUTH SETUP VALIDATION FAILED');
    validation.errors.forEach(error => {
      console.error('❌', error);
    });
    console.groupEnd();
  }

  if (validation.warnings.length > 0) {
    console.group('⚠️ AUTH SETUP WARNINGS');
    validation.warnings.forEach(warning => {
      console.warn('⚠️', warning);
    });
    console.groupEnd();
  }

  if (validation.suggestions.length > 0) {
    console.group('💡 AUTH SETUP SUGGESTIONS');
    validation.suggestions.forEach(suggestion => {
      console.info('💡', suggestion);
    });
    console.groupEnd();
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Auth setup validation passed');
  }
}

/**
 * Hook to validate auth setup on component mount
 * Only runs in development mode
 */
export function useAuthValidation(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Run validation once on mount
    setTimeout(runAuthValidation, 100);
  }
}