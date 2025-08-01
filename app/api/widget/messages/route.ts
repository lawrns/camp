// 🔧 FIXED WIDGET MESSAGES API - CAMPFIRE V2
// Updated to use unified types and proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapApiMessageToDbInsert, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';
import type { MessageCreateRequest } from '@/types/unified';

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

    // Create Supabase client
    const supabase = await createClient();

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

    const body: MessageCreateRequest = await request.json();

    // Validate required fields
    if (!body.content || !body.conversationId) {
      return NextResponse.json(
        { error: 'Content and conversation ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Prepare message data
    const messageData = mapApiMessageToDbInsert({
      conversation_id: body.conversationId,
      content: body.content,
      sender_type: body.senderType || 'visitor',
      sender_id: body.senderId,
      sender_name: body.senderName || null,
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

    // Update conversation's last message timestamp
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.conversationId);

    if (updateError) {
      console.error('Failed to update conversation timestamp:', updateError);
      // Don't fail the request, just log the error
    }

    // Map to API format
    const mappedMessage = mapDbMessagesToApi([message])[0];

    return NextResponse.json({
      message: mappedMessage,
      success: true,
    });

  } catch (error) {
    console.error('Widget message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}