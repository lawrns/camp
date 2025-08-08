import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from user metadata or membership
    let organizationId = session.user.user_metadata?.organization_id;
    
    if (!organizationId) {
      const { data: membership } = await supabaseClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();
      
      if (membership) {
        organizationId = membership.organization_id;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch team members from organization_members table
    const { data: members, error } = await supabaseClient
      .from('organization_members')
      .select(`
        user_id,
        role,
        status,
        profiles!inner(
          id,
          email,
          full_name,
          avatar_url,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    const teamMembers = members?.map(member => ({
      id: member.user_id,
      name: member.profiles.full_name,
      email: member.profiles.email,
      avatar: member.profiles.avatar_url,
      role: member.role,
      status: member.profiles.status || 'offline',
      department: member.role // Use role as department for now
    })) || [];

    return NextResponse.json({
      success: true,
      data: teamMembers
    });

  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 