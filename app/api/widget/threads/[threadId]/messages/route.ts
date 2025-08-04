import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const since = searchParams.get('since');

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database query when schema is ready
    // For now, return mock data
    const mockMessages = [
      {
        id: '1',
        threadId,
        content: 'Hi, I need help with my account',
        sender: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
          role: 'customer'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        attachments: [],
        reactions: [],
        status: 'read'
      },
      {
        id: '2',
        threadId,
        content: 'Sure, I can help you with that. What specific issue are you experiencing?',
        sender: {
          id: 'agent',
          name: 'Support Agent',
          email: 'support@example.com',
          avatar: null,
          role: 'agent'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        attachments: [],
        reactions: [],
        status: 'read'
      }
    ];

    return NextResponse.json({
      messages: mockMessages.slice(offset, offset + limit),
      hasMore: mockMessages.length > offset + limit,
      totalCount: mockMessages.length
    });

  } catch (error) {
    console.error('Failed to fetch thread messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const body = await request.json();
    const { content, organizationId, attachments } = body;

    if (!threadId || !content || !organizationId) {
      return NextResponse.json(
        { error: 'Thread ID, content, and organization ID are required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database operations when schema is ready
    // For now, return mock response
    const newMessage = {
      id: Date.now().toString(),
      threadId,
      content,
      sender: {
        id: 'visitor',
        name: 'You',
        email: 'visitor@example.com',
        avatar: null,
        role: 'customer'
      },
      timestamp: new Date().toISOString(),
      attachments: attachments || [],
      reactions: [],
      status: 'sent'
    };

    return NextResponse.json({
      messageId: newMessage.id,
      message: newMessage,
      status: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Failed to send thread message:', error);
    return NextResponse.json(
      { error: 'Failed to send thread message' },
      { status: 500 }
    );
  }
} 