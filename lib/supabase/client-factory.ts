/**
 * Client factory exports
 * Re-exports from main index to maintain compatibility
 */

import { supabase } from "./index";

/**
 * Create browser client (client-side only)
 */
export function createBrowserClient() {
  return supabase.browser();
}

/**
 * Create Supabase client (legacy compatibility)
 */
export function createSupabaseClient() {
  return supabase.browser();
}

/**
 * Create service role client (server-side only)
 */
export function createServiceRoleClient() {
  return supabase.admin();
}

// Re-export the main supabase object
export { supabase };
