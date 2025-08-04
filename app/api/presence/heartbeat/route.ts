import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Authentication wrapper for heartbeat endpoints
async function withAuth(handler: (req: NextRequest, user: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = cookies();
      const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });

      // Require authentication for heartbeat endpoints
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
      console.error('[Presence Heartbeat Auth Error]:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export const POST = withAuth(async (request: NextRequest, user: unknown) => {
  try {
    const body = await request.json();
    const { 
      status = 'online',
      activity = null,
      metadata = {} 
    } = body;

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

    // Update heartbeat timestamp and status
    const heartbeatData = {
      user_id: user.userId,
      organization_id: user.organizationId,
      status,
      lastSeenAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        userName: user.name,
        user_email: user.email,
        activity,
        heartbeat_source: 'api',
        last_heartbeat: new Date().toISOString()
      },
    };

    const { data: presence, error } = await supabaseClient
      .from('user_presence')
      .upsert(heartbeatData, {
        onConflict: 'user_id,organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Presence Heartbeat API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update heartbeat', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Only broadcast if status changed or it's been more than 5 minutes since last broadcast
    const shouldBroadcast = metadata.forceUpdate || 
      !metadata.lastBroadcast || 
      (Date.now() - new Date(metadata.lastBroadcast).getTime()) > 5 * 60 * 1000;

    if (shouldBroadcast) {
      try {
        // Use the standardized broadcast function for presence updates
        const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
        
        const heartbeatPayload = {
          userId: user.userId,
          userName: user.name,
          userEmail: user.email,
          status,
          activity,
          organizationId: user.organizationId,
          lastSeen: new Date().toISOString(),
          metadata: {
            ...metadata,
            heartbeat: true
          },
          timestamp: new Date().toISOString(),
          source: 'heartbeat_api'
        };

        // Broadcast to agents presence channel (lightweight heartbeat)
        await broadcastToChannel(
          UNIFIED_CHANNELS.agentsPresence(user.organizationId),
          UNIFIED_EVENTS.PRESENCE_HEARTBEAT,
          heartbeatPayload
        );

        console.log('[Presence Heartbeat API] Heartbeat broadcast sent');
      } catch (broadcastError) {
        console.error('[Presence Heartbeat API] Broadcast failed:', broadcastError);
        // Don't fail the request if broadcast fails
      }
    }

    return NextResponse.json({
      success: true,
      heartbeat: {
        userId: user.userId,
        status,
        activity,
        lastSeen: presence.lastSeenAt,
        organizationId: user.organizationId,
        timestamp: new Date().toISOString(),
        broadcastSent: shouldBroadcast
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Presence Heartbeat API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest, user: unknown) => {
  try {
    // Get current user's presence status
    const supabaseClient = supabase.admin();

    const { data: presence, error } = await supabaseClient
      .from('user_presence')
      .select('*')
      .eq('user_id', user.userId)
      .eq('organization_id', user.organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Presence Heartbeat API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presence status', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!presence) {
      // No presence record exists, create one
      const defaultPresence = {
        user_id: user.userId,
        organization_id: user.organizationId,
        status: 'online',
        lastSeenAt: new Date().toISOString(),
        metadata: {
          userName: user.name,
          user_email: user.email,
          createdBy: 'heartbeat_api'
        }
      };

      const { data: newPresence, error: createError } = await supabaseClient
        .from('user_presence')
        .insert(defaultPresence)
        .select()
        .single();

      if (createError) {
        console.error('[Presence Heartbeat API] Create error:', createError);
        return NextResponse.json(
          { error: 'Failed to create presence record', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        presence: {
          userId: user.userId,
          userName: user.name,
          status: 'online',
          lastSeen: newPresence.lastSeenAt,
          organizationId: user.organizationId,
          metadata: newPresence.metadata,
          isNew: true
        },
        timestamp: new Date().toISOString()
      });
    }

    // Calculate if user should be considered away (no heartbeat in last 10 minutes)
    const lastSeen = new Date(presence.lastSeenAt);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const shouldBeAway = lastSeen < tenMinutesAgo && presence.status === 'online';

    if (shouldBeAway) {
      // Auto-update to away status
      const { error: updateError } = await supabaseClient
        .from('user_presence')
        .update({
          status: 'away',
          metadata: {
            ...presence.metadata,
            auto_away: true,
            auto_away_at: new Date().toISOString()
          }
        })
        .eq('user_id', user.userId)
        .eq('organization_id', user.organizationId);

      if (!updateError) {
        presence.status = 'away';
      }
    }

    return NextResponse.json({
      presence: {
        userId: user.userId,
        userName: presence.metadata?.userName || user.name,
        status: presence.status,
        customStatus: presence.custom_status,
        lastSeen: presence.lastSeenAt,
        organizationId: user.organizationId,
        metadata: presence.metadata,
        autoAway: shouldBeAway
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Presence Heartbeat API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
