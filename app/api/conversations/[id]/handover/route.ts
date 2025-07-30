import { NextRequest, NextResponse } from 'next/server';
import { createCampfireClient } from '@/lib/supabase';
import { aiHandoverService } from '@/lib/ai/handover';
import { AI_PERSONALITIES } from '@/lib/ai/personalities';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const body = await request.json();
    const { organizationId, reason, context } = body;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Create handover context for this specific conversation
    const handoverContext = {
      conversationId,
      organizationId,
      customerId: context?.customerId,
      customerName: context?.customerName,
      customerEmail: context?.customerEmail,
      aiPersonality: AI_PERSONALITIES.HELPFUL,
      messageHistory: context?.messageHistory || [],
      currentIssue: {
        category: context?.category || 'general',
        description: reason || 'User requested human assistance',
        urgency: (context?.urgency || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        tags: context?.tags || []
      },
      aiAnalysis: {
        confidence: context?.confidence || 0.5,
        sentiment: (context?.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative' | 'frustrated' | 'angry',
        complexity: (context?.complexity || 'moderate') as 'simple' | 'moderate' | 'complex',
        suggestedActions: context?.suggestedActions || [],
        escalationReasons: [reason || 'User requested handover']
      }
    };
    
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
      contextSummary: handoverResult.contextSummary
    });
    
  } catch (error) {
    console.error(`[Conversation ${params.id} Handover] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
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