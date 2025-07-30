import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';

/**
 * Widget Read Receipts API
 * Handles read receipt tracking for widget messages
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const {
      messageIds,
      conversationId,
      readerId,
      readerType = 'visitor',
      sessionId,
      deviceId,
      metadata = {}
    } = body;

    // Validate required parameters
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!readerId) {
      return NextResponse.json(
        { error: 'Reader ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

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

    const readAt = new Date().toISOString();
    const readReceipts = [];

    // Process each message
    for (const messageId of messageIds) {
      try {
        // Get current message to update metadata
        const { data: message, error: fetchError } = await supabaseClient
          .from('messages')
          .select('id, metadata, sender_type')
          .eq('id', messageId)
          .eq('organization_id', organizationId)
          .single();

        if (fetchError || !message) {
          console.warn(`[Widget Read Receipts] Message not found: ${messageId}`);
          continue;
        }

        // Don't mark own messages as read (if visitor is reading their own message)
        if (message.sender_type === 'visitor' && readerType === 'visitor') {
          continue;
        }

        // Update message metadata with read receipt
        const currentMetadata = message.metadata || {};
        const readReceiptsData = currentMetadata.read_receipts || {};
        
        readReceiptsData[readerId] = {
          reader_type: readerType,
          session_id: sessionId,
          device_id: deviceId,
          read_at: readAt,
          metadata: {
            ...metadata,
            source: 'widget',
            timestamp: readAt
          }
        };

        // Update message with read receipt
        const { error: updateError } = await supabaseClient
          .from('messages')
          .update({
            metadata: {
              ...currentMetadata,
              read_receipts: readReceiptsData,
              last_read_at: readAt
            }
          })
          .eq('id', messageId)
          .eq('organization_id', organizationId);

        if (updateError) {
          console.error(`[Widget Read Receipts] Update error for message ${messageId}:`, updateError);
          continue;
        }

        readReceipts.push({
          messageId,
          readerId,
          readerType,
          readAt,
          conversationId,
          organizationId
        });

      } catch (messageError) {
        console.error(`[Widget Read Receipts] Error processing message ${messageId}:`, messageError);
        continue;
      }
    }

    // Broadcast read receipts to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      
      const readReceiptPayload = {
        messageIds: readReceipts.map(r => r.messageId),
        readerId,
        readerType,
        readAt,
        conversationId,
        organizationId,
        source: 'widget',
        timestamp: readAt
      };

      // Broadcast to conversation channel for dashboard
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_EVENTS.READ_RECEIPT,
        readReceiptPayload
      );

      // Broadcast to organization channel for general updates
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(organizationId),
        UNIFIED_EVENTS.READ_RECEIPT,
        readReceiptPayload
      );

      console.log('[Widget Read Receipts] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Widget Read Receipts] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      readReceipts,
      timestamp: readAt,
      summary: {
        totalMessages: messageIds.length,
        processedMessages: readReceipts.length,
        skippedMessages: messageIds.length - readReceipts.length
      }
    });

  } catch (error) {
    console.error('[Widget Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = request.headers.get('x-organization-id');
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');
    const readerId = searchParams.get('readerId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Build query for messages
    let query = supabaseClient
      .from('messages')
      .select('id, metadata, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (messageId) {
      query = query.eq('id', messageId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Widget Read Receipts API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch read receipts', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Extract read receipts from message metadata
    const readReceipts: Record<string, any> = {};

    messages?.forEach(message => {
      const metadata = message.metadata || {};
      const receipts = metadata.read_receipts || {};
      const msgId = message.id.toString();

      readReceipts[msgId] = {
        messageId: msgId,
        senderType: message.sender_type,
        createdAt: message.created_at,
        readBy: Object.keys(receipts).map(readerId => ({
          readerId,
          readerType: receipts[readerId].reader_type,
          readAt: receipts[readerId].read_at,
          sessionId: receipts[readerId].session_id,
          deviceId: receipts[readerId].device_id,
          metadata: receipts[readerId].metadata
        })),
        isRead: Object.keys(receipts).length > 0,
        lastReadAt: metadata.last_read_at
      };

      // Filter by specific reader if requested
      if (readerId) {
        readReceipts[msgId].readBy = readReceipts[msgId].readBy.filter(
          (receipt: any) => receipt.readerId === readerId
        );
        readReceipts[msgId].isRead = readReceipts[msgId].readBy.length > 0;
      }
    });

    return NextResponse.json({
      readReceipts,
      conversationId,
      organizationId,
      filters: {
        messageId,
        readerId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Widget Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
