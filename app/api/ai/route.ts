import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role-server';
import { aiHandoverService } from '@/lib/ai/handover';
import { AI_PERSONALITIES } from '@/lib/ai/personalities';

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
        const { conversationId, organizationId, reason, context } = body;
        
        if (!conversationId || !organizationId) {
          return NextResponse.json(
            { error: 'Conversation ID and Organization ID are required for handover' },
            { status: 400 }
          );
        }
        
        // Create handover context
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
            urgency: context?.urgency || 'medium' as const,
            tags: context?.tags || []
          },
          aiAnalysis: {
            confidence: context?.confidence || 0.5,
            sentiment: context?.sentiment || 'neutral' as const,
            complexity: context?.complexity || 'moderate' as const,
            suggestedActions: context?.suggestedActions || [],
            escalationReasons: [reason || 'User requested handover']
          }
        };
        
        // Evaluate and execute handover
        const handoverResult = await aiHandoverService.evaluateHandover(handoverContext);
        await aiHandoverService.executeHandover(handoverContext, handoverResult);
        
        return NextResponse.json({
          success: true,
          shouldHandover: handoverResult.shouldHandover,
          reason: handoverResult.reason,
          urgency: handoverResult.urgency,
          message: handoverResult.handoverMessage
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

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'AI API is running', version: '1.0.0' },
    { status: 200 }
  );
}