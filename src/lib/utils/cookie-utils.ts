/**
 * Cookie utility functions for client-side use
 */

/**
 * Get a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null; // Not in browser environment
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (!cookiePart) return null;
    return cookiePart.split(";").shift() || null;
  }

  return null;
}

/**
 * Set a cookie with the given name and value
 * @param name The cookie name
 * @param value The cookie value
 * @param options Optional cookie settings
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
    return; // Not in browser environment
  }

  const { days = 1, path = "/", domain, secure = true, sameSite = "lax" } = options;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

  const cookieValue = [
    `${name}=${value}`,
    `expires=${date.toUTCString()}`,
    `path=${path}`,
    sameSite ? `SameSite=${sameSite}` : "",
    secure ? "Secure" : "",
    domain ? `domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieValue;
}

/**
 * Delete a cookie by name
 * @param name The name of the cookie to delete
 * @param path The cookie path
 */
export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") {
    return; // Not in browser environment
  }

  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}
