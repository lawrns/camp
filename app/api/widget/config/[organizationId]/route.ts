/**
 * Widget Configuration API
 * 
 * Provides organization-specific widget configuration including branding,
 * colors, and settings for the widget interface.
 * 
 * CRITICAL FIX: This endpoint was missing, causing 404 errors in widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

interface WidgetConfig {
  branding?: {
    companyName?: string;
    greeting?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  features?: {
    fileUpload?: boolean;
    typing?: boolean;
    readReceipts?: boolean;
    emoji?: boolean;
  };
  behavior?: {
    autoOpen?: boolean;
    showAgentTyping?: boolean;
    enableSounds?: boolean;
  };
  recentMessage?: {
    from: string;
    preview: string;
    time: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Use service client to ensure access to organization data
    const supabase = getServiceClient();

    // Get organization with settings
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id, name, settings, widget_api_key')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Database error fetching organization:', error);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Extract widget configuration from organization settings
    const settings = organization.settings || {};
    const widgetSettings = settings.widget || {};

    // Build widget configuration response
    const config: WidgetConfig = {
      branding: {
        companyName: organization.name || 'Support',
        greeting: widgetSettings.greeting || 'Hi there! 👋 How can we help you today?',
        logo: widgetSettings.logo || null,
        primaryColor: widgetSettings.primaryColor || '#6366F1',
        secondaryColor: widgetSettings.secondaryColor || '#F3F4F6',
      },
      features: {
        fileUpload: widgetSettings.fileUpload !== false, // Default true
        typing: widgetSettings.typing !== false, // Default true
        readReceipts: widgetSettings.readReceipts !== false, // Default true
        emoji: widgetSettings.emoji !== false, // Default true
      },
      behavior: {
        autoOpen: widgetSettings.autoOpen === true, // Default false
        showAgentTyping: widgetSettings.showAgentTyping !== false, // Default true
        enableSounds: widgetSettings.enableSounds !== false, // Default true
      },
    };

    // Get recent message if available
    if (widgetSettings.showRecentMessage !== false) {
      try {
        const { data: recentMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_type')
          .eq('organization_id', organizationId)
          .eq('sender_type', 'agent')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentMessage) {
          config.recentMessage = {
            from: 'Support Team',
            preview: recentMessage.content.substring(0, 100) + (recentMessage.content.length > 100 ? '...' : ''),
            time: new Date(recentMessage.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          };
        }
      } catch (messageError) {
        // Don't fail if we can't get recent message
        console.log('Could not fetch recent message:', messageError);
      }
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('Widget config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const updates: Partial<WidgetConfig> = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Use service client for admin operations
    const supabase = getServiceClient();

    // Get current organization settings
    const { data: organization, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (fetchError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Merge widget settings
    const currentSettings = organization.settings || {};
    const currentWidgetSettings = currentSettings.widget || {};
    
    const updatedWidgetSettings = {
      ...currentWidgetSettings,
      ...updates.branding,
      ...updates.features,
      ...updates.behavior,
    };

    const updatedSettings = {
      ...currentSettings,
      widget: updatedWidgetSettings,
    };

    // Update organization settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Database error updating widget config:', updateError);
      return NextResponse.json(
        { error: 'Failed to update widget configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Widget configuration updated successfully' 
    });

  } catch (error) {
    console.error('Widget config update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
