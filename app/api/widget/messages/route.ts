// 🔧 FIXED WIDGET MESSAGES API - CAMPFIRE V2
// Updated to use unified types and proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { mapApiMessageToDbInsert, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';
import { getSharedConversationChannel } from '@/lib/services/shared-conversation-service';
// Define the request type inline
interface MessageCreateRequest {
  conversationId: string;
  content: string;
  senderType?: string;
  senderId?: string;
  senderName?: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = searchParams.get('organizationId');

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Conversation ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Use service client for widget operations to ensure access
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get messages for the conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Map database records to API format
    const mappedMessages = mapDbMessagesToApi(messages || []);

    return NextResponse.json({
      messages: mappedMessages,
      count: mappedMessages.length,
    });

  } catch (error) {
    console.error('Widget messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID header is required' },
        { status: 400 }
      );
    }

    const body: MessageCreateRequest = await request.json().catch(() => ({}));

    // Validate required fields
    if (!body.content || !body.conversationId) {
      return NextResponse.json(
        { error: 'Content and conversation ID are required' },
        { status: 400 }
      );
    }

    // Use service client for widget operations to ensure access
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Prepare message data
    const messageData = mapApiMessageToDbInsert({
      conversation_id: body.conversationId,
      content: body.content,
      senderType: body.senderType || 'visitor',
      senderId: body.senderId,
      senderName: body.senderName || null,
      message_type: body.messageType || 'text',
      metadata: body.metadata || {},
    }, organizationId);

    console.log('[Widget Messages API] Inserting message data:', JSON.stringify(messageData, null, 2));

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('[Widget Messages API] Database error:', error);
      console.error('[Widget Messages API] Message data that failed:', JSON.stringify(messageData, null, 2));
      return NextResponse.json(
        { error: 'Failed to create message', details: error.message },
        { status: 500 }
      );
    }

    // Update conversation's last message timestamp - FIXED: Use snake_case column names
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        lastMessageAt: new Date().toISOString(), // FIXED: snake_case to match dashboard query
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.conversationId);

    if (updateError) {
      console.error('Failed to update conversation timestamp:', updateError);
      // Don't fail the request, just log the error
    }

    // Map to API format
    const mappedMessage = mapDbMessagesToApi([message])[0];

    // CRITICAL FIX: Broadcast message to real-time channels for dashboard and other widgets
    try {
      // Import the standardized broadcast function
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      const { UNIFIED_CHANNELS, UNIFIED_EVENTS } = await import('@/lib/realtime/unified-channel-standards');

      const messagePayload = {
        message: mappedMessage,
        conversationId: body.conversationId,
        organizationId,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel (for dashboard agents viewing this conversation)
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, body.conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      // Broadcast to organization channel (for conversation list updates)
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(organizationId),
        UNIFIED_EVENTS.CONVERSATION_UPDATED,
        {
          conversationId: body.conversationId,
          organizationId,
          lastMessage: mappedMessage,
          timestamp: new Date().toISOString(),
          source: 'widget'
        }
      );

      // Broadcast to conversations channel for dashboard conversation list updates
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

    // Log shared conversation channel for debugging
    const sharedChannel = getSharedConversationChannel(organizationId, body.conversationId);
    console.log('[Widget Messages API] Message created for shared channel:', sharedChannel);

    return NextResponse.json({
      message: mappedMessage,
      success: true,
      channel: sharedChannel, // Include channel info for real-time sync
    });

  } catch (error) {
    console.error('Widget message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}