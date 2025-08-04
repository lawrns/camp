/**
 * CORS Authentication Resolver
 *
 * Comprehensive solution for cross-origin authentication edge cases
 * Handles complex scenarios for widget embedding across different domains
 */

import { supabase } from "@/lib/supabase/consolidated-exports";
import { NextRequest, NextResponse } from "next/server";

export interface CorsAuthOptions {
  allowedOrigins?: string[] | string;
  allowCredentials?: boolean;
  maxAge?: number;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  strictMode?: boolean;
  enablePreflight?: boolean;
}

export interface AuthContext {
  organizationId?: string;
  visitorId?: string;
  apiKey?: string;
  authenticated: boolean;
  authMethod: "api-key" | "bearer-token" | "query-param" | "none";
  origin?: string;
  userAgent?: string;
}

/**
 * CORS Authentication Resolver Class
 */
export class CorsAuthResolver {
  private options: Required<CorsAuthOptions>;

  constructor(options: CorsAuthOptions = {}) {
    this.options = {
      allowedOrigins: options.allowedOrigins || "*",
      allowCredentials: options.allowCredentials ?? false,
      maxAge: options.maxAge || 86400,
      allowedMethods: options.allowedMethods || ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
      allowedHeaders: options.allowedHeaders || [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Organization-ID",
        "X-Visitor-ID",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Referer",
        "User-Agent",
        "Cache-Control",
        "Pragma",
      ],
      exposedHeaders: options.exposedHeaders || [
        "Content-Length",
        "Content-Type",
        "X-Response-Time",
        "ETag",
        "X-Rate-Limit-Remaining",
        "X-Rate-Limit-Reset",
      ],
      strictMode: options.strictMode ?? false,
      enablePreflight: options.enablePreflight ?? true,
    };
  }

  /**
   * Resolve CORS and authentication for a request
   */
  async resolve(request: NextRequest): Promise<{
    corsHeaders: Record<string, string>;
    authContext: AuthContext;
    shouldProceed: boolean;
    error?: string;
  }> {
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent") || "";

    // Generate CORS headers
    const corsHeaders = this.generateCorsHeaders(origin);

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return {
        corsHeaders,
        authContext: {
          authenticated: false,
          authMethod: "none",
          origin,
          userAgent,
        },
        shouldProceed: this.options.enablePreflight,
      };
    }

    // Authenticate the request
    const authContext = await this.authenticateRequest(request);

    // Check origin restrictions in strict mode
    if (this.options.strictMode && !this.isOriginAllowed(origin)) {
      return {
        corsHeaders,
        authContext,
        shouldProceed: false,
        error: "Origin not allowed",
      };
    }

