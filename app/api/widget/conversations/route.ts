import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, visitorId, customerName, customerEmail } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Create conversation using server-side Supabase client with service role
    const { data: conversation, error } = await supabase
      .admin()
      .from('conversations')
      .insert({
        organization_id: organizationId,
        status: 'open',
        subject: 'Widget Conversation',
        customer_name: customerName || 'Website Visitor',
        customer_email: customerEmail || 'visitor@widget.com',
        metadata: {
          source: 'widget',
          visitor_id: visitorId || 'anonymous',
          created_via: 'widget_api',
          timestamp: new Date().toISOString(),
        },
      })
      .select('id, organization_id, status, subject, customer_name, customer_email, created_at, metadata')
      .single();

    if (error) {
      console.error('[Widget API] Failed to create conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: error.message },
        { status: 500 }
      );
    }

    // Return only minimal fields needed by widget
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        organizationId: conversation.organization_id,
        status: conversation.status,
        createdAt: conversation.created_at,
      },
    });

  } catch (error) {
    console.error('[Widget API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const conversationId = searchParams.get('conversationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .admin()
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('metadata->>source', 'widget');

    if (conversationId) {
      query = query.eq('id', conversationId);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('[Widget API] Failed to fetch conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversations,
    });

  } catch (error) {
    console.error('[Widget API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
