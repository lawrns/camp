/**
 * Supabase Auth Client for Direct Authentication
 * 
 * This module provides direct Supabase authentication utilities
 * for use in the auth provider and other authentication contexts.
 */

import { supabase } from '@/lib/supabase';

/**
 * Create a Supabase client for authentication
 * Uses centralized client that respects E2E_MOCK mode
 */
export const createAuthClient = () => {
  return supabase.browser();
};

/**
 * Get current session from Supabase
 */
export const getCurrentSession = async () => {
  const client = createAuthClient();
  const { data: { session }, error } = await client.auth.getSession();
  
  if (error) {
    console.error('[Supabase Auth] Session error:', error);
    return null;
  }
  
  return session;
};

/**
 * Get current user from Supabase
 */
export const getCurrentUser = async () => {
  const client = createAuthClient();
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error) {
    console.error('[Supabase Auth] User error:', error);
    return null;
  }
  
  return user;
};

/**
 * Sign in with email and password
 */
export const signInWithPassword = async (email: string, password: string) => {
  const client = createAuthClient();
  return await client.auth.signInWithPassword({ email, password });
};

/**
 * Sign up with email and password
 */
export const signUpWithPassword = async (email: string, password: string, metadata?: unknown) => {
  const client = createAuthClient();
  return await client.auth.signUp({ 
    email, 
    password,
    options: {
      data: metadata
    }
  });
};

/**
 * Sign out
 */
export const signOut = async () => {
  const client = createAuthClient();
  return await client.auth.signOut();
};

/**
 * Listen for auth state changes
 */
export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => {
  const client = createAuthClient();
  return client.auth.onAuthStateChange(callback);
};

/**
 * Check if user has valid Supabase session
 */
export const hasValidSupabaseSession = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    return session !== null && session.expiresAt ? new Date(session.expiresAt) > new Date() : false;
  } catch (error) {
    console.error('[Supabase Auth] Session check error:', error);
    return false;
  }
};

/**
 * Get user with organization data
 */
export const getUserWithOrganization = async () => {
  try {
    const client = createAuthClient();
    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Get organization info if user exists
    let organizationId = user.user_metadata?.organization_id;

    if (!organizationId) {
      const { data: memberData } = await client
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      organizationId = memberData?.organization_id;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
      organizationId,
      organizationRole: user.user_metadata?.organization_role || 'member',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };
  } catch (error) {
    console.error('[Supabase Auth] Get user with organization error:', error);
    return null;
  }
};
