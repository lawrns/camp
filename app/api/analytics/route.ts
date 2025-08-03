import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateOrganizationAccess, checkRateLimit } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`analytics_${clientIP}`, 30, 60000); // 30 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    // Validate user has access to this organization
    const hasAccess = await validateOrganizationAccess(supabase, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Get analytics data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch conversation metrics
    const { data: conversationMetrics, error: convError } = await supabase
      .from('conversations')
      .select('id, status, created_at, assignedToUserId')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (convError) {
      console.error('Error fetching conversation metrics:', convError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation metrics' },
        { status: 500 }
      );
    }

    // Fetch message metrics
    const { data: messageMetrics, error: msgError } = await supabase
      .from('messages')
      .select('id, senderType, created_at, conversation_id')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (msgError) {
      console.error('Error fetching message metrics:', msgError);
      return NextResponse.json(
        { error: 'Failed to fetch message metrics' },
        { status: 500 }
      );
    }

    // Fetch AI processing metrics
    const { data: aiMetrics, error: aiError } = await supabase
      .from('ai_processing_logs')
      .select('id, status, processingTimeMs, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (aiError) {
      console.error('Error fetching AI metrics:', aiError);
      // Don't fail if AI metrics are unavailable
    }

    // Calculate analytics
    const totalConversations = conversationMetrics?.length || 0;
    const totalMessages = messageMetrics?.length || 0;
    const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

    // Conversation status breakdown
    const statusBreakdown = conversationMetrics?.reduce((acc: unknown, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Message sender breakdown
    const senderBreakdown = messageMetrics?.reduce((acc: unknown, msg) => {
      acc[msg.senderType] = (acc[msg.senderType] || 0) + 1;
      return acc;
    }, {}) || {};

    // AI performance metrics
    const aiPerformance = aiMetrics ? {
      totalProcessed: aiMetrics.length,
      avgProcessingTime: aiMetrics.length > 0 
        ? aiMetrics.reduce((sum, log) => sum + (log.processingTimeMs || 0), 0) / aiMetrics.length 
        : 0,
      successRate: aiMetrics.length > 0 
        ? (aiMetrics.filter(log => log.status === 'completed').length / aiMetrics.length) * 100 
        : 0
    } : null;

    // Daily conversation trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyTrends = last7Days.map(date => {
      const dayConversations = conversationMetrics?.filter(conv => 
        conv.created_at.startsWith(date)
      ).length || 0;
      
      const dayMessages = messageMetrics?.filter(msg => 
        msg.created_at.startsWith(date)
      ).length || 0;

      return {
        date,
        conversations: dayConversations,
        messages: dayMessages
      };
    });

    const analytics = {
      overview: {
        totalConversations,
        totalMessages,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100,
        period: '30 days'
      },
      conversationStatus: statusBreakdown,
      messageSenders: senderBreakdown,
      dailyTrends,
      aiPerformance,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
