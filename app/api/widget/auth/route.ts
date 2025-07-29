import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { mapDbConversationToApi } from '@/lib/utils/db-type-mappers';

// Simplified optional auth wrapper for widget endpoints
async function withOptionalAuth(handler: (req: NextRequest, user?: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const supabase = createRouteHandlerClient({ cookies });

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
    const { customerEmail, customerName, organizationId, visitorId, sessionData } = body;

    // Validate required fields - organizationId is required, customerEmail is optional for widget auth
    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['organizationId'],
            provided: Object.keys(body)
          }
        }, 
        { status: 400 }
      );
    }

    // Initialize Supabase service role client to bypass RLS for widget operations
    const supabaseClient = supabase.admin();

    // Verify organization exists and widget is enabled
    const { data: organization, error: orgError } = await supabaseClient
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

    const settings = organization.settings as any;
    const widgetEnabled = settings?.widget_enabled ?? true; // Default to enabled
    if (!widgetEnabled) {
      return NextResponse.json(
        { error: 'Widget not enabled for this organization', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Generate or use existing visitor ID
    const generatedVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // For widget auth, we don't need to check existing conversations if no email is provided
    let conversationId: string | null = null;
    
    if (customerEmail) {
      // Check for existing conversation for this customer
      const { data: existingConversation, error: convError } = await supabaseClient
        .from('conversations')
        .select('id, status, updated_at')
        .eq('organization_id', organizationId)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        console.error('[Widget Auth API] Conversation fetch error:', convError);
        return NextResponse.json(
          { error: 'Failed to check existing conversation', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      }
    }

    // Generate a widget authentication token
    const sessionToken = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = customerEmail ? `user_${customerEmail.replace('@', '_').replace('.', '_')}` : generatedVisitorId;

    return NextResponse.json({
      success: true,
      token: sessionToken,
      userId: userId,
      visitorId: generatedVisitorId,
      conversationId: conversationId,
      organizationId: organizationId,
      user: {
        id: userId,
        email: customerEmail || null,
        displayName: customerName || customerEmail || 'Anonymous User',
        organizationId: organizationId
      },
      organization: {
        id: organization.id,
        widgetEnabled: widgetEnabled
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