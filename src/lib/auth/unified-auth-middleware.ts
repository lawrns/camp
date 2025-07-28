/**
 * Unified Auth Middleware
 * 
 * Provides middleware functions that use the unified auth system
 * for consistent authentication across all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  UnifiedAuthCore, 
  UnifiedAuthResult, 
  UnifiedUser, 
  AuthConfig,
  createUnifiedAuth,
  dashboardAuth,
  widgetAuth,
  apiAuth,
  flexibleAuth
} from './unified-auth-core';

// Middleware context interface
export interface AuthMiddlewareContext {
  user: UnifiedUser;
  organizationId: string;
  authResult: UnifiedAuthResult;
  client?: any; // Scoped Supabase client
}

// Middleware options
export interface AuthMiddlewareOptions extends Partial<AuthConfig> {
  createScopedClient?: boolean;
  updateActivity?: boolean;
  rateLimiting?: boolean;
  auditLogging?: boolean;
}

/**
 * Create authentication middleware with unified auth
 */
export function withUnifiedAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, context: T): Promise<Response> => {
    try {
      // Create auth instance with options
      const auth = createUnifiedAuth(options);
      
      // Authenticate request
      const authResult = await auth.authenticate(request);
      
      if (!authResult.success || !authResult.user) {
        return createAuthErrorResponse(authResult.error || 'Authentication required');
      }

      // Validate organization requirement
      if (options.requireOrganization && !authResult.organizationId) {
        return createAuthErrorResponse('Organization context required');
      }

      // Create scoped client if requested
      let client;
      if (options.createScopedClient && authResult.organizationId) {
        client = await createScopedClientForUser(authResult.user);
      }

      // Update activity if requested
      if (options.updateActivity) {
        await updateUserActivity(authResult.user, request);
      }

      // Rate limiting check
      if (options.rateLimiting) {
        const rateLimitResult = await checkRateLimit(authResult.user, request);
        if (!rateLimitResult.allowed) {
          return createRateLimitResponse(rateLimitResult.resetTime);
        }
      }

      // Audit logging
      if (options.auditLogging) {
        await logAuthEvent(authResult.user, request, 'api_access');
      }

      // Create auth context
      const authContext: AuthMiddlewareContext = {
        user: authResult.user,
        organizationId: authResult.organizationId!,
        authResult,
        client,
      };

      // Call handler with auth context
      return await handler(request, context, authContext);
    } catch (error) {

      return createAuthErrorResponse('Authentication error');
    }
  };
}

/**
 * Pre-configured middleware for dashboard routes
 */
export function withDashboardAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
) {
  return withUnifiedAuth(handler, {
    methods: ['supabase-jwt', 'cookie'],
    required: true,
    requireOrganization: true,
    createScopedClient: true,
    updateActivity: true,
    auditLogging: true,
  });
}

/**
 * Pre-configured middleware for widget routes
 */
export function withWidgetAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
) {
  return withUnifiedAuth(handler, {
    methods: ['widget-jwt', 'api-key'],
    required: true,
    allowWidget: true,
    allowApiKey: true,
    createScopedClient: true,
    updateActivity: true,
    rateLimiting: true,
  });
}

/**
 * Pre-configured middleware for API routes
 */
export function withApiAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
) {
  return withUnifiedAuth(handler, {
    methods: ['api-key', 'bearer-token'],
    required: true,
    allowApiKey: true,
    createScopedClient: true,
    rateLimiting: true,
    auditLogging: true,
  });
}

/**
 * Flexible middleware that accepts multiple auth methods
 */
export function withFlexibleAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
) {
  return withUnifiedAuth(handler, {
    methods: ['supabase-jwt', 'widget-jwt', 'api-key', 'cookie', 'bearer-token'],
    required: false,
    allowWidget: true,
    allowApiKey: true,
    createScopedClient: true,
  });
}

/**
 * Optional auth middleware (doesn't require authentication)
 */
export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, context: T, auth?: AuthMiddlewareContext) => Promise<Response>
) {
  return async (request: NextRequest, context: T): Promise<Response> => {
    try {
      const auth = flexibleAuth;
      const authResult = await auth.authenticate(request);
      
      let authContext: AuthMiddlewareContext | undefined;
      
      if (authResult.success && authResult.user) {
        // Create scoped client if user is authenticated
        const client = authResult.organizationId 
          ? await createScopedClientForUser(authResult.user)
          : undefined;
          
        authContext = {
          user: authResult.user,
          organizationId: authResult.organizationId!,
          authResult,
          client,
        };
      }

      return await handler(request, context, authContext);
    } catch (error) {

      // Continue without auth context on error
      return await handler(request, context);
    }
  };
}

