import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { withAuth, AuthenticatedUser } from '@/lib/auth/route-auth';

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the Authorization header to create an authenticated client
    const authHeader = request.headers.get('authorization');
    let supabaseClient;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Create a Supabase client with the token for authenticated requests
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // Fallback to cookie-based client
      const cookieStore = await cookies();
      supabaseClient = supabase.server(cookieStore);
    }

    // First, get mailboxes for this organization
    const { data: mailboxes, error: mailboxError } = await supabaseClient
      .from('mailboxes')
      .select('id')
      .eq('organization_id', user.organizationId);

    if (mailboxError) {
      console.error('[Tickets API] Mailbox fetch error:', mailboxError);
      return NextResponse.json(
        { error: 'Failed to fetch organization mailboxes', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const mailboxIds = mailboxes?.map((m: any) => m.id) || [];

    if (mailboxIds.length === 0) {
      // No mailboxes for this organization, return empty array
      return NextResponse.json([]);
    }

    // Try to access tickets table, but handle permission errors gracefully
    try {
      // Build query with proper organization context through mailboxes
      let query = supabaseClient
        .from('tickets')
        .select('*')
        .in('mailbox_id', mailboxIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Add filters if provided
      if (status) {
        query = query.eq('status', status);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data: tickets, error } = await query;

      if (error) {
        // Check if it's a permission error
        if (error.message && error.message.includes('permission denied')) {
          console.log('[Tickets API] Permission denied for tickets table, returning empty array');
          return NextResponse.json([]);
        }
        
        console.error('[Tickets API] Fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch tickets', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json(tickets);
    } catch (error) {
      // Handle any unexpected errors
      console.error('[Tickets API] Unexpected error:', error);
      return NextResponse.json([]);
    }

  } catch (error) {
    console.error('[Tickets API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { title, description, priority, customerEmail, customerName } = body;

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

    // Get the Authorization header to create an authenticated client
    const authHeader = request.headers.get('authorization');
    let supabaseClient;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Create a Supabase client with the token for authenticated requests
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // Fallback to cookie-based client
      const cookieStore = await cookies();
      supabaseClient = supabase.server(cookieStore);
    }

    // Get the first mailbox for this organization to create the ticket
    const { data: mailboxes, error: mailboxError } = await supabaseClient
      .from('mailboxes')
      .select('id')
      .eq('organization_id', user.organizationId)
      .limit(1)
      .single();

    if (mailboxError || !mailboxes) {
      console.error('[Tickets API] Mailbox fetch error:', mailboxError);
      return NextResponse.json(
        { error: 'No mailbox found for organization', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Create ticket with proper organization context through mailbox
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .insert({
        mailbox_id: mailboxes.id,
        title,
        description,
        priority,
        status: 'open',
        createdBy: user.userId
      })
      .select()
      .single();

    if (ticketError) {
      console.error('[Tickets API] Creation error:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(ticket, { status: 201 });

  } catch (error) {
    console.error('[Tickets API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}); 