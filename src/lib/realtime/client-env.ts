/**
 * Simple client-side environment helper for lean realtime system
 * Avoids complex validation that breaks in browser context
 */

export function getClientSupabaseConfig() {
  if (typeof window === "undefined") {
    throw new Error("getClientSupabaseConfig() can only be called on the client side");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required. Please check your .env.local file.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please check your .env.local file.");
  }

  return { url, anonKey };
}
