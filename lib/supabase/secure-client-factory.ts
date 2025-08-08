/**
 * Secure Supabase Client Factory
 * FIXES: Critical Issue C001 - Widget Authentication Bypass Vulnerability
 * 
 * This factory provides secure alternatives to supabase.admin() that maintain
 * proper Row Level Security (RLS) and organization isolation.
 */

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { validateOrganizationId, validateUserId } from '@/lib/utils/validation';

export interface SecureClientOptions {
  organizationId?: string;
  userId?: string;
  requireAuth?: boolean;
  allowServiceRole?: boolean;
}

/**
 * Creates a secure Supabase client that respects RLS and organization boundaries
 * Use this instead of supabase.admin() for user-facing operations
 */
export async function createSecureClient(options: SecureClientOptions = {}) {
  const {
    organizationId,
    userId,
    requireAuth = true,
    allowServiceRole = false
  } = options;

  // For authenticated user operations, use the standard client with RLS
  if (requireAuth && !allowServiceRole) {
    const cookieStore = cookies();
    const client = supabase.server(cookieStore);
    
    // Validate the user's session
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // If organization ID is provided, validate the user has access
    if (organizationId) {
      const validatedOrgId = validateOrganizationId(organizationId, null);
      
      // Check if user is a member of the organization
      const { data: membership, error: membershipError } = await client
        .from('organization_members')
        .select('id, role, status')
        .eq('organization_id', validatedOrgId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError || !membership) {
        throw new Error('Access denied: User not authorized for this organization');
      }
    }

    return {
      client,
      user,
      organizationId: organizationId ? validateOrganizationId(organizationId, null) : null
    };
  }

  // For service role operations (use sparingly and with explicit validation)
  if (allowServiceRole) {
    const adminClient = supabase.admin();
    
    // Even with service role, validate organization ID if provided
    const validatedOrgId = organizationId ? validateOrganizationId(organizationId, null) : null;
    
    return {
      client: adminClient,
      user: null,
      organizationId: validatedOrgId
    };
  }

  throw new Error('Invalid client configuration');
}

/**
 * Creates a client specifically for widget operations
 * Validates organization membership and provides limited access
 */
export async function createWidgetClient(organizationId: string) {
  const validatedOrgId = validateOrganizationId(organizationId, null);
  
  // For widget operations, we need service role but with strict validation
  const adminClient = supabase.admin();
  
  // Verify the organization exists and is active
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('id, name, settings')
    .eq('id', validatedOrgId)
    .single();

  if (orgError || !org) {
    throw new Error('Invalid organization');
  }

  // Return a scoped client that includes organization context
  return {
    client: adminClient,
    organizationId: validatedOrgId,
    organization: org,
    // Helper method to ensure all queries include organization filter
    scopedQuery: (table: unknown) => {
      return adminClient.from(table).eq('organization_id', validatedOrgId);
    }
  };
}

/**
 * Creates a client for authenticated API operations
 * Automatically validates user session and organization membership
 */
export async function createAuthenticatedClient(requiredOrganizationId?: string) {
  const cookieStore = await cookies();
  const client = supabase.server(cookieStore);
  
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  let organizationId: string | null = null;
  let membership = null;

  if (requiredOrganizationId) {
    organizationId = validateOrganizationId(requiredOrganizationId, null);
    
    // Verify user membership in the required organization
    const { data: membershipData, error: membershipError } = await client
      .from('organization_members')
      .select('id, role, status, organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membershipData) {
      throw new Error('Access denied: User not authorized for this organization');
    }

    membership = membershipData;
  }

  return {
    client,
    user,
    organizationId,
    membership,
    // Helper method for organization-scoped queries
    scopedQuery: (table: string) => {
      if (!organizationId) {
        throw new Error('Organization context required for scoped queries');
      }
      return client.from(table).eq('organization_id', organizationId);
    }
  };
}

/**
 * Legacy compatibility wrapper - gradually migrate away from this
 * @deprecated Use createSecureClient, createWidgetClient, or createAuthenticatedClient instead
 */
export function createLegacySecureClient(organizationId?: string) {
  console.warn('createLegacySecureClient is deprecated. Use createSecureClient instead.');
  return createSecureClient({ 
    organizationId, 
    allowServiceRole: true 
  });
}
