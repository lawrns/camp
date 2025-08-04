/**
 * Widget Authentication Helper for Real-time Operations
 * 
 * Ensures proper authentication for widget real-time channels
 */

import { supabase } from "@/lib/supabase";

export interface WidgetAuthResult {
  isAuthenticated: boolean;
  session: unknown;
  error?: string;
}

/**
 * Ensures the widget has proper authentication for real-time operations
 */
export async function ensureWidgetAuthentication(
  organizationId: string,
  visitorId?: string
): Promise<WidgetAuthResult> {
  try {
    console.log('[Widget Auth] 🔐 Checking authentication state...');
    
    const client = supabase.browser();
    const { data: session, error } = await client.auth.getSession();

    // If we have a valid session, return it
    if (!error && session?.session?.access_token) {
      console.log('[Widget Auth] ✅ Valid session found');
      return {
        isAuthenticated: true,
        session: session.session
      };
    }

    // If no session or error, try anonymous authentication
    console.log('[Widget Auth] 🔄 No valid session, attempting anonymous authentication...');
    
    const { data: anonData, error: anonError } = await client.auth.signInAnonymously({
      options: {
        data: {
          organization_id: organizationId,
          widget_session: true,
          visitor_id: visitorId || `visitor_${Date.now()}`,
          source: "widget",
        },
      },
    });

    if (anonError || !anonData.session?.access_token) {
      console.error('[Widget Auth] ❌ Anonymous authentication failed:', anonError);
      return {
        isAuthenticated: false,
        session: null,
        error: anonError?.message || 'Anonymous authentication failed'
      };
    }

    console.log('[Widget Auth] ✅ Anonymous authentication successful');
    return {
      isAuthenticated: true,
      session: anonData.session
    };

  } catch (error) {
    console.error('[Widget Auth] 💥 Authentication error:', error);
    return {
      isAuthenticated: false,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown authentication error'
    };
  }
}

/**
 * Validates if a session is still valid for real-time operations
 */
export function isSessionValid(session: unknown): boolean {
  if (!session?.access_token) {
    return false;
  }

  // Check if token is expired
  const expiresAt = session.expiresAt;
  if (expiresAt && Date.now() / 1000 > expiresAt) {
    return false;
  }

  return true;
}

/**
 * Gets the current authentication state for debugging
 */
export async function getAuthDebugInfo(): Promise<any> {
  try {
    const client = supabase.browser();
    const { data: session, error } = await client.auth.getSession();
    
    return {
      hasSession: !!session?.session,
      hasAccessToken: !!session?.session?.access_token,
      isExpired: session?.session?.expiresAt ? Date.now() / 1000 > session.session.expiresAt : false,
      error: error?.message,
      userId: session?.session?.user?.id,
      role: session?.session?.user?.role,
      isAnonymous: session?.session?.user?.is_anonymous
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