/**
 * Create scoped Supabase client for authenticated user
 */
async function createScopedClientForUser(user: UnifiedUser) {
  if (user.isWidget && user.organizationId) {
    const { getScopedClient } = await import('@/lib/supabase');
    return await getScopedClient(user.organizationId);
  } else if (user.organizationId) {
    const { createUserScopedClient } = await import('./supabase-jwt-validator');
    return await createUserScopedClient(user);
  }
  
  // Fallback to regular client
  const { createServerClient } = await import('@/lib/supabase');
  return createServerClient();
}

/**
 * Update user activity timestamp
 */
async function updateUserActivity(user: UnifiedUser, request: NextRequest): Promise<void> {
  try {
    if (user.isWidget) {
      const { updateWidgetSessionActivity } = await import('./widget-jwt-validator');
      await updateWidgetSessionActivity(user);
    } else {
      // Update user activity in database
      const { createServerClient } = await import('@/lib/supabase');
      const client = createServerClient();
      
      await client
        .from('users')
        .update({
          last_activity_at: new Date().toISOString(),
          last_ip: extractIpAddress(request),
        })
        .eq('id', user.id);
    }
  } catch (error) {

  }
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(user: UnifiedUser, request: NextRequest): Promise<{ allowed: boolean; resetTime?: number }> {
  try {
    // Get rate limits based on user type
    let limits;
    if (user.metadata?.apiKeyAuth) {
      const { getApiKeyRateLimits } = await import('./api-key-validator');
      limits = await getApiKeyRateLimits(user);
    }
    
    // Default limits if none specified
    if (!limits) {
      limits = { requests: 1000, window: 3600 }; // 1000 requests per hour
    }

    // Simple in-memory rate limiting (should be replaced with Redis in production)
    const key = `rate_limit:${user.id}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % limits.window);
    
    // This is a simplified implementation
    // In production, use Redis or similar for distributed rate limiting
    return { allowed: true }; // Placeholder
  } catch (error) {

    return { allowed: true }; // Allow on error
  }
}

/**
 * Log authentication events for audit trail
 */
async function logAuthEvent(user: UnifiedUser, request: NextRequest, event: string): Promise<void> {
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const client = createServerClient();
    
    await client
      .from('audit_logs')
      .insert({
        user_id: user.id,
        organization_id: user.organizationId,
        event_type: event,
        event_data: {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: extractIpAddress(request),
          authMethod: user.metadata?.authMethod,
        },
        created_at: new Date().toISOString(),
      });
  } catch (error) {

  }
}

/**
 * Create standardized auth error response
 */
function createAuthErrorResponse(message: string, status: number = 401): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="API"',
      },
    }
  );
}

/**
 * Create rate limit error response
 */
function createRateLimitResponse(resetTime?: number): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Remaining': '0',
  };
  
  if (resetTime) {
    headers['X-RateLimit-Reset'] = resetTime.toString();
  }

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      resetTime,
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Extract IP address from request
 */
function extractIpAddress(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         undefined;
}

/**
 * Validate permissions for specific action
 */
export function requirePermissions(permissions: string[]) {
  return function<T = any>(
    handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
  ) {
    return withUnifiedAuth(async (request: NextRequest, context: T, auth: AuthMiddlewareContext) => {
      // Check if user has required permissions
      const hasPermission = permissions.every(perm => 
        auth.user.permissions?.includes(perm)
      );
      
      if (!hasPermission) {
        return createAuthErrorResponse('Insufficient permissions', 403);
      }
      
      return handler(request, context, auth);
    }, { permissions });
  };
}

/**
 * Require specific organization access
 */
export function requireOrganization(organizationId: string) {
  return function<T = any>(
    handler: (request: NextRequest, context: T, auth: AuthMiddlewareContext) => Promise<Response>
  ) {
    return withUnifiedAuth(async (request: NextRequest, context: T, auth: AuthMiddlewareContext) => {
      if (auth.organizationId !== organizationId) {
        return createAuthErrorResponse('Organization access denied', 403);
      }
      
      return handler(request, context, auth);
    });
  };
}
