import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase";

export const browserSupabase = supabase.browser();

export const auth = {
  login: async (email: string, password: string) => {
    const { data, error } = await browserSupabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  logout: async () => {
    const { error } = await browserSupabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const {
      data: { user },
      error,
    } = await browserSupabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const {
      data: { session },
      error,
    } = await browserSupabase.auth.getSession();
    return { session, error };
  },
};
