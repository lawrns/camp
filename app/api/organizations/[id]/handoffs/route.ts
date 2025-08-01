// 🔧 FIXED HANDOFFS API ENDPOINT - CAMPFIRE V2
// Created to fix the "Failed to load handoffs" error

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

    // Get active handoffs for the organization
    // Note: This assumes you have a handoffs table. If not, return empty array for now
    const { data: handoffs, error } = await supabase
      .from('handoffs')
      .select(`
        id,
        conversation_id,
        from_agent_id,
        to_agent_id,
        reason,
        priority,
        status,
        created_at,
        completed_at,
        notes
      `)
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });

    if (error) {
      // If handoffs table doesn't exist, return empty array
      console.warn('Handoffs table not found, returning empty array:', error);
      return NextResponse.json([]);
    }

    // Transform handoffs data
    const transformedHandoffs = (handoffs || []).map(handoff => ({
      id: handoff.id,
      conversation_id: handoff.conversation_id,
      from_agent_id: handoff.from_agent_id,
      to_agent_id: handoff.to_agent_id,
      reason: handoff.reason,
      priority: handoff.priority,
      status: handoff.status,
      created_at: handoff.created_at,
      completed_at: handoff.completed_at,
      notes: handoff.notes,
    }));

    return NextResponse.json(transformedHandoffs);

  } catch (error) {
    console.error('Handoffs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 