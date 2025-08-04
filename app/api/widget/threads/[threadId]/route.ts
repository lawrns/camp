import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database query when schema is ready
    // For now, return mock data
    const mockThread = {
      id: threadId,
      title: 'General Support',
      participants: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
          role: 'customer'
        }
      ],
      lastMessage: {
        id: '1',
        content: 'Hi, I need help with my account',
        sender: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
          role: 'customer'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        isUnread: false
      },
      unreadCount: 0,
      status: 'active',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      metadata: {}
    };

    return NextResponse.json({
      thread: mockThread
    });

  } catch (error) {
    console.error('Failed to fetch thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const body = await request.json();
    const { title, status, metadata } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database operations when schema is ready
    // For now, return mock response
    const updatedThread = {
      id: threadId,
      title: title || 'General Support',
      status: status || 'active',
      metadata: metadata || {},
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      thread: updatedThread,
      message: 'Thread updated successfully'
    });

  } catch (error) {
    console.error('Failed to update thread:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database operations when schema is ready
    // For now, return mock response
    return NextResponse.json({
      message: 'Thread deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
} 