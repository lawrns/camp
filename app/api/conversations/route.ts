import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { withAuth, AuthenticatedUser } from '@/lib/auth/route-auth';
import { isE2EMock, listConversations } from '@/lib/testing/e2e-mock-store';
import { mapDbConversationToApi, mapDbConversationsToApi } from '@/lib/utils/db-type-mappers';

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // E2E MOCK: serve conversations from in-memory store
    if (isE2EMock()) {
      const convs = listConversations(user.organizationId).slice(offset, offset + limit);
      return NextResponse.json(mapDbConversationsToApi(convs as any));
    }

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Build query with proper organization context
    let query = supabaseClient
      .from('conversations')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: conversations, error } = await query;

    if (error) {
      // Check if it's a permission error
      if (error.message && error.message.includes('permission denied')) {
        console.log('[Conversations API] Permission denied for conversations table, returning empty array');
        return NextResponse.json([]);
      }
      
      console.error('[Conversations API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Convert snake_case database response to camelCase API response
    const apiConversations = mapDbConversationsToApi(conversations || []);
    return NextResponse.json(apiConversations);

  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { customerEmail, customerName, subject, initialMessage } = body;

    // Validate required fields
    if (!customerEmail || !customerName || !subject) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['customerEmail', 'customerName', 'subject'],
            provided: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    if (isE2EMock()) {
      const { createConversation, addMessage } = await import('@/lib/testing/e2e-mock-store');
      const conv = createConversation({
        organizationId: user.organizationId,
        customerEmail,
        customerName,
        subject,
      });
      if (initialMessage) {
        addMessage({
          conversationId: conv.id,
          organizationId: user.organizationId,
          content: initialMessage,
          senderType: 'visitor',
          senderEmail: customerEmail,
          senderName: customerName,
        });
      }
      return NextResponse.json(mapDbConversationToApi(conv as any), { status: 201 });
    }

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Create conversation with proper organization context
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .insert({
        organization_id: user.organizationId,
        customerEmail: customerEmail,
        customerName: customerName,
        subject,
        status: 'open',
        createdBy: user.userId
      })
      .select()
      .single();

    if (conversationError) {
      console.error('[Conversations API] Creation error:', conversationError);
      return NextResponse.json(
        { error: 'Failed to create conversation', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Create initial message if provided
    if (initialMessage) {
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          organization_id: user.organizationId,
          content: initialMessage,
          senderType: 'customer',
          senderEmail: customerEmail,
          senderName: customerName
        });

      if (messageError) {
        console.error('[Conversations API] Initial message error:', messageError);
        // Don't fail the entire request, just log the error
      }
    }

    // Convert snake_case database response to camelCase API response
    const apiConversation = mapDbConversationToApi(conversation);
    return NextResponse.json(apiConversation, { status: 201 });

  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});