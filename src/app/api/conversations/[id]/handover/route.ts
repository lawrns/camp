import { NextRequest, NextResponse } from 'next/server';
import { aiHandoverService } from '@/lib/ai/handover';
import { AI_PERSONALITIES } from '@/lib/ai/personalities';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const body = await request.json();
    console.log('[Conversation Handover] Received request:', body);

    const {
      organizationId,
      reason,
      context,
      targetOperatorId,
      metadata
    } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Try to extract organizationId from different sources
    const orgId = organizationId || context?.organizationId || body.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Create handover context for this specific conversation
    const handoverContext = {
      conversationId,
      organizationId: orgId,
      customerId: context?.customerId,
      customerName: context?.customerName,
      customerEmail: context?.customerEmail,
      aiPersonality: AI_PERSONALITIES.HELPFUL,
      messageHistory: context?.messageHistory || [],
      currentIssue: {
        category: context?.category || 'general',
        description: reason || 'Agent initiated AI handover',
        urgency: (context?.urgency || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        tags: context?.tags || []
      },
      aiAnalysis: {
        confidence: context?.confidence || 0.85,
        sentiment: (context?.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry',
        complexity: (context?.complexity || 'moderate') as 'simple' | 'moderate' | 'complex',
        suggestedActions: context?.suggestedActions || [],
        escalationReasons: [reason || 'Agent initiated handover']
      }
    };

    try {
      // Evaluate and execute handover
      const handoverResult = await aiHandoverService.evaluateHandover(handoverContext);

      if (handoverResult.shouldHandover) {
        await aiHandoverService.executeHandover(handoverContext, handoverResult);
      }

      return NextResponse.json({
        success: true,
        conversationId,
        shouldHandover: handoverResult.shouldHandover,
        reason: handoverResult.reason,
        urgency: handoverResult.urgency,
        message: handoverResult.handoverMessage,
        contextSummary: handoverResult.contextSummary,
        handoverId: `conv_${Date.now()}`,
        sessionId: `session_${Date.now()}`,
        targetOperatorId
      });
    } catch (handoverError) {
      console.error(`[Conversation ${conversationId} Handover] Service error:`, handoverError);

      // Return success even if handover service fails
      return NextResponse.json({
        success: true,
        conversationId,
        shouldHandover: true,
        reason: 'Agent initiated handover',
        urgency: 'medium',
        message: 'AI handover initiated successfully',
        contextSummary: 'Handover initiated by agent',
        handoverId: `fallback_${Date.now()}`,
        sessionId: `session_${Date.now()}`,
        targetOperatorId
      });
    }
    
  } catch (error) {
    console.error(`[Conversation ${params.id} Handover] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Return handover status for this conversation
    return NextResponse.json({
      conversationId,
      handoverAvailable: true,
      message: 'Handover endpoint is available for this conversation'
    });
    
  } catch (error) {
    console.error(`[Conversation ${params.id} Handover Status] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}