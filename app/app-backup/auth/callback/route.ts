import { NextRequest, NextResponse } from "next/server";

// Lazy-load heavy dependencies
const getSupabaseClient = async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { cookies } = await import("next/headers");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(new URL("/login?error=auth_callback_error", requestUrl.origin));
      }

      if (data.session) {
        // Successful authentication - redirect to intended destination
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/login?error=auth_callback_exception", requestUrl.origin));
    }
  }

  // No code parameter or other error
  return NextResponse.redirect(new URL("/login?error=no_auth_code", requestUrl.origin));
}
