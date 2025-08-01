import { NextRequest, NextResponse } from 'next/server';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';
import { supabase } from '@/lib/supabase';

// Widget read receipts API - handles message delivery tracking

export const POST = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const body = await request.json();
    const { messageId, conversationId, status = 'read' } = body;
    const organizationId = getOrganizationId(request, auth);

    if (!messageId || !conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Create or update read receipt
    const receiptData = {
      message_id: messageId,
      conversation_id: conversationId,
      organization_id: organizationId,
      user_id: 'visitor', // Widget users are always visitors
      user_name: 'You',
      status, // 'read', 'delivered', 'sent'
      read_at: status === 'read' ? new Date().toISOString() : null,
      metadata: {
        source: 'widget',
        timestamp: new Date().toISOString(),
      }
    };

    const { data: receipt, error } = await supabaseClient
      .from('widget_read_receipts')
      .upsert(receiptData, {
        onConflict: 'message_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Widget Read Receipts API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update read receipt', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Broadcast read receipt to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');

      const receiptPayload = {
        messageId,
        conversationId,
        organizationId,
        userId: 'visitor',
        userName: 'You',
        status,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_EVENTS.READ_RECEIPT_UPDATED,
        receiptPayload
      );

      console.log('[Widget Read Receipts API] Read receipt broadcast sent:', status);
    } catch (broadcastError) {
      console.error('[Widget Read Receipts API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      receipt: {
        messageId,
        status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Widget Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
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

    // Build query
    let query = supabaseClient
      .from('widget_read_receipts')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId);

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: receipts, error } = await query;

    if (error) {
      console.error('[Widget Read Receipts API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch read receipts', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      receipts: receipts || [],
      conversationId,
      organizationId
    });

  } catch (error) {
    console.error('[Widget Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
