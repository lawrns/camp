/**
 * E2E Mode Detection Utilities
 * Provides consistent E2E mode detection across client and server
 */

/**
 * Check if we're in E2E mock mode
 * Works in both browser and server environments
 */
export function isE2EMode(): boolean {
  // Browser environment
  if (typeof window !== 'undefined') {
    const isE2E = (
      process.env.NEXT_PUBLIC_E2E_MOCK === 'true' ||
      process.env.NODE_ENV === 'test' ||
      window.location.search.includes('e2e=true')
    );
    if (isE2E) {
      console.log('[E2E] E2E mode detected in browser:', {
        NEXT_PUBLIC_E2E_MOCK: process.env.NEXT_PUBLIC_E2E_MOCK,
        NODE_ENV: process.env.NODE_ENV,
        urlParams: window.location.search
      });
    }
    return isE2E;
  }

  // Server environment
  const isE2E = (
    process.env.NEXT_PUBLIC_E2E_MOCK === 'true' ||
    process.env.E2E_MOCK === 'true' ||
    process.env.NODE_ENV === 'test'
  );
  if (isE2E) {
    console.log('[E2E] E2E mode detected on server:', {
      NEXT_PUBLIC_E2E_MOCK: process.env.NEXT_PUBLIC_E2E_MOCK,
      E2E_MOCK: process.env.E2E_MOCK,
      NODE_ENV: process.env.NODE_ENV
    });
  }
  return isE2E;
}

/**
 * Check if realtime should be disabled
 */
export function shouldDisableRealtime(): boolean {
  return isE2EMode();
}

/**
 * Check if input should be force-enabled (ignore connection state)
 */
export function shouldForceEnableInput(): boolean {
  return isE2EMode();
}
