/**
 * Supabase Service Role Client
 * Server-side only client with service role key for admin operations
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Create a Supabase client with service role key
 * WARNING: This should only be used on the server-side
 * The service role key bypasses Row Level Security
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a scoped service role client for a specific organization
 * This adds organization context to queries
 */
export function createScopedServiceRoleClient(organizationId: string) {
  const client = createServiceRoleClient();

  // Add organization context to all queries
  // This is a pattern for multi-tenant applications
  return {
    ...client,
    organizationId,
    // Helper method to add organization filter
    from: <T extends keyof Database["public"]["Tables"]>(table: T) => {
      const query = client.from(table);
      // For tables that have organization_id, automatically filter
      const tablesWithOrgId = [
        "conversations",
        "messages",
        "knowledge_documents",
        "ai_sessions",
        "organization_settings",
      ];

      if (tablesWithOrgId.includes(table as string)) {
        return query.eq("organization_id", organizationId);
      }

      return query;
    },
  };
}

/**
 * Verify a user's session token (for widget authentication)
 */
export async function verifySessionToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  organizationId?: string;
  error?: string;
}> {
  try {
    const client = createServiceRoleClient();

    // Decode and verify the JWT token
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      return {
        valid: false,
        error: error?.message || "Invalid token",
      };
    }

    // Get user's organization
    const { data: profile } = await client
      .from("profiles")
      .select("organization_id")
      .eq("user_id", data.user.id)
      .single();

    return {
      valid: true,
      userId: data.user.id,
      organizationId: profile?.organization_id ?? undefined,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a new anonymous session for widget users
 */
export async function createAnonymousSession(
  organizationId: string,
  metadata?: Record<string, any>
): Promise<{
  sessionId: string;
  visitorId: string;
  token: string;
}> {
  const client = createServiceRoleClient();

  // Generate visitor ID
  const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create visitor session record
  await client.from("visitor_sessions").insert({
    id: sessionId,
    visitor_id: visitorId,
    organization_id: organizationId,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  });

  // Generate a temporary token for the session
  // In a real implementation, this would be a proper JWT
  const token = Buffer.from(
    JSON.stringify({
      sessionId,
      visitorId,
      organizationId,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
  ).toString("base64");

  return {
    sessionId,
    visitorId,
    token,
  };
}

/**
 * Refresh an existing session
 */
export async function refreshSession(token: string): Promise<{
  valid: boolean;
  newToken?: string;
  error?: string;
}> {
  try {
    // Decode the token
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());

    if (!decoded.sessionId || decoded.exp < Date.now()) {
      return {
        valid: false,
        error: "Token expired",
      };
    }

    const client = createServiceRoleClient();

    // Update last seen
    await client
      .from("visitor_sessions")
      .update({
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", decoded.sessionId);

    // Generate new token
    const newToken = Buffer.from(
      JSON.stringify({
        ...decoded,
        exp: Date.now() + 24 * 60 * 60 * 1000, // Extend by 24 hours
      })
    ).toString("base64");

    return {
      valid: true,
      newToken,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Admin function to create a user with organization
 */
export async function createUserWithOrganization(
  email: string,
  password: string,
  organizationId: string,
  role: "owner" | "admin" | "agent" = "agent"
): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const client = createServiceRoleClient();

  try {
    // Create the user
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Failed to create user",
      };
    }

    // Create profile
    const { error: profileError } = await client.from("profiles").insert({
      user_id: authData.user.id,
      email,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      // Rollback user creation
      await client.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: profileError.message,
      };
    }

    // Add to organization members
    const { error: memberError } = await client.from("organization_members").insert({
      user_id: authData.user.id,
      organization_id: organizationId,
      role,
      created_at: new Date().toISOString(),
    });

    if (memberError) {
      // Rollback
      await client.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: memberError.message,
      };
    }

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
