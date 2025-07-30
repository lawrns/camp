import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';

// Authentication wrapper for dashboard read receipts
async function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });

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
      console.error('[Dashboard Read Receipts Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const {
      messageIds,
      conversationId,
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
          .eq('organization_id', user.organizationId)
          .single();

        if (fetchError || !message) {
          console.warn(`[Dashboard Read Receipts] Message not found: ${messageId}`);
          continue;
        }

        // Don't mark own messages as read (if agent is reading their own message)
        if (message.sender_type === 'operator' && user.userId) {
          // Could check if this specific agent sent the message, but for now skip all operator messages
          continue;
        }

        // Update message metadata with read receipt
        const currentMetadata = message.metadata || {};
        const readReceiptsData = currentMetadata.read_receipts || {};
        
        readReceiptsData[user.userId] = {
          reader_type: 'agent',
          reader_name: user.name,
          reader_email: user.email,
          read_at: readAt,
          metadata: {
            ...metadata,
            source: 'dashboard',
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
              last_read_at: readAt,
              last_read_by: user.userId
            }
          })
          .eq('id', messageId)
          .eq('organization_id', user.organizationId);

        if (updateError) {
          console.error(`[Dashboard Read Receipts] Update error for message ${messageId}:`, updateError);
          continue;
        }

        readReceipts.push({
          messageId,
          readerId: user.userId,
          readerType: 'agent',
          readerName: user.name,
          readAt,
          conversationId,
          organizationId: user.organizationId
        });

      } catch (messageError) {
        console.error(`[Dashboard Read Receipts] Error processing message ${messageId}:`, messageError);
        continue;
      }
    }

    // Broadcast read receipts to real-time channels
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      
      const readReceiptPayload = {
        messageIds: readReceipts.map(r => r.messageId),
        readerId: user.userId,
        readerType: 'agent',
        readerName: user.name,
        readAt,
        conversationId,
        organizationId: user.organizationId,
        source: 'dashboard',
        timestamp: readAt
      };

      // Broadcast to conversation channel for widget
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(user.organizationId, conversationId),
        UNIFIED_EVENTS.READ_RECEIPT,
        readReceiptPayload
      );

      // Broadcast to organization channel for other agents
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(user.organizationId),
        UNIFIED_EVENTS.READ_RECEIPT,
        readReceiptPayload
      );

      console.log('[Dashboard Read Receipts] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Dashboard Read Receipts] Real-time broadcast failed:', broadcastError);
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
    console.error('[Dashboard Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');
    const readerId = searchParams.get('readerId');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Verify conversation belongs to user's organization
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

    // Build query for messages
    let query = supabaseClient
      .from('messages')
      .select('id, metadata, sender_type, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false });

    if (messageId) {
      query = query.eq('id', messageId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Dashboard Read Receipts API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch read receipts', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Extract read receipts from message metadata
    const readReceipts: Record<string, any> = {};
    const summary = {
      totalMessages: messages?.length || 0,
      readMessages: 0,
      unreadMessages: 0,
      readByCurrentUser: 0
    };

    messages?.forEach(message => {
      const metadata = message.metadata || {};
      const receipts = metadata.read_receipts || {};
      const msgId = message.id.toString();

      const readByList = Object.keys(receipts).map(readerId => ({
        readerId,
        readerType: receipts[readerId].reader_type,
        readerName: receipts[readerId].reader_name,
        readerEmail: receipts[readerId].reader_email,
        readAt: receipts[readerId].read_at,
        metadata: includeDetails ? receipts[readerId].metadata : undefined
      }));

      const isRead = readByList.length > 0;
      const isReadByCurrentUser = readByList.some(r => r.readerId === user.userId);

      readReceipts[msgId] = {
        messageId: msgId,
        senderType: message.sender_type,
        senderName: message.sender_name,
        createdAt: message.created_at,
        readBy: readByList,
        isRead,
        isReadByCurrentUser,
        lastReadAt: metadata.last_read_at,
        lastReadBy: metadata.last_read_by
      };

      // Filter by specific reader if requested
      if (readerId) {
        readReceipts[msgId].readBy = readReceipts[msgId].readBy.filter(
          (receipt: any) => receipt.readerId === readerId
        );
        readReceipts[msgId].isRead = readReceipts[msgId].readBy.length > 0;
      }

      // Update summary
      if (isRead) summary.readMessages++;
      else summary.unreadMessages++;
      if (isReadByCurrentUser) summary.readByCurrentUser++;
    });

    return NextResponse.json({
      readReceipts,
      conversationId,
      organizationId: user.organizationId,
      summary,
      filters: {
        messageId,
        readerId,
        includeDetails
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Dashboard Read Receipts API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
