"use client";

import { authLogger } from "@/lib/utils/logger";
import React, { useEffect, useState } from "react";

// Session cache configuration
const SESSION_CACHE_KEY = "widget_session_cache";
const SESSION_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface WidgetUser {
  id: string;
  displayName: string;
  organizationId: string;
  email?: string;
}

interface CachedSession {
  token: string;
  conversationId: string;
  visitorId: string;
  user: WidgetUser | null;
  timestamp: number;
  organizationId: string;
}

// Cache utilities
function getCachedSession(organizationId: string): CachedSession | null {
  try {
    const cached = localStorage.getItem(`${SESSION_CACHE_KEY}_${organizationId}`);
    if (!cached) return null;

    const session: CachedSession = JSON.parse(cached);
    const now = Date.now();

    // Check if session is expired
    if (now - session.timestamp > SESSION_TTL) {
      localStorage.removeItem(`${SESSION_CACHE_KEY}_${organizationId}`);
      return null;
    }

    return session;
  } catch (error) {
    authLogger.warn("Failed to retrieve cached session:", error);
    return null;
  }
}

function setCachedSession(organizationId: string, authData: AuthResponse, user: WidgetUser | null): void {
  try {
    const session: CachedSession = {
      token: authData.token!,
      conversationId: authData.conversationId!,
      visitorId: authData.visitorId!,
      user,
      timestamp: Date.now(),
      organizationId,
    };
    localStorage.setItem(`${SESSION_CACHE_KEY}_${organizationId}`, JSON.stringify(session));
  } catch (error) {
    authLogger.warn("Failed to cache session:", error);
  }
}

interface WidgetAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  conversationId: string | null;
  visitorId: string | null;
  error: string | null;
  user: WidgetUser | null;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  conversationId?: string;
  organizationId?: string;
  visitorId?: string;
  userId?: string;
  error?: string;
}

