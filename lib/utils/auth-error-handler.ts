/**
 * Authentication Error Handler
 *
 * Centralized handling of authentication errors and redirects
 */

import { redirect } from "next/navigation";

export interface AuthError {
  status: number;
  message: string;
  code?: string;
}

export interface AuthErrorHandlerOptions {
  redirectOnUnauthorized?: boolean;
  loginPath?: string;
  showNotification?: boolean;
  logError?: boolean;
}

const DEFAULT_OPTIONS: AuthErrorHandlerOptions = {
  redirectOnUnauthorized: true,
  loginPath: "/login",
  showNotification: true,
  logError: true,
};

/**
 * Handle authentication errors with appropriate responses
 */
export function handleAuthError(error: AuthError, options: AuthErrorHandlerOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.logError) {

  }

  // Handle different error types
  switch (error.status) {
    case 401:
      handleUnauthorizedError(opts);
      break;
    case 403:
      handleForbiddenError(opts);
      break;
    case 500:
      handleServerError(error, opts);
      break;
    default:
      handleGenericError(error, opts);
  }
}

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorizedError(options: AuthErrorHandlerOptions): void {
  if (options.showNotification && typeof window !== "undefined") {
    // Show user-friendly notification
    showAuthNotification("Your session has expired. Please sign in again.", "warning");
  }

  if (options.redirectOnUnauthorized) {
    // Clear any stored auth data
    if (typeof window !== "undefined") {
      localStorage.removeItem("campfire_org_context");
      localStorage.removeItem("supabase.auth.token");
    }

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = options.loginPath || "/login";
    } else {
      // Server-side redirect
      redirect(options.loginPath || "/login");
    }
  }
}

/**
 * Handle 403 Forbidden errors
 */
function handleForbiddenError(options: AuthErrorHandlerOptions): void {
  if (options.showNotification && typeof window !== "undefined") {
    showAuthNotification("You don't have permission to access this resource.", "error");
  }

  // Redirect to unauthorized page or dashboard
  if (typeof window !== "undefined") {
    window.location.href = "/unauthorized";
  } else {
    redirect("/unauthorized");
  }
}

/**
 * Handle 500 Server errors
 */
function handleServerError(error: AuthError, options: AuthErrorHandlerOptions): void {
  if (options.showNotification && typeof window !== "undefined") {
    showAuthNotification("Authentication service is temporarily unavailable. Please try again.", "error");
  }

  if (options.logError) {

  }
}

/**
 * Handle generic authentication errors
 */
function handleGenericError(error: AuthError, options: AuthErrorHandlerOptions): void {
  if (options.showNotification && typeof window !== "undefined") {
    showAuthNotification("An authentication error occurred. Please try again.", "error");
  }

  if (options.logError) {

  }
}

/**
 * Show authentication notification to user
 */
function showAuthNotification(message: string, type: "info" | "warning" | "error" = "info"): void {
  // Try to use existing notification system
  if (typeof window !== "undefined") {
    // Check for toast notification system
    const event = new CustomEvent("auth-notification", {
      detail: { message, type },
    });
    window.dispatchEvent(event);

    // Fallback to console for development
    if (process.env.NODE_ENV === "development") {

    }
  }
}

/**
 * Create auth error from fetch response
 */
export async function createAuthErrorFromResponse(response: Response): Promise<AuthError> {
  let message = "Authentication failed";
  let code: string | undefined;

  try {
    const data = await response.json();
    message = data.error || data.message || message;
    code = data.code;
  } catch {
    // Use default message if response parsing fails
  }

  return {
    status: response.status,
    message,
    code,
  };
}

/**
 * Wrapper for fetch requests with auth error handling
 */
export async function fetchWithAuthHandling(
  url: string,
  options: RequestInit = {},
  errorOptions: AuthErrorHandlerOptions = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const authError = await createAuthErrorFromResponse(response);
      handleAuthError(authError, errorOptions);
      throw new Error(`Auth error: ${authError.message}`);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      // Network error
      const networkError: AuthError = {
        status: 0,
        message: "Network error - please check your connection",
      };
      handleAuthError(networkError, { ...errorOptions, redirectOnUnauthorized: false });
    }
    throw error;
  }
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    error &&
    typeof error.status === "number" &&
    typeof error.message === "string" &&
    (error.status === 401 || error.status === 403)
  );
}

/**
 * Verify session and handle errors
 */
export async function verifySession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }

    if (response.status === 401) {
      handleAuthError(
        { status: 401, message: "Session expired" },
        { redirectOnUnauthorized: false, showNotification: false }
      );
    }

    return false;
  } catch (error) {

    return false;
  }
}
