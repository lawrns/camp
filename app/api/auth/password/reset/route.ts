import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/utils/env-config";

const resend = new Resend(env.RESEND_API_KEY);

// Request reset schema
const requestResetSchema = z.object({
  email: z.string().email(),
});

// Confirm reset schema
const confirmResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

// Request password reset - Public endpoint
export async function POST(req: NextRequest) {
  try {
    const supabaseClient = supabase.admin();
    const body = await req.json();

    // Validate request
    const validationResult = requestResetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid email address",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Check if user exists
    const { data: user } = await supabaseClient.from("profiles").select("id").eq("email", email).single();

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: "If an account with that email exists, we sent a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in profile metadata
    const { error: tokenError } = await supabaseClient
      .from("profiles")
      .update({
        metadata: {
          password_reset: {
            token: hashedToken,
            expiresAt: expiresAt.toISOString(),
          },
        },
      })
      .eq("user_id", user.id);

    if (tokenError) {
      return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 });
    }

    // Send reset email
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    try {
      await resend.emails.send({
        from: "Campfire <noreply@campfire.app>",
        to: email,
        subject: "Reset your password",
        html: `
          <h2>Reset your password</h2>
          <p>You requested to reset your password. Click the link below to create a new password:</p>
          <p><a href="${resetUrl}" style="background: #246BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This email was sent by Campfire. If you have questions, please contact support.</p>
        `,
      });
    } catch (emailError) {
      // Clear the token if email fails
      const updatedMetadata = { password_reset: undefined };
      await supabaseClient.from("profiles").update({ metadata: updatedMetadata }).eq("user_id", user.id);

      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({
      message: "If an account with that email exists, we sent a password reset link.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Confirm password reset - Public endpoint
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validationResult = confirmResetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset token in profile metadata
    const supabaseClient = supabase.admin();
    const { data: profiles, error: tokenError } = await supabaseClient
      .from("profiles")
      .select("user_id, email, metadata")
      .not("metadata", "is", null);

    // Find profile with matching token
    const resetProfile = profiles?.find((profile: unknown) => {
      const resetData = (profile.metadata as unknown)?.password_reset;
      return (
        resetData &&
        resetData.token === hashedToken &&
        new Date(resetData.expiresAt) > new Date() &&
        !resetData.usedAt
      );
    });

    const resetToken = resetProfile
      ? {
          user_id: resetProfile.user_id,
          token: hashedToken,
          profiles: { email: resetProfile.email },
        }
      : null;

    if (tokenError || !resetToken || !resetToken.user_id) {
      return NextResponse.json(
        {
          error: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    // Update user password using Supabase Auth Admin API
    // supabase is already defined above
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(resetToken.user_id, { password });

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to update password",
        },
        { status: 500 }
      );
    }

    // Mark token as used in profile metadata
    const currentMetadata = (resetProfile?.metadata as unknown) || {};
    const updatedMetadata = {
      ...currentMetadata,
      password_reset: {
        ...currentMetadata.password_reset,
        usedAt: new Date().toISOString(),
      },
    };
    const { error: markUsedError } = await supabaseClient
      .from("profiles")
      .update({ metadata: updatedMetadata })
      .eq("user_id", resetToken.user_id);

    if (markUsedError) {
    }

    // Log the password reset
    await (supabaseClient as unknown).from("login_attempts").insert({
      email: resetToken.profiles.email,
      success: true,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      message: "Password successfully reset",
      redirect: "/login",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Validate reset token - Public endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check if token is valid in profile metadata
    const supabaseClient = supabase.admin();
    const { data: profiles, error } = await supabaseClient
      .from("profiles")
      .select("user_id, metadata")
      .not("metadata", "is", null);

    // Find profile with matching token
    const resetProfile = profiles?.find((profile: unknown) => {
      const resetData = (profile.metadata as unknown)?.password_reset;
      return (
        resetData &&
        resetData.token === hashedToken &&
        new Date(resetData.expiresAt) > new Date() &&
        !resetData.usedAt
      );
    });

    const resetToken = resetProfile
      ? {
          id: resetProfile.user_id,
          expiresAt: (resetProfile.metadata as unknown).password_reset.expiresAt,
        }
      : null;

    if (error || !resetToken) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid or expired token",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      expiresAt: resetToken.expiresAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
