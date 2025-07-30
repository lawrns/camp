import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Registration schema validation
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
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

    const { email, password, firstName, lastName, company } = validationResult.data;

    // Use regular signup instead of admin.createUser to avoid trigger issues
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Create user with regular signup
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "",
          company,
        }
      }
    });

    if (authError) {
      console.error("Registration auth error:", authError);
      // Handle specific error cases
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      return NextResponse.json({
        error: authError.message || "Registration failed",
        details: authError
      }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    // Profile is automatically created by the database trigger handle_new_user()
    // No need to manually create it here

    // Return success response with user data
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: authData.user.user_metadata?.first_name,
        lastName: authData.user.user_metadata?.last_name,
        fullName: authData.user.user_metadata?.full_name,
      },
    });
  } catch (error) {
    console.error("Registration catch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during registration",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
