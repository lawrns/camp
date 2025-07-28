/**
 * JWT Token Utilities
 * 
 * Shared utilities for JWT token handling, expiration checking,
 * and refresh logic across dashboard and widget authentication.
 */

export interface TokenInfo {
  isValid: boolean;
  expiresAt: number;
  timeUntilExpiry: number;
  shouldRefresh: boolean;
  payload?: { [key: string]: any };
}

/**
 * Browser-compatible JWT token decoding and expiration checking
 */
export function checkTokenExpiration(token: string, refreshThresholdSeconds: number = 300): TokenInfo {
  try {
    // Validate token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return {
        isValid: false,
        expiresAt: 0,
        timeUntilExpiry: 0,
        shouldRefresh: false,
      };
    }

    // Browser-compatible base64 decoding
    let payload: { exp: number; [key: string]: any };
    try {
      const base64Payload = tokenParts[1];
      // Handle URL-safe base64
      const normalizedPayload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(normalizedPayload);
      payload = JSON.parse(decodedPayload);
    } catch (decodeError) {
      return {
        isValid: false,
        expiresAt: 0,
        timeUntilExpiry: 0,
        shouldRefresh: false,
      };
    }

    // Check if payload has expiration
    if (!payload.exp || typeof payload.exp !== 'number') {
      return {
        isValid: false,
        expiresAt: 0,
        timeUntilExpiry: 0,
        shouldRefresh: false,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = payload.exp;
    const timeUntilExpiry = expiresAt - now;
    const isExpired = timeUntilExpiry <= 0;
    const shouldRefresh = timeUntilExpiry < refreshThresholdSeconds;

    return {
      isValid: !isExpired,
      expiresAt,
      timeUntilExpiry,
      shouldRefresh,
      payload,
    };
  } catch (error) {
    return {
      isValid: false,
      expiresAt: 0,
      timeUntilExpiry: 0,
      shouldRefresh: false,
    };
  }
}

/**
 * Format time until expiry for human-readable display
 */
export function formatTimeUntilExpiry(seconds: number): string {
  if (seconds <= 0) return "Expired";
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get refresh timing recommendations based on token expiration
 */
export function getRefreshTiming(timeUntilExpiry: number): {
  urgency: 'immediate' | 'soon' | 'normal' | 'none';
  nextCheckIn: number; // seconds
  message: string;
} {
  if (timeUntilExpiry <= 0) {
    return {
      urgency: 'immediate',
      nextCheckIn: 0,
      message: 'Token has expired - immediate refresh required'
    };
  }

  if (timeUntilExpiry < 60) { // Less than 1 minute
    return {
      urgency: 'immediate',
      nextCheckIn: 10, // Check every 10 seconds
      message: 'Token expires in less than 1 minute'
    };
  }

  if (timeUntilExpiry < 300) { // Less than 5 minutes
    return {
      urgency: 'soon',
      nextCheckIn: 30, // Check every 30 seconds
      message: 'Token expires soon - refresh recommended'
    };
  }

  if (timeUntilExpiry < 900) { // Less than 15 minutes
    return {
      urgency: 'normal',
      nextCheckIn: 120, // Check every 2 minutes
      message: 'Token expires in less than 15 minutes'
    };
  }

  return {
    urgency: 'none',
    nextCheckIn: 300, // Check every 5 minutes
    message: 'Token is valid for more than 15 minutes'
  };
}

/**
 * Create a standardized token refresh scheduler
 */
export function createTokenRefreshScheduler(
  checkTokenFn: () => Promise<boolean>,
  onRefreshNeeded: () => Promise<boolean>,
  onError: (error: Error) => void,
  options: {
    initialDelayMs?: number;
    maxRetries?: number;
    backoffMultiplier?: number;
  } = {}
) {
  const {
    initialDelayMs = 1000,
    maxRetries = 3,
    backoffMultiplier = 2
  } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let retryCount = 0;

  const scheduleNextCheck = (delayMs: number) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      try {
        const needsRefresh = await checkTokenFn();
        
        if (needsRefresh) {
          const refreshSuccess = await onRefreshNeeded();
          
          if (refreshSuccess) {
            retryCount = 0; // Reset retry count on success
            scheduleNextCheck(initialDelayMs);
          } else {
            // Retry with exponential backoff
            retryCount++;
            if (retryCount <= maxRetries) {
              const backoffDelay = initialDelayMs * Math.pow(backoffMultiplier, retryCount);
              scheduleNextCheck(backoffDelay);
            } else {
              onError(new Error(`Token refresh failed after ${maxRetries} retries`));
            }
          }
        } else {
          // Token is still valid, schedule normal check
          scheduleNextCheck(initialDelayMs);
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Token check failed'));
        // Continue checking even after errors
        scheduleNextCheck(initialDelayMs * 2);
      }
    }, delayMs);
  };

  const start = () => {
    scheduleNextCheck(initialDelayMs);
  };

  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    retryCount = 0;
  };

  return { start, stop };
}

/**
 * Debug helper for token information
 */
export function debugTokenInfo(token: string, label: string = "Token"): void {
  if (process.env.NODE_ENV !== 'development') return;

  const info = checkTokenExpiration(token);
  const timing = getRefreshTiming(info.timeUntilExpiry);

}
