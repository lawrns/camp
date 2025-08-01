/**
 * Server-side Supabase client exports
 * Re-exports from main index to maintain compatibility
 */

import { cookies } from "next/headers";
import { supabase } from "./index";

/**
 * Get server client for server-side operations with user context
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  return supabase.server(cookieStore);
}

/**
 * Get service client for admin operations (server-side only)
 */
export function getServiceClient() {
  return supabase.admin();
}

/**
 * Create client with user context for server-side operations
 */
export function createClient() {
  const cookieStore = cookies();
  return supabase.server(cookieStore);
}

// Legacy exports
export { supabase };
