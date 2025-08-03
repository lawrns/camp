/**
 * PHASE 1 CRITICAL FIX: Rate Limiting Middleware
 * 
 * Implements rate limiting for critical API endpoints to prevent abuse
 * and protect against DoS attacks identified in god.md analysis.
 * 
 * Features:
 * - IP-based rate limiting
 * - Organization-based rate limiting
 * - Different limits for different endpoint types
 * - Memory-based storage (can be upgraded to Redis)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (upgrade to Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `ip:${ip}`;
}

/**
 * Organization-based key generator
 */
export function orgKeyGenerator(request: NextRequest): string {
  const orgId = request.headers.get('x-organization-id') || 
                request.nextUrl.searchParams.get('organizationId') ||
                'unknown';
  return `org:${orgId}`;
}

/**
 * Combined IP + Organization key generator
 */
export function combinedKeyGenerator(request: NextRequest): string {
  const ip = defaultKeyGenerator(request);
  const org = orgKeyGenerator(request);
  return `${ip}:${org}`;
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    // Execute the handler
    const response = await handler();

    // Add rate limit headers to response
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

/**
 * Predefined rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Widget endpoints - moderate limits
  WIDGET: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    keyGenerator: combinedKeyGenerator
  },

  // Authentication endpoints - strict limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    keyGenerator: defaultKeyGenerator
  },

  // Message sending - moderate limits
  MESSAGES: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 messages per minute
    keyGenerator: combinedKeyGenerator
  },

  // File uploads - strict limits
  UPLOADS: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 uploads per 5 minutes
    keyGenerator: combinedKeyGenerator
  },

  // General API - lenient limits
  GENERAL: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: defaultKeyGenerator
  },

  // Dashboard endpoints - moderate limits
  DASHBOARD: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
    keyGenerator: orgKeyGenerator
  }
} as const;

/**
 * Convenience functions for common rate limiting patterns
 */
export const widgetRateLimit = createRateLimit(RATE_LIMITS.WIDGET);
export const authRateLimit = createRateLimit(RATE_LIMITS.AUTH);
export const messageRateLimit = createRateLimit(RATE_LIMITS.MESSAGES);
export const uploadRateLimit = createRateLimit(RATE_LIMITS.UPLOADS);
export const generalRateLimit = createRateLimit(RATE_LIMITS.GENERAL);
export const dashboardRateLimit = createRateLimit(RATE_LIMITS.DASHBOARD);

/**
 * Helper function to apply rate limiting to API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const rateLimit = createRateLimit(config);
  
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    return rateLimit(request, () => handler(request));
  };
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): {
  count: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (entry.resetTime < now) {
    rateLimitStore.delete(key);
    return null;
  }

  return {
    count: entry.count,
    remaining: Math.max(0, 100 - entry.count), // Assuming default limit of 100
    resetTime: entry.resetTime,
    isLimited: entry.count >= 100
  };
}