    return {
      corsHeaders,
      authContext,
      shouldProceed: true,
    };
  }

  /**
   * Generate CORS headers based on origin
   */
  private generateCorsHeaders(origin?: string | null): Record<string, string> {
    const headers: Record<string, string> = {};

    // Handle origin
    if (this.options.allowedOrigins === "*") {
      headers["Access-Control-Allow-Origin"] = "*";
    } else if (Array.isArray(this.options.allowedOrigins)) {
      if (origin && this.options.allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
      } else if (this.options.allowedOrigins.length > 0) {
        headers["Access-Control-Allow-Origin"] = this.options.allowedOrigins[0];
      }
    } else if (typeof this.options.allowedOrigins === "string") {
      headers["Access-Control-Allow-Origin"] = this.options.allowedOrigins;
    }

    // Other CORS headers
    headers["Access-Control-Allow-Methods"] = this.options.allowedMethods.join(", ");
    headers["Access-Control-Allow-Headers"] = this.options.allowedHeaders.join(", ");
    headers["Access-Control-Expose-Headers"] = this.options.exposedHeaders.join(", ");
    headers["Access-Control-Max-Age"] = this.options.maxAge.toString();

    if (this.options.allowCredentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    // Vary header for proper caching
    headers["Vary"] = "Origin, Access-Control-Request-Method, Access-Control-Request-Headers";

    return headers;
  }

  /**
   * Authenticate the request using multiple methods
   */
  private async authenticateRequest(request: NextRequest): Promise<AuthContext> {
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent") || "";

    // Try API key authentication (most secure)
    const apiKeyAuth = this.extractApiKey(request);
    if (apiKeyAuth.apiKey) {
      const validation = await this.validateApiKey(apiKeyAuth.apiKey);
      if (validation.valid) {
        return {
          organizationId: validation.organizationId,
          visitorId: request.headers.get("X-Visitor-ID") || undefined,
          apiKey: apiKeyAuth.apiKey,
          authenticated: true,
          authMethod: apiKeyAuth.method as "api-key" | "bearer-token" | "query-param",
          origin,
          userAgent,
        };
      }
    }

    // SECURITY: Organization ID header bypass - STRICTLY LIMITED to development
    // Multiple layers of protection against production bypass attempts
    const organizationId = request.headers.get("X-Organization-ID");
    if (organizationId) {
      // Import security utilities dynamically to avoid circular dependencies
      const { isLegitimateTestRequest, logSecurityBypass, assertDevelopmentOnly, isDevelopmentBypassAllowed } =
        await import("@/lib/security/environment");

      // CRITICAL: Multiple environment checks to prevent production bypass
      if (!isDevelopmentBypassAllowed()) {
        logSecurityBypass("Organization ID Header (BLOCKED - PRODUCTION)", {
          organizationId,
          userAgent,
          origin,
          endpoint: request.url,
          reason: "Development bypass attempted in production environment",
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
        });

        // In production, this is a security violation - do not proceed
        throw new Error("Security violation: Organization ID header bypass attempted in production");
      }

      if (isLegitimateTestRequest(userAgent)) {
        // Assert development environment one more time
        assertDevelopmentOnly("Organization ID header bypass");

        logSecurityBypass("Organization ID Header (DEVELOPMENT ONLY)", {
          organizationId,
          userAgent,
          origin,
          endpoint: request.url,
          warning: "Development bypass active - NEVER use in production",
        });

        return {
          organizationId,
          visitorId: request.headers.get("X-Visitor-ID") || undefined,
          authenticated: true,
          authMethod: "development-bypass",
          origin,
          userAgent,
        };
      } else {
        logSecurityBypass("Organization ID Header (BLOCKED - INVALID REQUEST)", {
          organizationId,
          userAgent,
          origin,
          endpoint: request.url,
          reason: "Invalid test request format or missing required headers",
        });
      }
    }

    // No authentication found
    return {
      authenticated: false,
      authMethod: "none",
      origin,
      userAgent,
    };
  }

  /**
   * Extract API key from various sources
   */
  private extractApiKey(request: NextRequest): { apiKey?: string; method: string } {
    // 1. X-API-Key header
    const headerApiKey = request.headers.get("X-API-Key");
    if (headerApiKey) {
      return { apiKey: headerApiKey, method: "api-key" };
    }

    // 2. Authorization Bearer token
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token.startsWith("wapi_")) {
        return { apiKey: token, method: "bearer-token" };
      }
    }

    // 3. Query parameter (less secure, for development)
    const url = new URL(request.url);
    const queryApiKey = url.searchParams.get("api_key");
    if (queryApiKey) {
      return { apiKey: queryApiKey, method: "query-param" };
    }

    return { method: "none" };
  }

  /**
   * Validate API key against database
   */
  private async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    organizationId?: string;
    error?: string;
  }> {
    try {
      // Simple validation for widget API keys
      if (apiKey.startsWith("wapi_")) {
        // Extract organization ID from API key format: wapi_orgId_randomString
        const parts = apiKey.split("_");
        if (parts.length >= 3) {
          const organizationId = parts[1];

          // Validate organization exists
          const supabaseClient = supabase.admin();
          const { data: org, error } = await supabaseClient
            .from("organizations")
            .select("id")
            .eq("id", organizationId)
            .single();

          if (error || !org) {
            return { valid: false, error: "Organization not found" };
          }

          return { valid: true, organizationId };
        }
      }

      return { valid: false, error: "Invalid API key format" };
    } catch (error) {

      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin?: string | null): boolean {
    if (!origin) return !this.options.strictMode;

    if (this.options.allowedOrigins === "*") return true;

    if (Array.isArray(this.options.allowedOrigins)) {
      return this.options.allowedOrigins.includes(origin);
    }

    if (typeof this.options.allowedOrigins === "string") {
      return this.options.allowedOrigins === origin;
    }

    return false;
  }

  /**
   * Create a response with CORS headers
   */
  createResponse(
    body: unknown,
    options: {
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
      corsHeaders?: Record<string, string>;
    } = {}
  ): NextResponse {
    const responseHeaders = {
      ...options.headers,
      ...options.corsHeaders,
    };

    return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), {
      status: options.status || 200,
      statusText: options.statusText,
      headers: responseHeaders,
    });
  }

  /**
   * Create an error response with CORS headers
   */
  createErrorResponse(message: string, status: number = 400, corsHeaders: Record<string, string> = {}): NextResponse {
    return this.createResponse({ error: message, status }, { status, corsHeaders });
  }
}

/**
 * Middleware wrapper for CORS authentication
 */
