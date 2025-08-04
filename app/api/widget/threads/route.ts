import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database query when schema is ready
    // For now, return mock data
    const mockThreads = [
      {
        id: '1',
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
      },
      {
        id: '2',
        title: 'Technical Issue',
        participants: [
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: null,
            role: 'customer'
          }
        ],
        lastMessage: {
          id: '2',
          content: 'The app is not working properly',
          sender: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: null,
            role: 'customer'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isUnread: true
        },
        unreadCount: 2,
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        metadata: {}
      }
    ];

    return NextResponse.json({
      threads: mockThreads,
      total: mockThreads.length
    });

  } catch (error) {
    console.error('Failed to fetch threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, initialMessage, organizationId } = body;

    if (!title || !initialMessage || !organizationId) {
      return NextResponse.json(
        { error: 'Title, initial message, and organization ID are required' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // TODO: Replace with real database operations when schema is ready
    // For now, return mock response
    const newThread = {
      id: Date.now().toString(),
      title,
      participants: [
        {
          id: 'visitor',
          name: 'You',
          email: 'visitor@example.com',
          avatar: null,
          role: 'customer'
        }
      ],
      lastMessage: {
        id: Date.now().toString(),
        content: initialMessage,
        sender: {
          id: 'visitor',
          name: 'You',
          email: 'visitor@example.com',
          avatar: null,
          role: 'customer'
        },
        timestamp: new Date().toISOString(),
        isUnread: false
      },
      unreadCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    return NextResponse.json({
      thread: newThread,
      message: 'Thread created successfully'
    });

  } catch (error) {
    console.error('Failed to create thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
} 