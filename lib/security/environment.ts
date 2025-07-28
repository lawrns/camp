/**
 * Security Environment Detection
 *
 * Centralized utilities for detecting production environment and preventing
 * development bypasses from being used in production
 */

/**
 * Determines if the current environment is production
 * Uses multiple checks to prevent bypass attempts
 */
export function isProductionEnvironment(): boolean {
  // Multiple production indicators
  const indicators = [
    process.env.NODE_ENV === "production",
    process.env.VERCEL_ENV === "production",
    process.env.PRODUCTION === "true",
    process.env.ENVIRONMENT === "production",
    // Check for production domain patterns
    process.env.VERCEL_URL?.includes("campfire.ai") || false,
    process.env.NEXT_PUBLIC_SITE_URL?.includes("campfire.ai") || false,
  ];

  // If ANY indicator suggests production, treat as production
  return indicators.some((indicator) => indicator);
}

/**
 * Determines if development bypasses should be allowed
 * Requires explicit opt-in and multiple safety checks
 */
export function isDevelopmentBypassAllowed(): boolean {
  // Never allow bypasses in production
  if (isProductionEnvironment()) {
    return false;
  }

  // Require explicit bypass enablement
  if (process.env.ENABLE_TEST_BYPASS !== "true") {
    return false;
  }

  // Must be in development environment
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return true;
}

/**
 * Validates if a request is from legitimate E2E tests
 */
export function isLegitimateTestRequest(userAgent?: string | null, userId?: string | null): boolean {
  if (!isDevelopmentBypassAllowed()) {
    return false;
  }

  // Check for test user agent
  if (!userAgent?.includes("Campfire-E2E-Tests")) {
    return false;
  }

  // Check for test user ID format (if provided)
  if (userId && !userId.startsWith("test-")) {
    return false;
  }

  return true;
}

/**
 * Logs security bypass usage with appropriate warnings
 */
export function logSecurityBypass(bypassType: string, context: Record<string, any> = {}): void {
  const logLevel = isProductionEnvironment() ? "error" : "warn";
  const message = `[SECURITY] ${bypassType} bypass used - ${isProductionEnvironment() ? "BLOCKED IN PRODUCTION" : "DEVELOPMENT ONLY"}`;

  if (logLevel === "error") {

  } else {

  }

  // In production, also log to error monitoring
  if (isProductionEnvironment() && typeof window !== "undefined") {
    // Report to error monitoring service
    try {
      fetch("/api/security/report-bypass-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bypassType,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error);
    } catch (error) {

    }
  }
}

/**
 * Environment information for debugging
 */
export function getEnvironmentInfo(): Record<string, any> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    PRODUCTION: process.env.PRODUCTION,
    ENVIRONMENT: process.env.ENVIRONMENT,
    ENABLE_TEST_BYPASS: process.env.ENABLE_TEST_BYPASS,
    isProduction: isProductionEnvironment(),
    bypassAllowed: isDevelopmentBypassAllowed(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Security assertion that throws in production if bypasses are attempted
 */
export function assertDevelopmentOnly(operation: string): void {
  if (isProductionEnvironment()) {
    const error = new Error(`Security violation: ${operation} attempted in production environment`);

    throw error;
  }
}
