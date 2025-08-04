import { createServerClient } from "@/lib/core/auth";
import { env } from "@/lib/utils/env-config";
import jwt from "jsonwebtoken";

/**
 * Widget Auth - Secure JWT Implementation
 *
 * This file provides secure JWT-based authentication for widget sessions
 * with proper server-side signing and organization context.
 */

// Re-export everything from the consolidated auth module
export * from "@/lib/core/auth";

// Get JWT secret with validation
const getJWTSecret = (): string => {
  const secret = env.WIDGET_JWT_SECRET;
  if (!secret) {
    throw new Error("WIDGET_JWT_SECRET environment variable is required");
  }
  return secret;
};

// Widget-specific auth functions with proper JWT signing
export const createWidgetAuthToken = async (
  organizationId: string,
  visitorId?: string,
  metadata?: unknown
): Promise<{
  token: string;
  userId: string;
  visitorId: string;
  organizationId: string;
  expiresAt: Date;
  session?: unknown;
  user?: unknown;
}> => {
  const client = createServerClient();

  // Generate unique visitor ID if not provided
  const finalVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create JWT payload with organization context
  // CRITICAL: Use Supabase-compatible JWT structure for real-time access
  const jwtPayload = {
    aud: "anon", // Use "anon" for anonymous widget sessions
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    iat: Math.floor(Date.now() / 1000),
    iss: "supabase", // MUST be "supabase" for real-time WebSocket authentication
    sub: `widget_${finalVisitorId}`,
    email: `visitor@${organizationId}`,
    phone: "",
    app_metadata: {
      provider: "widget",
      providers: ["widget"],
      organization_id: organizationId, // Add org context to app_metadata
    },
    user_metadata: {
      organization_id: organizationId,
      widget_session: true,
      visitor_id: finalVisitorId,
      metadata: metadata || {},
      source: "widget", // Add source identifier
    },
    role: "anon", // Use "anon" role for widget sessions
    aal: "aal1",
    amr: [{ method: "widget", timestamp: Math.floor(Date.now() / 1000) }],
    session_id: `widget_${finalVisitorId}`,
    // CRITICAL: Add organization_id at root level for RLS policies
    organization_id: organizationId,
  };

  // For Supabase real-time compatibility, we need to use Supabase's own JWT signing
  // Instead of custom JWT, we'll use Supabase's signInAnonymously with metadata
  const supabaseClient = createServerClient();

  try {
    // Sign in anonymously with widget metadata
    const { data, error } = await supabaseClient.auth.signInAnonymously({
      options: {
        data: {
          organization_id: organizationId,
          widget_session: true,
          visitor_id: finalVisitorId,
          source: "widget",
          metadata: metadata || {},
        },
      },
    });

    if (error) {
      throw new Error(`Widget authentication failed: ${error.message}`);
    }

    if (!data.session?.access_token) {
      throw new Error("No access token received from Supabase authentication");
    }

    // Return the Supabase-generated token and session data
    return {
      token: data.session.access_token,
      userId: data.user?.id || `widget_${finalVisitorId}`,
      visitorId: finalVisitorId,
      organizationId,
      expiresAt: new Date(data.session.expiresAt ? data.session.expiresAt * 1000 : Date.now() + 24 * 60 * 60 * 1000),
      session: data.session,
      user: data.user,
    };
  } catch (authError) {
    console.error("Widget Supabase authentication error:", authError);

    // Fallback to custom JWT if Supabase auth fails
    console.warn("Falling back to custom JWT token for widget authentication");

    // Sign the JWT token with proper secret as fallback
    const token = jwt.sign(jwtPayload, getJWTSecret(), {
      algorithm: "HS256",
      expiresIn: "24h",
    });

    return {
      token,
      userId: `widget_${finalVisitorId}`,
      visitorId: finalVisitorId,
      organizationId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }
};

export const verifyWidgetToken = async (token: string) => {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as unknown;

    // Validate token structure
    if (!decoded.organization_id || !decoded.user_metadata?.visitor_id) {
      throw new Error("Invalid token structure");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token signature");
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

// Alias for backward compatibility
export const generateWidgetToken = createWidgetAuthToken;
