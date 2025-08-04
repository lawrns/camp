import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Enhanced Messages API with pagination and AI metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const organizationId = searchParams.get('organization_id');
    const cursor = searchParams.get('cursor'); // For pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const senderType = searchParams.get('sender_type'); // Filter by sender type

    // Validate required parameters
    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversation_id, organization_id' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseClient = supabase.admin();

    // Build query with pagination and filtering
    let query = supabaseClient
      .from('messages')
      .select(`
        id,
        conversation_id,
        organization_id,
        content,
        sender_type,
        sender_name,
        created_at,
        updated_at,
        read_status,
        metadata,
        attachments,
        ai_sessions!inner(
          id,
          ai_model,
          ai_persona,
          confidence_threshold,
          session_metadata
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add cursor-based pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Add sender type filter
    if (senderType) {
      query = query.eq('senderType', senderType);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Messages API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Prepare pagination metadata
    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].created_at : null;

    // Enhance messages with AI metadata
    const enhancedMessages = messages.map(message => ({
      ...message,
      ai_enhanced: message.ai_sessions?.length > 0,
      ai_metadata: message.ai_sessions?.[0] || null,
      is_ai_generated: message.senderType === 'ai',
      confidence_score: message.ai_sessions?.[0]?.sessionMetadata?.confidence_score || null
    }));

    return NextResponse.json({
      messages: enhancedMessages,
      pagination: {
        hasMore,
        nextCursor,
        limit,
        total: messages.length
      },
      filters: {
        conversationId,
        organizationId,
        senderType
      }
    });

  } catch (error) {
    console.error('[Messages API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method for creating messages with AI metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversation_id,
      organization_id,
      content,
      sender_type,
      sender_name,
      metadata,
      ai_session_id
    } = body;

    // Validate required fields
    if (!conversation_id || !organization_id || !content || !sender_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase.admin();

    // Create message with AI metadata
    const { data: message, error } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id,
        organization_id,
        content,
        senderType,
        senderName: sender_name || (sender_type === 'ai' ? 'AI Assistant' : 'User'),
        metadata: {
          ...metadata,
          ai_session_id,
          created_via: 'api',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[Messages API] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // If this is an AI message, update the AI session
    if (sender_type === 'ai' && ai_session_id) {
      await supabaseClient
        .from('ai_sessions')
        .update({
          updated_at: new Date().toISOString(),
          sessionMetadata: {
            last_message_id: message.id,
            last_response_at: new Date().toISOString()
          }
        })
        .eq('id', ai_session_id);
    }

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        ai_enhanced: !!ai_session_id,
        is_ai_generated: sender_type === 'ai'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Messages API] Create unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
