import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/consolidated-exports';
import { validateOrganizationId, sanitizeErrorMessage, checkRateLimit } from '@/lib/utils/validation';
import { widgetRateLimit } from '@/lib/middleware/rate-limit';
import { identifyVisitor, associateConversation } from '@/lib/services/visitor-identification';
import { WidgetSchemas, validateRequest, BaseSchemas } from '@/lib/validation/schemas';
import { generateUniqueVisitorName } from '@/lib/utils/nameGenerator';
import { z } from 'zod';
import { Message, Conversation } from '@/types/unified-types';

// Widget API route handler for various actions
export async function POST(request: NextRequest) {
  // PHASE 1 CRITICAL FIX: Apply rate limiting to widget endpoints
  return widgetRateLimit(request, async () => {
    try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    // PHASE 2 CRITICAL FIX: Input validation with Zod schemas
    const actionValidation = validateRequest(z.object({
      action: BaseSchemas.widgetAction
    }), body);

    if (!actionValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request format',
            details: actionValidation.errors
          }
        },
        { status: 400 }
      );
    }

    // SECURITY FIX: Validate organization ID format and prevent injection
    let organizationId: string;
    try {
      organizationId = validateOrganizationId(
        request.headers.get('x-organization-id'),
        body.organizationId
      );
    } catch (validationError) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'VALIDATION_ERROR',
            message: sanitizeErrorMessage(validationError)
          }
        },
        { status: 400 }
      );
    }

    // SECURITY FIX: Basic rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`widget-${clientIP}`, 60, 60000); // 60 requests per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }

    switch (action) {
      case 'create-conversation':
        return await handleCreateConversation(body, organizationId, request);

      case 'send-message':
        return await handleSendMessage(body, organizationId, request);
      
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
  }); // Close rate limiting wrapper
}

interface CreateConversationRequest {
  providedVisitorId?: string;
  initialMessage?: string;
  customerEmail?: string;
  customerName?: string;
  userAgent?: string;
  referrer?: string;
  currentUrl?: string;
  organizationId?: string;
}

