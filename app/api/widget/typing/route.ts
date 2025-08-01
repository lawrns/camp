import { NextRequest, NextResponse } from 'next/server';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';

// Widget typing indicator API - handles real-time typing state

export const POST = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const body = await request.json();
    const { conversationId, isTyping, userId, userName } = body;
    const organizationId = getOrganizationId(request, auth);

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Broadcast typing indicator to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      const typingPayload = {
        conversationId,
        organizationId,
        userId: userId || 'visitor',
        userName: userName || 'You',
        isTyping,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        isTyping ? UNIFIED_EVENTS.TYPING_STARTED : UNIFIED_EVENTS.TYPING_STOPPED,
        typingPayload
      );

      console.log('[Widget Typing API] Typing indicator broadcast sent:', isTyping);
    } catch (broadcastError) {
      console.error('[Widget Typing API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      isTyping,
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

export const DELETE = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');
    const organizationId = getOrganizationId(request, auth);

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Broadcast typing stopped to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      const typingPayload = {
        conversationId,
        organizationId,
        userId: userId || 'visitor',
        userName: 'You',
        isTyping: false,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_EVENTS.TYPING_STOPPED,
        typingPayload
      );

      console.log('[Widget Typing API] Typing stopped broadcast sent');
    } catch (broadcastError) {
      console.error('[Widget Typing API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      isTyping: false,
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
