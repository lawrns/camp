import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Registration schema validation
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
});

/**
 * POST /api/auth/register
 * Register a new user with Supabase Auth and create their profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, organizationName } = validationResult.data;

    console.log('[Registration API] Starting registration for:', { email, fullName, organizationName });

    // Use regular signup to ensure triggers fire properly
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Create user with regular signup to ensure trigger execution
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: organizationName,
        }
      }
    });

    if (authError) {
      console.error("[Registration API] Auth error:", authError);
      // Handle specific error cases
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      return NextResponse.json({
        error: authError.message || "Registration failed",
        details: authError
      }, { status: 400 });
    }

    if (!authData.user) {
      console.error("[Registration API] No user data returned");
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    console.log('[Registration API] User created successfully:', authData.user.id);

    // Create organization and profile manually (more reliable than triggers)
    const supabaseAdmin = supabase.admin();

    try {
      // Create organization
      const orgSlug = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const { data: organization, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: organizationName,
          slug: orgSlug,
          email: email,
          status: 'active'
        })
        .select()
        .single();

      if (orgError) {
        console.error('[Registration API] Organization creation error:', orgError);
        return NextResponse.json({
          error: "User created but organization setup failed",
          details: orgError
        }, { status: 500 });
      }

      console.log('[Registration API] Organization created:', organization.id);

      // Create profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: email,
          full_name: fullName,
          organization_id: organization.id,
          role: 'admin',
          status: 'active'
        })
        .select()
        .single();

      if (profileError) {
        console.error('[Registration API] Profile creation error:', profileError);
        return NextResponse.json({
          error: "User created but profile setup failed",
          details: profileError
        }, { status: 500 });
      }

      console.log('[Registration API] Profile created:', profile.id);

      // Create organization membership
      const { error: membershipError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: authData.user.id,
          role: 'admin',
          status: 'active'
        });

      if (membershipError) {
        console.warn('[Registration API] Membership creation warning:', membershipError);
        // Don't fail for membership issues
      }

      // Create onboarding tracking
      const { error: onboardingError } = await supabaseAdmin
        .from('onboarding_completion_tracking')
        .insert({
          user_id: authData.user.id,
          organization_id: organization.id
        });

      if (onboardingError) {
        console.warn('[Registration API] Onboarding tracking warning:', onboardingError);
        // Don't fail for onboarding tracking issues
      }

      // Return success response with complete user data
      return NextResponse.json({
        success: true,
        message: "Registration successful! Please check your email to confirm your account.",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: fullName,
          organizationName: organizationName,
          profile: {
            id: profile.id,
            organizationId: organization.id,
            role: profile.role
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          }
        },
      });
    } catch (setupError) {
      console.error('[Registration API] Setup error:', setupError);
      return NextResponse.json({
        error: "Registration failed during setup",
        details: setupError instanceof Error ? setupError.message : "Unknown setup error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[Registration API] Unexpected error:", error);
    console.error("[Registration API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: "Internal server error during registration",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  }
}
