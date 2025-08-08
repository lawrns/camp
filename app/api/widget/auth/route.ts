import { NextRequest, NextResponse } from 'next/server';
// (removed unused: supabaseFactory, cookies)
import { supabase } from '@/lib/supabase';
// (unused imports removed)
import { createOrGetSharedConversation } from '@/lib/services/shared-conversation-service';

// (unused optional auth wrapper removed)

// GET method for session validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const organizationId = searchParams.get('organizationId');

    if (!token || !organizationId) {
      return NextResponse.json(
        { error: 'Missing token or organizationId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate session token (simple validation for now)
    if (!token.startsWith('widget_')) {
      return NextResponse.json(
        { error: 'Invalid token format', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Verify organization exists
    const supabaseClient = supabase.admin();
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

    return NextResponse.json({
      valid: true,
      organizationId,
      organization: {
        id: organization.id,
        widgetEnabled: ((organization.settings as { widget_enabled?: boolean } | null)?.widget_enabled) ?? true
      }
    });

  } catch (error) {
    console.error('[Widget Auth GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PUT method for session refresh
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, organizationId } = body;

    if (!token || !organizationId) {
      return NextResponse.json(
        { error: 'Missing token or organizationId', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate new session token
    const newToken = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    return NextResponse.json({
      success: true,
      token: newToken,
      organizationId,
      refreshedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Widget Auth PUT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerEmail, customerName, organizationId, visitorId, sessionData } = body;

    // CRITICAL FIX: Handle organizationId from header if not in body (UltimateWidget compatibility)
    const orgIdFromHeader = request.headers.get('X-Organization-ID');
    const finalOrganizationId = organizationId || orgIdFromHeader;

    // Validate required fields - organizationId is required, customerEmail is optional for widget auth
    if (!finalOrganizationId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR',
          details: {
            required: ['organizationId (in body or X-Organization-ID header)'],
            provided: Object.keys(body),
            headers: { 'X-Organization-ID': orgIdFromHeader }
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
      .eq('id', finalOrganizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const settings = organization.settings as { widget_enabled?: boolean } | null;
    const widgetEnabled = (settings && typeof settings.widget_enabled === 'boolean') ? settings.widget_enabled : true; // Default to enabled
    if (!widgetEnabled) {
      return NextResponse.json(
        { error: 'Widget not enabled for this organization', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Generate or use existing visitor ID
    const generatedVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use shared conversation service to create or get existing conversation
    let conversation;
    try {
      conversation = await createOrGetSharedConversation({
        organizationId: finalOrganizationId,
        customerEmail,
        customerName,
        visitorId: generatedVisitorId,
        source: 'widget',
        metadata: {
          widget_session: true,
          userAgent: sessionData?.userAgent,
          referrer: sessionData?.referrer,
          current_url: sessionData?.currentUrl,
        }
      });
    } catch (error) {
      console.error('[Widget Auth API] Shared conversation creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Generate a widget authentication token
    const sessionToken = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = customerEmail ? `user_${customerEmail.replace('@', '_').replace('.', '_')}` : generatedVisitorId;

    return NextResponse.json({
      success: true,
      token: sessionToken,
      userId: userId,
      visitorId: generatedVisitorId,
      conversationId: conversation.id,
      organizationId: finalOrganizationId,
      user: {
        id: userId,
        email: customerEmail || null,
        displayName: customerName || customerEmail || 'Anonymous User',
        organizationId: finalOrganizationId
      },
      organization: {
        id: organization.id,
        widgetEnabled: widgetEnabled
      },
      conversation: {
        id: conversation.id,
        status: conversation.status,
        priority: conversation.priority
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