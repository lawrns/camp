import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIService } from '@/lib/ai/enhanced-ai-service';
import { createServiceRoleClient } from '@/lib/supabase';
import { slackService } from '@/lib/integrations/enhanced-slack-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      conversationId,
      organizationId,
      messageContent,
      messageId,
      customerInfo,
      conversationHistory
    } = body;

    // Validate required fields
    if (!conversationId || !organizationId || !messageContent) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, organizationId, messageContent' },
        { status: 400 }
      );
    }

    // Process the message with enhanced AI
    const aiResponse = await enhancedAIService.processMessage({
      conversationId,
      organizationId,
      messageContent,
      messageId: messageId || `msg_${Date.now()}`,
      customerInfo,
      conversationHistory: conversationHistory || [],
    });

    // Create handover record if AI confidence is low
    if (aiResponse.confidence < 0.7 || aiResponse.handoverReason) {
      try {
        const supabaseClient = createServiceRoleClient();
        
        // FIXED: AI handover functionality restored (Critical Issue C016)
        await supabaseClient
          .from('campfire_handoffs')
          .insert({
            conversation_id: conversationId,
            organization_id: organizationId,
            reason: aiResponse.handoverReason || `Low AI confidence: ${aiResponse.confidence}`,
            priority: aiResponse.metadata?.urgency || 'medium',
            transferType: 'ai-to-human',
            conversationState: {
              messageHistory: [{
                id: crypto.randomUUID(),
                sender: 'customer',
                content: messageContent,
                timestamp: new Date().toISOString()
              }],
              aiContext: {
                lastModel: 'gpt-4',
                confidence: aiResponse.confidence,
                knowledgeUsed: aiResponse.sources || []
              },
              customerInfo: {
                tier: 'standard'
              },
              sessionVariables: {},
              tags: []
            },
            customerSentiment: aiResponse.sentiment || 'neutral',
            topicComplexity: aiResponse.metadata?.complexity || 'medium',
            urgencyScore: 1.0 - aiResponse.confidence, // Higher urgency for lower confidence
            escalationTriggers: [aiResponse.handoverReason || 'low_confidence'],
            automatedTriggers: {
              sentimentThreshold: false,
              responseTimeExceeded: false,
              keywordDetected: false,
              customerRequest: false,
              aiConfidenceLow: aiResponse.confidence < 0.7
            },
            status: 'pending'
          });

        // Send Slack notification for handover
        try {
          await slackService.notifyAIHandover(
            conversationId,
            aiResponse.confidence,
            aiResponse.handoverReason || 'Low AI confidence',
            aiResponse.sentiment
          );
        } catch (slackError) {
          console.error('Error sending Slack handover notification:', slackError);
        }
      } catch (handoverError) {
        console.error('Error creating handover record:', handoverError);
        // Don't fail the response if handover record creation fails
      }
    }

    // Store the AI response in the database
    try {
      const supabaseClient = createServiceRoleClient();
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          organization_id: organizationId,
          content: aiResponse.content,
          senderType: 'ai',
          metadata: {
            confidence: aiResponse.confidence,
            sources: aiResponse.sources,
            sentiment: aiResponse.sentiment,
            responseTime: aiResponse.responseTime,
            aiPersonality: aiResponse.metadata.aiPersonality,
            empathyScore: aiResponse.metadata.empathyScore,
          },
          created_at: new Date().toISOString(),
        });
    } catch (dbError) {
      console.error('Error storing AI response:', dbError);
      // Don't fail the response if database storage fails
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });

  } catch (error) {
    console.error('Enhanced AI API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check for the AI service
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      service: 'enhanced-ai-response',
      timestamp: new Date().toISOString(),
      capabilities: [
        'RAG-powered responses',
        'Intelligent handover detection',
        'Sentiment analysis',
        'Confidence scoring',
        'Knowledge base integration',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}
