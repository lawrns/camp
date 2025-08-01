// 🔧 FIXED WIDGET CONVERSATIONS API - CAMPFIRE V2
// Updated to use unified types and proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapApiConversationToDbInsert, mapDbConversationsToApi } from '@/lib/utils/db-type-mappers';
import type { ConversationCreateRequest } from '@/types/unified';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Get conversations for the organization
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Map database records to API format
    const mappedConversations = mapDbConversationsToApi(conversations || []);

    return NextResponse.json({
      conversations: mappedConversations,
      count: mappedConversations.length,
    });

  } catch (error) {
    console.error('Widget conversations API error:', error);
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

    const body: ConversationCreateRequest = await request.json();

    // Validate required fields
    if (!body.customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Prepare conversation data
    const conversationData = mapApiConversationToDbInsert({
      organization_id: organizationId,
      customer_email: body.customerEmail,
      customer_name: body.customerName || 'Anonymous User',
      subject: body.subject,
      status: 'open',
      priority: 'medium',
      metadata: body.metadata || {},
    });

    // Insert conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // Map to API format
    const mappedConversation = mapDbConversationsToApi([conversation])[0];

    // If there's an initial message, create it
    if (body.initialMessage) {
      const messageData = {
        conversation_id: conversation.id,
        organization_id: organizationId,
        content: body.initialMessage,
        sender_type: 'visitor',
        message_type: 'text',
        metadata: {},
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('Failed to create initial message:', messageError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      conversation: mappedConversation,
      success: true,
    });

  } catch (error) {
    console.error('Widget conversation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
