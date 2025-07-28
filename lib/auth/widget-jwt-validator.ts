/**
 * Widget JWT Validator
 * 
 * Handles validation of custom widget JWT tokens for widget authentication.
 * Part of the unified auth system.
 */

import { UnifiedAuthResult, UnifiedUser, AuthMetadata } from './unified-auth-core';

/**
 * Validate widget JWT token
 */
export async function validateWidgetJWT(token: string): Promise<UnifiedAuthResult> {
  try {
    // Lazy load JWT library and utilities
    const jwt = await import('jsonwebtoken');
    const { getJWTSecret } = await import('./widget-auth');

    // Verify token signature
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as any;

    // Validate widget token structure
    const validation = validateWidgetTokenStructure(decoded);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid widget token structure'
      };
    }

    // Extract organization and visitor information
    const organizationId = decoded.organization_id || decoded.user_metadata?.organization_id;
    const visitorId = decoded.user_metadata?.visitor_id || decoded.visitor_id;
    const sessionId = decoded.session_id || decoded.sessionId;

    // Create metadata
    const metadata: AuthMetadata = {
      tokenType: 'widget',
      expiresAt: decoded.exp,
      issuedAt: decoded.iat,
      sessionDuration: decoded.exp && decoded.iat ? decoded.exp - decoded.iat : undefined,
    };

    // Create unified user object for widget session
    const unifiedUser: UnifiedUser = {
      id: decoded.sub || `widget_${visitorId}`,
      email: decoded.email,
      organizationId,
      role: 'visitor',
      permissions: ['widget:read', 'widget:write'],
      isWidget: true,
      visitorId,
      sessionId,
      metadata: {
        widgetSession: true,
        provider: 'widget',
        conversationId: decoded.conversationId,
        mailboxId: decoded.mailboxId,
        ...decoded.user_metadata,
      },
    };

    return {
      success: true,
      user: unifiedUser,
      organizationId,
      metadata,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return { success: false, error: 'Widget token expired' };
      } else if (error.name === 'JsonWebTokenError') {
        return { success: false, error: 'Invalid widget token signature' };
      } else if (error.name === 'NotBeforeError') {
        return { success: false, error: 'Widget token not yet valid' };
      }
    }

    return {
      success: false,
      error: `Widget JWT validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Quick widget JWT validation without full verification
 */
export async function quickValidateWidgetJWT(token: string): Promise<{ valid: boolean; userId?: string; organizationId?: string }> {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return { valid: false };

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    // Check if it's a widget token
    if (!payload.user_metadata?.widget_session && payload.app_metadata?.provider !== 'widget') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.sub,
      organizationId: payload.organization_id || payload.user_metadata?.organization_id,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Refresh widget JWT token
 */
export async function refreshWidgetJWT(token: string, organizationId: string): Promise<UnifiedAuthResult> {
  try {
    // First validate the current token to extract session info
    const currentResult = await validateWidgetJWT(token);
    if (!currentResult.success || !currentResult.user) {
      return { success: false, error: 'Cannot refresh invalid token' };
    }

    // Generate new token with same session data
    const { generateWidgetToken } = await import('./widget-auth');
    const newToken = await generateWidgetToken(
      organizationId,
      currentResult.user.visitorId!,
      {
        sessionId: currentResult.user.sessionId,
        conversationId: currentResult.user.metadata?.conversationId,
        mailboxId: currentResult.user.metadata?.mailboxId,
      }
    );

    // Validate the new token
    return await validateWidgetJWT(newToken);
  } catch (error) {
    return {
      success: false,
      error: `Widget token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate widget token structure
 */
function validateWidgetTokenStructure(payload: any): { valid: boolean; error?: string } {
  if (!payload) {
    return { valid: false, error: 'Invalid widget token payload' };
  }

  // Check required claims
  const requiredClaims = ['sub', 'exp', 'iat'];
  for (const claim of requiredClaims) {
    if (!payload[claim]) {
      return { valid: false, error: `Missing required claim: ${claim}` };
    }
  }

  // Check widget-specific requirements
  const organizationId = payload.organization_id || payload.user_metadata?.organization_id;
  if (!organizationId) {
    return { valid: false, error: 'Missing organization_id in widget token' };
  }

  const visitorId = payload.user_metadata?.visitor_id || payload.visitor_id;
  if (!visitorId) {
    return { valid: false, error: 'Missing visitor_id in widget token' };
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return { valid: false, error: 'Widget token expired' };
  }

  // Check widget session marker
  const isWidgetSession = payload.user_metadata?.widget_session || 
                         payload.app_metadata?.provider === 'widget';
  if (!isWidgetSession) {
    return { valid: false, error: 'Not a widget session token' };
  }

  return { valid: true };
}

/**
 * Create widget session context
 */
export async function createWidgetSessionContext(user: UnifiedUser) {
  if (!user.isWidget || !user.organizationId) {
    throw new Error('Invalid widget user for session context');
  }

  // Get organization-scoped client
  const { getScopedClient } = await import('@/lib/supabase');
  const client = await getScopedClient(user.organizationId);

  return {
    client,
    organizationId: user.organizationId,
    visitorId: user.visitorId,
    sessionId: user.sessionId,
    conversationId: user.metadata?.conversationId,
    mailboxId: user.metadata?.mailboxId,
  };
}

/**
 * Validate widget session activity
 */
export async function validateWidgetSession(user: UnifiedUser): Promise<{ valid: boolean; error?: string }> {
  if (!user.isWidget || !user.sessionId) {
    return { valid: false, error: 'Not a widget session' };
  }

  try {
    // Check if session exists and is active
    const { createServerClient } = await import('@/lib/supabase');
    const adminClient = createServerClient();

    const { data: session, error } = await adminClient
      .from('widget_sessions')
      .select('id, organization_id, visitor_id, expires_at, metadata')
      .eq('id', user.sessionId)
      .single();

    if (error || !session) {
      return { valid: false, error: 'Widget session not found' };
    }

    // Check expiration
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return { valid: false, error: 'Widget session expired' };
    }

    // Validate organization match
    if (session.organization_id !== user.organizationId) {
      return { valid: false, error: 'Organization mismatch' };
    }

    // Validate visitor match
    if (session.visitor_id !== user.visitorId) {
      return { valid: false, error: 'Visitor mismatch' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Session validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Update widget session activity
 */
export async function updateWidgetSessionActivity(user: UnifiedUser): Promise<void> {
  if (!user.isWidget || !user.sessionId) {
    return;
  }

  try {
    const { createServerClient } = await import('@/lib/supabase');
    const adminClient = createServerClient();

    await adminClient
      .from('widget_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        metadata: {
          ...user.metadata,
          last_activity_update: new Date().toISOString(),
        },
      })
      .eq('id', user.sessionId);
  } catch (error) {

  }
}

/**
 * Extract widget permissions based on organization settings
 */
export async function extractWidgetPermissions(organizationId: string): Promise<string[]> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const client = createServerClient();

    const { data: org, error } = await client
      .from('organizations')
      .select('metadata')
      .eq('id', organizationId)
      .single();

    if (error || !org) {
      return ['widget:read']; // Default minimal permissions
    }

    const metadata = org.metadata as Record<string, any> | null;
    const widgetConfig = metadata?.widget_config || {};

    const permissions = ['widget:read'];
    
    if (widgetConfig.allow_messages !== false) {
      permissions.push('widget:write');
    }
    
    if (widgetConfig.allow_file_upload) {
      permissions.push('widget:upload');
    }
    
    if (widgetConfig.allow_conversation_history) {
      permissions.push('widget:history');
    }

    return permissions;
  } catch {
    return ['widget:read']; // Default fallback
  }
}

/**
 * Helper function to decode JWT payload
 */
function decodeJwtPayload(token: string): any {
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
