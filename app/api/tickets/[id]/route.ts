import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Simplified auth wrapper for API endpoints
async function withAuth(handler: (req: NextRequest, user: any, params: any) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
      }

      // Get user's organization ID
      const organizationId = session.user.user_metadata?.organization_id;
      
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization not found', code: 'ORGANIZATION_NOT_FOUND' }, { status: 400 });
      }

      const user = {
        userId: session.user.id,
        organizationId,
        email: session.user.email
      };

      return await handler(request, user, params);
    } catch (error) {
      console.error('[Auth Error]:', error);
      return NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 500 });
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: any, params: any) => {
  try {
    const { id } = params;

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get ticket with proper organization context
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        conversation:conversations(*),
        assignee:users!tickets_assignee_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('organizationId', user.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Ticket not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Tickets API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ticket', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(ticket);

  } catch (error) {
    console.error('[Tickets API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, user: any, params: any) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, priority, status, assigneeId } = body;

    // Validate required fields
    if (!title || !description || !priority) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['title', 'description', 'priority'],
            provided: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { 
          error: 'Invalid priority value', 
          code: 'VALIDATION_ERROR',
          details: {
            validPriorities,
            provided: priority
          }
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status value', 
          code: 'VALIDATION_ERROR',
          details: {
            validStatuses,
            provided: status
          }
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Update ticket with proper organization context
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({
        title,
        description,
        priority,
        status: status || 'open',
        assigneeId,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organizationId', user.organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Ticket not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Tickets API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update ticket', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(ticket);

  } catch (error) {
    console.error('[Tickets API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, user: any, params: any) => {
  try {
    const { id } = params;

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Delete ticket with proper organization context
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('organizationId', user.organizationId);

    if (error) {
      console.error('[Tickets API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete ticket', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Tickets API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}); 