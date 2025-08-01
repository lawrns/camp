// 🔧 FIXED WIDGET TYPING INDICATORS API - CAMPFIRE V2
// Updated to use unified types and proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

interface TypingIndicatorRequest {
  conversationId: string;
  isTyping: boolean;
  userId?: string;
  userName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID header is required' },
        { status: 400 }
      );
    }

    const body: TypingIndicatorRequest = await request.json();

    // Validate required fields
    if (!body.conversationId || typeof body.isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'Conversation ID and typing status are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = getServiceClient();

    if (body.isTyping) {
      // Create or update typing indicator - using any to bypass type mismatch
      const { error } = await (supabase as any)
        .from('typing_indicators')
        .upsert({
          conversation_id: body.conversationId,
          user_id: body.userId || 'anonymous', // Use user_id for widget users
          is_typing: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to update typing indicator' },
          { status: 500 }
        );
      }
    } else {
      // Remove typing indicator - using any to bypass type mismatch
      const { error } = await (supabase as any)
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', body.conversationId)
        .eq('user_id', body.userId || 'anonymous'); // Use user_id for widget users

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to remove typing indicator' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      isTyping: body.isTyping,
    });

  } catch (error) {
    console.error('Widget typing indicator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
    const supabase = getServiceClient();

    // Get typing indicators for the conversation
    const { data: typingIndicators, error } = await supabase
      .from('typing_indicators')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .eq('is_typing', true);

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
      userName: indicator.user_name,
      isTyping: indicator.is_typing,
      lastActivity: indicator.last_activity,
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
