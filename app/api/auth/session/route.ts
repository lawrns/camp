/**
 * Session Check API Route
 *
 * Checks for existing session without requiring authentication
 * Used by auth provider to avoid chicken-and-egg problem
 */

import { applySecurityHeaders } from "@/lib/middleware/securityHeaders";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // ENHANCED DEBUGGING: Log all request details
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    const userAgent = request.headers.get("user-agent");

    // Parse and log individual cookies
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const authCookies = cookies.filter(c =>
        c.includes('sb-') ||
        c.includes('auth') ||
        c.includes('access') ||
        c.includes('refresh')
      );

      authCookies.forEach(cookie => {
        const [name, value] = cookie.split('=');

      });
    } else {

    }

    // Check for Bearer token first
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Handle widget/test tokens
      if (token === 'test-token' || token.startsWith('widget_')) {
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: {
            id: 'widget-user',
            email: 'widget@example.com',
            displayName: 'Widget User',
            organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd'
          },
          session: {
            isValid: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }

      try {
        const supabaseAdmin = supabase.admin();
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(token);

        if (!error && user) {
          // Get organization info
          let organizationId = user.user_metadata?.organization_id;

          if (!organizationId) {
            const { data: memberData } = await supabaseAdmin
              .from("organization_members")
              .select("organization_id, role")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            organizationId = memberData?.organization_id;
          }

          const response = NextResponse.json({
            success: true,
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
              organizationId,
              createdAt: user.created_at,
              lastSignInAt: user.last_sign_in_at,
            },
            session: {
              isValid: true,
              expiresAt: user.app_metadata?.expires_at,
            },
          });

          return applySecurityHeaders(response);
        }
      } catch (tokenError) {

      }
    }

    // Check for session in cookies (for browser requests)
    if (cookieHeader) {
      try {

        // Create a server client to check cookies
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();

        // Log what cookies Next.js sees
        const nextCookies = cookieStore.getAll();
        const nextAuthCookies = nextCookies.filter(c =>
          c.name.includes('sb-') ||
          c.name.includes('auth') ||
          c.name.includes('access') ||
          c.name.includes('refresh')
        );

        nextAuthCookies.forEach(cookie => {

        });

        const supabaseServer = supabase.server(cookieStore);

        const {
          data: { user },
          error,
        } = await supabaseServer.auth.getUser();

        if (!error && user) {
          // Get organization info
          let organizationId = user.user_metadata?.organization_id;

          if (!organizationId) {
            const { data: memberData } = await supabaseServer
              .from("organization_members")
              .select("organization_id, role")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            organizationId = memberData?.organization_id;
          }

          const response = NextResponse.json({
            success: true,
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
              organizationId,
              createdAt: user.created_at,
              lastSignInAt: user.last_sign_in_at,
            },
            session: {
              isValid: true,
              expiresAt: user.app_metadata?.expires_at,
            },
          });

          return applySecurityHeaders(response);
        }
      } catch (cookieError) {

      }
    }

    // No valid session found
    const response = NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "No valid session found",
      },
      { status: 401 }
    );

    return applySecurityHeaders(response);
  } catch (error) {

    const response = NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Session check failed",
      },
      { status: 500 }
    );

    return applySecurityHeaders(response);
  }
}
