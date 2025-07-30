import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/consolidated-exports';

// Widget API route handler for various actions
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();
    const organizationId = request.headers.get('x-organization-id') || body.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Organization ID is required' 
          }
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create-conversation':
        return await handleCreateConversation(body, organizationId);
      
      case 'send-message':
        return await handleSendMessage(body, organizationId);
      
      default:
        return NextResponse.json(
          { 
            success: false,
            error: { 
              code: 'INVALID_ACTION',
              message: `Unknown action: ${action}` 
            }
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Widget API Error]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'INTERNAL_ERROR',
          message: 'Internal server error' 
        }
      },
      { status: 500 }
    );
  }
}

async function handleCreateConversation(body: any, organizationId: string) {
  try {
    const { visitorId, initialMessage, customerEmail, customerName } = body;
    
    // Initialize Supabase service role client to bypass RLS for widget operations
    const supabaseClient = supabase.admin();
    
    // Generate UUID for conversation ID
    const conversationId = crypto.randomUUID();
    
    // Create conversation in database
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .insert({
        id: conversationId,
        organization_id: organizationId,
        customer_email: customerEmail || null,
        customer_name: customerName || 'Anonymous User',
        status: 'open',
        priority: 'medium',
        created_at: new Date().toISOString(),
        metadata: {
          source: 'widget',
          visitorId: visitorId || `visitor_${Date.now()}`,
          userAgent: body.userAgent,
          referrer: body.referrer,
          currentUrl: body.currentUrl
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[Widget API] Database conversation creation error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'DATABASE_ERROR',
            message: 'Failed to create conversation in database'
          }
        },
        { status: 500 }
      );
    }

    console.log('[Widget API] Created conversation:', conversationId);

    return NextResponse.json({
      success: true,
      conversationId,
      conversation,
      data: {
        conversation
      }
    });
  } catch (error) {
    console.error('[Widget API] Create conversation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'CONVERSATION_CREATE_ERROR',
          message: 'Failed to create conversation' 
        }
      },
      { status: 500 }
    );
  }
}

async function handleSendMessage(body: any, organizationId: string) {
  try {
    const { conversationId, content, senderEmail, senderName, senderType = 'customer' } = body;

    // Validate required fields
    if (!conversationId || !content) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: conversationId and content are required' 
          }
        },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client to bypass RLS for widget operations
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Conversation not found' 
          }
        },
        { status: 404 }
      );
    }

    // Create message with proper organization context and correct column names
    const { data: message, error } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        content,
        sender_email: senderEmail,
        sender_name: senderName,
        sender_type: senderType === 'customer' ? 'visitor' : senderType,
        metadata: {
          source: 'widget',
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[Widget API] Send message error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'MESSAGE_CREATE_ERROR',
            message: 'Failed to send message' 
          }
        },
        { status: 500 }
      );
    }

    console.log('[Widget API] Message sent:', message.id);

    return NextResponse.json({
      success: true,
      message,
      data: {
        message
      }
    });
  } catch (error) {
    console.error('[Widget API] Send message error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'INTERNAL_ERROR',
          message: 'Internal server error' 
        }
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for widget session initialization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Organization ID is required' 
          }
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'session':
        return await handleGetSession(organizationId);
      
      default:
        return NextResponse.json(
          { 
            success: false,
            error: { 
              code: 'INVALID_ACTION',
              message: `Unknown action: ${action}` 
            }
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Widget API Error]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'INTERNAL_ERROR',
          message: 'Internal server error' 
        }
      },
      { status: 500 }
    );
  }
}

async function handleGetSession(organizationId: string) {
  try {
    // Generate session data
    const sessionId = `session_${Date.now()}`;
    const token = `token_${Math.random().toString(36).substr(2, 16)}`;
    
    return NextResponse.json({
      success: true,
      token,
      session: {
        id: sessionId,
        organizationId,
        createdAt: new Date().toISOString()
      },
      config: {
        theme: 'light',
        primaryColor: '#3b82f6',
        enableRealtime: true
      }
    });
  } catch (error) {
    console.error('[Widget API] Get session error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'SESSION_ERROR',
          message: 'Failed to get session' 
        }
      },
      { status: 500 }
    );
  }
}