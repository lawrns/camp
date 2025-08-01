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
  metadata?: any
): Promise<{
  token: string;
  userId: string;
  visitorId: string;
  organizationId: string;
  expiresAt: Date;
}> => {

  // Generate unique visitor ID if not provided
  const finalVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = `widget_${finalVisitorId}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create JWT payload with organization context
  const jwtPayload = {
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    iat: Math.floor(Date.now() / 1000),
    iss: "campfire-widget",
    sub: userId,
    email: `visitor@${organizationId}`,
    phone: "",
    app_metadata: {
      provider: "widget",
      providers: ["widget"],
    },
    user_metadata: {
      organization_id: organizationId,
      widget_session: true,
      visitor_id: finalVisitorId,
      metadata: metadata || {},
    },
    role: "authenticated",
    aal: "aal1",
    amr: [{ method: "widget", timestamp: Math.floor(Date.now() / 1000) }],
    session_id: userId,
    // CRITICAL: Add organization_id at root level for RLS policies
    organization_id: organizationId,
  };

  // Sign the JWT token with proper secret
  const token = jwt.sign(jwtPayload, getJWTSecret(), {
    algorithm: "HS256",
    expiresIn: "24h",
  });

  return {
    token,
    userId,
    visitorId: finalVisitorId,
    organizationId,
    expiresAt,
  };
};

export const verifyWidgetToken = async (token: string) => {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as any;

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
