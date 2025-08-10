import { NextRequest, NextResponse } from 'next/server';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';
import { createWidgetReadReceiptService } from '@/services/widgetReadReceiptService';

// Widget read receipts API - handles message delivery tracking

export const POST = optionalWidgetAuth(async (request: NextRequest, context: unknown, auth) => {
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

    // Persist read receipts in message metadata for consistency
    const service = createWidgetReadReceiptService(organizationId);
    await service.markMessagesAsRead({
      messageIds: [messageId],
      conversationId,
      organizationId,
      readerId: 'visitor',
      readerType: 'visitor',
    });

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
        UNIFIED_EVENTS.READ_RECEIPT,
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

export const GET = optionalWidgetAuth(async (request: NextRequest, context: unknown, auth) => {
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

    const service = createWidgetReadReceiptService(organizationId);
    const receiptsByMessage = await service.getReadReceipts(conversationId, messageId ?? undefined);
    return NextResponse.json({ receipts: receiptsByMessage, conversationId, organizationId });

  } catch (error) {
    console.error('[Widget Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
