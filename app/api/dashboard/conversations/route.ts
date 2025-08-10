import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseFactory } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isE2EMock, listConversations } from '@/lib/testing/e2e-mock-store';


// Narrow user type for handler
interface DashboardUser {
  userId: string;
  organizationId: string;
  email: string | null;
  name: string | null;
}


// Custom cookie parser that handles both base64 and JSON formats
async function createCompatibleCookieStore() {
  const cookieStore = cookies();

  return {
    get: (name: string) => {
      const cookie = cookieStore.get(name);
      if (!cookie) return undefined;

      let value = cookie.value;

      // Handle base64-encoded cookies
      if (typeof value === 'string' && value.startsWith('base64-')) {
        try {
          const base64Content = value.substring(7); // Remove 'base64-' prefix
          const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
          console.log('[Dashboard Auth] Decoded base64 cookie:', name, 'decoded length:', decoded.length);
          value = decoded; // Keep as string, let Supabase parse it
        } catch (error) {
          console.warn('[Dashboard Auth] Failed to decode base64 cookie:', name, error);
          return undefined;
        }
      }

      return { name: cookie.name, value };
    },
    getAll: () => {
      return cookieStore.getAll().map(cookie => {
        let value = cookie.value;

        // Handle base64-encoded cookies
        if (typeof value === 'string' && value.startsWith('base64-')) {
          try {
            const base64Content = value.substring(7);
            const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
            value = decoded; // Keep as string, let Supabase parse it
          } catch (error) {
            console.warn('[Dashboard Auth] Failed to decode base64 cookie:', cookie.name, error);
          }
        }

        return { ...cookie, value };
      });
    },
    set: cookieStore.set?.bind(cookieStore),
    delete: cookieStore.delete?.bind(cookieStore)
  };
}

// Authentication wrapper for dashboard endpoints (FIXED: removed async from function declaration)
function withAuth(handler: (req: NextRequest, user: DashboardUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      console.log('[Dashboard Conversations API] Starting authentication...');

      // E2E Mock mode - return mock auth context
      if (isE2EMock()) {
        console.log('[Dashboard Conversations API] Using E2E mock auth');
        const mockUser: DashboardUser = {
          userId: 'mock-user-id',
          organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
          email: 'test@example.com',
          name: 'Test User'
        };
        return handler(request, mockUser);
      }

      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = await createCompatibleCookieStore();
      const supabaseClient = supabaseFactory.server(
        compatibleCookieStore as Parameters<typeof supabaseFactory.server>[0]
      );

      console.log('[Dashboard Conversations API] Supabase client created with compatible cookie store, getting session...');

      // Require authentication for dashboard endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

      console.log('[Dashboard Conversations API] Session result:', {
        hasSession: !!session,
        hasError: !!authError,
        userId: session?.user?.id,
        errorMessage: authError?.message
      });

      if (authError || !session) {
        console.log('[Dashboard Conversations API] Authentication failed');
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      console.log('[Dashboard Conversations API] Organization ID:', organizationId);

      if (!organizationId) {
        console.log('[Dashboard Conversations API] No organization ID found');
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

      console.log('[Dashboard Conversations API] Calling handler with user:', {
        userId: user.userId,
        organizationId: user.organizationId,
        email: user.email
      });

      const result = await handler(request, user);
      console.log('[Dashboard Conversations API] Handler completed successfully');
      return result;
    } catch (error) {
      console.error('[Dashboard Conversations API Error]:', error);
      console.error('[Dashboard Conversations API Error] Stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: DashboardUser) => {
  try {
    console.log('[Dashboard Conversations API] Starting conversations fetch for organization:', user.organizationId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';

    console.log('[Dashboard Conversations API] Query params:', { limit, offset, status, priority });

    // E2E mock path
    if (isE2EMock()) {
      const convs = listConversations(user.organizationId);
      const conversationsWithMessages = convs.map(conv => ({
        id: conv.id,
        customerId: null,
        customerEmail: conv.customer_email,
        customerName: conv.customer_name || conv.customer_email?.split('@')[0] || 'Unknown Customer',
        subject: conv.subject,
        status: conv.status,
        priority: conv.priority,
        channel: conv.channel || 'web',
        assignedToUserId: conv.assigned_to_user_id || null,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        lastMessageAt: conv.last_message_at,
        unreadCount: conv.unread_count || 0,
        tags: conv.tags || [],
      }));

      const response = {
        conversations: conversationsWithMessages,
        pagination: {
          limit,
          offset,
          total: conversationsWithMessages.length,
          hasMore: conversationsWithMessages.length === limit,
        },
      };

      return NextResponse.json(response);
    }

    // Initialize Supabase client bound to the authenticated user (RLS applies)
    const supabaseClient = supabaseFactory.server(await createCompatibleCookieStore() as Parameters<typeof supabaseFactory.server>[0]);

    // Build query for conversations - prioritize those with messages
    let query = supabaseClient
      .from('conversations')
      .select(`
        id,
        customerId:customer_id,
        customerEmail:customer_email,
        customerName:customer_name,
        subject,
        status,
        priority,
        channel,
        assignedToUserId:assigned_to_user_id,
        createdAt:created_at,
        updatedAt:updated_at,
        lastMessageAt:last_message_at,
        unreadCount:unread_count,
        tags
      `)
      .eq('organization_id', user.organizationId)
      .not('last_message_at', 'is', null) // Only conversations with messages
      .order('last_message_at', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: conversations, error } = await query;

    if (error) {
      console.error('[Dashboard Conversations API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    console.log('[Dashboard Conversations API] Conversations fetched:', conversations?.length || 0);

    // For each conversation, get the latest message
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages } = await supabaseClient
          .from('messages')
          .select('content, createdAt:created_at, senderType:sender_type, senderName:sender_name')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];

        return {
          id: conv.id,
          customerId: conv.customerId,
          customerEmail: conv.customerEmail,
          customerName: conv.customerName || conv.customerEmail?.split('@')[0] || 'Unknown Customer',
          subject: conv.subject,
          status: conv.status,
          priority: conv.priority,
          channel: conv.channel,
          assignedToUserId: conv.assignedToUserId,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          lastMessageAt: lastMessage?.createdAt || conv.lastMessageAt,
          unreadCount: conv.unreadCount,
          tags: conv.tags,
          lastMessage: lastMessage?.content || 'Message content unavailable'
        };
      })
    );

    const response = {
      conversations: conversationsWithMessages,
      pagination: {
        limit,
        offset,
        total: conversationsWithMessages.length,
        hasMore: conversationsWithMessages.length === limit
      }
    };

    console.log('[Dashboard Conversations API] Returning response with', conversationsWithMessages.length, 'conversations');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Dashboard Conversations API] Unexpected error:', error);
    console.error('[Dashboard Conversations API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
