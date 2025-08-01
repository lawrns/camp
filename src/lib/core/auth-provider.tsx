/**
 * Core Authentication Provider
 * Client-side authentication provider for React components
 */

"use client";

import { supabase } from "@/lib/supabase";
import { authLogger } from "@/lib/utils/logger";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthenticatedUser } from "./auth";
import { runAuthValidation } from "@/lib/auth/auth-validation";
import { initializeAuthPersistence, forceSessionRecovery } from "@/lib/auth/auth-persistence-fix";

// Extend Window interface for debug properties
declare global {
  interface Window {
    CampfireWidgetConfig?: any;
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
 * Now includes realtime connection validation and session state checking
 */
async function enrichJWTWithOrganization(organizationId: string | undefined, retryCount: number = 0) {
  if (!organizationId) {
    console.warn("🚨 No organizationId provided for JWT enrichment - using fallback mode");
    return { success: false, reason: "no_organization_id" };
  }

  // Check if we're in a test context and should skip JWT enrichment
  if (typeof window !== "undefined") {
    const isTestContext = window.location.pathname.includes('/test-') ||
                         window.location.search.includes('test=true') ||
                         window.location.pathname.includes('/debug/');

    if (isTestContext) {
      console.log("🔧 Skipping JWT enrichment in test context");
      return { success: true, reason: "test_context_skip" };
    }
  }

  // Validate organizationId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(organizationId)) {
    console.warn("🚨 Invalid organizationId format for JWT enrichment:", organizationId);
    return { success: false, reason: "invalid_organization_id" };
  }

  // Check if we have a valid session before attempting enrichment
  if (typeof window !== "undefined") {
    try {
      const { supabase } = await import("@/lib/supabase");
      const client = supabase.browser();
      const { data: { session }, error: sessionError } = await client.auth.getSession();

      // Comprehensive session debugging
      console.log("🔍 JWT Enrichment Session Debug:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userMetadata: session?.user?.user_metadata,
        appMetadata: session?.user?.app_metadata,
        organizationIdParam: organizationId,
        timestamp: new Date().toISOString()
      });

      if (sessionError || !session?.access_token) {
        console.warn("🚨 No valid session found for JWT enrichment, skipping");
        return { success: false, reason: "no_session" };
      }

      // Check if this is a widget session (comprehensive detection)
      const isWidgetSession = session.user?.user_metadata?.widget_session === true ||
                             session.user?.app_metadata?.provider === 'widget' ||
                             session.user?.id?.includes('visitor_') ||
                             session.user?.id?.startsWith('widget_') ||
                             session.user?.user_metadata?.source === 'widget' ||
                             session.user?.email?.includes('visitor@') ||
                             session.user?.aud === 'widget' ||
                             session.user?.user_metadata?.visitor_id;

      console.log("🔍 Widget Session Detection:", {
        isWidgetSession,
        checks: {
          widgetSessionMetadata: session.user?.user_metadata?.widget_session === true,
          providerWidget: session.user?.app_metadata?.provider === 'widget',
          idIncludesVisitor: session.user?.id?.includes('visitor_'),
          idStartsWithWidget: session.user?.id?.startsWith('widget_'),
          sourceWidget: session.user?.user_metadata?.source === 'widget',
          emailIncludesVisitor: session.user?.email?.includes('visitor@'),
          audWidget: session.user?.aud === 'widget',
          hasVisitorId: !!session.user?.user_metadata?.visitor_id
        }
      });

      if (isWidgetSession) {
        console.log("🔧 Skipping JWT enrichment for widget session - not required", {
          userId: session.user?.id,
          provider: session.user?.app_metadata?.provider,
          widgetSession: session.user?.user_metadata?.widget_session,
          email: session.user?.email,
          visitorId: session.user?.user_metadata?.visitor_id
        });
        return { success: true, reason: "widget_session_skip" };
      }
    } catch (sessionCheckError) {
      console.warn("🚨 Failed to check session before JWT enrichment:", sessionCheckError);
      return { success: false, reason: "session_check_failed" };
    }
  }

  try {
    console.log("🔧 Enriching JWT with organization_id:", organizationId, retryCount > 0 ? `(retry ${retryCount})` : "");

    const response = await fetch("/api/auth/set-organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId }),
      credentials: "include", // Ensure cookies are sent
    }).catch((networkError) => {
      console.warn("🚨 Network error during JWT enrichment:", networkError.message);
      return { status: 401, ok: false, json: () => Promise.resolve({ error: "Network error" }) };
    });

    // Handle 401 Unauthorized - user not authenticated or session expired
    if (response.status === 401) {
      // Retry once after a short delay if this is the first attempt
      if (retryCount === 0) {
        console.log("🔄 JWT enrichment got 401, retrying after session refresh...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return enrichJWTWithOrganization(organizationId, 1);
      }
      return { success: false, reason: "unauthorized", fallback: "anonymous" };
    }

    // Handle other non-OK responses
    if (!response.ok) {
      console.log('[Auth] JWT enrichment failed with status:', response.status);

      let errorDetails: any;
      try {
        errorDetails = await response.json();
      } catch {
        const statusText = 'statusText' in response ? response.statusText : 'Unknown error';
        errorDetails = { error: `HTTP ${response.status}: ${statusText}` };
      }

      // Enhanced error logging with more context - prevent empty object errors
      if (errorDetails && Object.keys(errorDetails).length > 0 && errorDetails.error !== "Unknown error") {
        console.error("🚨 Failed to enrich JWT:", {
          status: response.status,
          organizationId,
          errorDetails,
          url: "/api/auth/set-organization"
        });
      } else {
        const statusText = 'statusText' in response ? response.statusText : 'Unknown error';
        console.error("🚨 Failed to enrich JWT: HTTP", response.status, statusText, {
          organizationId,
          url: "/api/auth/set-organization"
        });
      }

      // Detailed logging for 400 errors
      if (response.status === 400) {
        console.error("🚨 JWT enrichment 400 details:", { organizationId, responseBody: errorDetails });
      }
      return { success: false, reason: "api_error", error: errorDetails };
    }

    // Parse the successful response
    let result = null;
    try {
      result = await response.json();
    } catch (parseError) {
      console.warn("🚨 Failed to parse JWT enrichment response as JSON:", parseError);
      return { success: false, reason: "parse_error", error: "Invalid JSON response" };
    }

    // Check if we got a valid result
    if (!result || typeof result !== 'object') {
      console.error("🚨 JWT enrichment returned invalid result:", {
        result,
        resultType: typeof result,
        organizationId,
        responseStatus: response.status
      });
      return { success: false, reason: "invalid_response", error: "Empty or invalid response" };
    }

    // Check if the API returned a success flag
    if (!result.success) {
      console.warn("🚨 JWT enrichment returned failure:", result.error || "Unknown error");
      return { success: false, reason: "enrichment_failed", error: result.error || "Unknown error" };
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
    // Check if this is an extension-related error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExtensionError = /extension|chrome-extension|moz-extension|1password|lastpass|bitwarden/i.test(errorMessage);

    if (!isExtensionError) {
      console.error("🚨 Error enriching JWT with organization:", error);
    } else {
      console.debug("🔇 Extension interference detected during JWT enrichment, suppressing error");
    }

    return { success: false, reason: "network_error", error };
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
  
  // Run auth validation in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Delay validation to ensure component tree is fully mounted
      const timer = setTimeout(() => {
        runAuthValidation();
        console.log('✅ AuthProvider mounted successfully');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

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
    // Use default organization ID if user doesn't have one
    const defaultOrgId = "550e8400-e29b-41d4-a716-446655440000";
    const userOrgId = supabaseUser.user_metadata?.organization_id || defaultOrgId;
    
    // Create auth user with basic info (organization will be set during onboarding)
    const authUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || supabaseUser.email || "",
      organizationId: userOrgId,
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
  const initDebugArray = () => {
    if (typeof window !== 'undefined') {
      if (!Array.isArray((window as any).authDebug)) {
        (window as any).authDebug = [];
      }
    }
  };
  initDebugArray();

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);

      ((window as any).authDebug as string[])?.push('[SignIn Debug] Starting signIn with email: ' + email);
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

      ((window as any).authDebug as string[])?.push('[SignIn Debug] API response status: ' + response.status);
      console.log('[Auth] API response status:', response.status);

      const result = await response.json();

      ((window as any).authDebug as string[])?.push('[SignIn Debug] API result: ' + JSON.stringify(result));
      console.log('[Auth] API result:', result);

      if (!response.ok) {
        const errorMessage = result.error || "Login failed";

        ((window as any).authDebug as string[])?.push('[SignIn Debug] Login failed: ' + errorMessage);

        setError(new Error(errorMessage));
        return { success: false, error: errorMessage };
      }

      // API login successful, now set the session in the browser client
      if (result.data?.session) {
        console.log('[Auth] Session received, setting in Supabase');
        ((window as any).authDebug as string[])?.push('[SignIn Debug] Session received, setting in Supabase');
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

        // Explicitly check and log session storage
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (!storedSession) {
          console.warn("⚠️ Session not found in localStorage after setSession - attempting fallback storage");
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: apiSession.access_token,
            refresh_token: apiSession.refresh_token,
            expires_in: 3600, // Default expiry
            token_type: 'bearer'
          }));
        } else {
          console.log("✅ Session successfully stored in localStorage");
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
              // For test users without proper org membership, continue without blocking
              if (enrichmentResult.reason === "enrichment_failed" || enrichmentResult.reason === "api_error") {
                authLogger.info("📝 Test user detected - proceeding with default organization access");
              }
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
            } else {
              authLogger.info("✅ JWT enrichment completed successfully");
            }
          } catch (enrichmentError) {
            // Gracefully handle enrichment errors without breaking auth flow
            authLogger.warn("🚨 JWT enrichment threw an error, continuing with basic auth:", enrichmentError);

            // Store fallback context for debugging
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "campfire_auth_fallback",
                JSON.stringify({
                  reason: "exception_thrown",
                  error: enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError),
                  timestamp: Date.now(),
                  organizationId: authUser.organizationId,
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

        // CRITICAL: Clear loading state so LoginForm can redirect
        setLoading(false);
        console.log('[Auth] Loading set to false');

        // Manually trigger a state update to ensure components re-render
        refreshUser();
        setMounted(true);
        console.log('[Auth] Mounted set to true');

        console.log('[Auth] signIn successful');
        return { success: true };
      }

      ((window as any).authDebug as string[])?.push('[SignIn Debug] Invalid response, no session');
      return { success: false, error: "Invalid response from server" };
    } catch (error) {
      ((window as any).authDebug as string[])?.push('[SignIn Debug] Catch error: ' + (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)));
      console.log('[Auth] signIn error:', error);
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Sign in failed";

      setError(new Error(errorMessage));
      return {
        success: false,
        error: errorMessage,
      };
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
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Sign up failed",
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

        // Initialize auth persistence fix first
        await initializeAuthPersistence({
          enableExtensionIsolation: true,
          enableFallbackStorage: true,
          enableSessionRecovery: true,
          sessionCheckInterval: 30000
        });

        // Check if we're in widget context and have a widget token
        const isWidgetContext = window.location.pathname.includes('/widget') ||
          window.location.search.includes('widget=true') ||
          (window as any).CampfireWidgetConfig;

        const widgetToken = isWidgetContext ? localStorage.getItem("campfire_widget_token") : null;

        // Prepare headers for session request
        const sessionHeaders: Record<string, string> = {
          "Cache-Control": "no-cache",
        };

        // Include widget token as Bearer token if available
        if (widgetToken) {
          sessionHeaders["Authorization"] = `Bearer ${widgetToken}`;
          console.log("[AuthProvider] Including widget token in session request");
        }

        // Use session endpoint to get user data
        const res = await fetch("/api/auth/session", {
          credentials: "include",
          headers: sessionHeaders,
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          const apiUser = data?.user;

          if (apiUser) {
            console.log("[AuthProvider] User found:", apiUser.email || apiUser.displayName);

            // Handle widget users differently
            if (apiUser.isWidget) {
              console.log("[AuthProvider] Widget user authenticated:", apiUser.visitorId);
            }
            console.log("[AuthProvider] User data:", {
              id: apiUser.id,
              organizationId: apiUser.organizationId,
              organizationRole: apiUser.organizationRole
            });

            // Try to sync the session with Supabase client
            try {
              if (supabaseClient) {
                // First check if Supabase client already has a session
                const {
                  data: { session: existingSession },
                } = await supabaseClient.auth.getSession();

                if (!existingSession) {
                  console.log("[AuthProvider] No existing session in Supabase client, attempting to restore");

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
          if (res.status === 401) {
            console.log("[AuthProvider] No authenticated session found (401)");
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
        console.error("[AuthProvider] Auth initialization error:", err);

        // Try session recovery as fallback
        try {
          console.log("[AuthProvider] Attempting session recovery...");
          await forceSessionRecovery();

          // Retry auth check after recovery
          const retryRes = await fetch("/api/auth/user", {
            credentials: "include",
            headers: { "Cache-Control": "no-cache" },
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.user) {
              console.log("[AuthProvider] Session recovery successful");
              setUser(retryData.user);
              return;
            }
          }
        } catch (recoveryError) {
          console.warn("[AuthProvider] Session recovery failed:", recoveryError);
        }

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
  }, [supabaseClient]); // Remove 'mounted' from dependencies to prevent infinite loop

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
          // Skip for widget sessions and test contexts
          setTimeout(() => {
            // Check if this is a test context
            const isTestContext = typeof window !== "undefined" && (
              window.location.pathname.includes('/test-') ||
              window.location.search.includes('test=true') ||
              window.location.pathname.includes('/debug/')
            );

            // Check if this is a widget session
            const isWidgetSession = authUser.user_metadata?.widget_session === true ||
                                   authUser.id?.includes('visitor_') ||
                                   authUser.id?.startsWith('widget_') ||
                                   authUser.email?.includes('visitor@') ||
                                   supabaseSession.user?.user_metadata?.source === 'widget';

            console.log("🔧 JWT enrichment check during SIGNED_IN:", {
              userId: authUser.id,
              organizationId: authUser.organizationId,
              isWidget: isWidgetSession,
              isTestContext: isTestContext,
              willSkip: isWidgetSession || isTestContext
            });

            if (isWidgetSession) {
              console.log("🔧 Skipping JWT enrichment for widget session");
              return;
            }

            if (isTestContext) {
              console.log("🔧 Skipping JWT enrichment in test context");
              return;
            }

            // Only enrich for regular authenticated users
            enrichJWTWithOrganization(authUser.organizationId).catch(error => {
              console.warn("🚨 JWT enrichment failed during SIGNED_IN:", error);
            });
          }, 100);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setError(null);
          // Clear any stored organization context
          if (typeof window !== "undefined") {
            localStorage.removeItem("campfire_org_context");
          }
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
          // Skip for widget sessions and test contexts
          setTimeout(() => {
            // Check if this is a test context
            const isTestContext = typeof window !== "undefined" && (
              window.location.pathname.includes('/test-') ||
              window.location.search.includes('test=true') ||
              window.location.pathname.includes('/debug/')
            );

            // Check if this is a widget session
            const isWidgetSession = authUser.user_metadata?.widget_session === true ||
                                   authUser.id?.includes('visitor_') ||
                                   authUser.id?.startsWith('widget_') ||
                                   authUser.email?.includes('visitor@') ||
                                   supabaseSession.user?.user_metadata?.source === 'widget';

            console.log("🔧 JWT enrichment check during TOKEN_REFRESHED:", {
              userId: authUser.id,
              organizationId: authUser.organizationId,
              isWidget: isWidgetSession,
              isTestContext: isTestContext,
              willSkip: isWidgetSession || isTestContext
            });

            if (isWidgetSession) {
              console.log("🔧 Skipping JWT enrichment for widget session");
              return;
            }

            if (isTestContext) {
              console.log("🔧 Skipping JWT enrichment in test context");
              return;
            }

            // Only enrich for regular authenticated users
            enrichJWTWithOrganization(authUser.organizationId).catch(error => {
              console.warn("🚨 JWT enrichment failed during TOKEN_REFRESHED:", error);
            });
          }, 100);
        }
      } catch (error) {
        console.error("🚨 Auth state change error:", error);
        setError(error instanceof Error ? error : new Error("Auth state change failed"));
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
    // Enhanced error message with debugging information
    const errorMessage = [
      "🔥 AUTH CONTEXT ERROR: useAuth must be used within a AuthProvider",
      "",
      "This error occurs when:",
      "1. The component is not wrapped with AuthProvider",
      "2. AuthProvider is missing from your layout hierarchy",
      "3. There's a component tree mismatch during SSR/hydration",
      "",
      "Quick fixes:",
      "• Ensure AuthProvider wraps your component tree in the root layout",
      "• Check that AuthProvider is imported correctly",
      "• Verify the component calling useAuth is a child of AuthProvider",
      "",
      "Current location: " + (typeof window !== 'undefined' ? window.location.pathname : 'server-side'),
      "Component tree: Check React DevTools for AuthProvider presence"
    ].join("\n");
    
    console.error(errorMessage);
    
    // Run validation in development to help debug
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => runAuthValidation(), 0);
    }
    
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
