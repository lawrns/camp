import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Add tags to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { tag } = body;

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json(
        { error: 'Tag is required and must be a string' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase.admin();

    // Get current tags
    const { data: conversation, error: fetchError } = await supabaseClient
      .from('conversations')
      .select('tags')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const currentTags = conversation.tags || [];
    const normalizedTag = tag.trim().toLowerCase();

    // Check if tag already exists
    if (currentTags.includes(normalizedTag)) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      );
    }

    // Add new tag
    const updatedTags = [...currentTags, normalizedTag];

    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({ 
        tags: updatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to add tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tags: updatedTags
    });

  } catch (error) {
    console.error('[Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove tag from conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag parameter is required' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase.admin();

    // Get current tags
    const { data: conversation, error: fetchError } = await supabaseClient
      .from('conversations')
      .select('tags')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const currentTags = conversation.tags || [];
    const normalizedTag = tag.trim().toLowerCase();

    // Remove tag
    const updatedTags = currentTags.filter((t: string) => t !== normalizedTag);

    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({ 
        tags: updatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tags: updatedTags
    });

  } catch (error) {
    console.error('[Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation tags
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabaseClient = supabase.admin();

    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .select('tags')
      .eq('id', conversationId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tags: conversation.tags || []
    });

  } catch (error) {
    console.error('[Tags API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
