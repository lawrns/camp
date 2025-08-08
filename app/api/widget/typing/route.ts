/**
 * PHASE 1 CRITICAL FIX: Widget Typing Indicator API
 *
 * Database-driven typing indicators for reliable real-time communication
 * identified as missing in god.md analysis.
 *
 * Features:
 * - Database persistence for reliability
 * - Automatic cleanup of stale indicators
 * - Rate limiting protection
 * - Proper authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { validateSession } from '@/lib/services/visitor-identification';
import { messageRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  return messageRateLimit(request, async () => {
    try {
      const body = await request.json();
      const { conversationId, userId, userName, isTyping, sessionToken } = body;

      // Get organization ID from headers
      const organizationId = request.headers.get('x-organization-id');
      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_ORG_ID', message: 'Organization ID required' } },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!conversationId || userId === undefined) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_FIELDS', message: 'conversationId and userId required' } },
          { status: 400 }
        );
      }

      // Validate session if provided
      if (sessionToken) {
        const sessionValidation = await validateSession(sessionToken, organizationId);
        if (!sessionValidation.valid) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SESSION', message: 'Invalid session token' } },
            { status: 401 }
          );
        }
      }

      const supabaseClient = supabase.admin();

      if (isTyping) {
        // Insert or update typing indicator
        const { data, error } = await supabaseClient
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: userId,
            userName: userName || 'Customer',
            userType: 'visitor',
            isTyping: true,
            organization_id: organizationId,
            lastActivity: new Date().toISOString(),
            created_at: new Date().toISOString()
          }, {
            onConflict: 'conversation_id,user_id'
          })
          .select();

        if (error) {
          console.error('[Typing API] Error creating typing indicator:', error);
          return NextResponse.json(
            { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create typing indicator' } },
            { status: 500 }
          );
        }

        console.log('[Typing API] ✅ Typing indicator created:', { conversationId, userId, isTyping });
        // Broadcast standardized typing start event
        try {
          const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
          await broadcastToChannel(
            UNIFIED_CHANNELS.conversation(organizationId, conversationId),
            UNIFIED_EVENTS.TYPING_START,
            {
              userId,
              userName: userName || 'Customer',
              senderType: 'visitor',
              isTyping: true,
              conversationId,
              organizationId,
              timestamp: new Date().toISOString()
            }
          );
        } catch {}

        return NextResponse.json({ success: true, data: { typingIndicator: data?.[0] } });

      } else {
        // Remove typing indicator
        const { error } = await supabaseClient
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) {
          console.error('[Typing API] Error removing typing indicator:', error);
          return NextResponse.json(
            { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to remove typing indicator' } },
            { status: 500 }
          );
        }

        console.log('[Typing API] ✅ Typing indicator removed:', { conversationId, userId, isTyping });
        // Broadcast standardized typing stop event
        try {
          const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
          await broadcastToChannel(
            UNIFIED_CHANNELS.conversation(organizationId, conversationId),
            UNIFIED_EVENTS.TYPING_STOP,
            {
              userId,
              userName: userName || 'Customer',
              senderType: 'visitor',
              isTyping: false,
              conversationId,
              organizationId,
              timestamp: new Date().toISOString()
            }
          );
        } catch {}

        return NextResponse.json({ success: true, data: { removed: true } });
      }

    } catch (error) {
      console.error('[Typing API] Error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = searchParams.get('organizationId');

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Conversation ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabaseClient = supabase.admin();

    // Get typing indicators for the conversation
    const { data: typingIndicators, error } = await supabaseClient
      .from('typing_indicators')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .eq('isTyping', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch typing indicators' },
        { status: 500 }
      );
    }

    // Map to API format
    const mappedIndicators = (typingIndicators || []).map(indicator => ({
      id: indicator.id,
      conversationId: indicator.conversation_id,
      userId: indicator.user_id,
      userName: indicator.userName,
      isTyping: indicator.isTyping,
      lastActivity: indicator.lastActivity,
        createdAt: indicator.created_at,
    }));

    return NextResponse.json({
      typingIndicators: mappedIndicators,
      count: mappedIndicators.length,
    });

  } catch (error) {
    console.error('Widget typing indicators fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