async function handleCreateConversation(body: CreateConversationRequest, organizationId: string, request: NextRequest) {
  try {
    // PHASE 2 CRITICAL FIX: Validate create conversation request
    const validation = validateRequest(WidgetSchemas.createConversation, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid create conversation request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data as z.infer<typeof WidgetSchemas.createConversation>;
    const { providedVisitorId, initialMessage, customerEmail, customerName } = validatedData;

    // PHASE 1 CRITICAL FIX: Replace hardcoded visitor IDs with proper identification
    const visitorInfo = await identifyVisitor(organizationId, request, providedVisitorId);

    // PHASE 0 CRITICAL FIX: Implement proper widget token validation before RLS bypass
    // Validate widget token before allowing admin access
    const authHeader = request.headers.get('authorization');
    const widgetToken = authHeader?.replace('Bearer ', '');

    if (!widgetToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Widget token required' } },
        { status: 401 }
      );
    }

    // Validate widget token belongs to the organization
    const isValidToken = await validateWidgetToken(widgetToken, organizationId);
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid widget token' } },
        { status: 401 }
      );
    }

    // Only after validation, use admin client for widget operations
    const supabaseClient = supabase.admin();
    
    // Generate UUID for conversation ID
    const conversationId = crypto.randomUUID();
    
    // Create conversation in database
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .insert({
        id: conversationId,
        organizationId: organizationId,
        customerEmail: customerEmail || null,
        customerName: customerName || generateUniqueVisitorName(providedVisitorId || 'anonymous'),
        status: 'open',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'widget',
          visitorId: visitorInfo.visitorId,
          sessionId: visitorInfo.sessionId,
          sessionToken: visitorInfo.sessionToken,
          isReturning: visitorInfo.isReturning,
          browserInfo: visitorInfo.metadata.browserInfo,
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

    // Associate conversation with session
    await associateConversation(visitorInfo.sessionToken, conversation.id);

    return NextResponse.json({
      success: true,
      conversationId,
      conversation,
      visitorInfo: {
        visitorId: visitorInfo.visitorId,
        sessionId: visitorInfo.sessionId,
        sessionToken: visitorInfo.sessionToken,
        isReturning: visitorInfo.isReturning
      },
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

interface SendMessageRequest {
  conversationId: string;
  content: string;
  senderEmail?: string;
  senderName?: string;
  senderType?: string;
}

async function handleSendMessage(body: SendMessageRequest, organizationId: string, request: NextRequest) {
  try {
    // PHASE 2 CRITICAL FIX: Validate send message request
    const validation = validateRequest(WidgetSchemas.sendMessage, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid send message request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data as z.infer<typeof WidgetSchemas.sendMessage>;
    const { conversationId, content, senderEmail, senderName, senderType = 'customer' } = validatedData;

    // Validate required fields (additional check)
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

    // PHASE 0 CRITICAL FIX: Implement proper widget token validation before RLS bypass
    const authHeader = request.headers.get('authorization');
    const widgetToken = authHeader?.replace('Bearer ', '');

    if (!widgetToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Widget token required' } },
        { status: 401 }
      );
    }

    // Validate widget token belongs to the organization
    const isValidToken = await validateWidgetToken(widgetToken, organizationId);
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid widget token' } },
        { status: 401 }
      );
    }

    // Only after validation, use admin client for widget operations
    const supabaseClient = supabase.admin();

    // Verify conversation exists and belongs to organization
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('organizationId', organizationId)
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
        conversationId: conversationId,
        organizationId: organizationId,
        content,
        senderEmail: senderEmail,
        senderName: senderName,
        senderType: senderType === 'customer' ? 'visitor' : senderType,
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

    // CRITICAL FIX: Broadcast message to real-time channels for dashboard
    try {
      // Import the standardized broadcast function
      const { broadcastToChannel } = await import('@/lib/realtime/standardized-realtime');
      const { UNIFIED_CHANNELS, UNIFIED_EVENTS } = await import('@/lib/realtime/unified-channel-standards');

      const messagePayload = {
        message,
        conversationId,
        organizationId,
        timestamp: new Date().toISOString(),
        source: 'widget'
      };

      // Broadcast to conversation-specific channel (for dashboard agents viewing this conversation)
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      // Broadcast to organization channel (for conversation list updates)
      await broadcastToChannel(
        UNIFIED_CHANNELS.organization(organizationId),
        UNIFIED_EVENTS.CONVERSATION_UPDATED,
        {
          conversationId,
          organizationId,
          lastMessage: message,
          timestamp: new Date().toISOString(),
          source: 'widget'
        }
      );

      // Broadcast to conversations channel for dashboard conversation list updates
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversations(organizationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        messagePayload
      );

      console.log('[Widget API] Real-time broadcast sent successfully');
    } catch (broadcastError) {
      console.error('[Widget API] Real-time broadcast failed:', broadcastError);
      // Don't fail the request if broadcast fails, but log it
    }

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
    const token = `token_${Math.random().toString(36).substring(2, 16)}`;
    
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

/**
 * PHASE 0 CRITICAL FIX: Widget token validation function
 * Validates that a widget token belongs to the specified organization
 */
async function validateWidgetToken(token: string, organizationId: string): Promise<boolean> {
  try {
    // Use regular client for token validation (not admin)
    const supabaseClient = supabase.browser();

    // Check if token exists and belongs to organization
    const { data: widgetSettings, error } = await supabaseClient
      .from('widget_settings')
      .select('organizationId')
      .eq('apiKey', token)
      .eq('organizationId', organizationId)
      .single();

    if (error || !widgetSettings) {
      console.warn('[Widget Auth] Invalid token validation:', { token: token.substring(0, 8) + '...', organizationId });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Widget Auth] Token validation error:', error);
    return false;
  }
}