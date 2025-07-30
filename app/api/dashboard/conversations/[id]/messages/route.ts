import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { mapDbMessageToApi, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';

// Authentication wrapper for dashboard endpoints
async function withAuth(handler: (req: NextRequest, user: any, conversationId: string) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });

      // Require authentication for dashboard endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      if (authError || !session) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization not found', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const user = {
        userId: session.user.id,
        organizationId,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email
      };

      return await handler(request, user, params.id);
    } catch (error) {
      console.error('[Dashboard Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize Supabase client
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to user's organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organizationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch messages for the conversation
    const { data: messages, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Dashboard Messages API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Convert snake_case database response to camelCase API response
    const apiMessages = mapDbMessagesToApi(messages || []);
    return NextResponse.json({
      messages: apiMessages,
      pagination: {
        limit,
        offset,
        total: apiMessages.length,
        hasMore: apiMessages.length === limit
      }
    });

  } catch (error) {
    console.error('[Dashboard Messages API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    const body = await request.json();
    const { content, senderType = 'operator' } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to user's organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organizationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create message with agent context
    const { data: message, error } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: user.organizationId,
        content: content.trim(),
        sender_email: user.email,
        sender_name: user.name,
        sender_type: senderType,
        sender_id: user.userId,
        metadata: {
          source: 'dashboard',
          timestamp: new Date().toISOString(),
          agent_id: user.userId,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[Dashboard Messages API] Creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create message', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast message to real-time channels for widget and other agents
    try {
      // Use the standardized broadcast function for consistent real-time communication
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      const messagePayload = {
        message,
        conversationId,
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      };

      // Broadcast to conversation-specific channel (for widget and other agents viewing this conversation)
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(user.organizationId, conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      // Broadcast to organization channel (for conversation list updates)
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(user.organizationId),
        UNIFIED_EVENTS.CONVERSATION_UPDATED,
        {
          conversationId,
          organizationId: user.organizationId,
          lastMessage: message,
          timestamp: new Date().toISOString(),
          source: 'dashboard'
        }
      );

      // Broadcast to widget channel for bidirectional communication
      await broadcastToChannel(
        UNIFIED_CHANNELS.widget(user.organizationId, conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      // Broadcast to conversations channel for dashboard conversation list updates
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversations(user.organizationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      console.log('[Dashboard Messages API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Dashboard Messages API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

    // Update conversation's last activity
    try {
      await supabaseClient
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('organization_id', user.organizationId);
    } catch (updateError) {
      console.error('[Dashboard Messages API] Conversation update failed:', updateError);
      // Don't fail the request if conversation update fails
    }

    // Convert snake_case database response to camelCase API response
    const apiMessage = mapDbMessageToApi(message);
    return NextResponse.json(apiMessage, { status: 201 });

  } catch (error) {
    console.error('[Dashboard Messages API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
