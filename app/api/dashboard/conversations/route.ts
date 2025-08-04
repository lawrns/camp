import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Custom cookie parser that handles both base64 and JSON formats
function createCompatibleCookieStore() {
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
function withAuth(handler: (req: NextRequest, user: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      console.log('[Dashboard Conversations API] Starting authentication...');
      
      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

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

export const GET = withAuth(async (request: NextRequest, user: unknown) => {
  try {
    console.log('[Dashboard Conversations API] Starting conversations fetch for organization:', user.organizationId);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';

    console.log('[Dashboard Conversations API] Query params:', { limit, offset, status, priority });

    // Initialize Supabase client with error handling
    let supabaseClient;
    try {
      supabaseClient = supabase.admin();
      console.log('[Dashboard Conversations API] Supabase client initialized');
    } catch (clientError) {
      console.error('[Dashboard Conversations API] Failed to initialize Supabase client:', clientError);
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DATABASE_CONNECTION_ERROR' },
        { status: 500 }
      );
    }

    // Build query for conversations - prioritize those with messages
    let query = supabaseClient
      .from('conversations')
      .select(`
        id,
        customer_id,
        customer_email,
        customer_name,
        subject,
        status,
        priority,
        channel,
        assigned_agent,
        created_at,
        updated_at,
        last_message_at,
        unread_count,
        tags
      `)
      .eq('organization_id', user.organizationId)
      .not('lastMessageAt', 'is', null) // Only conversations with messages
      .order('lastMessageAt', { ascending: false });

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
          .select('content, created_at, senderType, senderName')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];

        return {
          ...conv,
          lastMessage: lastMessage?.content || 'Message content unavailable',
          lastMessageAt: lastMessage?.created_at || conv.lastMessageAt,
          customerName: conv.customerName || conv.customerEmail?.split('@')[0] || 'Unknown Customer'
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
