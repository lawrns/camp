import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';

const VALID_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed', 'snoozed'] as const;
type Status = typeof VALID_STATUSES[number];

// Update conversation status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status', 
          validStatuses: VALID_STATUSES 
        },
        { status: 400 }
      );
    }

    const supabaseClient = supabase.admin();

    // Prepare update data
    const updateData: unknown = {
      status: status as Status,
      updated_at: new Date().toISOString()
    };

    // Set closed_at timestamp if status is closed or resolved
    if (status === 'closed' || status === 'resolved') {
      updateData.closedAt = new Date().toISOString();
    } else {
      updateData.closedAt = null;
    }

    // Update conversation status
    const { data: conversation, error: updateError } = await supabaseClient
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select('id, status, closedAt, updated_at')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      console.error('[Status API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        status: conversation.status,
        closedAt: conversation.closedAt,
        updatedAt: conversation.updated_at
      }
    });

  } catch (error) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabaseClient = supabase.admin();

    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .select('id, status, closedAt')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: conversation.id,
      status: conversation.status,
      closedAt: conversation.closedAt,
      validStatuses: VALID_STATUSES
    });

  } catch (error) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