export function withCorsAuth(
  handler: (request: NextRequest, context: unknown, authContext: AuthContext) => Promise<NextResponse>,
  options: CorsAuthOptions = {}
) {
  const resolver = new CorsAuthResolver(options);

  return async (request: NextRequest, context: unknown): Promise<NextResponse> => {
    try {
      const resolution = await resolver.resolve(request);

      // Handle preflight requests
      if (request.method === "OPTIONS") {
        return resolver.createResponse(null, {
          status: 200,
          corsHeaders: resolution.corsHeaders,
        });
      }

      // Check if request should proceed
      if (!resolution.shouldProceed) {
        return resolver.createErrorResponse(resolution.error || "Request not allowed", 403, resolution.corsHeaders);
      }

      // Call the handler
      const response = await handler(request, context, resolution.authContext);

      // Add CORS headers to response
      Object.entries(resolution.corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {

      return resolver.createErrorResponse(
        "Internal server error",
        500,
        resolver.generateCorsHeaders(request.headers.get("origin"))
      );
    }
  };
}

// Default configurations for different scenarios
export const widgetCorsAuth = new CorsAuthResolver({
  allowedOrigins: "*",
  allowCredentials: false,
  strictMode: false,
  enablePreflight: true,
});

export const strictCorsAuth = new CorsAuthResolver({
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["https://app.campfire.ai"],
  allowCredentials: true,
  strictMode: true,
  enablePreflight: true,
});

export const developmentCorsAuth = new CorsAuthResolver({
  allowedOrigins: "*",
  allowCredentials: false,
  strictMode: false,
  enablePreflight: true,
});

/**
 * Unified CORS headers for widget endpoints
 */
export const UNIFIED_WIDGET_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
  "Access-Control-Allow-Headers": [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Organization-ID",
    "X-Visitor-ID",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Referer",
    "User-Agent",
    "Cache-Control",
    "Pragma",
  ].join(", "),
  "Access-Control-Allow-Credentials": "false",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": [
    "Content-Length",
    "Content-Type",
    "X-Response-Time",
    "ETag",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
  ].join(", "),
  Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
};

/**
 * Create a standardized OPTIONS handler
 */
export function createOptionsHandler(customHeaders: Record<string, string> = {}) {
  return function OPTIONS() {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...UNIFIED_WIDGET_CORS_HEADERS,
        ...customHeaders,
      },
    });
  };
}

/**
 * Apply CORS headers to any response
 */
export function applyCorsHeaders(response: NextResponse, customHeaders: Record<string, string> = {}): NextResponse {
  Object.entries({
    ...UNIFIED_WIDGET_CORS_HEADERS,
    ...customHeaders,
  }).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle complex cross-origin scenarios
 */
export async function handleCrossOriginEdgeCases(
  request: NextRequest,
  organizationId?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  headers: Record<string, string>;
}> {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent") || "";

  // Edge case 1: Missing origin header (direct API calls)
  if (!origin && !referer) {
    // Allow direct API calls with proper authentication
    const hasAuth =
      request.headers.get("X-API-Key") ||
      request.headers.get("Authorization") ||
      request.headers.get("X-Organization-ID");

    if (hasAuth) {
      return {
        allowed: true,
        headers: UNIFIED_WIDGET_CORS_HEADERS,
      };
    }

    return {
      allowed: false,
      reason: "Missing origin and authentication",
      headers: UNIFIED_WIDGET_CORS_HEADERS,
    };
  }

  // Edge case 2: Localhost development
  if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
    return {
      allowed: true,
      headers: {
        ...UNIFIED_WIDGET_CORS_HEADERS,
        "Access-Control-Allow-Origin": origin,
      },
    };
  }

  // Edge case 3: File protocol (local HTML files)
  if (origin === "null" || origin?.startsWith("file://")) {
    // Allow file protocol in development
    if (process.env.NODE_ENV === "development") {
      return {
        allowed: true,
        headers: {
          ...UNIFIED_WIDGET_CORS_HEADERS,
          "Access-Control-Allow-Origin": "null",
        },
      };
    }

    return {
      allowed: false,
      reason: "File protocol not allowed in production",
      headers: UNIFIED_WIDGET_CORS_HEADERS,
    };
  }

  // Edge case 4: Subdomain handling
  if (organizationId && origin) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // Check if it's a known subdomain pattern
      const subdomainPatterns = [
        /^[a-zA-Z0-9-]+\.campfire\.ai$/,
        /^[a-zA-Z0-9-]+\.vercel\.app$/,
        /^[a-zA-Z0-9-]+\.netlify\.app$/,
        /^[a-zA-Z0-9-]+\.github\.io$/,
      ];

      const isKnownSubdomain = subdomainPatterns.some((pattern) => pattern.test(hostname));

      if (isKnownSubdomain) {
        return {
          allowed: true,
          headers: {
            ...UNIFIED_WIDGET_CORS_HEADERS,
            "Access-Control-Allow-Origin": origin,
          },
        };
      }
    } catch (error) {

    }
  }

  // Edge case 5: Mobile app webviews
  if (
    userAgent.includes("Mobile") &&
    (userAgent.includes("WebView") ||
      userAgent.includes("wv") ||
      origin?.includes("capacitor") ||
      origin?.includes("ionic"))
  ) {
    return {
      allowed: true,
      headers: {
        ...UNIFIED_WIDGET_CORS_HEADERS,
        "Access-Control-Allow-Origin": origin || "*",
      },
    };
  }

  // Default: allow all origins for widget endpoints
  return {
    allowed: true,
    headers: {
      ...UNIFIED_WIDGET_CORS_HEADERS,
      "Access-Control-Allow-Origin": origin || "*",
    },
  };
}
