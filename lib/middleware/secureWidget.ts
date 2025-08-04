import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  WIDGET_CORS_HEADERS,
  type RouteContext,
  type WidgetContext,
  type WidgetHandler,
} from "@/lib/api/unified-auth";
import { widgetMessageRateLimit } from "@/lib/middleware/restRateLimit";
import { applySecurityHeaders, WIDGET_SECURITY_HEADERS } from "@/lib/middleware/securityHeaders";
import { supabase } from "@/lib/supabase";

/**
 * Secure Widget Middleware - Improved version with API key authentication
 * Replaces the basic withWidget for security-critical endpoints
 */

interface SecureWidgetContext extends WidgetContext {
  apiKeyValidated: true;
  apiKey: string;
}

/**
 * Extract widget API key from request
 */
function extractWidgetApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer wapi_")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader?.startsWith("wapi_")) {
    return apiKeyHeader;
  }

  // Check query parameter (for widget embeds)
  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get("api_key");
  if (apiKeyParam?.startsWith("wapi_")) {
    return apiKeyParam;
  }

  return null;
}

/**
 * Validate widget API key and get organization
 */
async function validateWidgetApiKey(apiKey: string): Promise<{
  valid: boolean;
  organizationId?: string;
  error?: string;
}> {
  try {
    const supabaseClient = supabase.admin();

    const { data, error } = await supabase
      .from("organizations")
      .select("id, widget_enabled")
      .eq("widgetApiKey", apiKey)
      .eq("widget_enabled", true)
      .single();

    if (error || !data) {
      return { valid: false, error: "Invalid widget API key" };
    }

    return {
      valid: true,
      organizationId: data.id,
    };
  } catch (error) {
    return { valid: false, error: "API key validation failed" };
  }
}

/**
 * Secure widget middleware with API key authentication and rate limiting
 */
export function withSecureWidget<T extends Record<string, string | string[]> = Record<string, string | string[]>>(
  handler: (req: NextRequest, context: RouteContext<T>, widgetContext: SecureWidgetContext) => Promise<Response>
) {
  return async (req: NextRequest, context: RouteContext<T>): Promise<Response> => {
    try {
      // Apply rate limiting first
      const rateLimitResponse = widgetMessageRateLimit(req, async () => NextResponse.next());
      if (rateLimitResponse instanceof NextResponse && rateLimitResponse.status === 429) {
        return new NextResponse(rateLimitResponse.body, {
          status: 429,
          headers: { ...Object.fromEntries(rateLimitResponse.headers), ...WIDGET_CORS_HEADERS },
        });
      }

      // Extract and validate API key
      const apiKey = extractWidgetApiKey(req);
      if (!apiKey) {
        return createErrorResponse(
          "Widget API key required. Provide via X-API-Key header, Authorization Bearer, or api_key query parameter.",
          401,
          "MISSING_API_KEY",
          WIDGET_CORS_HEADERS
        );
      }

      const validation = await validateWidgetApiKey(apiKey);
      if (!validation.valid || !validation.organizationId) {
        return createErrorResponse(
          validation.error || "Invalid widget API key",
          401,
          "INVALID_API_KEY",
          WIDGET_CORS_HEADERS
        );
      }

      // Create secure widget context
      const secureWidgetContext: SecureWidgetContext = {
        organizationId: validation.organizationId,
        client: supabase.admin(),
        apiKeyValidated: true,
        apiKey,
      };

      const visitorId = req.headers.get("X-Visitor-ID");
      if (visitorId) {
        secureWidgetContext.visitorId = visitorId;
      }

      // Update API key usage tracking (non-blocking)
      updateApiKeyUsage(validation.organizationId).catch(console.error);

      const response = await handler(req, context, secureWidgetContext);

      // Apply widget security headers to response
      return applySecurityHeaders(new NextResponse(response.body, response), WIDGET_SECURITY_HEADERS);
    } catch (error) {
      return createErrorResponse("Widget authentication failed", 500, "WIDGET_AUTH_ERROR", WIDGET_CORS_HEADERS);
    }
  };
}

/**
 * Update API key usage statistics (non-blocking)
 */
async function updateApiKeyUsage(organizationId: string): Promise<void> {
  try {
    const supabaseClient = supabase.admin();

    // Update last usage timestamp
    await supabase
      .from("organizations")
      .update({
        updated_at: new Date().toISOString(),
        // Could also increment a usage counter if that column exists
      })
      .eq("id", organizationId);
  } catch (error) {
    // Don't throw - this is non-critical tracking
  }
}

/**
 * Improved widget middleware for high-security endpoints
 * Includes API key auth + rate limiting + usage tracking
 */
export function withSecureWidgetAuth<T extends Record<string, string | string[]> = Record<string, string | string[]>>(
  handler: WidgetHandler<T>
) {
  return withSecureWidget(async (req, context, secureContext) => {
    // Convert secure context to standard widget context for compatibility
    const widgetContext: WidgetContext = {
      organizationId: secureContext.organizationId,
      client: secureContext.client,
    };

    if (secureContext.visitorId) {
      widgetContext.visitorId = secureContext.visitorId;
    }

    return handler(req, context, widgetContext);
  });
}
