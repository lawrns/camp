import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';

// Simplified optional auth wrapper for widget endpoints
async function withOptionalAuth(handler: (req: NextRequest, user?: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Try to get authentication, but don't require it
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      let user = undefined;
      if (!authError && session) {
        const organizationId = session.user.user_metadata?.organization_id;
        if (organizationId) {
          user = {
            userId: session.user.id,
            organizationId,
            email: session.user.email
          };
        }
      }

      return await handler(request, user);
    } catch (error) {
      console.error('[Auth Error]:', error);
      return await handler(request, undefined);
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, organizationId } = body;

    // Validate required fields
    if (!customerEmail || !organizationId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['customerEmail', 'organizationId'],
            provided: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client (Next.js 15 fix)
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify organization exists and widget is enabled
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, settings')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const widgetEnabled = organization.settings?.widget_enabled ?? true; // Default to enabled
    if (!widgetEnabled) {
      return NextResponse.json(
        { error: 'Widget not enabled for this organization', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check for existing conversation for this customer
    const { data: existingConversation, error: convError } = await supabase
      .from('conversations')
      .select('id, status, updated_at')
      .eq('organization_id', organizationId)
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let conversationId: string;

    if (convError && convError.code !== 'PGRST116') {
      console.error('[Widget Auth API] Conversation fetch error:', convError);
      return NextResponse.json(
        { error: 'Failed to check existing conversation', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id;
      
      // Update conversation if it was closed
      if (existingConversation.status === 'closed') {
        await supabase
          .from('conversations')
          .update({
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
    } else {
      // Create new conversation with correct column names
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
          customer_email: customerEmail,
          customer_name: customerName || customerEmail,
          subject: `New conversation from ${customerEmail}`,
          status: 'open',
          metadata: {
            source: 'widget',
            timestamp: new Date().toISOString(),
          },
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[Widget Auth API] Conversation creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;

      // CRITICAL: Broadcast new conversation to real-time channels for agent dashboard
      try {
        // Get full conversation data for broadcast
        const { data: fullConversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (fullConversation) {
          // Broadcast to organization channel for new conversation notifications
          const orgChannel = UNIFIED_CHANNELS.organization(organizationId);
          await supabase.channel(orgChannel).send({
            type: 'broadcast',
            event: UNIFIED_EVENTS.CONVERSATION_CREATED,
            payload: {
              conversation: fullConversation,
              organizationId,
              timestamp: new Date().toISOString(),
            }
          });

          console.log('[Widget Auth API] New conversation broadcast sent successfully');
        }
      } catch (broadcastError) {
        console.error('[Widget Auth API] New conversation broadcast failed:', broadcastError);
        // Don't fail the request if broadcast fails, but log it
      }
    }

    // Generate a simple session token for widget authentication
    const sessionToken = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      conversationId,
      sessionToken,
      organization: {
        id: organization.id,
        widgetEnabled: organization.widgetEnabled
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Widget Auth API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}