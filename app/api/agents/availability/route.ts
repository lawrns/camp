import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
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

    // Get all agents in the organization
    const { data: agents, error } = await supabase
      .from('profiles')
      .select(`
        id,
        fullName,
        email,
        avatar_url,
        role
      `)
      .eq('organization_id', profile.organization_id)
      .in('role', ['admin', 'agent'])
      .order('fullName');

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Transform agents data with availability info
    const agentsWithAvailability = (agents || []).map(agent => ({
      user_id: agent.id,
      fullName: agent.fullName || agent.email,
      email: agent.email,
      avatar_url: agent.avatar_url,
      workload: 0, // TODO: Calculate actual workload
      capacity: 10, // TODO: Get from user preferences
      available: true, // TODO: Check actual availability
      status: 'available' as const // TODO: Get from presence system
    }));

    return NextResponse.json({
      agents: agentsWithAvailability,
      organizationId: profile.organization_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agents availability API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}