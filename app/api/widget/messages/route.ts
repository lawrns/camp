import { NextRequest, NextResponse } from 'next/server';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase';
import { mapDbMessageToApi, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';

// Widget authentication using unified Supabase sessions

export const GET = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = getOrganizationId(request, auth);

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client to bypass RLS for widget operations
    const supabaseClient = supabase.admin();

    // Get messages with proper organization context and correct field names
    const { data: messages, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Widget Messages API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Convert snake_case database response to camelCase API response
    const apiMessages = mapDbMessagesToApi(messages || []);
    return NextResponse.json(apiMessages);

  } catch (error) {
    console.error('[Widget Messages API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const body = await request.json();
    const { conversationId, content, senderEmail, senderName, senderType = 'customer' } = body;
    const organizationId = getOrganizationId(request, auth);

    // Validate required fields
    if (!conversationId || !content || !organizationId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['conversationId', 'content', 'organizationId'],
            provided: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client to bypass RLS for widget operations
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create message with proper organization context and correct column names
    const { data: message, error } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        content,
        sender_email: senderEmail,
        sender_name: senderName,
        sender_type: senderType === 'customer' ? 'visitor' : senderType, // Map customer to visitor
        metadata: {
          source: 'widget',
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[Widget Messages API] Creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create message', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast message to real-time channels for agent dashboard
    try {
      // Use the standardized broadcast function for consistent real-time communication
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      const messagePayload = {
        message,
        conversationId,
        organizationId,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel (for agents viewing this conversation)
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      // Broadcast to organization channel (for conversation list updates)
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(organizationId),
        UNIFIED_EVENTS.CONVERSATION_UPDATED,
        {
          conversationId,
          organizationId,
          lastMessage: message,
          timestamp: new Date().toISOString(),
          source: 'widget'
        }
      );

      // Also broadcast to conversations channel for dashboard conversation list updates
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversations(organizationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      console.log('[Widget Messages API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Widget Messages API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

    // Convert snake_case database response to camelCase API response
    const apiMessage = mapDbMessageToApi(message);
    return NextResponse.json(apiMessage, { status: 201 });

  } catch (error) {
    console.error('[Widget Messages API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});