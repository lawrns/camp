import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseFactory } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Authentication wrapper for dashboard endpoints
async function withAuth(handler: (req: NextRequest, user: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = supabaseFactory.server(cookieStore);

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

      return await handler(request, user);
    } catch (error) {
      console.error('[Dashboard Typing Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: unknown) => {
  try {
    const body = await request.json();
    const { 
      conversationId, 
      isTyping, 
      content = null 
    } = body;

    // Validate required parameters
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: conversationId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'isTyping must be a boolean', code: 'VALIDATION_ERROR' },
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

    // Update or create typing indicator in database
    const typingData = {
      conversation_id: conversationId,
      organization_id: user.organizationId,
      user_id: user.userId,
      userName: user.name,
      senderType: 'operator',
      isTyping: isTyping,
      content: content,
      updated_at: new Date().toISOString(),
    };

    if (isTyping) {
      // Create or update typing indicator
      const { data: typingIndicator, error: typingError } = await supabaseClient
        .from('typing_indicators')
        .upsert(typingData, {
          onConflict: 'conversation_id,user_id'
        })
        .select()
        .single();

      if (typingError) {
        console.error('[Dashboard Typing API] Database error:', typingError);
        return NextResponse.json(
          { error: 'Failed to update typing indicator', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }
    } else {
      // Remove typing indicator when agent stops typing
      const { error: deleteError } = await supabaseClient
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.userId);

      if (deleteError) {
        console.error('[Dashboard Typing API] Delete error:', deleteError);
        // Don't fail the request if delete fails
      }
    }

    // CRITICAL: Broadcast typing indicator to real-time channels
    try {
      const typingPayload = {
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        senderType: 'operator',
        isTyping,
        content,
        conversationId,
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      };

      // Broadcast to conversation typing channel
      const typingChannel = UNIFIED_CHANNELS.conversationTyping(user.organizationId, conversationId);
      const typingChannelClient = supabaseClient.channel(typingChannel);
      await typingChannelClient.send({
        type: 'broadcast',
        event: isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
        payload: typingPayload
      });

      // Also broadcast to main conversation channel for widget updates
      const conversationChannel = UNIFIED_CHANNELS.conversation(user.organizationId, conversationId);
      const convChannelClient = supabaseClient.channel(conversationChannel);
      await convChannelClient.send({
        type: 'broadcast',
        event: isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
        payload: typingPayload
      });

      // Broadcast to widget channel for bidirectional communication
      const widgetChannel = UNIFIED_CHANNELS.widget(user.organizationId, conversationId);
      const widgetChannelClient = supabaseClient.channel(widgetChannel);
      await widgetChannelClient.send({
        type: 'broadcast',
        event: isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
        payload: typingPayload
      });

      console.log('[Dashboard Typing API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Dashboard Typing API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

    return NextResponse.json({
      success: true,
      typing: {
        userId: user.userId,
        userName: user.name,
        senderType: 'operator',
        isTyping,
        content,
        conversationId,
        organizationId: user.organizationId,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Dashboard Typing API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest, user: unknown) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: conversationId', code: 'VALIDATION_ERROR' },
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

    // Get active typing indicators for the conversation
    const { data: typingIndicators, error } = await supabaseClient
      .from('typing_indicators')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', user.organizationId)
      .eq('isTyping', true)
      .gte('updated_at', new Date(Date.now() - 30000).toISOString()) // Only get indicators from last 30 seconds
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Dashboard Typing API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch typing indicators', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      typingUsers: typingIndicators || [],
      conversationId,
      organizationId: user.organizationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Dashboard Typing API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
