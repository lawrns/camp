import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = supabase.server(cookieStore);

    // Check authentication
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization ID
    const organizationId = session.user.user_metadata?.organization_id;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Fetch real metrics from database
    const [conversationsResult, messagesResult] = await Promise.allSettled([
      // Get active conversations count
      supabaseClient
        .from('conversations')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'open'),
      
      // Get recent messages for response time calculation
      supabaseClient
        .from('messages')
        .select('created_at, sender_type')
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Calculate metrics
    const activeConversations = conversationsResult.status === 'fulfilled' 
      ? conversationsResult.value.count || 0 
      : 0;

    // Calculate average response time (mock calculation for now)
    const avgResponseTime = calculateResponseTime();
    
    // Calculate AI resolution rate (mock for now)
    const aiResolutionRate = calculateAIResolutionRate();
    
    // Calculate customer satisfaction (mock for now)
    const customerSatisfaction = calculateCustomerSatisfaction();

    // Return both structured and flat formats for compatibility
    const metrics = {
      // Structured format for components that expect {value, change, trend}
      structured: {
        activeConversations: {
          value: activeConversations,
          change: activeConversations > 20 ? '+15%' : activeConversations > 10 ? '+8%' : '-2%',
          trend: activeConversations > 20 ? 'up' : activeConversations > 10 ? 'up' : 'down',
        },
        responseTime: {
          value: `${avgResponseTime}s`,
          change: avgResponseTime < 1.0 ? '-0.2s' : '+0.1s',
          trend: avgResponseTime < 1.0 ? 'down' : 'up',
        },
        aiResolutionRate: {
          value: `${aiResolutionRate}%`,
          change: aiResolutionRate > 85 ? '+3%' : '+1%',
          trend: aiResolutionRate > 85 ? 'up' : 'up',
        },
        customerSatisfaction: {
          value: `${customerSatisfaction}/5`,
          change: customerSatisfaction > 4.5 ? '+0.1' : '+0.05',
          trend: customerSatisfaction > 4.5 ? 'up' : 'up',
        },
      },
      // Flat format for components that expect primitive values
      activeConversations: activeConversations,
      responseTime: `${avgResponseTime}s`,
      aiResolutionRate: `${aiResolutionRate}%`,
      customerSatisfaction: `${customerSatisfaction}/5`,
      // Additional flat metrics
      totalConversations: activeConversations + Math.floor(Math.random() * 50),
      resolvedToday: Math.floor(Math.random() * 25),
      satisfactionRate: Math.round(customerSatisfaction * 20), // Convert to percentage
      openConversations: activeConversations,
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

function calculateResponseTime(): number {
  // Mock calculation - in real implementation, this would analyze message timestamps
  const baseTime = 0.8;
  const variation = Math.random() * 0.6;
  return Math.round((baseTime + variation) * 10) / 10;
}

function calculateAIResolutionRate(): number {
  // Mock calculation - in real implementation, this would analyze AI vs human resolution
  return Math.floor(82 + Math.random() * 10);
}

function calculateCustomerSatisfaction(): number {
  // Mock calculation - in real implementation, this would come from satisfaction surveys
  const base = 4.5;
  const variation = Math.random() * 0.5;
  return Math.round((base + variation) * 10) / 10;
}
