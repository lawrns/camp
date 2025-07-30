import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Simplified optional auth wrapper for widget endpoints
async function withOptionalAuth(handler: (req: NextRequest, user?: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });

      // Try to get authentication, but don't require it for widget
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      let user = undefined;
      if (!authError && session) {
        const organizationId = session.user.user_metadata?.organization_id;
        if (organizationId) {
          user = {
            userId: session.user.id,
            organizationId,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email
          };
        }
      }

      return await handler(request, user);
    } catch (error) {
      console.error('[Widget Typing Auth Error]:', error);
      return await handler(request, undefined);
    }
  };
}

export const POST = withOptionalAuth(async (request: NextRequest, user?: any) => {
  try {
    const body = await request.json();
    const { 
      conversationId, 
      organizationId, 
      isTyping, 
      senderName, 
      senderEmail,
      senderType = 'visitor',
      content = null 
    } = body;

    // Validate required parameters
    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversationId, organizationId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'isTyping must be a boolean', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Use authenticated user info if available, otherwise use provided info
    const userId = user?.userId || senderEmail || `visitor_${Date.now()}`;
    const userName = user?.name || senderName || senderEmail || 'Anonymous';
    const userEmail = user?.email || senderEmail;

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
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
      organization_id: organizationId,
      user_id: userId,
      user_name: userName,
      sender_type: senderType,
      is_typing: isTyping,
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
        console.error('[Widget Typing API] Database error:', typingError);
        return NextResponse.json(
          { error: 'Failed to update typing indicator', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }
    } else {
      // Remove typing indicator when user stops typing
      const { error: deleteError } = await supabaseClient
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[Widget Typing API] Delete error:', deleteError);
        // Don't fail the request if delete fails
      }
    }

    // CRITICAL: Broadcast typing indicator to real-time channels
    try {
      const typingPayload = {
        userId,
        userName,
        userEmail,
        senderType,
        isTyping,
        content,
        conversationId,
        organizationId,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation typing channel
      const typingChannel = UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId);
      const typingChannelClient = supabaseClient.channel(typingChannel);
      await typingChannelClient.send({
        type: 'broadcast',
        event: isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
        payload: typingPayload
      });

      // Also broadcast to main conversation channel for dashboard updates
      const conversationChannel = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
      const convChannelClient = supabaseClient.channel(conversationChannel);
      await convChannelClient.send({
        type: 'broadcast',
        event: isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP,
        payload: typingPayload
      });

      console.log('[Widget Typing API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Widget Typing API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

    return NextResponse.json({
      success: true,
      typing: {
        userId,
        userName,
        senderType,
        isTyping,
        content,
        conversationId,
        organizationId,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Widget Typing API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = withOptionalAuth(async (request: NextRequest, user?: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = searchParams.get('organizationId');

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversationId, organizationId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Get active typing indicators for the conversation
    const { data: typingIndicators, error } = await supabaseClient
      .from('typing_indicators')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .eq('is_typing', true)
      .gte('updated_at', new Date(Date.now() - 30000).toISOString()) // Only get indicators from last 30 seconds
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Widget Typing API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch typing indicators', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      typingUsers: typingIndicators || [],
      conversationId,
      organizationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Widget Typing API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
