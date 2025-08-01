import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent', 'critical'] as const;
type Priority = typeof VALID_PRIORITIES[number];

// Update conversation priority
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { priority } = body;

    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { 
          error: 'Invalid priority', 
          validPriorities: VALID_PRIORITIES 
        },
        { status: 400 }
      );
    }

    const supabaseClient = supabase.admin();

    // Update conversation priority
    const { data: conversation, error: updateError } = await supabaseClient
      .from('conversations')
      .update({ 
        priority: priority as Priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select('id, priority, updated_at')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      console.error('[Priority API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update priority' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        priority: conversation.priority,
        updatedAt: conversation.updated_at
      }
    });

  } catch (error) {
    console.error('[Priority API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation priority
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabaseClient = supabase.admin();

    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .select('id, priority')
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
        { error: 'Failed to fetch priority' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: conversation.id,
      priority: conversation.priority,
      validPriorities: VALID_PRIORITIES
    });

  } catch (error) {
    console.error('[Priority API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
