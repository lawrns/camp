import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { z } from "zod";
import { withTenantGuard, type TenantContext } from "@/lib/core/auth";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/utils/env-config";
import type { Profile, Json } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type definitions for database tables and metadata
interface TwoFactorMetadata {
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  last_login_at?: string;
  [key: string]: unknown;
}

interface ProfileWithMetadata extends Profile {
  metadata: TwoFactorMetadata | null;
}

interface UserSession {
  id: string;
  user_id: string;
  token?: string;
  deviceInfo: Json;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  created_at: string;
}

interface TwoFactorCode {
  id: string;
  user_id: string;
  code: string;
  expiresAt: string;
  usedAt: string | null;
}

interface LoginAttempt {
  email: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

type TypedSupabaseClient = SupabaseClient;

// Verification schema
const verifySchema = z.object({
  token: z.string().min(6).max(8),
  sessionId: z.string().uuid(),
});

export const POST = withTenantGuard(async (req: NextRequest, { user, organizationId, scopedClient }: TenantContext) => {
  try {
    const supabaseClient = supabase.admin();
    if (!supabaseClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const body = await req.json();

    // Validate request
    const validationResult = verifySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { token, sessionId } = validationResult.data;

    // Get pending 2FA session
    const { data: pendingSession, error: sessionError } = await (supabaseClient as TypedSupabaseClient)
      .from("user_sessions")
      .select("user_id, deviceInfo")
      .eq("id", sessionId)
      .eq("deviceInfo->type", "2fa_pending")
      .gt("expiresAt", new Date().toISOString())
      .single() as { data: Pick<UserSession, 'user_id' | 'deviceInfo'> | null; error: unknown };

    if (sessionError || !pendingSession) {
      return NextResponse.json(
        {
          error: "Invalid or expired session",
        },
        { status: 400 }
      );
    }

    // Get user profile with 2FA secret
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("metadata, email")
      .eq("id", pendingSession.user_id)
      .single();

    const profileWithMetadata = profile as ProfileWithMetadata;
    if (profileError || !profile || !profileWithMetadata?.metadata?.two_factor_enabled) {
      return NextResponse.json(
        {
          error: "Two-factor authentication not enabled",
        },
        { status: 400 }
      );
    }

    let verified = false;

    // Check if it's a TOTP code (6 digits)
    if (token.length === 6 && /^\d+$/.test(token)) {
      verified = speakeasy.totp.verify({
        secret: profileWithMetadata?.metadata?.two_factor_secret,
        encoding: "base32",
        token,
        window: 2, // Allow 2 time windows for clock skew
      });
    }
    // Check if it's a recovery code (8 characters)
    else if (token.length === 8) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      try {
        const { data: recoveryCode, error: codeError } = await (supabaseClient as TypedSupabaseClient)
          .from("two_factor_codes")
          .select("id")
          .eq("user_id", pendingSession.user_id)
          .eq("code", hashedToken)
          .is("usedAt", null)
          .gt("expiresAt", new Date().toISOString())
          .single();

        if (!codeError && recoveryCode) {
          verified = true;

          // Mark recovery code as used
          await (supabase as any)
            .from("two_factor_codes")
            .update({ usedAt: new Date().toISOString() })
            .eq("id", recoveryCode.id);
        }
      } catch (error) {}
    }

    if (!verified) {
      // Log failed attempt - table may not exist yet
      try {
        await (supabase as any).from("login_attempts").insert({
          email: profile.email,
          success: false,
          failureReason: "2FA verification failed",
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        });
      } catch (error) {}

      return NextResponse.json(
        {
          error: "Invalid verification code",
        },
        { status: 400 }
      );
    }

    // Create authenticated session
    const sessionToken = crypto.randomUUID();
    const { error: createSessionError } = await (supabase as any).from("user_sessions").insert({
      user_id: pendingSession.user_id,
      token: sessionToken,
      deviceInfo: (pendingSession as any).deviceInfo?.deviceInfo || {},
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    if (createSessionError) {
      return NextResponse.json(
        {
          error: "Failed to create session",
        },
        { status: 500 }
      );
    }

    // Delete pending 2FA session
    await (supabaseClient as any).from("user_sessions").delete().eq("id", sessionId);

    // Update last login (using metadata since column may not exist)
    try {
      await supabaseClient
        .from("profiles")
        .update({
          metadata: {
            ...((
              (await supabaseClient.from("profiles").select("metadata").eq("id", pendingSession.user_id).single())
                .data as any
            )?.metadata || {}),
            last_login_at: new Date().toISOString(),
          },
        } as any)
        .eq("id", pendingSession.user_id);
    } catch (error) {}

    // Log successful login - table may not exist yet
    try {
      await (supabase as any).from("login_attempts").insert({
        email: profile.email,
        success: true,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      });
    } catch (error) {}

    // Set session cookie
    const response = NextResponse.json({
      message: "Two-factor authentication successful",
      sessionToken,
      redirect: "/dashboard",
    });

    // Set secure session cookie
    response.cookies.set("campfire-session", sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// Resend 2FA code (for future implementation of SMS/Email 2FA)
export const PUT = withTenantGuard(async (req: NextRequest, { user, organizationId, scopedClient }: TenantContext) => {
  try {
    const supabaseClient = supabase.admin();
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Get pending session
    const { data: pendingSession, error: sessionError } = await (supabase as any)
      .from("user_sessions")
      .select("user_id, created_at")
      .eq("id", sessionId)
      .eq("deviceInfo->type", "2fa_pending")
      .gt("expiresAt", new Date().toISOString())
      .single();

    if (sessionError || !pendingSession) {
      return NextResponse.json(
        {
          error: "Invalid or expired session",
        },
        { status: 400 }
      );
    }

    // Check rate limiting (max 1 resend per minute)
    const lastResend = new Date(pendingSession.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastResend.getTime();

    if (timeDiff < 60000) {
      // Less than 1 minute
      return NextResponse.json(
        {
          error: "Please wait before requesting another code",
          retryAfter: Math.ceil((60000 - timeDiff) / 1000),
        },
        { status: 429 }
      );
    }

    // For TOTP, we don't actually resend anything
    // This endpoint is for future SMS/Email 2FA implementation
    return NextResponse.json({
      message: "Please check your authenticator app for the current code",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
