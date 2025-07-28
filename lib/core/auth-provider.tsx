/**
 * Core Authentication Provider
 * Client-side authentication provider for React components
 */

"use client";

import { supabase, getBrowserClient } from "@/lib/supabase";
import { authLogger } from "@/lib/utils/logger";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthenticatedUser } from "./auth";

// Extend Window interface for debug properties
declare global {
  interface Window {
    authDebug?: string[];
  }
}

// Reset state between HMR refreshes
if (typeof window !== "undefined" && (module as any).hot) {
  (module as any).hot.dispose(() => {
    // Clear any auth state on hot reload
    window.localStorage.removeItem("auth-state");
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  session: { access_token?: string; refresh_token?: string; user?: AuthenticatedUser } | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: unknown) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich JWT with organization_id claims for proper RLS policy evaluation
 * Enhanced with proper 401/empty enrichment handling for Phase 2 fix
 * Now includes realtime connection validation
 */
async function enrichJWTWithOrganization(organizationId: string | undefined) {
  if (!organizationId) {
    console.warn("🚨 No organizationId provided for JWT enrichment - using fallback mode");
    return { success: false, reason: "no_organization_id" };
  }

  try {
    console.log("🔧 Enriching JWT with organization_id:", organizationId);

    // First, try to get the current session to ensure we're authenticated
    const supabase = getBrowserClient();
    if (!supabase) {
      console.warn("🚨 No Supabase client available for JWT enrichment");
      return { success: false, reason: "no_supabase", fallback: "anonymous" };
    }
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn("🚨 No active session for JWT enrichment");
      return { success: false, reason: "no_session", fallback: "anonymous" };
    }

    const response = await fetch("/app/api/auth/set-organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ organizationId }),
      credentials: "include", // Ensure cookies are sent
    });

    // Handle 401 Unauthorized - user not authenticated
    if (response.status === 401) {
      console.warn("🚨 JWT enrichment failed: Unauthorized");
      return { success: false, reason: "unauthorized", fallback: "anonymous" };
    }

    // Handle 403 Forbidden - organization access denied
    if (response.status === 403) {
      console.warn("🚨 JWT enrichment failed: Organization access denied");
      return { success: false, reason: "forbidden", fallback: "anonymous" };
    }

    // Handle other non-OK responses
    if (!response.ok) {
      console.log('[Auth] JWT enrichment failed with status:', response.status);
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = { error: `HTTP ${response.status}: ${response.statusText || 'Unknown error'}` };
      }

      // Only log if we have meaningful error details
      if (errorDetails && Object.keys(errorDetails).length > 0) {
        console.error("🚨 Failed to enrich JWT:", errorDetails);
      } else {
        console.error("🚨 Failed to enrich JWT: HTTP", response.status, response.statusText);
      }

      return { success: false, reason: "api_error", error: errorDetails };
    }

    let result = null;
    try {
      result = await response.json();
    } catch (parseError) {
      console.warn("🚨 Failed to parse JWT enrichment response as JSON:", parseError);
      return { success: false, reason: "parse_error", error: "Invalid JSON response" };
    }

    // Check if we got a valid result
    if (!result) {
      console.warn("🚨 JWT enrichment returned empty response");
      return { success: false, reason: "empty_response", error: "No response data" };
    }

    // Check if the API returned a success flag
    if (!result.success) {
      console.warn("🚨 JWT enrichment returned failure:", result.error || "Unknown error");
      return { success: false, reason: "enrichment_failed", error: result.error || "Unknown enrichment error" };
    }

    console.log("✅ JWT enriched successfully:", result);

    // Store organization context for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "campfire_org_context",
        JSON.stringify({
          organizationId,
          timestamp: Date.now(),
          enriched: true,
        })
      );
    }

    return { success: true, result };
  } catch (error) {
    // Check if this is an extension-related error before logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExtensionError = /extension|chrome-extension|moz-extension|1password|lastpass|bitwarden/i.test(errorMessage);

    if (!isExtensionError) {
      console.error("🚨 Error enriching JWT with organization:", error);
    } else {
      console.debug("🔇 Extension interference detected during JWT enrichment, suppressing error");
    }

    return { success: false, reason: "network_error", error: errorMessage };
  }
}

// JWT validation for realtime connections will be implemented in the realtime system
// to avoid circular dependencies and auth provider complexity

