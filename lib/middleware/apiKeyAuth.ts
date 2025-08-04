import { NextRequest, NextResponse } from "next/server";
import { createSecureErrorResponse } from "@/lib/utils/security";

/**
 * API Key Authentication Middleware
 * Validates API keys for widget and general API endpoints
 */

interface ApiKeyValidationResult {
  isValid: boolean;
  organizationId?: string;
  keyId?: string;
  permissions?: string[];
  error?: string;
}

/**
 * Extract API key from request headers
 */
function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && authHeader.startsWith("Bearer wapi_")) {
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
 * Validate API key against database
 */
async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // For widget API keys, check organizations.widgetApiKey
    if (apiKey.startsWith("wapi_")) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, widget_enabled")
        .eq("widgetApiKey", apiKey)
        .eq("widget_enabled", true)
        .single();

      if (error || !data) {
        return { isValid: false, error: "Invalid API key" };
      }

      return {
        isValid: true,
        organizationId: data.id,
        permissions: ["widget:read", "widget:write"],
      };
    }

    // For general API keys, check api_keys table
    // Extract key prefix (first 10 characters) for efficient lookup
    const keyPrefix = apiKey.substring(0, 10);

    // Hash the full API key for comparison
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: apiKeyData, error } = await supabase
      .from("api_keys")
      .select("id, organization_id, scopes, status, expires_at")
      .eq("key_prefix", keyPrefix)
      .eq("key_hash", keyHash)
      .eq("status", "active")
      .single();

    if (error || !apiKeyData) {
      return { isValid: false, error: "Invalid API key" };
    }

    // Check if API key has expired
    if (apiKeyData.expiresAt) {
      const expiresAt = new Date(apiKeyData.expiresAt);
      if (expiresAt < new Date()) {
        return { isValid: false, error: "API key has expired" };
      }
    }

    // Update last_used_at timestamp
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKeyData.id);

    return {
      isValid: true,
      organizationId: apiKeyData.organization_id,
      keyId: apiKeyData.id,
      permissions: Array.isArray(apiKeyData.scopes) ? (apiKeyData.scopes as string[]) : [],
    };
  } catch (error) {
    return { isValid: false, error: "Validation failed" };
  }
}

/**
 * Create API key authentication middleware
 */
export function createApiKeyMiddleware(
  options: {
    required?: boolean;
    permissions?: string[];
  } = {}
) {
  return async function apiKeyMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    const { required = true, permissions = [] } = options;

    // Extract API key
    const apiKey = extractApiKey(request);

    if (!apiKey && required) {
      return createSecureErrorResponse(
        "API key required. Provide via X-API-Key header, Authorization Bearer, or api_key query parameter.",
        401
      );
    }

    if (!apiKey) {
      // API key not required and not provided, continue
      return next();
    }

    // Validate API key
    const validation = await validateApiKey(apiKey);

    if (!validation.isValid) {
      return createSecureErrorResponse(validation.error || "Invalid API key", 401);
    }

    // Check permissions if specified
    if (permissions.length > 0 && validation.permissions) {
      const hasPermission = permissions.some((perm) => validation.permissions?.includes(perm));

      if (!hasPermission) {
        return createSecureErrorResponse("Insufficient API key permissions", 403);
      }
    }

    // Add API key info to request headers for downstream handlers
    const headers = new Headers(request.headers);
    headers.set("x-organization-id", validation.organizationId || "");
    headers.set("x-api-key-id", validation.keyId || "");
    headers.set("x-api-permissions", JSON.stringify(validation.permissions || []));

    // Create new request with enriched headers
    const modifiedRequest = new NextRequest(request.url, {
      headers,
      method: request.method,
      body: request.body,
    });

    // Continue with enriched request
    return next();
  };
}

/**
 * Pre-configured middleware for widget endpoints
 */
export const widgetApiKeyAuth = createApiKeyMiddleware({
  required: true,
  permissions: ["widget:read", "widget:write"],
});

/**
 * Pre-configured middleware for general API endpoints
 */
export const generalApiKeyAuth = createApiKeyMiddleware({
  required: true,
  permissions: [],
});

/**
 * Optional API key middleware (allows requests without API keys)
 */
export const optionalApiKeyAuth = createApiKeyMiddleware({
  required: false,
});

/**
 * Update API key last_used_at timestamp
 * Call this after successful API key authentication
 */
export async function updateApiKeyUsage(organizationId: string): Promise<void> {
  try {
    const supabaseClient = supabase.browser();

    // Update widget API key usage
    await supabase.from("organizations").update({ updated_at: new Date().toISOString() }).eq("id", organizationId);
  } catch (error) {
    // Don't throw - this is non-critical
  }
}
