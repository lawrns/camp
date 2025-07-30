import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIAnalytics } from '@/lib/analytics/enhanced-ai-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'performance';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let data;

    switch (type) {
      case 'performance':
        data = await enhancedAIAnalytics.getPerformanceMetrics(organizationId, start, end);
        break;

      case 'trends':
        const granularity = searchParams.get('granularity') as 'hour' | 'day' | 'week' || 'day';
        data = await enhancedAIAnalytics.getTrendData(organizationId, start, end, granularity);
        break;

      case 'realtime':
        data = await enhancedAIAnalytics.getRealTimeMetrics(organizationId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: performance, trends, or realtime' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        organizationId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Enhanced AI Analytics API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      conversationId,
      organizationId,
      messageId,
      aiResponseTime,
      confidence,
      sentiment,
      handoverTriggered,
      handoverReason,
      sourcesUsed,
      empathyScore,
      userSatisfaction,
      responseCategory,
    } = body;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing required field: organizationId' },
        { status: 400 }
      );
    }

    await enhancedAIAnalytics.trackInteraction({
      conversationId,
      organizationId,
      messageId,
      aiResponseTime: aiResponseTime || 0,
      confidence: confidence || 0,
      sentiment: sentiment || 'neutral',
      handoverTriggered: handoverTriggered || false,
      handoverReason,
      sourcesUsed: sourcesUsed || 0,
      empathyScore: empathyScore || 0,
      userSatisfaction,
      responseCategory: responseCategory || 'detailed_response',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'AI interaction tracked successfully',
    });

  } catch (error) {
    console.error('Track AI interaction error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
