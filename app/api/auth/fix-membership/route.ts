import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/auth/fix-membership
 * 
 * Public endpoint to fix organization membership issues for authenticated users
 * This endpoint can be called when users have auth tokens but missing organization memberships
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get user from multiple sources
    let user = null;
    let userSource = "none";

    // Method 1: Try cookies
    try {
      const cookieStore = await cookies();
      const supabaseClient = supabase.server(cookieStore);
      const { data: { user: cookieUser }, error: cookieError } = await supabaseClient.auth.getUser();
      
      if (cookieUser && !cookieError) {
        user = cookieUser;
        userSource = "cookies";
      }
    } catch (e) {
      console.log("[FixMembership] Cookie auth failed:", e);
    }

    // Method 2: Try Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.admin().auth.getUser(token);
          if (tokenUser && !tokenError) {
            user = tokenUser;
            userSource = "token";
          }
        } catch (e) {
          console.log("[FixMembership] Token auth failed:", e);
        }
      }
    }

    // Method 3: Try to extract from request body (for cases where token is passed in body)
    if (!user) {
      try {
        const body = await request.json();
        if (body.access_token) {
          const { data: { user: bodyUser }, error: bodyError } = await supabase.admin().auth.getUser(body.access_token);
          if (bodyUser && !bodyError) {
            user = bodyUser;
            userSource = "body";
          }
        }
      } catch (e) {
        // Body parsing failed, continue
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No authenticated user found",
        suggestion: "Please ensure you are logged in and try again"
      }, { status: 401 });
    }

    console.log(`[FixMembership] Found user ${user.id} via ${userSource}`);

    const supabaseAdmin = supabase.admin();
    const fixes = [];

    // Check if user has any organization membership
    const { data: existingMembership } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!existingMembership) {
      console.log(`[FixMembership] User ${user.id} has no organization membership, creating one`);

      // Get the first available organization or create a default one
      let { data: firstOrg } = await supabaseAdmin
        .from("organizations")
        .select("id, name")
        .eq("status", "active")
        .limit(1)
        .single();

      if (!firstOrg) {
        // Create a default organization
        const { data: newOrg, error: createOrgError } = await supabaseAdmin
          .from("organizations")
          .insert({
            name: "Default Organization",
            slug: "default-org",
            status: "active",
            settings: {}
          })
          .select("id, name")
          .single();

        if (createOrgError) {
          throw new Error(`Failed to create default organization: ${createOrgError.message}`);
        }

        firstOrg = newOrg;
        fixes.push(`Created default organization: ${firstOrg.name}`);
      }

      // Create membership for the user
      const { error: membershipError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          user_id: user.id,
          organization_id: firstOrg.id,
          role: "admin", // Make them admin of their first org
          status: "active"
        });

      if (membershipError) {
        throw new Error(`Failed to create membership: ${membershipError.message}`);
      }

      fixes.push(`Created organization membership: ${firstOrg.name} (admin)`);

      // Update user metadata with organization ID
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          organization_id: firstOrg.id
        }
      });

      if (updateError) {
        console.warn("[FixMembership] Failed to update user metadata:", updateError.message);
      } else {
        fixes.push("Updated user metadata with organization ID");
      }
    } else {
      fixes.push("User already has organization membership");
    }

    // Ensure user has a profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
          organization_id: user.user_metadata?.organization_id
        });

      if (profileError) {
        console.warn("[FixMembership] Failed to create profile:", profileError.message);
      } else {
        fixes.push("Created user profile");
      }
    }

    return NextResponse.json({
      success: true,
      fixes,
      user: {
        id: user.id,
        email: user.email,
        organization_id: user.user_metadata?.organization_id
      },
      message: fixes.length > 0 ? "Organization membership issues fixed" : "No issues found"
    });

  } catch (error) {
    console.error("[FixMembership] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fix organization membership",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/fix-membership
 * Check membership status without making changes
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message
      });
    }

    const supabaseAdmin = supabase.admin();

    // Check memberships
    const { data: memberships } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role, status")
      .eq("user_id", user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        organization_id: user.user_metadata?.organization_id
      },
      memberships: memberships || [],
      needsFix: !memberships || memberships.length === 0
    });

  } catch (error) {
    return NextResponse.json({
      error: "Failed to check membership status",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
