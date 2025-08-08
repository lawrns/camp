import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Simplified auth wrapper for API endpoints
async function withAuth(handler: (req: NextRequest, user: unknown, params: unknown) => Promise<NextResponse>) {
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

export const GET = withAuth(async (request: NextRequest, user: unknown, params: unknown) => {
  try {
    const { id } = params;

    // Verify user has access to this organization
    if (user.organizationId !== id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get organization settings with proper organization context
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organizationId', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Return default settings if none exist
        const defaultSettings = {
          organizationId: id,
          widgetEnabled: true,
          widgetColor: '#6366F1',
          widgetPosition: 'bottom-right',
          autoReplyEnabled: false,
          businessHours: {
            enabled: false,
            timezone: 'UTC',
            hours: {
              monday: { start: '09:00', end: '17:00', enabled: true },
              tuesday: { start: '09:00', end: '17:00', enabled: true },
              wednesday: { start: '09:00', end: '17:00', enabled: true },
              thursday: { start: '09:00', end: '17:00', enabled: true },
              friday: { start: '09:00', end: '17:00', enabled: true },
              saturday: { start: '09:00', end: '17:00', enabled: false },
              sunday: { start: '09:00', end: '17:00', enabled: false }
            }
          },
          notificationSettings: {
            email: true,
            slack: false,
            webhook: false
          }
        };
        return NextResponse.json(defaultSettings);
      }
      console.error('[Organization Settings API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('[Organization Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, user: unknown, params: unknown) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { widgetEnabled, widgetColor, widgetPosition, autoReplyEnabled, businessHours, notificationSettings } = body;

    // Verify user has access to this organization
    if (user.organizationId !== id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (widgetEnabled === undefined) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          code: 'VALIDATION_ERROR',
          details: {
            required: ['widgetEnabled'],
            provided: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Update or create settings with proper organization context
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .upsert({
        organizationId: id,
        widgetEnabled,
        widgetColor: widgetColor || '#6366F1',
        widgetPosition: widgetPosition || 'bottom-right',
        autoReplyEnabled: autoReplyEnabled || false,
        businessHours: businessHours || {
          enabled: false,
          timezone: 'UTC',
          hours: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '17:00', enabled: false },
            sunday: { start: '09:00', end: '17:00', enabled: false }
          }
        },
        notificationSettings: notificationSettings || {
          email: true,
          slack: false,
          webhook: false
        },
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Organization Settings API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update settings', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('[Organization Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}); 