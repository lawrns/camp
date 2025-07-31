/**
 * Widget Supabase Authentication Middleware
 * 
 * Unified authentication for widget endpoints using Supabase sessions
 * instead of separate JWT tokens to fix message broadcasting failures.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

export interface WidgetAuthContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    organizationId: string;
    visitorId?: string;
    conversationId?: string;
  } | null;
  session: any;
  supabaseClient: any;
}

/**
 * Extract Supabase session from Authorization header
 */
async function extractSessionFromHeader(request: NextRequest): Promise<any> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Create a temporary Supabase client to verify the token
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Set the session manually using the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Widget Auth] Token verification failed:', error);
      return null;
    }

    // Get the full session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // If we can't get session but have user, create a minimal session object
      return {
        access_token: token,
        user,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
    }

    return session;
  } catch (error) {
    console.error('[Widget Auth] Session extraction error:', error);
    return null;
  }
}

/**
 * Widget authentication middleware that supports Supabase sessions
 */
export function withWidgetSupabaseAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: WidgetAuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      // Try to extract session from Authorization header first
      let session = await extractSessionFromHeader(request);
      let supabaseClient;

      if (session) {
        // Create authenticated Supabase client
        supabaseClient = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
              set: () => {},
              remove: () => {},
            },
          }
        );

        // Set the session for this client
        await supabaseClient.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
        });
      } else {
        // Fallback: try to get session from cookies (for backward compatibility)
        supabaseClient = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: (name: string) => {
                const cookieStore = request.cookies;
                return cookieStore.get(name)?.value;
              },
              set: () => {},
              remove: () => {},
            },
          }
        );

        const { data: { session: cookieSession } } = await supabaseClient.auth.getSession();
        session = cookieSession;
      }

      // Build auth context
      const authContext: WidgetAuthContext = {
        isAuthenticated: !!session?.user,
        user: null,
        session,
        supabaseClient,
      };

      if (session?.user) {
        const userMetadata = session.user.user_metadata || {};
        const appMetadata = session.user.app_metadata || {};
        
        authContext.user = {
          id: session.user.id,
          email: session.user.email,
          organizationId: userMetadata.organization_id || appMetadata.organization_id,
          visitorId: userMetadata.visitor_id,
          conversationId: userMetadata.conversation_id,
        };
      }

      // Call the handler with auth context
      return await handler(request, context as T, authContext);

    } catch (error) {
      console.error('[Widget Supabase Auth] Middleware error:', error);
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          code: 'AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export function requireWidgetAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: WidgetAuthContext) => Promise<NextResponse>
) {
  return withWidgetSupabaseAuth<T>(async (request, context, auth) => {
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          code: 'AUTH_REQUIRED',
          message: 'Valid Supabase session token required in Authorization header'
        },
        { status: 401 }
      );
    }

    return await handler(request, context, auth);
  });
}

/**
 * Optional authentication - continues even if not authenticated
 */
export function optionalWidgetAuth<T = any>(
  handler: (request: NextRequest, context: T, auth: WidgetAuthContext) => Promise<NextResponse>
) {
  return withWidgetSupabaseAuth<T>(handler);
}

/**
 * Validate organization access
 */
export function validateOrganizationAccess(auth: WidgetAuthContext, requiredOrgId: string): boolean {
  if (!auth.isAuthenticated || !auth.user) {
    return false;
  }

  return auth.user.organizationId === requiredOrgId;
}

/**
 * Extract organization ID from request headers or auth context
 */
export function getOrganizationId(request: NextRequest, auth: WidgetAuthContext): string | null {
  // Try auth context first
  if (auth.user?.organizationId) {
    return auth.user.organizationId;
  }

  // Fallback to header
  return request.headers.get('x-organization-id');
}
