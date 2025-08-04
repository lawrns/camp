/**
 * Session Timeout Management Hook
 * 
 * Provides session timeout warnings, auto-refresh mechanisms,
 * and graceful session expiration handling
 */

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface SessionTimeoutConfig {
  sessionDuration: number; // Total session duration in milliseconds
  warningTime: number; // Time before expiration to show warning (ms)
  refreshThreshold: number; // Time before expiration to auto-refresh (ms)
  checkInterval: number; // How often to check session status (ms)
  autoRefresh: boolean; // Whether to automatically refresh the session
  showWarnings: boolean; // Whether to show timeout warnings
  onWarning?: (timeRemaining: number) => void;
  onExpired?: () => void;
  onRefreshed?: () => void;
}

export interface SessionTimeoutState {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  isExpired: boolean;
  lastActivity: number;
  sessionStart: number;
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  warningTime: 5 * 60 * 1000, // 5 minutes
  refreshThreshold: 2 * 60 * 1000, // 2 minutes
  checkInterval: 30 * 1000, // 30 seconds
  autoRefresh: true,
  showWarnings: true,
};

export function useSessionTimeout(config: Partial<SessionTimeoutConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { user, refreshSession, logout } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<SessionTimeoutState>({
    isActive: false,
    timeRemaining: fullConfig.sessionDuration,
    showWarning: false,
    isExpired: false,
    lastActivity: Date.now(),
    sessionStart: Date.now(),
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const warningShownRef = useRef(false);
  const refreshAttemptedRef = useRef(false);

  // Update last activity time
  const updateActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastActivity: Date.now(),
      showWarning: false,
      isExpired: false,
    }));
    warningShownRef.current = false;
    refreshAttemptedRef.current = false;
  }, []);

  // Manually refresh session
  const refreshSessionManually = useCallback(async () => {
    try {
      await refreshSession();
      setState(prev => ({
        ...prev,
        sessionStart: Date.now(),
        lastActivity: Date.now(),
        showWarning: false,
        isExpired: false,
      }));
      warningShownRef.current = false;
      refreshAttemptedRef.current = false;
      fullConfig.onRefreshed?.();
      return true;
    } catch (error) {

      return false;
    }
  }, [refreshSession, fullConfig]);

  // Handle session expiration
  const handleExpiration = useCallback(async () => {
    setState(prev => ({ ...prev, isExpired: true, showWarning: false }));
    fullConfig.onExpired?.();

    try {
      await logout();
      router.push('/login?reason=session_expired');
    } catch (error) {

      // Force redirect even if logout fails
      window.location.href = '/login?reason=session_expired';
    }
  }, [logout, router, fullConfig]);

  // Check session status
  const checkSession = useCallback(() => {
    if (!user) {
      setState(prev => ({ ...prev, isActive: false }));
      return;
    }

    const now = Date.now();
    const sessionAge = now - state.sessionStart;
    const timeSinceActivity = now - state.lastActivity;
    const timeRemaining = fullConfig.sessionDuration - Math.max(sessionAge, timeSinceActivity);

    setState(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: Math.max(0, timeRemaining),
    }));

    // Session has expired
    if (timeRemaining <= 0) {
      handleExpiration();
      return;
    }

    // Auto-refresh if enabled and threshold reached
    if (
      fullConfig.autoRefresh &&
      timeRemaining <= fullConfig.refreshThreshold &&
      !refreshAttemptedRef.current
    ) {
      refreshAttemptedRef.current = true;
      refreshSessionManually();
      return;
    }

    // Show warning if threshold reached
    if (
      fullConfig.showWarnings &&
      timeRemaining <= fullConfig.warningTime &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true;
      setState(prev => ({ ...prev, showWarning: true }));
      fullConfig.onWarning?.(timeRemaining);
    }
  }, [
    user,
    state.sessionStart,
    state.lastActivity,
    fullConfig,
    handleExpiration,
    refreshSessionManually,
  ]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const throttledUpdateActivity = throttle(updateActivity, 1000);

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
    };
  }, [user, updateActivity]);

  // Set up session checking interval
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Initial check
    checkSession();

    // Set up interval
    intervalRef.current = setInterval(checkSession, fullConfig.checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, checkSession, fullConfig.checkInterval]);

  // Initialize session start time when user logs in
  useEffect(() => {
    if (user && !state.isActive) {
      const now = Date.now();
      setState(prev => ({
        ...prev,
        sessionStart: now,
        lastActivity: now,
        isActive: true,
        isExpired: false,
        showWarning: false,
        timeRemaining: fullConfig.sessionDuration,
      }));
    }
  }, [user, state.isActive, fullConfig.sessionDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    updateActivity,
    refreshSession: refreshSessionManually,
    extendSession: refreshSessionManually,
    logout: handleExpiration,
    formatTimeRemaining: (ms: number) => {
      const minutes = Math.floor(ms / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  };
}

// Throttle utility function
function throttle<T extends (...args: unknown[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Session timeout context for global state management

interface SessionTimeoutContextType {
  state: SessionTimeoutState;
  updateActivity: () => void;
  refreshSession: () => Promise<boolean>;
  extendSession: () => Promise<boolean>;
  formatTimeRemaining: (ms: number) => string;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

export function SessionTimeoutProvider({
  children,
  config
}: {
  children: React.ReactNode;
  config?: Partial<SessionTimeoutConfig>;
}) {
  const sessionTimeout = useSessionTimeout(config);

  return (
    <SessionTimeoutContext.Provider value={sessionTimeout}>
      {children}
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeoutContext() {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error('useSessionTimeoutContext must be used within SessionTimeoutProvider');
  }
  return context;
}

// Hook for components that need to extend session on specific actions
export function useSessionExtender() {
  const { updateActivity, refreshSession } = useSessionTimeout();

  const extendOnAction = useCallback(async (action: () => Promise<any> | any) => {
    updateActivity();
    try {
      const result = await action();
      updateActivity(); // Update again after successful action
      return result;
    } catch (error) {
      // Don't update activity on failed actions
      throw error;
    }
  }, [updateActivity]);

  const extendOnApiCall = useCallback(async (apiCall: () => Promise<any>) => {
    return extendOnAction(apiCall);
  }, [extendOnAction]);

  return {
    extendOnAction,
    extendOnApiCall,
    refreshSession,
    updateActivity,
  };
}
