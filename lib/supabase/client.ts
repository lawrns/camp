/**
 * Browser Supabase Client
 *
 * Simple client for browser-side usage
 */

import { supabase } from "./index";

// Export the browser client as default
export const createClient = supabase.browser;

// Default export for compatibility
export default supabase.browser;

// Named exports for different use cases
export const client = supabase.browser();
export const supabaseClient = supabase.browser();
export const browserClient = supabase.browser();
