import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // CRITICAL-003 FIX: Enhanced authentication handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check for Authorization header (for API clients)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // Not needed for API access
      });
    }

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('[AgentAvailability] Authentication failed:', sessionError?.message);
      return NextResponse.json(
        { error: 'Unauthorized', details: sessionError?.message },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 }
      );
    }

    // CRITICAL-003 FIX: Get all agents with enhanced presence data
    const { data: agents, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        email,
        avatar_url,
        role,
        status,
        current_chat_count,
        max_concurrent_chats,
        is_online,
        last_seen_at
      `)
      .eq('organization_id', profile.organization_id)
      .in('role', ['admin', 'agent'])
      .order('full_name');

    if (error) {
      console.error('Error fetching agents:', error);
      console.error('Query details:', {
        organizationId: profile.organization_id,
        userId: session.user.id,
        error: error.message
      });
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      );
    }

    // CRITICAL-003 FIX: Transform agents data with real availability info
    const agentsWithAvailability = (agents || []).map((agent: any) => {
      // Calculate actual workload based on current chat count
      const workload = agent.current_chat_count || 0;
      const capacity = agent.max_concurrent_chats || 10;
      const isAvailable = workload < capacity && agent.is_online;

      // Determine status based on presence and workload
      let status: 'available' | 'busy' | 'away' | 'offline' = 'offline';
      if (agent.is_online) {
        if (workload >= capacity) {
          status = 'busy';
        } else if (workload > 0) {
          status = 'available'; // Online with some chats
        } else {
          status = 'available'; // Online with no chats
        }
      } else {
        // Check if recently seen (within 5 minutes)
        const lastSeen = agent.last_seen_at ? new Date(agent.last_seen_at) : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        status = lastSeen && lastSeen > fiveMinutesAgo ? 'away' : 'offline';
      }

      return {
        user_id: agent.user_id,
        fullName: agent.full_name || agent.email || 'Unknown Agent',
        email: agent.email,
        avatar_url: agent.avatar_url,
        workload,
        capacity,
        available: isAvailable,
        status,
        is_online: agent.is_online,
        last_seen_at: agent.last_seen_at,
        current_chat_count: agent.current_chat_count,
        max_concurrent_chats: agent.max_concurrent_chats
      };
    });

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