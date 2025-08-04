/**
 * Supabase JWT Validator
 * 
 * Handles validation of Supabase-issued JWT tokens for dashboard authentication.
 * Part of the unified auth system.
 */

import { UnifiedAuthResult, UnifiedUser, AuthMetadata } from './unified-auth-core';

/**
 * Validate Supabase JWT token
 */
export async function validateSupabaseJWT(token: string): Promise<UnifiedAuthResult> {
  try {
    // Lazy load Supabase to avoid bundle bloat
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        error: error?.message || 'Invalid Supabase token'
      };
    }

    // Extract organization ID from user metadata
    const organizationId = user.user_metadata?.organization_id || 
                          user.app_metadata?.organization_id;

    // Decode JWT payload for additional metadata
    const payload = decodeJwtPayload(token);
    const metadata: AuthMetadata = {
      tokenType: 'access',
      expiresAt: payload?.exp,
      issuedAt: payload?.iat,
      sessionDuration: payload?.exp && payload?.iat ? payload.exp - payload.iat : undefined,
    };

    // Create unified user object
    const unifiedUser: UnifiedUser = {
      id: user.id,
      email: user.email,
      organizationId,
      role: user.app_metadata?.role || 'user',
      permissions: user.app_metadata?.permissions || [],
      isWidget: false,
      metadata: {
        supabaseUser: true,
        emailVerified: user.email_confirmed_at ? true : false,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        ...user.user_metadata,
      },
    };

    return {
      success: true,
      user: unifiedUser,
      organizationId,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: `Supabase JWT validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Quick Supabase JWT validation without database calls
 */
export async function quickValidateSupabaseJWT(token: string): Promise<{ valid: boolean; userId?: string; organizationId?: string }> {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return { valid: false };

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    // Check if it's a Supabase token
    if (payload.iss !== 'supabase' && !payload.aud?.includes('authenticated')) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.sub,
      organizationId: payload.user_metadata?.organization_id || payload.app_metadata?.organization_id,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Refresh Supabase JWT token
 */
export async function refreshSupabaseJWT(refreshToken: string): Promise<UnifiedAuthResult> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return {
        success: false,
        error: error?.message || 'Token refresh failed'
      };
    }

    // Validate the new access token
    return await validateSupabaseJWT(data.session.access_token);
  } catch (error) {
    return {
      success: false,
      error: `Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Extract organization context from Supabase user
 */
export function extractOrganizationContext(user: unknown): { organizationId?: string; role?: string; permissions?: string[] } {
  const organizationId = user.user_metadata?.organization_id || 
                        user.app_metadata?.organization_id;
  
  const role = user.app_metadata?.role || 'user';
  const permissions = user.app_metadata?.permissions || [];

  return { organizationId, role, permissions };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: UnifiedUser, permission: string): boolean {
  return user.permissions?.includes(permission) || false;
}

/**
 * Check if user has unknown of the specified permissions
 */
export function hasAnyPermission(user: UnifiedUser, permissions: string[]): boolean {
  return permissions.some(perm => hasPermission(user, perm));
}

/**
 * Check if user belongs to organization
 */
export function belongsToOrganization(user: UnifiedUser, organizationId: string): boolean {
  return user.organizationId === organizationId;
}

/**
 * Validate organization access for user
 */
export async function validateOrganizationAccess(
  user: UnifiedUser, 
  requiredOrganizationId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!user.organizationId) {
    return { valid: false, error: 'User has no organization context' };
  }

  if (user.organizationId !== requiredOrganizationId) {
    return { valid: false, error: 'User does not belong to required organization' };
  }

  // Additional checks could be added here:
  // - Organization status (active/suspended)
  // - User role within organization
  // - Feature access permissions

  return { valid: true };
}

/**
 * Create Supabase client with user context
 */
export async function createUserScopedClient(user: UnifiedUser) {
  const { createServerClient } = await import('@/lib/supabase');
  const supabase = createServerClient();

  // Set user context for RLS policies
  if (user.organizationId) {
    await supabase.rpc('set_claim', {
      claim: 'organization_id',
      value: user.organizationId,
    });
  }

  return supabase;
}

/**
 * Helper function to decode JWT payload
 */
function decodeJwtPayload(token: string): unknown {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Validate JWT structure and required claims
 */
export function validateJwtStructure(payload: unknown): { valid: boolean; error?: string } {
  if (!payload) {
    return { valid: false, error: 'Invalid JWT payload' };
  }

  // Check required claims
  const requiredClaims = ['sub', 'aud', 'exp', 'iat', 'iss'];
  for (const claim of requiredClaims) {
    if (!payload[claim]) {
      return { valid: false, error: `Missing required claim: ${claim}` };
    }
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return { valid: false, error: 'Token expired' };
  }

  // Check not before (if present)
  if (payload.nbf && payload.nbf > now) {
    return { valid: false, error: 'Token not yet valid' };
  }

  // Check issuer
  if (payload.iss !== 'supabase') {
    return { valid: false, error: 'Invalid token issuer' };
  }

  // Check audience
  if (!payload.aud?.includes('authenticated')) {
    return { valid: false, error: 'Invalid token audience' };
  }

  return { valid: true };
}

/**
 * Extract user metadata from JWT payload
 */
export function extractUserMetadata(payload: unknown): Record<string, any> {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    organizationId: payload.user_metadata?.organization_id || payload.app_metadata?.organization_id,
    permissions: payload.app_metadata?.permissions || [],
    emailVerified: payload.email_confirmed_at ? true : false,
    ...payload.user_metadata,
  };
}
