import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // FIXED: Check if request has body before parsing
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json(
        { error: 'No body provided' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role, status')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not a member of this organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update user's profile with current organization
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user organization' },
        { status: 500 }
      );
    }

    // Set organization cookie for client-side access
    const cookieStore = await cookies();
    cookieStore.set('current-organization', organizationId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    // Get user's organizations for context
    const { data: userOrganizations, error: userOrgsError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (userOrgsError) {
      console.error('Error fetching user organizations:', userOrgsError);
    }

    const response = {
      success: true,
      message: 'Organization set successfully',
      data: {
        currentOrganization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: membership.role
        },
        userOrganizations: userOrganizations?.map(org => ({
          id: org.organizations.id,
          name: org.organizations.name,
          slug: org.organizations.slug,
          role: org.role
        })) || []
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Set organization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user's current organization from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let currentOrganization = null;
    if (profile?.organization_id) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', profile.organization_id)
        .single();

      if (!orgError && org) {
        // Get user's role in this organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', org.id)
          .eq('status', 'active')
          .single();

        currentOrganization = {
          ...org,
          role: membership?.role || 'member'
        };
      }
    }

    // Get all user's organizations
    const { data: userOrganizations, error: userOrgsError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (userOrgsError) {
      console.error('Error fetching user organizations:', userOrgsError);
      return NextResponse.json(
        { error: 'Failed to fetch user organizations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      currentOrganization,
      userOrganizations: userOrganizations?.map(org => ({
        id: org.organizations.id,
        name: org.organizations.name,
        slug: org.organizations.slug,
        role: org.role
      })) || []
    });

  } catch (error) {
    console.error('Get organization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to set organization.' },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
