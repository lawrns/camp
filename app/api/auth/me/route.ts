import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Force dynamic rendering for API routes

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile with additional details
    const { data: profile } = await supabaseClient.from("profiles").select("*").eq("user_id", user.id).single();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: profile?.fullName || "Agent",
      avatarUrl: profile?.avatar_url,
      organizationId: profile?.organization_id,
      role: ((profile?.metadata as Record<string, unknown>)?.role as string) || "agent",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
