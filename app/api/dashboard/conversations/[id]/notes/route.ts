import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

// Authentication wrapper for dashboard endpoints
function withAuth(handler: (req: NextRequest, user: any, conversationId: string) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Use compatible cookie store that handles base64 format
      const compatibleCookieStore = createCompatibleCookieStore();
      const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

      // Require authentication for dashboard endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

      if (authError || !session) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization from metadata or membership
      let organizationId = session.user.user_metadata?.organization_id || session.user.app_metadata?.organization_id;

      // If no organization ID in metadata, check organization membership
      if (!organizationId) {
        const { data: membership, error: membershipError } = await supabaseClient
          .from('organization_members')
          .select('organization_id, role, status')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (!membershipError && membership) {
          organizationId = membership.organization_id;
        }
      }

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization not found - user must be member of an organization', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const user = {
        userId: session.user.id,
        organizationId,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email
      };

      const result = await handler(request, user, params.id);
      return result;
    } catch (error) {
      console.error('[Dashboard Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: any, conversationId: string) => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note message is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Use the same Supabase client for consistency
    const compatibleCookieStore = createCompatibleCookieStore();
    const supabaseClient = createRouteHandlerClient({ cookies: () => compatibleCookieStore });

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

    // Create internal note as a message with special type
    const { data: note, error } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: user.organizationId,
        content: message.trim(),
        sender_email: user.email,
        sender_name: user.name,
        sender_type: 'agent',
        sender_id: user.userId,
        topic: 'note',
        extension: 'text',
        is_internal: true,
        is_private: true,
        metadata: {
          source: 'dashboard',
          type: 'internal_note',
          timestamp: new Date().toISOString(),
          agent_id: user.userId,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[Dashboard Notes API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create note', code: 'DATABASE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ note }, { status: 201 });

  } catch (error) {
    console.error('[Dashboard Notes API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
