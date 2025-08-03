/**
 * PHASE 1 CRITICAL FIX: CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection for state-changing operations
 * identified as missing in god.md security analysis.
 * 
 * Features:
 * - Token-based CSRF protection
 * - Origin validation
 * - Referer checking
 * - Custom header validation
 * - Configurable for different endpoint types
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface CSRFConfig {
  tokenHeader?: string; // Header name for CSRF token
  cookieName?: string; // Cookie name for CSRF token
  checkOrigin?: boolean; // Whether to validate origin
  allowedOrigins?: string[]; // Allowed origins for requests
  checkReferer?: boolean; // Whether to validate referer
  customHeaderName?: string; // Custom header that must be present
  skipMethods?: string[]; // HTTP methods to skip CSRF check
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  tokenHeader: 'x-csrf-token',
  cookieName: 'csrf-token',
  checkOrigin: true,
  allowedOrigins: ['http://localhost:3001', 'https://campfire.fyves.com'],
  checkReferer: true,
  customHeaderName: 'x-requested-with',
  skipMethods: ['GET', 'HEAD', 'OPTIONS']
};

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate origin header
 */
function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Validate referer header
 */
function validateReferer(request: NextRequest, allowedOrigins: string[]): boolean {
  const referer = request.headers.get('referer');
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    return allowedOrigins.includes(refererOrigin);
  } catch {
    return false;
  }
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(request: NextRequest, config: Required<CSRFConfig>): boolean {
  const tokenFromHeader = request.headers.get(config.tokenHeader);
  const tokenFromCookie = request.cookies.get(config.cookieName)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromHeader, 'hex'),
    Buffer.from(tokenFromCookie, 'hex')
  );
}

/**
 * Check for custom header (simple CSRF protection)
 */
function validateCustomHeader(request: NextRequest, headerName: string): boolean {
  return request.headers.has(headerName);
}

/**
 * Create CSRF protection middleware
 */
export function createCSRFProtection(userConfig: Partial<CSRFConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  return async function csrfMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const method = request.method.toUpperCase();

    // Skip CSRF check for safe methods
    if (config.skipMethods.includes(method)) {
      return handler();
    }

    // Check origin if enabled
    if (config.checkOrigin && !validateOrigin(request, config.allowedOrigins)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID_ORIGIN',
            message: 'Invalid origin'
          }
        },
        { status: 403 }
      );
    }

    // Check referer if enabled
    if (config.checkReferer && !validateReferer(request, config.allowedOrigins)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID_REFERER',
            message: 'Invalid referer'
          }
        },
        { status: 403 }
      );
    }

    // Check custom header (simple protection)
    if (!validateCustomHeader(request, config.customHeaderName)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_MISSING_HEADER',
            message: 'Missing required header'
          }
        },
        { status: 403 }
      );
    }

    // For token-based protection, validate CSRF token
    const hasCSRFCookie = request.cookies.has(config.cookieName);
    if (hasCSRFCookie && !validateCSRFToken(request, config)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID_TOKEN',
            message: 'Invalid CSRF token'
          }
        },
        { status: 403 }
      );
    }

    // All checks passed, execute handler
    return handler();
  };
}

/**
 * Predefined CSRF configurations for different endpoint types
 */
export const CSRF_CONFIGS = {
  // Widget endpoints - relaxed (custom header only)
  WIDGET: {
    checkOrigin: true,
    checkReferer: false,
    customHeaderName: 'x-widget-request',
    allowedOrigins: ['http://localhost:3001', 'https://campfire.fyves.com']
  },

  // Dashboard endpoints - strict protection
  DASHBOARD: {
    checkOrigin: true,
    checkReferer: true,
    customHeaderName: 'x-requested-with',
    allowedOrigins: ['http://localhost:3001', 'https://campfire.fyves.com']
  },

  // API endpoints - moderate protection
  API: {
    checkOrigin: true,
    checkReferer: false,
    customHeaderName: 'x-api-request',
    allowedOrigins: ['http://localhost:3001', 'https://campfire.fyves.com']
  },

  // Authentication endpoints - strict protection
  AUTH: {
    checkOrigin: true,
    checkReferer: true,
    customHeaderName: 'x-auth-request',
    allowedOrigins: ['http://localhost:3001', 'https://campfire.fyves.com']
  }
} as const;

/**
 * Convenience functions for common CSRF protection patterns
 */
export const widgetCSRFProtection = createCSRFProtection(CSRF_CONFIGS.WIDGET);
export const dashboardCSRFProtection = createCSRFProtection(CSRF_CONFIGS.DASHBOARD);
export const apiCSRFProtection = createCSRFProtection(CSRF_CONFIGS.API);
export const authCSRFProtection = createCSRFProtection(CSRF_CONFIGS.AUTH);

/**
 * Helper function to apply CSRF protection to API routes
 */
export function withCSRFProtection(
  config: Partial<CSRFConfig>,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const csrfProtection = createCSRFProtection(config);
  
  return async function csrfProtectedHandler(request: NextRequest): Promise<NextResponse> {
    return csrfProtection(request, () => handler(request));
  };
}

/**
 * Generate CSRF token response for client
 */
export function generateCSRFTokenResponse(): NextResponse {
  const token = generateCSRFToken();
  
  const response = NextResponse.json({
    success: true,
    data: { csrfToken: token }
  });

  // Set CSRF token in cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  });

  return response;
}
