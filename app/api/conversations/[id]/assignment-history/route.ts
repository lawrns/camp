import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const conversationId = params.id;
    
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

    // Verify conversation belongs to the organization
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // For now, return empty assignment history since we don't have an assignment_history table
    // TODO: Create assignment_history table and implement proper tracking
    const assignmentHistory = [];

    // Get current assignment from conversation
    const { data: currentConversation } = await supabase
      .from('conversations')
      .select(`
        assigned_to_user_id,
        assigned_at,
        profiles!conversations_assigned_to_user_id_fkey(
          user_id,
          full_name,
          email
        )
      `)
      .eq('id', conversationId)
      .single();

    if (currentConversation?.assigned_to_user_id) {
      assignmentHistory.push({
        id: `current-${conversationId}`,
        conversation_id: conversationId,
        assigned_to_user_id: currentConversation.assigned_to_user_id,
        assigned_by_user_id: null, // TODO: Track who made the assignment
        assigned_at: currentConversation.assigned_at || new Date().toISOString(),
        unassigned_at: null,
        reason: 'Current assignment',
        agent: Array.isArray(currentConversation.profiles) 
          ? currentConversation.profiles[0] 
          : currentConversation.profiles
      });
    }

    return NextResponse.json({
      assignmentHistory,
      conversationId,
      organizationId: profile.organization_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Assignment history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}