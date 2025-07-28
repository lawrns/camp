import { NextRequest, NextResponse } from "next/server";

/**
 * Security Headers Middleware
 * Lean implementation for core security headers without external dependencies
 */

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",

  // HSTS - Force HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy (formerly Feature Policy)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",

  // Content Security Policy - Basic but secure
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' wss: https:; " +
    "frame-ancestors 'none'",
} as const;

/**
 * Widget-specific security headers (more permissive for embedding)
 */
export const WIDGET_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Allow embedding in frames (required for widget)
  "X-Frame-Options": "SAMEORIGIN",
  // More permissive CSP for widget embedding
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' wss: https:; " +
    "frame-ancestors *",
} as const;

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  headerSet: typeof SECURITY_HEADERS | typeof WIDGET_SECURITY_HEADERS = SECURITY_HEADERS
): NextResponse {
  Object.entries(headerSet).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create security headers middleware
 */
export function createSecurityMiddleware(
  headerSet: typeof SECURITY_HEADERS | typeof WIDGET_SECURITY_HEADERS = SECURITY_HEADERS
) {
  return function securityMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> | NextResponse {
    const response = next();

    if (response instanceof Promise) {
      return response.then((res) => applySecurityHeaders(res, headerSet));
    }

    return applySecurityHeaders(response, headerSet);
  };
}

/**
 * Standard security middleware
 */
export const securityHeaders = createSecurityMiddleware(SECURITY_HEADERS);

/**
 * Widget security middleware
 */
export const widgetSecurityHeaders = createSecurityMiddleware(WIDGET_SECURITY_HEADERS);

/**
 * CSRF token generation and validation
 */
const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token for session
 */
export function generateCsrfToken(sessionId: string): string {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  csrfTokens.set(sessionId, { token, expires });

  // Cleanup expired tokens
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored || stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

/**
 * Cleanup expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(
  request: NextRequest,
  next: () => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return next();
  }

  // Skip CSRF for API key authenticated requests (widget endpoints)
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
  if (apiKey?.startsWith("wapi_")) {
    return next();
  }

  const sessionId = request.headers.get("x-session-id");
  const csrfToken = request.headers.get("x-csrf-token");

  if (!sessionId || !csrfToken) {
    return NextResponse.json({ error: "CSRF token required" }, { status: 403, headers: SECURITY_HEADERS });
  }

  if (!validateCsrfToken(sessionId, csrfToken)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403, headers: SECURITY_HEADERS });
  }

  return next();
}

/**
 * Combined security middleware with headers and CSRF
 */
export function withSecurity(
  request: NextRequest,
  next: () => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
  // Apply CSRF protection first
  const csrfResult = csrfProtection(request, next);

  if (csrfResult instanceof Promise) {
    return csrfResult.then((response) => {
      if (response.status === 403) return response;
      return applySecurityHeaders(response);
    });
  }

  if (csrfResult.status === 403) return csrfResult;
  return applySecurityHeaders(csrfResult);
}
