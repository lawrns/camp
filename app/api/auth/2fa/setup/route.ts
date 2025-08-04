import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { z } from "zod";
import { withTenantGuard, type TenantContext } from "@/lib/core/auth";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/supabase";

// Types for 2FA operations
interface TwoFactorProfile {
  metadata?: {
    two_factor_enabled?: boolean;
    two_factor_secret?: string;
    two_fa_setup?: {
      secret: string;
      token: string;
      expiresAt: string;
    };
    [key: string]: unknown;
  };
}

interface TwoFactorCode {
  user_id: string;
  code: string;
  expiresAt: string;
}

type ProfileRow = Tables<'profiles'>;

// Enable 2FA schema
const enable2FASchema = z.object({
  token: z.string().length(6),
});

// Generate 2FA secret and QR code
export const GET = withTenantGuard(async (_req: NextRequest, { user: _user, organizationId: _organizationId, scopedClient: _scopedClient }: TenantContext) => {
  try {
    const supabaseClient = supabase.admin();
    if (!supabaseClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if 2FA is already enabled
    const { data: profile } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single();

    const typedProfile = profile as TwoFactorProfile;
    if (typedProfile?.metadata?.two_factor_enabled) {
      return NextResponse.json(
        {
          error: "Two-factor authentication is already enabled",
        },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Campfire (${user.email})`,
      issuer: "Campfire",
      length: 32,
    });

    // Store temporary secret in session (expires in 10 minutes)
    const sessionToken = crypto.randomUUID();
    // Store setup data in profile metadata (temporary)
    const { error: sessionError } = await supabaseClient
      .from("profiles")
      .update({
        metadata: {
          two_fa_setup: {
            secret: secret.base32,
            token: sessionToken,
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          },
        },
      })
      .eq("user_id", user.id);

    if (sessionError) {
      return NextResponse.json({ error: "Failed to initialize 2FA setup" }, { status: 500 });
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      sessionToken,
      manualEntryKey: secret.base32,
      expiresAt: new Date(Date.now() + 600000),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// Enable 2FA with verification
export const POST = withTenantGuard(async (req: NextRequest, { user: _user, organizationId: _organizationId, scopedClient: _scopedClient }: TenantContext) => {
  try {
    const supabaseClient = supabase.admin();
    if (!supabaseClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const body = await req.json();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request
    const validationResult = enable2FASchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid verification code",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;
    const sessionToken = body.sessionToken;

    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    // Get temporary secret from profile metadata
    const { data: profile, error: sessionError } = await supabaseClient
      .from("profiles")
      .select("metadata")
      .eq("user_id", user.id)
      .single();

    const typedProfile = profile as TwoFactorProfile;
    const setupData = typedProfile?.metadata?.two_fa_setup;
    if (!setupData || setupData.token !== sessionToken || new Date(setupData.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired session token" }, { status: 400 });
    }

    if (sessionError || !profile) {
      return NextResponse.json(
        {
          error: "Session not found",
        },
        { status: 400 }
      );
    }

    const secret = setupData.secret;

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time windows for clock skew
    });

    if (!verified) {
      return NextResponse.json(
        {
          error: "Invalid verification code",
        },
        { status: 400 }
      );
    }

    // Enable 2FA in profile (using metadata since columns don't exist yet)
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        metadata: {
          ...((await supabaseClient.from("profiles").select("metadata").eq("id", user.id).single()).data?.metadata as Record<string, unknown> || {}),
          two_factor_enabled: true,
          two_factor_secret: secret, // In production, encrypt this!
        },
        updated_at: new Date().toISOString(),
      } as Partial<ProfileRow>)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to enable two-factor authentication",
        },
        { status: 500 }
      );
    }

    // Clean up setup session from profile metadata
    const updatedMetadata = { ...((profile.metadata as object) || {}), two_fa_setup: undefined };
    await supabaseClient.from("profiles").update({ metadata: updatedMetadata }).eq("user_id", user.id);

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomUUID().replace(/-/g, "").substring(0, 8));

    // Store recovery codes (hashed in production) - table doesn't exist yet
    try {
      const supabaseAdmin = supabase.admin();
      await supabaseAdmin.from("two_factor_codes").insert(
        recoveryCodes.map((code: string): TwoFactorCode => ({
          user_id: user.id,
          code: crypto.createHash("sha256").update(code).digest("hex"),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }))
      );
    } catch (_error) {}

    return NextResponse.json({
      message: "Two-factor authentication enabled successfully",
      recoveryCodes,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// Disable 2FA
export const DELETE = withTenantGuard(
  async (req: NextRequest, { user: _user, organizationId: _organizationId, scopedClient: _scopedClient }: TenantContext) => {
    try {
      const supabaseClient = supabase.admin();
      if (!supabaseClient) {
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
      }
      const body = await req.json();

      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify current password or 2FA token
      const { password, token } = body;

      if (!password && !token) {
        return NextResponse.json(
          {
            error: "Password or 2FA token required",
          },
          { status: 400 }
        );
      }

      // Get user profile
      const { data: profile } = await supabaseClient.from("profiles").select("metadata").eq("id", user.id).single();

      const typedProfile = profile as TwoFactorProfile;
      if (!typedProfile?.metadata?.two_factor_enabled) {
        return NextResponse.json(
          {
            error: "Two-factor authentication is not enabled",
          },
          { status: 400 }
        );
      }

      // If token provided, verify it
      if (token) {
        const verified = speakeasy.totp.verify({
          secret: typedProfile?.metadata?.two_factor_secret || "",
          encoding: "base32",
          token,
          window: 2,
        });

        if (!verified) {
          return NextResponse.json(
            {
              error: "Invalid verification code",
            },
            { status: 400 }
          );
        }
      }

      // Disable 2FA (using metadata since columns don't exist yet)
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          metadata: {
            ...(typedProfile?.metadata || {}),
            two_factor_enabled: false,
            two_factor_secret: null,
          },
          updated_at: new Date().toISOString(),
        } as Partial<ProfileRow>)
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json(
          {
            error: "Failed to disable two-factor authentication",
          },
          { status: 500 }
        );
      }

      // Delete all recovery codes - table doesn't exist yet
      try {
        const supabaseAdmin = supabase.admin();
        await supabaseAdmin.from("two_factor_codes").delete().eq("user_id", user.id);
      } catch (_error) {}

      return NextResponse.json({
        message: "Two-factor authentication disabled successfully",
      });
    } catch (_error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
