/**
 * Type declarations for cookies-next package
 */

declare module "cookies-next" {
  export interface CookieOptions {
    /** Cookie domain */
    domain?: string;
    /** Cookie path */
    path?: string;
    /** Cookie expiration date in days */
    expires?: Date;
    /** Max age of the cookie in seconds */
    maxAge?: number;
    /** Whether cookie is only for HTTP, not JS */
    httpOnly?: boolean;
    /** Whether cookie requires HTTPS connection */
    secure?: boolean;
    /** Same site policy */
    sameSite?: "strict" | "lax" | "none";
  }

  /**
   * Set a cookie
   */
  export function setCookie(key: string, value: string | object, options?: CookieOptions): void;

  /**
   * Get a cookie
   */
  export function getCookie(key: string, options?: CookieOptions): string | undefined;

  /**
   * Delete a cookie
   */
  export function deleteCookie(key: string, options?: CookieOptions): void;

  /**
   * Check if a cookie exists
   */
  export function hasCookie(key: string, options?: CookieOptions): boolean;
}
