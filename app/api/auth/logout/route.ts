import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, withOptionalAuth } from "@/lib/middleware/auth";

// User type from auth middleware (compatible with AuthContext)
// interface AuthUser {
//   id: string;
//   email: string;
//   organization_id: string;
//   role?: string;
// }

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic";

export const POST = withOptionalAuth(async (request: NextRequest & { user?: unknown }): Promise<NextResponse> => {
  try {
    const cookieStore = await cookies();
    const { supabase } = await import("@/lib/supabase");
    const supabaseClient = supabase.server(cookieStore);

    // Sign out the user if authenticated
    if (request.user) {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {

      }
    }

    // Clear all auth cookies regardless
    await clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: "Logout failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});
