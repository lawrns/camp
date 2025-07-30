/**
 * Token refresh utility for handling expired JWT tokens
 */

import { supabase } from "@/lib/supabase";

export async function refreshAuthTokens(): Promise<boolean> {
  try {
    const supabaseClient = supabase.browser();
    
    // Try to refresh the session
    const { data: { session }, error } = await supabaseClient.auth.refreshSession();
    
    if (error) {
      console.warn('[TokenRefresh] Session refresh failed:', error.message);
      
      // If refresh fails, try to get the current session
      const { data: { session: currentSession }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.warn('[TokenRefresh] No valid session found, user needs to re-authenticate');
        return false;
      }
      
      return true;
    }
    
    if (session) {
      console.log('[TokenRefresh] Session refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[TokenRefresh] Error refreshing tokens:', error);
    return false;
  }
}

export async function forceReauthentication(): Promise<void> {
  try {
    const supabaseClient = supabase.browser();
    
    // Sign out and redirect to login
    await supabaseClient.auth.signOut();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  } catch (error) {
    console.error('[TokenRefresh] Error during forced re-authentication:', error);
  }
}

export async function checkAndRefreshTokens(): Promise<boolean> {
  // First try to refresh tokens
  const refreshSuccess = await refreshAuthTokens();
  
  if (!refreshSuccess) {
    // If refresh fails, force re-authentication
    console.warn('[TokenRefresh] Token refresh failed, forcing re-authentication');
    await forceReauthentication();
    return false;
  }
  
  return true;
}
