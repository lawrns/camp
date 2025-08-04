import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase";

/**
 * Simple API Key Management Utilities
 * Lean implementation for widget API key generation and management
 */

/**
 * Generate a new widget API key
 */
export function generateWidgetApiKey(): string {
  // Generate 32 random bytes and encode as base64url
  const randomData = randomBytes(32);
  const base64 = randomData.toString("base64url");
  return `wapi_${base64}`;
}

/**
 * Create or regenerate widget API key for an organization
 */
export async function createWidgetApiKey(organizationId: string): Promise<{
  success: boolean;
  apiKey?: string;
  error?: string;
}> {
  try {
    const supabaseClient = supabase.browser();
    const newApiKey = generateWidgetApiKey();

    const { error } = await supabase
      .from("organizations")
      .update({
        widgetApiKey: newApiKey,
        widget_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (error) {
      return { success: false, error: "Failed to create API key" };
    }

    return { success: true, apiKey: newApiKey };
  } catch (error) {
    return { success: false, error: "API key creation failed" };
  }
}

/**
 * Disable widget API key for an organization
 */
export async function disableWidgetApiKey(organizationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabaseClient = supabase.browser();

    const { error } = await supabase
      .from("organizations")
      .update({
        widget_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (error) {
      return { success: false, error: "Failed to disable API key" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "API key disable failed" };
  }
}

/**
 * Get masked widget API key info for an organization
 */
export async function getWidgetApiKeyInfo(organizationId: string): Promise<{
  success: boolean;
  keyInfo?: {
    masked: string;
    enabled: boolean;
    lastUsed?: string;
  };
  error?: string;
}> {
  try {
    const supabaseClient = supabase.browser();

    const { data, error } = await supabase
      .from("organizations")
      .select("widget_api_key, widget_enabled, updated_at")
      .eq("id", organizationId)
      .single();

    if (error || !data) {
      return { success: false, error: "Organization not found" };
    }

    if (!data.widgetApiKey) {
      return {
        success: true,
        keyInfo: {
          masked: "No API key generated",
          enabled: false,
        },
      };
    }

    // Mask the API key (show first 4 and last 4 characters)
    const apiKey = data.widgetApiKey;
    const masked =
      apiKey.length > 8
        ? `${apiKey.slice(0, 9)}${"*".repeat(apiKey.length - 13)}${apiKey.slice(-4)}`
        : apiKey.slice(0, 4) + "*".repeat(Math.max(0, apiKey.length - 4));

    return {
      success: true,
      keyInfo: {
        masked,
        enabled: data.widget_enabled || false,
        lastUsed: data.updated_at,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to get API key info" };
  }
}

/**
 * Validate widget API key format
 */
export function isValidWidgetApiKey(apiKey: string): boolean {
  return (
    typeof apiKey === "string" &&
    apiKey.startsWith("wapi_") &&
    apiKey.length > 10 &&
    /^wapi_[A-Za-z0-9_-]+$/.test(apiKey)
  );
}

/**
 * Rate limit check for API key operations
 */
const apiKeyOpRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkApiKeyOpRateLimit(organizationId: string): boolean {
  const now = Date.now();
  const key = `apikey_ops:${organizationId}`;
  const limit = 10; // 10 operations per hour
  const windowMs = 60 * 60 * 1000; // 1 hour

  // Clean up expired entries
  if (apiKeyOpRateLimits.has(key)) {
    const entry = apiKeyOpRateLimits.get(key)!;
    if (entry.resetTime < now) {
      apiKeyOpRateLimits.delete(key);
    }
  }

  // Check/update rate limit
  const entry = apiKeyOpRateLimits.get(key) || { count: 0, resetTime: now + windowMs };

  if (entry.count >= limit) {
    return false; // Rate limited
  }

  entry.count++;
  apiKeyOpRateLimits.set(key, entry);
  return true; // Allowed
}