export function useWidgetAuth(organizationId: string) {
  // CRITICAL FIX: Disable auth bypass to enable proper real-time authentication
  const WIDGET_AUTH_BYPASS = false; // Disabled to enable real authentication

  const [authState, setAuthState] = useState<WidgetAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    conversationId: null,
    visitorId: null,
    error: null,
    user: null,
  });

  // Storage keys for persistence
  const STORAGE_KEYS = {
    token: `campfire_widget_token_${organizationId}`,
    conversationId: `campfire_widget_conversation_${organizationId}`,
    visitorId: `campfire_widget_visitor_${organizationId}`,
    user: `campfire_widget_user_${organizationId}`,
  };

  // Load persisted auth state (with duplicate prevention)
  useEffect(() => {
    let mounted = true;

    // Prevent multiple simultaneous loads
    if (authState.isLoading && authState.token) {
      return;
    }

    const loadPersistedAuth = () => {
      if (!mounted) return;

      try {
        const token = localStorage.getItem(STORAGE_KEYS.token);
        const conversationId = localStorage.getItem(STORAGE_KEYS.conversationId);
        const visitorId = localStorage.getItem(STORAGE_KEYS.visitorId);
        const userStr = localStorage.getItem(STORAGE_KEYS.user);

        if (token && conversationId && visitorId) {
          const user = userStr ? JSON.parse(userStr) : null;

          if (mounted) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              token,
              conversationId,
              visitorId,
              error: null,
              user,
            });

            // Only log once per session
            authLogger.once("info", `session_restored_${organizationId}`, "Restored persisted session");
          }
          return;
        }
      } catch (error) {
        authLogger.error("Failed to load persisted auth:", error);
        clearPersistedAuth();
      }

      // No persisted auth, start fresh authentication
      if (mounted) {
        authenticateWidget();
      }
    };

    loadPersistedAuth();

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  // Clear persisted auth data
  const clearPersistedAuth = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  // Persist auth data
  const persistAuthData = (authData: AuthResponse, user?: WidgetUser | null) => {
    try {
      if (authData.token) localStorage.setItem(STORAGE_KEYS.token, authData.token);
      if (authData.conversationId) localStorage.setItem(STORAGE_KEYS.conversationId, authData.conversationId);
      if (authData.visitorId) localStorage.setItem(STORAGE_KEYS.visitorId, authData.visitorId);
      if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } catch (error) {
      authLogger.error("Failed to persist auth data:", error);
    }
  };

  // Authenticate widget session
  const authenticateWidget = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for cached session first
      const cachedSession = getCachedSession(organizationId);
      if (cachedSession) {
        authLogger.debugThrottled("Using cached session for organization:", organizationId);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: cachedSession.token,
          conversationId: cachedSession.conversationId,
          visitorId: cachedSession.visitorId,
          error: null,
          user: cachedSession.user,
        });
        return;
      }

      authLogger.once("info", `auth_start_${organizationId}`, "Starting authentication for org:", organizationId);

      const response = await fetch("/api/widget/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId,
          visitorId: localStorage.getItem(STORAGE_KEYS.visitorId) || undefined,
          sessionData: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            referrer: document.referrer,
          },
        }),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.token) {
        const user = {
          id: result.userId || "unknown",
          displayName: `Visitor ${result.visitorId?.slice(-6) || "Unknown"}`,
          organizationId: result.organizationId || organizationId,
        };

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: result.token,
          conversationId: result.conversationId || null,
          visitorId: result.visitorId || null,
          error: null,
          user,
        });

        // Persist auth data
        persistAuthData(result, user);

        // Cache the session
        setCachedSession(organizationId, result, user);

        authLogger.once("info", `auth_success_${organizationId}`, "✅ Authentication successful");
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      authLogger.error("Authentication failed:", error);

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        conversationId: null,
        visitorId: null,
        error: error instanceof Error ? error.message : "Authentication failed",
        user: null,
      });

      // Clear any stale persisted data
      clearPersistedAuth();
    }
  };

  // ENHANCED: Proactive token refresh with JWT expiration checking
  const checkAndRefreshWidgetToken = async () => {
    if (!authState.token) {
      return false;
    }

    try {
      // ENHANCED: Use shared token utilities for consistent behavior
      const { checkTokenExpiration, debugTokenInfo } = await import("@/lib/auth/token-utils");
      const tokenInfo = checkTokenExpiration(authState.token, 300); // 5 minutes threshold

      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        debugTokenInfo(authState.token, "Widget Auth");
      }

      if (!tokenInfo.isValid) {
        authLogger.warn("Widget token is expired, attempting refresh");
        await refreshAuth();
        return true;
      } else if (!tokenInfo.shouldRefresh) {
        // Token is still valid and doesn't need refresh yet
        return true;
      }

      // Token needs refresh
      authLogger.info("Widget token expiring soon, refreshing...");
      await refreshAuth();
      return true;

      return true;
    } catch (error) {
      authLogger.error("Widget token check failed:", error);
      return false;
    }
  };

  // Refresh authentication
  const refreshAuth = async () => {
    if (!authState.token) {
      return authenticateWidget();
    }

    try {
      // Use widget-specific refresh endpoint
      const response = await fetch("/api/widget/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          action: "refresh_session",
          organizationId: authState.user?.organizationId
        }),
      });

      const result = await response.json();

      if (result.success && result.token) {
        setAuthState((prev) => ({
          ...prev,
          token: result.token,
          error: null,
        }));

        localStorage.setItem(STORAGE_KEYS.token, result.token);
        authLogger.debugThrottled("✅ Widget session refreshed");
      } else {
        throw new Error(result.error || "Widget session refresh failed");
      }
    } catch (error) {
      authLogger.error("Widget session refresh failed:", error);
      // Fall back to full re-authentication
      authenticateWidget();
    }
  };

  // Logout
  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      conversationId: null,
      visitorId: null,
      error: null,
      user: null,
    });

    clearPersistedAuth();
    authLogger.info("Logged out");
  };

  // PERFORMANCE: Disable custom token refresh for Supabase auth to prevent 401 errors
  // The widget now uses Supabase authentication which handles token refresh automatically
  // The custom refresh endpoint is for custom JWT tokens, not Supabase tokens
  React.useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) {
      return;
    }

    // Only log that we're using the auth system, don't try to refresh manually
    authLogger.debugThrottled('Widget authentication active - using Supabase auto-refresh');

    // Supabase client handles token refresh automatically
    // No manual intervention needed to prevent 401 errors
  }, [authState.isAuthenticated, authState.token]);

  // Return bypass auth state for development
  if (WIDGET_AUTH_BYPASS) {
    return {
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: 'test-token',
      conversationId: 'test-conversation',
      visitorId: 'test-visitor',
      user: {
        id: 'test-user',
        displayName: 'Test User',
        organizationId
      },
      authenticate: authenticateWidget,
      refresh: refreshAuth,
      logout,
      checkAndRefreshToken: checkAndRefreshWidgetToken,
    };
  }

  return {
    ...authState,
    authenticate: authenticateWidget,
    refresh: refreshAuth,
    logout,
    checkAndRefreshToken: checkAndRefreshWidgetToken, // Expose for manual use
  };
}
