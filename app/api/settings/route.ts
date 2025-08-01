import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrganizationAccess, checkRateLimit } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`settings_${clientIP}`, 20, 60000); // 20 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    // Validate user has access to this organization
    const hasAccess = await validateOrganizationAccess(supabase, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Fetch organization settings
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch organization settings' },
        { status: 500 }
      );
    }

    // Fetch widget settings
    const { data: widgetSettings, error: widgetError } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (widgetError && widgetError.code !== 'PGRST116') {
      console.error('Error fetching widget settings:', widgetError);
      return NextResponse.json(
        { error: 'Failed to fetch widget settings' },
        { status: 500 }
      );
    }

    // Fetch widget welcome config
    const { data: welcomeConfig, error: welcomeError } = await supabase
      .from('widget_welcome_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (welcomeError && welcomeError.code !== 'PGRST116') {
      console.error('Error fetching welcome config:', welcomeError);
    }

    // Fetch agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, status, user_id')
      .eq('organization_id', organizationId);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
    }

    // Fetch mailboxes
    const { data: mailboxes, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('id, name, slug, description')
      .eq('organization_id', organizationId);

    if (mailboxError) {
      console.error('Error fetching mailboxes:', mailboxError);
    }

    const settings = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        created_at: organization.created_at,
        updated_at: organization.updated_at
      },
      widget: {
        enabled: widgetSettings?.is_enabled || false,
        title: widgetSettings?.widget_title || 'Chat with us',
        subtitle: widgetSettings?.widget_subtitle || 'We\'re here to help!',
        position: widgetSettings?.position || 'bottom-right',
        primary_color: widgetSettings?.primary_color || '#3B82F6',
        secondary_color: widgetSettings?.secondary_color || '#1F2937',
        show_avatar: widgetSettings?.show_avatar || true,
        show_typing_indicator: widgetSettings?.show_typing_indicator || true,
        auto_open: widgetSettings?.auto_open || false,
        settings: widgetSettings?.settings || {}
      },
      welcome: {
        enabled: welcomeConfig?.is_enabled || false,
        message: welcomeConfig?.message || 'Welcome! How can we help you today?',
        trigger_type: welcomeConfig?.trigger_type || 'page_load',
        trigger_value: welcomeConfig?.trigger_value || 0
      },
      agents: agents || [],
      mailboxes: mailboxes || [],
      features: {
        ai_enabled: true,
        realtime_enabled: true,
        file_uploads: true,
        typing_indicators: true,
        read_receipts: true
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { organizationId, settings } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate user has access to this organization
    const hasAccess = await validateOrganizationAccess(supabase, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Update organization settings if provided
    if (settings.organization) {
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: settings.organization.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (orgError) {
        console.error('Error updating organization:', orgError);
        return NextResponse.json(
          { error: 'Failed to update organization settings' },
          { status: 500 }
        );
      }
    }

    // Update widget settings if provided
    if (settings.widget) {
      const widgetData = {
        organization_id: organizationId,
        widget_title: settings.widget.title,
        widget_subtitle: settings.widget.subtitle,
        primary_color: settings.widget.primary_color,
        secondary_color: settings.widget.secondary_color,
        position: settings.widget.position,
        is_enabled: settings.widget.enabled,
        show_avatar: settings.widget.show_avatar,
        show_typing_indicator: settings.widget.show_typing_indicator,
        auto_open: settings.widget.auto_open,
        settings: settings.widget.settings || {},
        updated_at: new Date().toISOString()
      };

      const { error: widgetError } = await supabase
        .from('widget_settings')
        .upsert(widgetData);

      if (widgetError) {
        console.error('Error updating widget settings:', widgetError);
        return NextResponse.json(
          { error: 'Failed to update widget settings' },
          { status: 500 }
        );
      }
    }

    // Update welcome config if provided
    if (settings.welcome) {
      const welcomeData = {
        organization_id: organizationId,
        message: settings.welcome.message,
        is_enabled: settings.welcome.enabled,
        trigger_type: settings.welcome.trigger_type,
        trigger_value: settings.welcome.trigger_value,
        updated_at: new Date().toISOString()
      };

      const { error: welcomeError } = await supabase
        .from('widget_welcome_config')
        .upsert(welcomeData);

      if (welcomeError) {
        console.error('Error updating welcome config:', welcomeError);
        return NextResponse.json(
          { error: 'Failed to update welcome config' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to update settings.' },
    { status: 405 }
  );
}
