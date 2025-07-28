/**
 * Unified Authentication Core
 * 
 * Central abstraction layer that unifies all authentication methods:
 * - Supabase JWT validation
 * - Custom widget JWT handling  
 * - API key authentication
 * - Lightweight auth checks
 * 
 * This eliminates drift between authentication systems and provides
 * a single source of truth for auth logic.
 */

import { NextRequest } from "next/server";
import { User } from "@supabase/supabase-js";

// Unified auth result interface
export interface UnifiedAuthResult {
  success: boolean;
  user?: UnifiedUser;
  organizationId?: string;
  authMethod?: AuthMethod;
  error?: string;
  metadata?: AuthMetadata;
}

// Unified user interface
export interface UnifiedUser {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  isWidget?: boolean;
  visitorId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Authentication methods
export type AuthMethod = 
  | 'supabase-jwt'
  | 'widget-jwt' 
  | 'api-key'
  | 'bearer-token'
  | 'query-param'
  | 'cookie';

// Auth metadata for tracking and debugging
export interface AuthMetadata {
  tokenType?: 'access' | 'refresh' | 'widget' | 'api-key';
  expiresAt?: number;
  issuedAt?: number;
  origin?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionDuration?: number;
}

// Auth configuration options
export interface AuthConfig {
  methods?: AuthMethod[];
  required?: boolean;
  allowWidget?: boolean;
  allowApiKey?: boolean;
  requireOrganization?: boolean;
  permissions?: string[];
  skipExpiration?: boolean;
  debug?: boolean;
}

// Default auth configuration
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  methods: ['supabase-jwt', 'cookie'],
  required: true,
  allowWidget: false,
  allowApiKey: false,
  requireOrganization: false,
  permissions: [],
  skipExpiration: false,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Core unified authentication class
 */
export class UnifiedAuthCore {
  private config: AuthConfig;
  private tokenExtractors: Map<AuthMethod, (request: NextRequest) => string | null>;
  private tokenValidators: Map<AuthMethod, (token: string, request: NextRequest) => Promise<UnifiedAuthResult>>;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config };
    this.tokenExtractors = new Map();
    this.tokenValidators = new Map();
    this.initializeExtractors();
    this.initializeValidators();
  }

  /**
   * Main authentication method - tries all configured auth methods
   */
  async authenticate(request: NextRequest): Promise<UnifiedAuthResult> {
    const methods = this.config.methods || ['supabase-jwt'];
    
    for (const method of methods) {
      try {
        const token = this.extractToken(request, method);
        if (!token) continue;

        const result = await this.validateToken(token, method, request);
        if (result.success) {
          // Add auth metadata
          result.authMethod = method;
          result.metadata = {
            ...result.metadata,
            origin: request.headers.get('origin') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: this.extractIpAddress(request),
          };

          // Validate organization requirement
          if (this.config.requireOrganization && !result.organizationId) {
            continue; // Try next method
          }

          // Validate permissions
          if (this.config.permissions?.length && result.user?.permissions) {
            const hasPermission = this.config.permissions.some(perm => 
              result.user?.permissions?.includes(perm)
            );
            if (!hasPermission) {
              continue; // Try next method
            }
          }

          if (this.config.debug) {

          }

          return result;
        }
      } catch (error) {
        if (this.config.debug) {

        }
        continue; // Try next method
      }
    }

    // No authentication method succeeded
    const error = this.config.required ? 'Authentication required' : 'No valid authentication found';
    return { success: false, error };
  }

  /**
   * Quick auth check without full validation (for performance)
   */
  async quickCheck(request: NextRequest): Promise<{ valid: boolean; userId?: string; organizationId?: string }> {
    const methods = this.config.methods || ['supabase-jwt'];
    
    for (const method of methods) {
      const token = this.extractToken(request, method);
      if (!token) continue;

      try {
        // Quick JWT decode without verification
        if (method.includes('jwt')) {
          const payload = this.decodeJwtPayload(token);
          if (payload) {
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp && payload.exp < now;
            
            if (!isExpired || this.config.skipExpiration) {
              return {
                valid: true,
                userId: payload.sub,
                organizationId: payload.organization_id || payload.user_metadata?.organization_id,
              };
            }
          }
        }
      } catch {
        continue;
      }
    }

    return { valid: false };
  }

  /**
   * Extract token using specific method
   */
  private extractToken(request: NextRequest, method: AuthMethod): string | null {
    const extractor = this.tokenExtractors.get(method);
    return extractor ? extractor(request) : null;
  }

  /**
   * Validate token using specific method
   */
  private async validateToken(token: string, method: AuthMethod, request: NextRequest): Promise<UnifiedAuthResult> {
    const validator = this.tokenValidators.get(method);
    if (!validator) {
      return { success: false, error: `No validator for method: ${method}` };
    }
    return validator(token, request);
  }

  /**
   * Initialize token extractors for each auth method
   */
  private initializeExtractors() {
    // Supabase JWT from cookies
    this.tokenExtractors.set('supabase-jwt', (request) => {
      return this.extractFromCookies(request, 'sb-access-token') ||
             this.extractFromCookies(request, 'supabase-auth-token');
    });

    // Cookie-based auth
    this.tokenExtractors.set('cookie', (request) => {
      return this.extractFromCookies(request, 'campfire-auth-token') ||
             this.extractFromCookies(request, 'auth-token');
    });

    // Widget JWT from Authorization header
    this.tokenExtractors.set('widget-jwt', (request) => {
      const auth = request.headers.get('authorization');
      if (auth?.startsWith('Bearer ')) {
        const token = auth.substring(7);
        // Check if it's a widget token by looking for widget-specific claims
        try {
          const payload = this.decodeJwtPayload(token);
          if (payload?.user_metadata?.widget_session || payload?.app_metadata?.provider === 'widget') {
            return token;
          }
        } catch {}
      }
      return null;
    });

    // API key from multiple sources
    this.tokenExtractors.set('api-key', (request) => {
      // X-API-Key header
      const apiKeyHeader = request.headers.get('x-api-key');
      if (apiKeyHeader) return apiKeyHeader;

      // Authorization Bearer (for API keys)
      const auth = request.headers.get('authorization');
      if (auth?.startsWith('Bearer ') && auth.substring(7).startsWith('wapi_')) {
        return auth.substring(7);
      }

      // Query parameter
      const url = new URL(request.url);
      return url.searchParams.get('api_key');
    });

    // Bearer token from Authorization header
    this.tokenExtractors.set('bearer-token', (request) => {
      const auth = request.headers.get('authorization');
      return auth?.startsWith('Bearer ') ? auth.substring(7) : null;
    });

    // Query parameter token
    this.tokenExtractors.set('query-param', (request) => {
      const url = new URL(request.url);
      return url.searchParams.get('token') || url.searchParams.get('access_token');
    });
  }

  /**
   * Initialize token validators for each auth method
   */
  private initializeValidators() {
    // Supabase JWT validation
    this.tokenValidators.set('supabase-jwt', async (token, request) => {
      try {
        const { validateSupabaseJWT } = await import('./supabase-jwt-validator');
        return await validateSupabaseJWT(token);
      } catch (error) {
        return { success: false, error: `Supabase JWT validation failed: ${error}` };
      }
    });

    // Cookie validation (same as Supabase JWT)
    this.tokenValidators.set('cookie', async (token, request) => {
      return this.tokenValidators.get('supabase-jwt')!(token, request);
    });

    // Widget JWT validation
    this.tokenValidators.set('widget-jwt', async (token, request) => {
      try {
        const { validateWidgetJWT } = await import('./widget-jwt-validator');
        return await validateWidgetJWT(token);
      } catch (error) {
        return { success: false, error: `Widget JWT validation failed: ${error}` };
      }
    });

    // API key validation
    this.tokenValidators.set('api-key', async (token, request) => {
      try {
        const { validateApiKey } = await import('./api-key-validator');
        return await validateApiKey(token);
      } catch (error) {
        return { success: false, error: `API key validation failed: ${error}` };
      }
    });

    // Bearer token validation (try as Supabase JWT first, then widget)
    this.tokenValidators.set('bearer-token', async (token, request) => {
      // Try Supabase JWT first
      const supabaseResult = await this.tokenValidators.get('supabase-jwt')!(token, request);
      if (supabaseResult.success) return supabaseResult;

      // Try widget JWT
      const widgetResult = await this.tokenValidators.get('widget-jwt')!(token, request);
      if (widgetResult.success) return widgetResult;

      return { success: false, error: 'Invalid bearer token' };
    });

    // Query parameter validation (same as bearer token)
    this.tokenValidators.set('query-param', async (token, request) => {
      return this.tokenValidators.get('bearer-token')!(token, request);
    });
  }

  /**
   * Helper methods
   */
  private extractFromCookies(request: NextRequest, cookieName: string): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === cookieName && value) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private decodeJwtPayload(token: string): any {
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

  private extractIpAddress(request: NextRequest): string | undefined {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           undefined;
  }
}

/**
 * Create unified auth instance with configuration
 */
export function createUnifiedAuth(config?: Partial<AuthConfig>): UnifiedAuthCore {
  return new UnifiedAuthCore(config);
}

/**
 * Pre-configured auth instances for common use cases
 */
export const dashboardAuth = createUnifiedAuth({
  methods: ['supabase-jwt', 'cookie'],
  required: true,
  requireOrganization: true,
});

export const widgetAuth = createUnifiedAuth({
  methods: ['widget-jwt', 'api-key'],
  required: true,
  allowWidget: true,
  allowApiKey: true,
});

export const apiAuth = createUnifiedAuth({
  methods: ['api-key', 'bearer-token'],
  required: true,
  allowApiKey: true,
});

export const flexibleAuth = createUnifiedAuth({
  methods: ['supabase-jwt', 'widget-jwt', 'api-key', 'cookie', 'bearer-token'],
  required: false,
  allowWidget: true,
  allowApiKey: true,
});
