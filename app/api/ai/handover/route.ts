import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { aiHandoverService } from '@/lib/ai/handover';
import { AI_PERSONALITIES } from '@/lib/ai/personalities';
import { validateOrganizationAccess } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      organizationId,
      action = 'start',
      reason,
      context,
      targetOperatorId,
      metadata,
      handoverType = 'agent_to_ai', // New: handover type
      confidenceThreshold = 0.8, // New: confidence threshold
      rollbackEnabled = true // New: rollback capability
    } = body;
    
    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Conversation ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Validate confidence threshold for AI handovers
    if (handoverType.includes('ai') && (confidenceThreshold < 0 || confidenceThreshold > 1)) {
      return NextResponse.json(
        { error: 'Confidence threshold must be between 0 and 1' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Validate organization access
    const hasAccess = await validateOrganizationAccess(supabase, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get recent message history
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, content, senderType, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('Error fetching message history:', msgError);
    }

    const messageHistory = messages?.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderType: msg.senderType as 'customer' | 'ai' | 'agent',
      timestamp: msg.created_at
    })) || [];

    if (action === 'start') {
      // Create handover context
      const handoverContext = {
        conversationId,
        organizationId,
        customerId: context?.customerId,
        customerName: context?.customerName,
        customerEmail: context?.customerEmail || conversation.customer_email,
        aiPersonality: AI_PERSONALITIES.HELPFUL,
        messageHistory,
        currentIssue: {
          category: context?.category || 'general',
          description: reason || 'Agent initiated AI handover',
          urgency: context?.urgency || 'medium' as const,
          tags: context?.tags || []
        },
        aiAnalysis: {
          confidence: context?.confidence || 0.8,
          sentiment: context?.sentiment || 'neutral' as const,
          complexity: context?.complexity || 'moderate' as const,
          suggestedActions: context?.suggestedActions || [],
          escalationReasons: [reason || 'Agent initiated handover']
        }
      };
      
      // Evaluate and execute handover
      const handoverResult = await aiHandoverService.evaluateHandover(handoverContext);
      
      if (handoverResult.shouldHandover) {
        await aiHandoverService.executeHandover(handoverContext, handoverResult, targetOperatorId);
        
        // Update conversation status
        await supabase
          .from('conversations')
          .update({
            aiHandoverActive: true,
            assignedToUserId: targetOperatorId || null,
            status: 'ai_active',
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
      
      return NextResponse.json({
        success: true,
        action: 'start',
        conversationId,
        shouldHandover: handoverResult.shouldHandover,
        reason: handoverResult.reason,
        urgency: handoverResult.urgency,
        message: handoverResult.handoverMessage,
        confidence: handoverContext.aiAnalysis.confidence,
        strategy: 'knowledge_base'
      });
      
    } else if (action === 'stop') {
      // Stop AI handover
      await supabase
        .from('conversations')
        .update({
          aiHandoverActive: false,
          assignedToUserId: targetOperatorId || null,
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Update any pending handover records
      await supabase
        .from('campfire_handoffs')
        .update({
          status: 'cancelled',
          assignedAgentId: targetOperatorId,
          completedAt: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('status', 'pending');

      return NextResponse.json({
        success: true,
        action: 'stop',
        conversationId,
        message: 'AI handover stopped successfully'
      });
      
    } else {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('[AI Handover] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const organizationId = searchParams.get('organizationId');

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'Conversation ID and Organization ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get handover status
    const { data: handovers, error: handoverError } = await supabase
      .from('campfire_handoffs')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (handoverError) {
      console.error('Error fetching handover status:', handoverError);
      return NextResponse.json(
        { error: 'Failed to fetch handover status' },
        { status: 500 }
      );
    }

    const latestHandover = handovers?.[0];
    
    // Get conversation status
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('aiHandoverActive, status, assignedToUserId')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversationId,
      organizationId,
      handoverActive: conversation?.aiHandoverActive || false,
      conversationStatus: conversation?.status || 'unknown',
      assignedAgent: conversation?.assignedToUserId,
      latestHandover: latestHandover ? {
        id: latestHandover.id,
        reason: latestHandover.reason,
        priority: latestHandover.priority,
        status: latestHandover.status,
        createdAt: latestHandover.created_at,
        assignedAgent: latestHandover.assignedAgentId
      } : null,
      available: true,
      message: 'Handover service is available'
    });
    
  } catch (error) {
    console.error('[AI Handover Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT method for handover rollback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoverId, organizationId, rollbackReason } = body;

    if (!handoverId || !organizationId) {
      return NextResponse.json(
        { error: 'Handover ID and Organization ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get handover details
    const { data: handover, error: handoverError } = await supabase
      .from('campfire_handoffs')
      .select('*')
      .eq('id', handoverId)
      .eq('organization_id', organizationId)
      .single();

    if (handoverError || !handover) {
      return NextResponse.json(
        { error: 'Handover not found' },
        { status: 404 }
      );
    }

    // Check if rollback is available
    if (!handover.rollback_available) {
      return NextResponse.json(
        { error: 'Rollback not available for this handover' },
        { status: 400 }
      );
    }

    // Perform rollback
    const { data: rolledBackHandover, error: rollbackError } = await supabase
      .from('campfire_handoffs')
      .update({
        status: 'rolled_back',
        updated_at: new Date().toISOString(),
        notes: `${handover.notes || ''}\n\nRollback performed: ${rollbackReason}`,
        metrics: {
          ...handover.metrics,
          rollback_at: new Date().toISOString(),
          rollback_reason: rollbackReason
        }
      })
      .eq('id', handoverId)
      .select()
      .single();

    if (rollbackError) {
      console.error('Rollback error:', rollbackError);
      return NextResponse.json(
        { error: 'Failed to perform rollback' },
        { status: 500 }
      );
    }

    // Restore conversation to previous state if checkpoint exists
    if (handover.last_checkpoint_id) {
      const checkpoints = handover.checkpoints as Record<string, unknown>;
      const lastCheckpoint = checkpoints?.[handover.last_checkpoint_id] as Record<string, unknown>;

      if (lastCheckpoint) {
        await supabase
          .from('conversations')
          .update({
            status: lastCheckpoint.conversation_status,
            assignedAgentId: lastCheckpoint.assignedAgentId,
            ai_session_id: lastCheckpoint.ai_session_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', handover.conversation_id);
      }
    }

    return NextResponse.json({
      success: true,
      handover: rolledBackHandover,
      message: 'Handover successfully rolled back'
    });

  } catch (error) {
    console.error('Handover rollback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
