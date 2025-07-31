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
          console.log('[Dashboard Messages API] Decoded base64 cookie:', name, 'decoded length:', decoded.length);
          value = decoded; // Keep as string, let Supabase parse it
        } catch (error) {
          console.warn('[Dashboard Messages API] Failed to decode base64 cookie:', name, error);
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
            console.warn('[Dashboard Messages API] Failed to decode base64 cookie:', cookie.name, error);
          }
        }
        
        return { ...cookie, value };
      });
    },
    set: cookieStore.set?.bind(cookieStore),
    delete: cookieStore.delete?.bind(cookieStore)
  };
}

// Authentication wrapper for dashboard endpoints
function withAuth(handler: (req: NextRequest, user: any, conversationId: string) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: { params: { conversationId: string } }) => {
    try {
      console.log('[Dashboard Messages API] Starting authentication for conversation:', params.conversationId);
      
      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

      console.log('[Dashboard Messages API] Supabase client created, getting session...');

      // Require authentication for dashboard endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      console.log('[Dashboard Messages API] Session result:', {
        hasSession: !!session,
        hasError: !!authError,
        userId: session?.user?.id,
        errorMessage: authError?.message
      });
      
      if (authError || !session) {
        console.log('[Dashboard Messages API] Authentication failed');
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      console.log('[Dashboard Messages API] Organization ID:', organizationId);
      
      if (!organizationId) {
        console.log('[Dashboard Messages API] No organization ID found');
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

      console.log('[Dashboard Messages API] Calling handler with user:', {
        userId: user.userId,
        organizationId: user.organizationId,
        conversationId: params.conversationId
      });

      const result = await handler(request, user, params.conversationId);
      console.log('[Dashboard Messages API] Handler completed successfully');
      return result;
    } catch (error) {
      console.error('[Dashboard Messages API Error]:', error);
      console.error('[Dashboard Messages API Error] Stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    console.log('[Dashboard Messages API] Fetching messages for conversation:', conversationId);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[Dashboard Messages API] Query params:', { limit, offset });

    // Initialize Supabase client
    const supabaseClient = supabase.admin();
    console.log('[Dashboard Messages API] Supabase client initialized');

    // Verify conversation access
    console.log('[Dashboard Messages API] Checking conversation access for user:', user.userId);
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organizationId)
      .single();

    if (convError || !conversation) {
      console.log('[Dashboard Messages API] Conversation access denied:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found or access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    console.log('[Dashboard Messages API] Conversation access verified');

    // Fetch messages
    console.log('[Dashboard Messages API] Fetching messages...');
    const { data: messages, error } = await supabaseClient
      .from('messages')
      .select(`
        id,
        content,
        sender_type,
        sender_name,
        sender_email,
        created_at,
        conversation_id,
        organization_id,
        read_status,
        attachments
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Dashboard Messages API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    console.log('[Dashboard Messages API] Messages fetched:', messages?.length || 0);

    const response = {
      messages: messages || [],
      pagination: {
        limit,
        offset,
        total: messages?.length || 0,
        hasMore: (messages?.length || 0) === limit
      }
    };

    console.log('[Dashboard Messages API] Returning response with', messages?.length || 0, 'messages');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Dashboard Messages API] Unexpected error:', error);
    console.error('[Dashboard Messages API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    console.log('[Dashboard Messages API] Creating message for conversation:', conversationId);
    
    const body = await request.json();
    const { content, sender_type = 'operator', sender_name } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.log('[Dashboard Messages API] Message data:', { content: content.trim(), sender_type, sender_name });

    // Initialize Supabase client
    const supabaseClient = supabase.admin();

    // Verify conversation access
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', user.organizationId)
      .single();

    if (convError || !conversation) {
      console.log('[Dashboard Messages API] Conversation access denied:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found or access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Create message
    const messageData = {
      content: content.trim(),
      sender_type,
      sender_name: sender_name || user.name || 'Agent',
      sender_email: user.email,
      conversation_id: conversationId,
      organization_id: user.organizationId,
      read_status: 'sent'
    };

    console.log('[Dashboard Messages API] Creating message with data:', messageData);

    const { data: message, error } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('[Dashboard Messages API] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create message', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    console.log('[Dashboard Messages API] Message created successfully:', message.id);

    // Update conversation's last_message_at
    await supabaseClient
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return NextResponse.json({ message });

  } catch (error) {
    console.error('[Dashboard Messages API] Unexpected error:', error);
    console.error('[Dashboard Messages API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
