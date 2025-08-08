import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Use service client for agent availability
    const supabase = getServiceClient();

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
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
      .eq('organization_id', organizationId)
      .in('role', ['admin', 'agent'])
      .order('fullName');

    if (error) {
      console.error('Error fetching agents:', error);
      console.error('Query details:', {
        organizationId: organizationId,
        error: error.message
      });
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      );
    }

    // CRITICAL-003 FIX: Transform agents data with real availability info
    const agentsWithAvailability = (agents || []).map((agent: {
      user_id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
      role: string;
      status: string | null;
      current_chat_count: number | null;
      max_concurrent_chats: number | null;
      is_online: boolean | null;
      last_seen_at: string | null;
    }) => {
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
      organizationId: organizationId,
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