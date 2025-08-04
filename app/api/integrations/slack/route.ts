import { NextRequest, NextResponse } from 'next/server';
import { slackService } from '@/lib/integrations/enhanced-slack-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'send_notification':
        result = await slackService.sendNotification(params.notification);
        break;
      
      case 'notify_assignment':
        result = await slackService.notifyAssignment(
          params.conversationId,
          params.assignedTo,
          params.assignedBy,
          params.reason,
          params.priority
        );
        break;
      
      case 'notify_ai_handover':
        result = await slackService.notifyAIHandover(
          params.conversationId,
          params.confidence,
          params.reason,
          params.customerSentiment
        );
        break;
      
      case 'notify_escalation':
        result = await slackService.notifyEscalation(
          params.conversationId,
          params.escalatedBy,
          params.reason,
          params.customerInfo
        );
        break;
      
      case 'create_thread':
        result = await slackService.createConversationThread(
          params.conversationId,
          params.customerName,
          params.initialMessage
        );
        break;
      
      case 'update_thread':
        result = await slackService.updateConversationThread(
          params.threadTs,
          params.message,
          params.senderType
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Slack integration API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let result;

    switch (action) {
      case 'team_members':
        result = await slackService.getTeamMembers();
        break;
      
      case 'status':
        result = {
          initialized: slackService['isInitialized'],
          configured: !!slackService['config'],
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Slack integration API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Configure Slack integration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, config } = body;

    if (!organizationId || !config) {
      return NextResponse.json(
        { error: 'Missing organizationId or config' },
        { status: 400 }
      );
    }

    // Validate required config fields
    const requiredFields = ['botToken', 'signingSecret', 'defaultChannel'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize Slack service
    slackService.initialize(config);

    // Store configuration in database
    try {
      const supabaseClient = supabase.server();
      const { error } = await supabaseClient
        .from('organization_integrations')
        .upsert({
          organization_id: organizationId,
          integrationType: 'slack',
          config: {
            ...config,
            // Don't store sensitive tokens in plain text in production
            botToken: '***ENCRYPTED***',
            signingSecret: '***ENCRYPTED***',
          },
          isActive: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing Slack config:', error);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if database storage fails
    }

    // Test the configuration
    const testResult = await slackService.sendNotification({
      type: 'new_conversation',
      conversationId: 'test',
      organizationId,
      title: '✅ Slack Integration Configured',
      message: 'Your Slack integration is now active and ready to use!',
      priority: 'medium',
    });

    return NextResponse.json({
      success: true,
      configured: true,
      testResult,
      message: 'Slack integration configured successfully',
    });

  } catch (error) {
    console.error('Slack configuration error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to configure Slack integration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
