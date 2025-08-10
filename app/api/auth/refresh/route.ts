import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES, extractAuthToken } from "@/lib/auth/cookie-utils";
import { refreshAuth, setAuthCookies } from "@/lib/middleware/auth";
import { generateCsrfToken } from "@/lib/middleware/securityHeaders";

/**
 * API endpoint to refresh authentication session
 * Called after login to ensure browser client is synchronized
 */
export async function POST(request: NextRequest) {
  try {
    // E2E MOCK: synthesize refresh without external calls
    if (process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test') {
      const cookieStore = await cookies();
      // Ensure we have an auth token to base the refresh on
      const authCookie = cookieStore.get(AUTH_COOKIE_NAMES.AUTH_TOKEN)?.value;
      if (!authCookie) {
        return NextResponse.json({ error: 'No session found' }, { status: 401 });
      }
      const newSession = {
        access_token: `mock-access-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
      } as const;
      await setAuthCookies({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expiresAt: newSession.expiresAt,
        token_type: newSession.token_type,
      } as any);
      const csrfToken = generateCsrfToken();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = NextResponse.json({ success: true, session: newSession });
      response.headers.set('X-CSRF-Token', csrfToken);
      response.headers.set('X-Session-ID', sessionId);
      return response;
    }
    const cookieStore = await cookies();

    // Try to get refresh token from cookies first
    let refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value;

    if (!refreshToken) {
      // Fall back to extracting from auth token
      const authToken = extractAuthToken(request);
      if (!authToken) {
        return NextResponse.json(
          {
            error: "No session found",
            message: "Authentication required",
          },
          { status: 401 }
        );
      }

      // Try to extract refresh token from session cookie
      const authCookie = cookieStore.get(AUTH_COOKIE_NAMES.AUTH_TOKEN)?.value;
      if (authCookie?.startsWith("base64-")) {
        try {
          const sessionData = JSON.parse(Buffer.from(authCookie.substring(7), "base64").toString());
          refreshToken = sessionData.refresh_token;
        } catch (e) {

        }
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "No refresh token found",
          message: "Please login again",
        },
        { status: 401 }
      );
    }

    // Refresh the session
    const newSession = await refreshAuth(refreshToken);

    if (!newSession) {
      return NextResponse.json(
        {
          error: "Session refresh failed",
          message: "Please login again",
        },
        { status: 401 }
      );
    }

    // Update cookies with new tokens
    await setAuthCookies(newSession);

    // Generate new CSRF token for refreshed session
    const csrfToken = generateCsrfToken();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = NextResponse.json({
      success: true,
      session: {
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expiresAt: newSession.expiresAt,
        token_type: "bearer",
      },
    });

    // Set CSRF token and session ID in response headers
    response.headers.set("X-CSRF-Token", csrfToken);
    response.headers.set("X-Session-ID", sessionId);

    return response;
  } catch (error) {

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
