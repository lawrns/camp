import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      // Get user's organization if not provided
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.organization_id) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 403 }
        );
      }
    }

    const targetOrgId = organizationId || session.user.id;

    // Get all agents in the organization
    const { data: agents, error } = await supabase
      .from('profiles')
      .select(`
        id,
        fullName,
        email,
        avatar_url,
        role,
        organization_id
      `)
      .eq('organization_id', targetOrgId)
      .in('role', ['admin', 'agent'])
      .order('fullName');

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Transform agents data
    const transformedAgents = (agents || []).map(agent => ({
      id: agent.id,
      user_id: agent.id,
      fullName: agent.fullName || agent.email,
      email: agent.email,
      avatar_url: agent.avatar_url,
      role: agent.role,
      workload: 0, // TODO: Calculate actual workload
      capacity: 10, // TODO: Get from user preferences
      available: true, // TODO: Check actual availability
      status: 'available' as const // TODO: Get from presence system
    }));

    return NextResponse.json({
      success: true,
      agents: transformedAgents,
      organizationId: targetOrgId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
