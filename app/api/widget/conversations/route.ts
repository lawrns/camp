import { NextRequest, NextResponse } from 'next/server';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';

// Widget conversations API - handles conversation lifecycle management

export const POST = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const body = await request.json();
    const { visitorId, initialMessage, customerEmail, customerName, userAgent, referrer, currentUrl } = body;
    const organizationId = getOrganizationId(request, auth);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Generate UUID for conversation ID
    const conversationId = crypto.randomUUID();

    // Create conversation in database
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .insert({
        id: conversationId,
        organization_id: organizationId,
        customer_email: customerEmail || null,
        customer_name: customerName || 'Anonymous User',
        status: 'open',
        priority: 'medium',
        channel: 'widget',
        created_at: new Date().toISOString(),
        metadata: {
          source: 'widget',
          visitorId: visitorId || `visitor_${Date.now()}`,
          userAgent,
          referrer,
          currentUrl
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[Widget Conversations API] Database conversation creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // If there's an initial message, create it
    if (initialMessage) {
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          organization_id: organizationId,
          content: initialMessage,
          sender_type: 'visitor',
          sender_name: customerName || 'Anonymous User',
          sender_email: customerEmail,
          metadata: {
            source: 'widget',
            timestamp: new Date().toISOString(),
          },
        });

      if (messageError) {
        console.error('[Widget Conversations API] Initial message creation error:', messageError);
        // Don't fail the conversation creation if message fails
      }
    }

    // Broadcast conversation creation to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      await broadcastToChannel(
        UNIFIED_CHANNELS.conversations(organizationId),
        UNIFIED_EVENTS.CONVERSATION_CREATED,
        {
          conversation,
          organizationId,
          timestamp: new Date().toISOString(),
          source: 'widget'
        }
      );

      console.log('[Widget Conversations API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Widget Conversations API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    console.log('[Widget Conversations API] Created conversation:', conversationId);

    return NextResponse.json({
      conversationId,
      conversation,
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('[Widget Conversations API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

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

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Get conversation with organization context
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);

  } catch (error) {
    console.error('[Widget Conversations API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
