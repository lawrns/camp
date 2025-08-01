/**
 * Build-time security validation
 * Ensures no development bypasses are compiled into production builds
 */

import { isProductionEnvironment } from './environment';

/**
 * Validates that no development bypasses are active in production builds
 * This runs at build time to catch security issues early
 */
export function validateProductionBuild(): void {
  if (isProductionEnvironment()) {
    // Check for development environment variables that should not exist in production
    const dangerousEnvVars = [
      'ENABLE_TEST_BYPASS',
      'SKIP_AUTH_VALIDATION',
      'DISABLE_SECURITY_CHECKS',
      'DEBUG_MODE',
      'DEVELOPMENT_OVERRIDE'
    ];

    const foundDangerousVars = dangerousEnvVars.filter(varName => 
      process.env[varName] === 'true' || process.env[varName] === '1'
    );

    if (foundDangerousVars.length > 0) {
      throw new Error(
        `SECURITY ERROR: Development environment variables found in production build: ${foundDangerousVars.join(', ')}`
      );
    }

    // Validate that production security features are enabled
    const requiredSecurityFeatures = {
      'NODE_ENV': 'production',
      'NEXT_PUBLIC_ENVIRONMENT': 'production'
    };

    for (const [envVar, expectedValue] of Object.entries(requiredSecurityFeatures)) {
      if (process.env[envVar] !== expectedValue) {
        console.warn(`WARNING: ${envVar} should be set to '${expectedValue}' in production`);
      }
    }

    console.log('✅ Production build security validation passed');
  }
}

/**
 * Runtime security assertion for critical operations
 * Throws immediately if called in production with development bypasses
 */
export function assertNoProductionBypass(operation: string): void {
  if (isProductionEnvironment()) {
    // Check if any development bypass environment variables are set
    if (process.env.ENABLE_TEST_BYPASS === 'true') {
      throw new Error(`CRITICAL SECURITY VIOLATION: ${operation} attempted with development bypass in production`);
    }

    // Additional runtime checks
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    if (userAgent.includes('test') || userAgent.includes('automation')) {
      console.warn(`WARNING: ${operation} called with test user agent in production: ${userAgent}`);
    }
  }
}

/**
 * Enhanced development bypass validation with additional security layers
 */
export function validateDevelopmentBypass(context: string): boolean {
  // Never allow in production
  if (isProductionEnvironment()) {
    console.error(`SECURITY VIOLATION: Development bypass attempted in production for ${context}`);
    return false;
  }

  // Require explicit enablement
  if (process.env.ENABLE_TEST_BYPASS !== 'true') {
    return false;
  }

  // Must be in development environment
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // Additional validation: check for localhost
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
    console.warn(`WARNING: Development bypass used with non-localhost URL: ${appUrl}`);
  }

  return true;
}

// Run build-time validation when this module is imported
if (typeof window === 'undefined') {
  // Server-side only
  validateProductionBuild();
}
