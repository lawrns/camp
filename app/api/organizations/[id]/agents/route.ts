// 🔧 FIXED AGENTS API ENDPOINT - CAMPFIRE V2
// Created to fix the "Failed to load agents" error

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user belongs to the organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.organization_id || profile.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Get all agents in the organization
    const { data: agents, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .in('role', ['admin', 'agent'])
      .order('full_name');

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Transform agents data with availability info
    const agentsWithAvailability = (agents || []).map(agent => ({
      id: agent.id,
      name: agent.full_name || agent.email,
      email: agent.email,
      avatar: agent.avatar_url,
      role: agent.role,
      status: 'online' as const, // TODO: Get from presence system
      skills: [], // TODO: Get from user preferences
      capacity: 10, // TODO: Get from user preferences
      current_conversations: 0, // TODO: Calculate actual count
      max_conversations: 10, // TODO: Get from user preferences
      response_time_avg: 5, // TODO: Calculate actual average
      satisfaction_score: 4.5, // TODO: Calculate actual score
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }));

    return NextResponse.json(agentsWithAvailability);

  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 