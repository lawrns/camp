import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Authentication wrapper for presence endpoints
async function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });

      // Require authentication for presence endpoints
      const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
      
      if (authError || !session) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user organization
      const organizationId = session.user.user_metadata?.organization_id;
      if (!organizationId) {
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

      return await handler(request, user);
    } catch (error) {
      console.error('[Presence Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { 
      status, 
      customStatus = null,
      metadata = {} 
    } = body;

    // Validate required parameters
    if (!status) {
      return NextResponse.json(
        { error: 'Missing required parameter: status', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Update or create user presence
    const presenceData = {
      user_id: user.userId,
      organization_id: user.organizationId,
      status,
      custom_status: customStatus,
      last_seen_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        user_name: user.name,
        user_email: user.email,
        updated_by: 'api',
        source: 'presence_api'
      },
    };

    const { data: presence, error } = await supabaseClient
      .from('user_presence')
      .upsert(presenceData, {
        onConflict: 'user_id,organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Presence API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update presence', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast presence update to real-time channels
    try {
      // Use the standardized broadcast function for consistent real-time communication
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      
      const presencePayload = {
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        status,
        customStatus,
        organizationId: user.organizationId,
        lastSeen: new Date().toISOString(),
        metadata,
        timestamp: new Date().toISOString(),
        source: 'presence_api'
      };

      // Broadcast to organization presence channel
      await broadcastToChannel(
        UNIFIED_CHANNELS.agentsPresence(user.organizationId),
        UNIFIED_EVENTS.PRESENCE_UPDATE,
        presencePayload
      );

      // Broadcast to organization channel for general updates
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(user.organizationId),
        UNIFIED_EVENTS.PRESENCE_UPDATE,
        presencePayload
      );

      // Broadcast to user-specific channel
      await broadcastToChannel(
        UNIFIED_CHANNELS.userPresence(user.organizationId, user.userId),
        UNIFIED_EVENTS.PRESENCE_UPDATE,
        presencePayload
      );

      console.log('[Presence API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Presence API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

    return NextResponse.json({
      success: true,
      presence: {
        userId: user.userId,
        userName: user.name,
        status,
        customStatus,
        organizationId: user.organizationId,
        lastSeen: presence.last_seen_at,
        metadata: presence.metadata,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Presence API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeOffline = searchParams.get('includeOffline') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Build query
    let query = supabaseClient
      .from('user_presence')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('last_seen_at', { ascending: false })
      .limit(limit);

    // Filter out offline users unless explicitly requested
    if (!includeOffline) {
      query = query.neq('status', 'offline');
    }

    // Only show recent presence (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('last_seen_at', twentyFourHoursAgo);

    const { data: presenceList, error } = await query;

    if (error) {
      console.error('[Presence API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presence data', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Transform data for API response
    const transformedPresence = (presenceList || []).map(p => ({
      userId: p.user_id,
      userName: p.metadata?.user_name || p.metadata?.name || 'Unknown',
      userEmail: p.metadata?.user_email || p.metadata?.email,
      status: p.status,
      customStatus: p.custom_status,
      lastSeen: p.last_seen_at,
      metadata: p.metadata,
      organizationId: p.organization_id
    }));

    return NextResponse.json({
      presence: transformedPresence,
      organizationId: user.organizationId,
      timestamp: new Date().toISOString(),
      filters: {
        includeOffline,
        limit,
        timeRange: '24h'
      }
    });

  } catch (error) {
    console.error('[Presence API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, user: any) => {
  try {
    // Set user status to offline and remove from active presence
    const supabaseClient = supabase.admin();

    const { error } = await supabaseClient
      .from('user_presence')
      .update({
        status: 'offline',
        last_seen_at: new Date().toISOString(),
        metadata: {
          user_name: user.name,
          user_email: user.email,
          updated_by: 'api',
          source: 'presence_api_logout'
        }
      })
      .eq('user_id', user.userId)
      .eq('organization_id', user.organizationId);

    if (error) {
      console.error('[Presence API] Logout error:', error);
      return NextResponse.json(
        { error: 'Failed to update presence on logout', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Broadcast offline status
    try {
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      
      const offlinePayload = {
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        status: 'offline',
        organizationId: user.organizationId,
        lastSeen: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        source: 'presence_api_logout'
      };

      await broadcastToChannel(
        UNIFIED_CHANNELS.agentsPresence(user.organizationId),
        UNIFIED_EVENTS.PRESENCE_UPDATE,
        offlinePayload
      );

      console.log('[Presence API] Offline broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Presence API] Offline broadcast failed:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: 'User presence set to offline',
      userId: user.userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Presence API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
