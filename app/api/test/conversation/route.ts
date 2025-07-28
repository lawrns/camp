import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization ID
    const organizationId = session.user.user_metadata?.organization_id;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Create a test conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organizationId,
        customer_email: 'test@example.com',
        status: 'open',
        subject: 'Test Conversation',
        metadata: {
          source: 'test',
          created_via: 'api'
        }
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Create a test message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        organization_id: organizationId,
        content: 'Hello! This is a test message to verify the chat functionality is working.',
        sender_type: 'customer',
        sender_name: 'Test Customer',
        metadata: {
          source: 'test'
        }
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation,
      message,
      message: 'Test conversation and message created successfully'
    });

  } catch (error) {
    console.error('Test conversation creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create test conversation' },
      { status: 500 }
    );
  }
}