// ============================================================================
// PROVIDER
// ============================================================================

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Prevent React hydration mismatch by rendering nothing until the
  // component mounts on the client. Server-side render outputs the
  // placeholder markup (nothing), then the client mounts, sets this
  // flag to true, and we re-render real UI. This guarantees that the
  // markup matches on the first hydration pass and that our effects
  // (initAuth etc.) always run.
  const [hasHydrated, setHasHydrated] = useState(false);

  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<{
    access_token?: string;
    refresh_token?: string;
    user?: AuthenticatedUser;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Race condition protection
  const hasManualLogin = useRef(false);
  const initializationInProgress = useRef(false);
  const authStateChangeInProgress = useRef(false);
  const lastAuthCheckTime = useRef(0);

  const supabaseClient = useMemo(() => {
    try {
      // Only create browser client when actually in browser
      if (typeof window === "undefined") {
        return null;
      }

      return supabase.browser();
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      return null;
    }
  }, []);

  // Convert Supabase user to AuthenticatedUser (non-null)
  const convertUser = async (supabaseUser: SupabaseUser): Promise<AuthenticatedUser> => {
    // Create auth user with basic info (organization will be set during onboarding)
    const authUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || supabaseUser.email || "",
      organizationId: supabaseUser.user_metadata?.organization_id || "",
      organizationRole: "viewer",
      firstName: supabaseUser.user_metadata?.first_name,
      lastName: supabaseUser.user_metadata?.last_name,
      fullName: supabaseUser.user_metadata?.full_name,
      user_metadata: supabaseUser.user_metadata,
    };

    return authUser;
  };

  const refreshUser = async () => {
    try {
      if (!supabaseClient) {
        setUser(null);
        return;
      }

      const {
        data: { user: supabaseUser },
      } = await supabaseClient.auth.getUser();
      if (supabaseUser) {
        const authUser = await convertUser(supabaseUser);
        setUser(authUser);
        console.log('[Auth] User set:', authUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  // Widget authentication fallback for anonymous users
  const tryWidgetAuthentication = async () => {
    try {
      // Check if we're in a widget context (look for organization ID in URL or config)
      const urlParams = new URLSearchParams(window.location.search);
      const organizationId =
        urlParams.get("organizationId") ||
        (window as any).CampfireWidgetConfig?.organizationId ||
        localStorage.getItem("campfire_widget_org_id");

      if (!organizationId) {
        authLogger.debug("No organization ID found for widget auth");
        setUser(null);
        return;
      }

      authLogger.once('info', `widget_auth_attempt_${organizationId}`, "Attempting widget authentication for org:", organizationId);

      // Try to create widget session
      const widgetAuthRes = await fetch("/api/widget/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organizationId, // Fixed: API expects 'organizationId', not 'orgId'
          sessionData: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            referrer: document.referrer,
          },
        }),
      });

      if (widgetAuthRes.ok) {
        const widgetData = await widgetAuthRes.json();

        // Check if the response has the expected structure
        if (!widgetData.success || !widgetData.token) {
          authLogger.warn("Widget authentication response missing required data");
          setUser(null);
          return;
        }

        authLogger.once('info', `widget_auth_success_${organizationId}`, "Widget authentication successful");

        // Create widget user from the response
        const widgetUser = {
          id: widgetData.userId || `widget_${widgetData.visitorId}`,
          email: `visitor@${organizationId}`,
          name: `Visitor ${widgetData.visitorId?.slice(-6) || 'Unknown'}`,
          organizationId: widgetData.organizationId || organizationId,
          organizationRole: "visitor",
          user_metadata: { widget_session: true },
          firstName: "Visitor",
          lastName: "",
          fullName: `Visitor ${widgetData.visitorId?.slice(-6) || 'Unknown'}`,
        };

        // Set user state for widget
        setUser(widgetUser);

        setSession({
          access_token: widgetData.token,
          refresh_token: widgetData.token, // Widget uses same token
          user: widgetUser,
        });

        // Store widget context
        localStorage.setItem("campfire_widget_org_id", organizationId);
        localStorage.setItem("campfire_widget_token", widgetData.token);

        // Widget JWT already contains organization claims, no need for additional enrichment
        authLogger.debug("Widget JWT already contains organization context, skipping enrichment");

        authLogger.once('info', `widget_session_established_${organizationId}`, "Widget session established successfully");

        // Store widget session info for debugging
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "campfire_widget_session",
            JSON.stringify({
              organizationId,
              visitorId: widgetData.visitorId,
              timestamp: Date.now(),
            })
          );
        }
      } else {
        if (widgetAuthRes.status === 400) {
          authLogger.debug("Widget authentication not applicable (400) - no widget context");
        } else {
          authLogger.warn("Widget authentication failed:", widgetAuthRes.status);
        }
        setUser(null);
      }
    } catch (error) {
      authLogger.error("Widget authentication error:", error);
      setUser(null);
    }
  };

  // Debug array for capturing messages
  if (typeof window !== 'undefined') {
    window.authDebug = window.authDebug || [];
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);

      if (window.authDebug) {
        window.authDebug.push('[SignIn Debug] Starting signIn with email: ' + email);
      }
      console.log('[Auth] Starting signIn with email:', email);

      // Use our working API endpoint instead of direct Supabase call
      const body = JSON.stringify({ email, password });
      console.log('[Auth] Request body:', body);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      if (window.authDebug) {
        window.authDebug.push('[SignIn Debug] API response status: ' + response.status);
      }
      console.log('[Auth] API response status:', response.status);

      const result = await response.json();

      if (window.authDebug) {
        window.authDebug.push('[SignIn Debug] API result: ' + JSON.stringify(result));
      }
      console.log('[Auth] API result:', result);

      if (!response.ok) {
        const errorMessage = result.error || "Login failed";

        if (window.authDebug) {
          window.authDebug.push('[SignIn Debug] Login failed: ' + errorMessage);
        }

        setError(new Error(errorMessage));
        return { success: false, error: errorMessage };
      }

      // API login successful, now set the session in the browser client
      if (result.data?.session) {
        console.log('[Auth] Session received, setting in Supabase');
        if (window.authDebug) {
          window.authDebug.push('[SignIn Debug] Session received, setting in Supabase');
        }
        const { session: apiSession, user: apiUser } = result.data;

        // Set the session in the browser Supabase client
        if (!supabaseClient) {
          setError(new Error("Supabase client not available"));
          return { success: false, error: "Supabase client not available" };
        }

        const { error: sessionError } = await supabaseClient.auth.setSession({
          access_token: apiSession.access_token,
          refresh_token: apiSession.refresh_token,
        });

        if (sessionError) {
          setError(new Error("Failed to set session"));
          return { success: false, error: "Failed to set session" };
        }

        // Convert user but don't set state yet
        const authUser = await convertUser(apiUser);

        // Clear any existing errors since login was successful
        setError(null);

        // CRITICAL: Enrich JWT with organization_id for RLS policies (skip for widget users)
        if (authUser.organizationId && !authUser.user_metadata?.widget_session) {
          authLogger.info("🔧 Enriching JWT after successful login...");

          try {
            const enrichmentResult = await enrichJWTWithOrganization(authUser.organizationId);

            if (!enrichmentResult.success) {
              authLogger.warn("🚨 JWT enrichment failed, but continuing with basic auth:", enrichmentResult.reason);
              // Store fallback context for debugging
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  "campfire_auth_fallback",
                  JSON.stringify({
                    reason: enrichmentResult.reason,
                    organizationId: authUser.organizationId,
                    timestamp: Date.now(),
                  })
                );
              }
            }
          } catch (enrichmentError) {
            // Gracefully handle enrichment errors without breaking auth flow
            authLogger.warn("🚨 JWT enrichment threw an error, continuing with basic auth:", enrichmentError);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "campfire_auth_fallback",
                JSON.stringify({
                  reason: "enrichment_exception",
                  error: enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError),
                  organizationId: authUser.organizationId,
                  timestamp: Date.now(),
                })
              );
            }
          }
        } else {
          authLogger.warn("🚨 No organizationId found for user after login - using basic auth mode");
        }

        // CRITICAL: Set user and session state AFTER all async operations complete
        setUser(authUser);
        setSession({
          access_token: apiSession.access_token,
          refresh_token: apiSession.refresh_token,
          user: authUser,
        });

        if (window.authDebug) {
          window.authDebug.push('[SignIn Debug] Login successful, user set');
        }

        // CRITICAL: Clear loading state so LoginForm can redirect
        setLoading(false);
        console.log('[Auth] Loading set to false');

        // Manually trigger a state update to ensure components re-render
        refreshUser();
        setMounted(true);
        console.log('[Auth] Mounted set to true');

        console.log('[Auth] signIn successful');
        return { success: true };
      } else {
        const errorMessage = "Invalid response format from login API";
        setError(new Error(errorMessage));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setError(new Error(errorMessage));

      if (window.authDebug) {
        window.authDebug.push('[SignIn Debug] Login exception: ' + errorMessage);
      }

      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setError(null);

      // Clear loading state
      setLoading(false);
      setMounted(true);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Sign out failed"));
    }
  };

  const signUp = async (email: string, password: string, metadata?: unknown) => {
    try {
      // Use our working API endpoint instead of direct Supabase call
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          ...(metadata as any), // Spread metadata for firstName, lastName, etc.
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || "Registration failed" };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  };

  // Proper auth initialization – try to restore session from HTTP-only cookies
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Prevent multiple simultaneous initialization calls
      if (initializationInProgress.current) {
        console.log("[AuthProvider] Initialization already in progress, skipping");
        return;
      }

      initializationInProgress.current = true;

      try {
        console.log("[AuthProvider] Initializing auth state");
        // Use session endpoint to check authentication without requiring auth
        const res = await fetch("/api/auth/session", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();

          if (data.success && data.authenticated && data.user) {
            const apiUser = data.user;
            console.log("[AuthProvider] User found:", apiUser.email);
            console.log("[AuthProvider] User data:", {
              id: apiUser.id,
              organizationId: apiUser.organizationId,
              organizationRole: apiUser.organizationRole
            });

            // Try to sync the session with Supabase client
            try {
              if (supabaseClient) {
                // First check if Supabase client already has a session
                // Use getUser() instead of getSession() for security
                const {
                  data: { user: existingUser },
                } = await supabaseClient.auth.getUser();

                if (!existingUser) {
                  console.log("[AuthProvider] No existing user in Supabase client, attempting to restore");

                  // Try to get the session from our refresh endpoint
                  const refreshRes = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                  });

                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    if (refreshData.session) {
                      // Set the session in Supabase client
                      await supabaseClient.auth.setSession({
                        access_token: refreshData.session.access_token,
                        refresh_token: refreshData.session.refresh_token || "",
                      });
                      console.log("[AuthProvider] Session restored in Supabase client");
                    }
                  }
                }
              }
            } catch (syncError) {
              console.error("[AuthProvider] Failed to sync session with Supabase:", syncError);
            }

            // Check if user needs initialization
            if (!apiUser.organizationId) {
              console.log("[AuthProvider] User missing organizationId, attempting initialization");
              try {
                const initRes = await fetch("/api/auth/initialize", {
                  method: "POST",
                  credentials: "include",
                });
                
                if (initRes.ok) {
                  const initData = await initRes.json();
                  apiUser.organizationId = initData.organizationId;
                  apiUser.organizationRole = initData.role;
                  console.log("[AuthProvider] User initialized with organization:", initData.organizationId);
                }
              } catch (initError) {
                console.error("[AuthProvider] Failed to initialize user:", initError);
              }
            }
            
            // Set user state
            setUser({
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.displayName ?? apiUser.email,
              organizationId: apiUser.organizationId ?? "",
              organizationRole: apiUser.organizationRole ?? "viewer",
              user_metadata: apiUser.user_metadata ?? {},
              firstName: apiUser.first_name ?? apiUser.firstName,
              lastName: apiUser.last_name ?? apiUser.lastName,
              fullName: apiUser.full_name ?? apiUser.fullName,
            });
          } else {
            console.log("[AuthProvider] No user data in response");
            setUser(null);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.log("[AuthProvider] Session check failed:", {
            status: res.status,
            success: errorData.success,
            authenticated: errorData.authenticated,
            error: errorData.error
          });

          if (res.status === 401) {
            console.log("[AuthProvider] No authenticated session found (401)");
          } else if (res.status === 403) {
            console.log("[AuthProvider] Organization access denied (403) - attempting to initialize user");

            // Try to fix organization membership issues
            try {
              const initRes = await fetch("/api/auth/fix-membership", {
                method: "POST",
                credentials: "include",
              });

              if (initRes.ok) {
                const initData = await initRes.json();
                console.log("[AuthProvider] Organization membership fixed:", initData.fixes);
                console.log("[AuthProvider] Retrying auth check after fix");
                // Retry the auth check after initialization
                const retryRes = await fetch("/api/auth/session", {
                  credentials: "include",
                });

                if (retryRes.ok) {
                  const retryData = await retryRes.json();
                  if (retryData.success && retryData.authenticated && retryData.user) {
                    const apiUser = retryData.user;
                    setUser({
                      id: apiUser.id,
                      email: apiUser.email,
                      name: apiUser.displayName ?? apiUser.email,
                      organizationId: apiUser.organizationId ?? "",
                      organizationRole: apiUser.organizationRole ?? "viewer",
                      user_metadata: apiUser.user_metadata ?? {},
                      firstName: apiUser.firstName,
                      lastName: apiUser.lastName,
                      fullName: apiUser.fullName,
                    });
                    return; // Success, exit early
                  }
                }
              }
            } catch (initError) {
              console.error("[AuthProvider] User initialization failed:", initError);
            }
          } else {
            console.log("[AuthProvider] Auth check failed with status:", res.status);
          }

          // Only try widget authentication if we're in a widget context
          const isWidgetContext = window.location.pathname.includes('/widget') ||
            window.location.search.includes('widget=true') ||
            (window as any).CampfireWidgetConfig;

          if (isWidgetContext) {
            console.log("[AuthProvider] Widget context detected, trying widget authentication");
            await tryWidgetAuthentication();
          } else {
            console.log("[AuthProvider] Dashboard context, setting user to null");
            setUser(null);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Handle specific cookie parsing errors gracefully
        if (errorMessage.includes('Failed to parse cookie') ||
            errorMessage.includes('Unexpected token') ||
            errorMessage.includes('base64-eyJ')) {
          console.warn("[AuthProvider] Cookie parsing error detected, clearing auth state");

          // Clear potentially corrupted cookies
          try {
            document.cookie.split(";").forEach(cookie => {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
              if (name.startsWith('sb-') && name.includes('auth-token')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
              }
            });
          } catch (cookieError) {
            // Ignore cookie clearing errors
          }

          setUser(null);
          setError(null);
        } else {
          console.error("[AuthProvider] Auth initialization error:", err);

          // Only try widget authentication if we're in a widget context
          const isWidgetContext = window.location.pathname.includes('/widget') ||
            window.location.search.includes('widget=true') ||
            (window as any).CampfireWidgetConfig;

          if (isWidgetContext) {
            console.log("[AuthProvider] Widget context detected, trying widget authentication after error");
            await tryWidgetAuthentication();
          } else {
            console.log("[AuthProvider] Dashboard context, setting user to null after error");
            setUser(null);
          }
        }
      } finally {
        initializationInProgress.current = false;
        if (!cancelled) {
          setLoading(false);
          setMounted(true);
        }
      }
    }

    // Only initialize if we haven't already and we're in the browser
    if (typeof window !== "undefined" && !mounted && !initializationInProgress.current) {
      init();
    }

    return () => {
      cancelled = true;
      initializationInProgress.current = false;
    };
  }, [supabaseClient, mounted]);

  // Listen for auth changes (separate useEffect)
  useEffect(() => {
    if (typeof window === "undefined" || !mounted || !supabaseClient) {
      return;
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event: any, supabaseSession: any) => {
      try {
        console.log("🔐 Auth state change:", event, supabaseSession?.user?.id);

        // Prevent race conditions with multiple auth state changes
        if (authStateChangeInProgress.current) {
          console.log("🔐 Auth state change already in progress, skipping");
          return;
        }

        // Debounce rapid auth state changes
        const now = Date.now();
        if (now - lastAuthCheckTime.current < 1000) {
          console.log("🔐 Auth state change too recent, debouncing");
          return;
        }
        lastAuthCheckTime.current = now;

        authStateChangeInProgress.current = true;

        if (event === "SIGNED_IN" && supabaseSession?.user) {
          const authUser = await convertUser(supabaseSession.user);
          setUser(authUser);
          setSession({
            access_token: supabaseSession.access_token,
            refresh_token: supabaseSession.refresh_token,
            user: authUser,
          });
          setError(null);

          // Enrich JWT with organization_id claims after successful sign in
          await enrichJWTWithOrganization(authUser.organizationId);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setError(null);
          // Clear any stored organization context
          localStorage.removeItem("campfire_org_context");
        } else if (event === "TOKEN_REFRESHED" && supabaseSession?.user) {
          console.log("🔄 Token refreshed, updating session");
          const authUser = await convertUser(supabaseSession.user);
          setUser(authUser);
          setSession({
            access_token: supabaseSession.access_token,
            refresh_token: supabaseSession.refresh_token,
            user: authUser,
          });

          // Re-enrich JWT with organization_id claims after token refresh
          await enrichJWTWithOrganization(authUser.organizationId);
        }
      } catch (error) {
        console.error("🚨 Auth state change error:", error);
        setError(error instanceof Error ? error : new Error("Auth state change failed"));
      } finally {
        authStateChangeInProgress.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, supabaseClient]);

  // ------------------------------------------------------------------------------------------------
  // HYDRATION GUARD – sets hasHydrated to true after first client render
  // ------------------------------------------------------------------------------------------------
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Early return to avoid hydration mismatch
  if (!hasHydrated) {
    return null;
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
    error,
    session,
    signIn,
    signOut,
    signUp,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
}
