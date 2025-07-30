/**
 * Utility to clear expired tokens and force fresh authentication
 */

export function clearExpiredTokens(): void {
  if (typeof window === 'undefined') return;

  console.log('[ClearTokens] Clearing all authentication storage...');

  // Clear all Supabase-related localStorage items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth-token') ||
      key.includes('auth.token') ||
      key.includes('session')
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    console.log('[ClearTokens] Removing:', key);
    localStorage.removeItem(key);
  });

  // Clear sessionStorage as well
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth-token') ||
      key.includes('auth.token') ||
      key.includes('session')
    )) {
      sessionKeysToRemove.push(key);
    }
  }

  sessionKeysToRemove.forEach(key => {
    console.log('[ClearTokens] Removing from sessionStorage:', key);
    sessionStorage.removeItem(key);
  });

  console.log('[ClearTokens] Storage cleared. Reloading page...');
  
  // Reload the page to force fresh authentication
  window.location.reload();
}

// Function to check if tokens are expired and clear them if needed
export function checkAndClearExpiredTokens(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;

    const storageKey = `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`;
    const authData = localStorage.getItem(storageKey);

    if (!authData) return false;

    const parsed = JSON.parse(authData);
    if (!parsed?.access_token || !parsed?.expires_at) return false;

    // Check if token is expired (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = (parsed.expires_at - 30) <= now;

    if (isExpired) {
      console.log('[ClearTokens] Expired token detected, clearing storage...');
      clearExpiredTokens();
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[ClearTokens] Error checking token expiration:', error);
    return false;
  }
}

// Force clear all tokens immediately (for debugging)
export function forceClearAllTokens(): void {
  if (typeof window === 'undefined') return;

  console.log('[ClearTokens] Force clearing all authentication tokens...');
  clearExpiredTokens();
}
