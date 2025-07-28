/**
 * Security utilities for API protection
 * Lean implementation following /ai/ rules
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting configurations for different endpoint types
 * Automatically adjusts for test environments
 */
function createRateLimits() {
  const isTestEnv =
    process.env.NODE_ENV === "test" || process.env.VITEST === "true" || process.env.JEST_WORKER_ID !== undefined;

  // In test environments, use much more lenient rate limits
  const multiplier = isTestEnv ? 100 : 1; // 100x more requests allowed in tests
  const windowDivider = isTestEnv ? 10 : 1; // 10x shorter windows in tests

  return {
    // Authentication: strictest limits
    AUTH_LOGIN: { maxRequests: 5 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 5/min (500/6s in tests)
    AUTH_2FA: { maxRequests: 3 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 3/min (300/6s in tests)
    AUTH_RESET: { maxRequests: 3 * multiplier, windowMs: (60 * 60 * 1000) / windowDivider }, // 3/hour (300/6min in tests)

    // Widget: public-facing, moderate limits
    WIDGET_MESSAGE: { maxRequests: 60 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 60/min (6000/6s in tests)
    WIDGET_CREATE: { maxRequests: 20 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 20/min (2000/6s in tests)
    WIDGET_TOKEN: { maxRequests: 10 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 10/min (1000/6s in tests)

    // API: general endpoints
    API_GENERAL: { maxRequests: 100 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 100/min (10000/6s in tests)
    API_UPLOAD: { maxRequests: 20 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 20/min (2000/6s in tests)

    // AI: resource-intensive
    AI_CHAT: { maxRequests: 10 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 10/min (1000/6s in tests)
    AI_RAG: { maxRequests: 5 * multiplier, windowMs: (60 * 1000) / windowDivider }, // 5/min (500/6s in tests)
  } as const;
}

export const RATE_LIMITS = createRateLimits();

/**
 * Extract client identifier for rate limiting
 */
export function getClientId(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token structure");
      }
      const payloadPart = tokenParts[1];
      if (!payloadPart) {
        throw new Error("Invalid token payload");
      }
      const payload = JSON.parse(atob(payloadPart));

      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error("Token expired");
      }

      if (payload.sub || payload.user_id) {
        return `user:${payload.sub || payload.user_id}`;
      }
    } catch {
      // Fallback to IP if JWT parsing fails
    }
  }

  // Fallback to IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIP || "unknown";
  return `ip:${ip}`;
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

/**
 * Create secure error response with proper headers
 */
export function createSecureErrorResponse(
  message: string,
  status: number = 400,
  headers: Record<string, string> = {}
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...SECURITY_HEADERS,
        ...headers,
      },
    }
  );
}

/**
 * Create rate limit error response with retry headers
 */
export function createRateLimitResponse(
  retryAfter: number,
  limit: number,
  remaining: number = 0,
  resetTime: number,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetTime.toString(),
        ...SECURITY_HEADERS,
        ...additionalHeaders,
      },
    }
  );
}

/**
 * Validate request content type for POST/PUT requests
 */
export function validateContentType(request: NextRequest): boolean {
  const method = request.method;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const contentType = request.headers.get("content-type");
    return contentType?.includes("application/json") ?? false;
  }
  return true; // Non-body requests are valid
}

/**
 * Basic input sanitization
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>'"&]/g, "") // Remove potentially dangerous characters
    .substring(0, 10000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Check if request is from a suspicious source
 */
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";

  // Basic bot detection
  const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];

  return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
}

export type RateLimitType = keyof typeof RATE_LIMITS;
