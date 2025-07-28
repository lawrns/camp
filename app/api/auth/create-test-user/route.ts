import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password required",
        },
        { status: 400 }
      );
    }

    const adminClient = supabase.admin();
    if (!adminClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers.users.find((u) => u.email === email);

    let user;
    if (existingUser) {

      // Update existing user's password
      const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: password,
        email_confirm: true,
      });

      if (updateError) {
        throw updateError;
      }

      user = updateData.user;
    } else {

      // Create new user
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (createError) {
        throw createError;
      }

      user = createData.user;
    }

    // Ensure user is in an organization
    const { data: membership } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {

      // Add to the organization with conversations
      const { error: membershipError } = await adminClient.from("organization_members").insert({
        user_id: user.id,
        organization_id: "b5e80170-004c-4e82-a88c-3e2166b169dd", // Organization with 1047 conversations
        role: "admin",
        status: "active",
      });

      if (membershipError) {

      }
    }

    return NextResponse.json({
      success: true,
      message: "Test user created/updated successfully",
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to create test user",
      },
      { status: 500 }
    );
  }
}
