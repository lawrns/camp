/**
 * API Key Validator
 * 
 * Handles validation of API keys for widget and API access.
 * Part of the unified auth system.
 */

import { UnifiedAuthResult, UnifiedUser, AuthMetadata } from './unified-auth-core';

// API key types and their prefixes
const API_KEY_TYPES = {
  WIDGET: 'wapi_',
  GENERAL: 'api_',
  ADMIN: 'admin_',
} as const;

type ApiKeyType = keyof typeof API_KEY_TYPES;

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<UnifiedAuthResult> {
  try {
    // Determine API key type
    const keyType = getApiKeyType(apiKey);
    if (!keyType) {
      return { success: false, error: 'Invalid API key format' };
    }

    // Validate based on key type
    switch (keyType) {
      case 'WIDGET':
        return await validateWidgetApiKey(apiKey);
      case 'GENERAL':
        return await validateGeneralApiKey(apiKey);
      case 'ADMIN':
        return await validateAdminApiKey(apiKey);
      default:
        return { success: false, error: 'Unsupported API key type' };
    }
  } catch (error) {
    return {
      success: false,
      error: `API key validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate widget API key
 */
async function validateWidgetApiKey(apiKey: string): Promise<UnifiedAuthResult> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    // Query organizations table for widget API key
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, widget_enabled, metadata')
      .eq('widget_api_key', apiKey)
      .eq('widget_enabled', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid widget API key' };
    }

    // Extract widget configuration
    const metadata = data.metadata as Record<string, any> | null;
    const widgetConfig = metadata?.widget_config || {};

    // Determine permissions based on widget configuration
    const permissions = await extractWidgetApiPermissions(widgetConfig);

    // Create metadata
    const authMetadata: AuthMetadata = {
      tokenType: 'api-key',
    };

    // Create unified user object for API key
    const unifiedUser: UnifiedUser = {
      id: `api_${data.id}`,
      organizationId: data.id,
      role: 'api',
      permissions,
      isWidget: true,
      metadata: {
        apiKeyAuth: true,
        organizationName: data.name,
        widgetConfig,
        keyType: 'widget',
      },
    };

    return {
      success: true,
      user: unifiedUser,
      organizationId: data.id,
      metadata: authMetadata,
    };
  } catch (error) {
    return {
      success: false,
      error: `Widget API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate general API key
 */
async function validateGeneralApiKey(apiKey: string): Promise<UnifiedAuthResult> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    // Query api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        organization_id,
        permissions,
        expires_at,
        last_used_at,
        metadata,
        organizations!inner(id, name)
      `)
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid API key' };
    }

    // Check expiration
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return { success: false, error: 'API key expired' };
    }

    // Update last used timestamp
    await updateApiKeyUsage(data.id);

    // Create metadata
    const authMetadata: AuthMetadata = {
      tokenType: 'api-key',
      expiresAt: data.expiresAt ? Math.floor(new Date(data.expiresAt).getTime() / 1000) : undefined,
    };

    // Create unified user object
    const unifiedUser: UnifiedUser = {
      id: `api_${data.id}`,
      organizationId: data.organization_id,
      role: 'api',
      permissions: data.permissions || [],
      isWidget: false,
      metadata: {
        apiKeyAuth: true,
        apiKeyId: data.id,
        apiKeyName: data.name,
        organizationName: data.organizations.name,
        keyType: 'general',
        lastUsed: data.last_used_at,
        ...data.metadata,
      },
    };

    return {
      success: true,
      user: unifiedUser,
      organizationId: data.organization_id,
      metadata: authMetadata,
    };
  } catch (error) {
    return {
      success: false,
      error: `General API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate admin API key
 */
async function validateAdminApiKey(apiKey: string): Promise<UnifiedAuthResult> {
  // Admin API keys are typically for system-level operations
  // Implementation would depend on specific admin requirements
  return { success: false, error: 'Admin API keys not yet implemented' };
}

/**
 * Determine API key type from prefix
 */
function getApiKeyType(apiKey: string): ApiKeyType | null {
  for (const [type, prefix] of Object.entries(API_KEY_TYPES)) {
    if (apiKey.startsWith(prefix)) {
      return type as ApiKeyType;
    }
  }
  return null;
}

/**
 * Extract widget API permissions from configuration
 */
async function extractWidgetApiPermissions(widgetConfig: Record<string, any>): Promise<string[]> {
  const permissions = ['widget:read'];

  // Basic widget permissions
  if (widgetConfig.allow_messages !== false) {
    permissions.push('widget:write', 'widget:send_message');
  }

  if (widgetConfig.allow_file_upload) {
    permissions.push('widget:upload');
  }

  if (widgetConfig.allow_conversation_history) {
    permissions.push('widget:history');
  }

  // Advanced permissions
  if (widgetConfig.allow_user_identification) {
    permissions.push('widget:identify_user');
  }

  if (widgetConfig.allow_custom_fields) {
    permissions.push('widget:custom_fields');
  }

  if (widgetConfig.allow_conversation_rating) {
    permissions.push('widget:rate_conversation');
  }

  return permissions;
}

/**
 * Hash API key for secure storage lookup
 */
function hashApiKey(apiKey: string): string {
  // In a real implementation, use a proper hashing function
  // For now, using a simple approach (should be replaced with crypto.createHash)
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Update API key usage timestamp
 */
async function updateApiKeyUsage(apiKeyId: string): Promise<void> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: supabase.rpc('increment_usage_count', { key_id: apiKeyId }),
      })
      .eq('id', apiKeyId);
  } catch (error) {

  }
}

/**
 * Validate API key permissions for specific action
 */
export function validateApiKeyPermissions(user: UnifiedUser, requiredPermissions: string[]): { valid: boolean; error?: string } {
  if (!user.permissions) {
    return { valid: false, error: 'No permissions found for API key' };
  }

  const missingPermissions = requiredPermissions.filter(perm => !user.permissions!.includes(perm));
  
  if (missingPermissions.length > 0) {
    return {
      valid: false,
      error: `Missing required permissions: ${missingPermissions.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Check if API key has specific permission
 */
export function hasApiKeyPermission(user: UnifiedUser, permission: string): boolean {
  return user.permissions?.includes(permission) || false;
}

/**
 * Get API key rate limits
 */
export async function getApiKeyRateLimits(user: UnifiedUser): Promise<{ requests: number; window: number } | null> {
  if (!user.metadata?.apiKeyId) {
    return null;
  }

  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('api_keys')
      .select('rate_limit_requests, rate_limit_window')
      .eq('id', user.metadata.apiKeyId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      requests: data.rate_limit_requests || 1000, // Default 1000 requests
      window: data.rate_limit_window || 3600,     // Default 1 hour window
    };
  } catch {
    return null;
  }
}

/**
 * Create organization-scoped client for API key
 */
export async function createApiKeyScopedClient(user: UnifiedUser) {
  if (!user.organizationId) {
    throw new Error('API key user has no organization context');
  }

  const { getScopedClient } = await import('@/lib/supabase');
  return await getScopedClient(user.organizationId);
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key must be a non-empty string' };
  }

  if (apiKey.length < 32) {
    return { valid: false, error: 'API key too short' };
  }

  if (apiKey.length > 128) {
    return { valid: false, error: 'API key too long' };
  }

  // Check for valid prefix
  const keyType = getApiKeyType(apiKey);
  if (!keyType) {
    return { valid: false, error: 'Invalid API key prefix' };
  }

  // Check for valid characters (alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(apiKey)) {
    return { valid: false, error: 'API key contains invalid characters' };
  }

  return { valid: true };
}
