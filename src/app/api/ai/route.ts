import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'AI API is running',
    version: '1.0.0',
    endpoints: {
      'POST /api/ai?action=handover': 'Initiate or stop AI handover'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'handover': {
        const body = await request.json();
        console.log('[AI API] Received handover request:', body);

        const {
          conversationId,
          organizationId,
          reason,
          context,
          action: handoverAction,
          targetOperatorId,
          metadata
        } = body;

        if (!conversationId || !organizationId) {
          return NextResponse.json(
            { error: 'Conversation ID and Organization ID are required for handover' },
            { status: 400 }
          );
        }

        // Handle different handover actions
        if (handoverAction === 'stop') {
          // Handle AI stop/agent takeover
          return NextResponse.json({
            success: true,
            action: 'stopped',
            message: 'AI handover stopped successfully',
            handoverId: `stop_${Date.now()}`,
            targetOperatorId
          });
        }
        
        // Return a simple success response for now
        return NextResponse.json({
          success: true,
          shouldHandover: true,
          reason: reason || 'Agent initiated handover',
          urgency: 'medium',
          message: 'AI handover initiated successfully',
          handoverId: `ai_${Date.now()}`,
          sessionId: `session_${Date.now()}`,
          conversationId,
          organizationId,
          targetOperatorId
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

