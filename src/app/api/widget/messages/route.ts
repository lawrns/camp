import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { mapDbMessageToApi, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';

// Simplified optional auth wrapper for widget endpoints
async function withOptionalAuth(handler: (req: NextRequest, user?: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Try to get authentication, but don't require it
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      let user = undefined;
      if (!authError && session) {
        const organizationId = session.user.user_metadata?.organization_id;
        if (organizationId) {
          user = {
            userId: session.user.id,
            organizationId,
            email: session.user.email
          };
        }
      }

      return await handler(request, user);
    } catch (error) {
      console.error('[Auth Error]:', error);
      return await handler(request, undefined);
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = request.headers.get('x-organization-id');

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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, senderEmail, senderName, senderType = 'customer' } = body;
    const organizationId = request.headers.get('x-organization-id');

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
      // Broadcast to conversation-specific channel (for selected conversation)
      const conversationChannel = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
      const convChannel = supabaseClient.channel(conversationChannel);
      await convChannel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.MESSAGE_CREATED,
        payload: {
          message,
          conversationId,
          organizationId,
          timestamp: new Date().toISOString(),
        }
      });

      // Broadcast to organization channel (for conversation list updates)
      const orgChannel = UNIFIED_CHANNELS.organization(organizationId);
      const organizationChannel = supabaseClient.channel(orgChannel);
      await organizationChannel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.CONVERSATION_UPDATED,
        payload: {
          conversationId,
          organizationId,
          lastMessage: message,
          timestamp: new Date().toISOString(),
        }
      });

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
}