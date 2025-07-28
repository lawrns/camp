/**
 * Authentication Cookie Utilities
 * Standardizes cookie handling across the authentication system
 */

import { NextRequest } from "next/server";

// Standard cookie names
export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "sb-access-token",
  REFRESH_TOKEN: "sb-refresh-token",
  AUTH_TOKEN: "sb-auth-token", // Simplified name without project reference
} as const;

// Consistent cookie expiration for all auth cookies (7 days)
export const COOKIE_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Cookie options for different environments
export const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAge || COOKIE_EXPIRATION_SECONDS, // Consistent 7 days
});

// Standardized cookie options for auth cookies
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_EXPIRATION_SECONDS, // Always 7 days for auth cookies
});

/**
 * Extract auth token from request cookies
 * Handles multiple cookie formats for backward compatibility
 */
export function extractAuthToken(request: NextRequest): string | null {
  const cookieHeader = request.headers.get("cookie") || "";

  // First, try the simplified auth token cookie
  const authTokenCookie = cookieHeader
    .split(/;\s*/)
    .map((c: any) => c.trim())
    .find((c: any) => c.startsWith(`${AUTH_COOKIE_NAMES.AUTH_TOKEN}=`));

  if (authTokenCookie) {
    try {
      const cookieValue = decodeURIComponent(authTokenCookie.split("=")[1]);

      if (cookieValue.startsWith("base64-")) {
        const sessionData = JSON.parse(Buffer.from(cookieValue.substring(7), "base64").toString());
        return sessionData.access_token;
      }

      // Direct token value
      return cookieValue;
    } catch (error) {

    }
  }

  // Try HTTP-only access token cookie
  const accessTokenCookie = cookieHeader
    .split(/;\s*/)
    .map((c: any) => c.trim())
    .find((c: any) => c.startsWith(`${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=`));

  if (accessTokenCookie) {
    return accessTokenCookie.split("=")[1];
  }

  // Backward compatibility: Try Supabase format cookies
  const supabaseAuthCookie = cookieHeader
    .split(/;\s*/)
    .map((c: any) => c.trim())
    .find((c: any) => /sb-.*-auth-token=/.test(c));

  if (supabaseAuthCookie) {
    try {
      let cookieValue = decodeURIComponent(supabaseAuthCookie.split("=")[1]);

      if (cookieValue.startsWith("base64-")) {
        const sessionData = JSON.parse(Buffer.from(cookieValue.substring(7), "base64").toString());
        return sessionData.access_token;
      }
    } catch (error) {

    }
  }

  // Try authorization header as last resort
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Create session cookie value
 */
export function createSessionCookieValue(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type?: string;
  user?: any;
}): string {
  return `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
}
