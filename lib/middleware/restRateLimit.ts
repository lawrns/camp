import { NextRequest, NextResponse } from "next/server";
import { createRateLimitResponse, getClientId, RATE_LIMITS, type RateLimitType } from "@/lib/utils/security";

/**
 * Improved rate limiting middleware for REST API routes
 * Uses centralized security utilities and configurations
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory store (production should use Redis)
const restRateLimitStore: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const key in restRateLimitStore) {
      const entry = restRateLimitStore[key];
      if (entry && entry.resetTime < now) {
        delete restRateLimitStore[key];
      }
    }
  },
  5 * 60 * 1000
);

export function createRateLimitMiddleware(rateLimitType: RateLimitType) {
  return function rateLimitMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> | NextResponse {
    // Skip rate limiting in test environment if disabled
    if (process.env.DISABLE_RATE_LIMITING === "true") {
      return next();
    }

    const config = RATE_LIMITS[rateLimitType];
    const clientId = getClientId(request);
    const key = `rest:${rateLimitType}:${clientId}`;
    const now = Date.now();

    // Initialize or reset expired entry
    if (!restRateLimitStore[key] || restRateLimitStore[key].resetTime < now) {
      restRateLimitStore[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    const entry = restRateLimitStore[key];

    // Check rate limit
    if (entry.count >= config.maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      return createRateLimitResponse(resetIn, config.maxRequests, 0, entry.resetTime);
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers to response
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const response = next();

    if (response instanceof Promise) {
      return response.then((res) => {
        res.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
        res.headers.set("X-RateLimit-Remaining", remaining.toString());
        res.headers.set("X-RateLimit-Reset", entry.resetTime.toString());
        return res;
      });
    }

    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());
    return response;
  };
}

// Pre-configured middleware exports using security utility
export const authLoginRateLimit = createRateLimitMiddleware("AUTH_LOGIN");
export const auth2FARateLimit = createRateLimitMiddleware("AUTH_2FA");
export const authResetRateLimit = createRateLimitMiddleware("AUTH_RESET");
export const widgetMessageRateLimit = createRateLimitMiddleware("WIDGET_MESSAGE");
export const widgetCreateRateLimit = createRateLimitMiddleware("WIDGET_CREATE");
export const widgetTokenRateLimit = createRateLimitMiddleware("WIDGET_TOKEN");
export const apiGeneralRateLimit = createRateLimitMiddleware("API_GENERAL");
export const apiUploadRateLimit = createRateLimitMiddleware("API_UPLOAD");
export const aiChatRateLimit = createRateLimitMiddleware("AI_CHAT");
export const aiRAGRateLimit = createRateLimitMiddleware("AI_RAG");

// Legacy exports for backward compatibility
export const authRateLimit = authLoginRateLimit;
export const widgetRateLimit = widgetMessageRateLimit;
export const apiRateLimit = apiGeneralRateLimit;
export const aiRateLimit = aiChatRateLimit;
