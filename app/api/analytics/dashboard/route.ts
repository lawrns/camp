import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AuthUser {
  userId: string;
  organizationId: string;
  email?: string;
}

// Simplified auth wrapper for API endpoints
async function withAuth(handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
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

      return await handler(request, user);
    } catch (error) {
      console.error('[Auth Error]:', error);
      return NextResponse.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, { status: 500 });
    }
  };
}

export const GET = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Calculate date range based on period
    const now = new Date();
    let dateFilter: { gte: string; lte: string };
    
    switch (period) {
      case '1d':
        dateFilter = {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          lte: now.toISOString()
        };
        break;
      case '7d':
        dateFilter = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lte: now.toISOString()
        };
        break;
      case '30d':
        dateFilter = {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lte: now.toISOString()
        };
        break;
      default:
        dateFilter = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lte: now.toISOString()
        };
    }

    // Get conversations data
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('createdAt, status, customerEmail')
      .eq('organizationId', user.organizationId)
      .gte('createdAt', dateFilter.gte)
      .lte('createdAt', dateFilter.lte);

    if (conversationsError) {
      console.error('[Analytics API] Conversations fetch error:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations data', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Get messages data
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('createdAt, senderType, conversationId')
      .eq('organizationId', user.organizationId)
      .gte('createdAt', dateFilter.gte)
      .lte('createdAt', dateFilter.lte);

    if (messagesError) {
      console.error('[Analytics API] Messages fetch error:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages data', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Get tickets data
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('createdAt, status, priority')
      .eq('organizationId', user.organizationId)
      .gte('createdAt', dateFilter.gte)
      .lte('createdAt', dateFilter.lte);

    if (ticketsError) {
      console.error('[Analytics API] Tickets fetch error:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets data', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalConversations = conversations?.length || 0;
    const openConversations = conversations?.filter(c => c.status === 'open').length || 0;
    const resolvedConversations = conversations?.filter(c => c.status === 'resolved').length || 0;
    
    const totalMessages = messages?.length || 0;
    const customerMessages = messages?.filter(m => m.senderType === 'customer').length || 0;
    const agentMessages = messages?.filter(m => m.senderType === 'agent').length || 0;
    
    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const urgentTickets = tickets?.filter(t => t.priority === 'urgent').length || 0;

    // Calculate unique customers
    const uniqueCustomers = new Set(conversations?.map(c => c.customerEmail)).size;

    // Calculate average response time (simplified)
    const avgResponseTime = totalMessages > 0 ? Math.round(totalMessages / totalConversations) : 0;

    const analytics = {
      period,
      dateRange: {
        start: dateFilter.gte,
        end: dateFilter.lte
      },
      conversations: {
        total: totalConversations,
        open: openConversations,
        resolved: resolvedConversations,
        uniqueCustomers
      },
      messages: {
        total: totalMessages,
        customer: customerMessages,
        agent: agentMessages,
        avgResponseTime
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        urgent: urgentTickets
      },
      performance: {
        responseRate: totalConversations > 0 ? Math.round((resolvedConversations / totalConversations) * 100) : 0,
        avgMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}); 