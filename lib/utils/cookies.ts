/**
 * Cookie utility functions for client-side use
 * Standardized for Campfire authentication
 */

/**
 * Standard cookie name for CSRF protection
 */
export const CSRF_COOKIE_NAME = "campfire-csrf-token";

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      const cookiePart = parts.pop();
      if (!cookiePart) return null;
      return cookiePart.split(";").shift() || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Set a cookie with the given name and value
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}
): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const { days = 1, path = "/", domain, secure, sameSite = "lax" } = options;

    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

    const cookieValue = [
      `${name}=${value}`,
      `expires=${date.toUTCString()}`,
      `path=${path}`,
      sameSite ? `SameSite=${sameSite}` : "",
      secure !== undefined ? (secure ? "Secure" : "") : window.location.protocol === "https:" ? "Secure" : "",
      domain ? `domain=${domain}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    document.cookie = cookieValue;
  } catch (error) {}
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  } catch (error) {}
}

/**
 * Get or generate CSRF token
 */
export function getOrGenerateCSRFToken(): string {
  let token = getCookie(CSRF_COOKIE_NAME);

  if (!token) {
    token = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    setCookie(CSRF_COOKIE_NAME, token, {
      days: 1,
      sameSite: "lax",
    });
  }

  return token;
}

/**
 * Clear all auth-related cookies
 */
export function clearAuthCookies(): void {
  // Clear CSRF token
  deleteCookie(CSRF_COOKIE_NAME);

  // Clear any legacy cookie names
  deleteCookie("campfire.csrf");
  deleteCookie("csrf-token");

  // Clear Supabase auth cookies (pattern matching)
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie: unknown) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes("supabase") || name.includes("auth-token")) {
        deleteCookie(name);
      }
    });
  }
}
