import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { mapDbMessageToApi, mapDbMessagesToApi } from '@/lib/utils/db-type-mappers';

// Custom cookie parser that handles both base64 and JSON formats
function createCompatibleCookieStore() {
  const cookieStore = cookies();

  return {
    get: (name: string) => {
      const cookie = cookieStore.get(name);
      if (!cookie) return undefined;

      let value = cookie.value;

      // Handle base64-encoded cookies
      if (typeof value === 'string' && value.startsWith('base64-')) {
        try {
          const base64Content = value.substring(7); // Remove 'base64-' prefix
          const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
          console.log('[Dashboard Auth] Decoded base64 cookie:', name, 'decoded length:', decoded.length);
          value = decoded; // Keep as string, let Supabase parse it
        } catch (error) {
          console.warn('[Dashboard Auth] Failed to decode base64 cookie:', name, error);
          return undefined;
        }
      }

      return { name: cookie.name, value };
    },
    getAll: () => {
      return cookieStore.getAll().map(cookie => {
        let value = cookie.value;

        // Handle base64-encoded cookies
        if (typeof value === 'string' && value.startsWith('base64-')) {
          try {
            const base64Content = value.substring(7);
            const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
            value = decoded; // Keep as string, let Supabase parse it
          } catch (error) {
            console.warn('[Dashboard Auth] Failed to decode base64 cookie:', cookie.name, error);
          }
        }

        return { ...cookie, value };
      });
    },
    set: cookieStore.set?.bind(cookieStore),
    delete: cookieStore.delete?.bind(cookieStore)
  };
}

// Authentication wrapper for dashboard endpoints (FIXED: removed async from function declaration)
function withAuth(handler: (req: NextRequest, user: any, conversationId: string) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      console.log('[Dashboard withAuth] Starting authentication for conversation:', params.id);

      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

      console.log('[Dashboard withAuth] Supabase client created with compatible cookie store, getting session...');

      // Require authentication for dashboard endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

      console.log('[Dashboard withAuth] Session result:', {
        hasSession: !!session,
        hasError: !!authError,
        userId: session?.user?.id,
        errorMessage: authError?.message
      });

      if (authError || !session) {
        console.log('[Dashboard withAuth] Authentication failed');
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      console.log('[Dashboard withAuth] Organization ID:', organizationId);

      if (!organizationId) {
        console.log('[Dashboard withAuth] No organization ID found');
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

      console.log('[Dashboard withAuth] Calling handler with user:', {
        userId: user.userId,
        organizationId: user.organizationId,
        email: user.email
      });

      const result = await handler(request, user, params.id);
      console.log('[Dashboard withAuth] Handler completed successfully');
      return result;
    } catch (error) {
      console.error('[Dashboard Auth Error]:', error);
      console.error('[Dashboard Auth Error] Stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    console.log('[Dashboard Messages API] Starting request for conversation:', conversationId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[Dashboard Messages API] Query params:', { limit, offset });

    // Initialize Supabase client with error handling
    let supabaseClient;
    try {
      supabaseClient = supabase.admin();
      console.log('[Dashboard Messages API] Supabase client initialized');
    } catch (clientError) {
      console.error('[Dashboard Messages API] Failed to initialize Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DATABASE_CONNECTION_ERROR' },
        { status: 500 }
      );
    }

    // Verify conversation exists and belongs to user's organization
    console.log('[Dashboard Messages API] Checking conversation access for user:', user.organizationId);

    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organizationId)
      .single();

    if (conversationError || !conversation) {
      console.log('[Dashboard Messages API] Conversation not found or access denied:', {
        conversationId,
        organizationId: user.organizationId,
        error: conversationError
      });
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.log('[Dashboard Messages API] Conversation access verified');

    // Fetch messages for the conversation
    console.log('[Dashboard Messages API] Fetching messages...');

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

    console.log('[Dashboard Messages API] Messages fetched:', messages?.length || 0);

    // Convert snake_case database response to camelCase API response
    let apiMessages;
    try {
      apiMessages = mapDbMessagesToApi(messages || []);
      console.log('[Dashboard Messages API] Messages mapped successfully');
    } catch (mappingError) {
      console.error('[Dashboard Messages API] Message mapping error:', mappingError);
      return NextResponse.json(
        { error: 'Failed to process messages', code: 'PROCESSING_ERROR' },
        { status: 500 }
      );
    }

    const response = {
      messages: apiMessages,
      pagination: {
        limit,
        offset,
        total: apiMessages.length,
        hasMore: apiMessages.length === limit
      }
    };

    console.log('[Dashboard Messages API] Returning response with', apiMessages.length, 'messages');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Dashboard Messages API] Unexpected error:', error);
    console.error('[Dashboard Messages API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
