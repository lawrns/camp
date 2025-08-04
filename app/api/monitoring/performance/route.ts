import { NextRequest, NextResponse } from 'next/server';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { validateOrganizationAccess, checkRateLimit } from '@/lib/utils/validation';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'api' | 'database' | 'realtime' | 'widget' | undefined;
    const operation = searchParams.get('operation');
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000'); // Default: 1 hour
    const organizationId = searchParams.get('organizationId');

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`performance_${clientIP}`, 20, 60000); // 20 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    // Validate organization access if organizationId is provided
    if (organizationId) {
      const supabase = createClient();
      const hasAccess = await validateOrganizationAccess(supabase, organizationId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Unauthorized access to organization' },
          { status: 403 }
        );
      }
    }

    // Get performance statistics
    const stats = performanceTracker.getStats(type, operation, timeRange);
    const recentMetrics = performanceTracker.getRecentMetrics(50);
    const status = performanceTracker.getStatus();

    // Calculate additional insights
    const insights = {
      healthScore: calculateHealthScore(stats),
      recommendations: generateRecommendations(stats),
      alerts: generateAlerts(stats)
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange: `${timeRange}ms`,
      filters: { type, operation },
      stats,
      insights,
      recentMetrics: recentMetrics.slice(-10), // Last 10 metrics
      status
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, operation, duration, success = true, metadata, error } = body;

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`performance_post_${clientIP}`, 100, 60000); // 100 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!type || !operation || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, operation, duration' },
        { status: 400 }
      );
    }

    // Track the performance metric
    performanceTracker.track(type, operation, duration, success, metadata, error);

    return NextResponse.json({
      success: true,
      message: 'Performance metric tracked successfully'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to track performance metric',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`performance_delete_${clientIP}`, 5, 60000); // 5 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    // Clear all performance metrics
    performanceTracker.clear();

    return NextResponse.json({
      success: true,
      message: 'Performance metrics cleared successfully'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to clear performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateHealthScore(stats: unknown): number {
  if (stats.totalRequests === 0) return 100;

  let score = 100;

  // Penalize high error rates
  if (stats.successRate < 95) score -= (95 - stats.successRate) * 2;
  if (stats.successRate < 90) score -= 20;

  // Penalize slow response times
  if (stats.averageResponseTime > 1000) score -= 15;
  if (stats.averageResponseTime > 2000) score -= 25;
  if (stats.p95ResponseTime > 3000) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(stats: unknown): string[] {
  const recommendations: string[] = [];

  if (stats.successRate < 95) {
    recommendations.push('High error rate detected. Review error logs and implement better error handling.');
  }

  if (stats.averageResponseTime > 1000) {
    recommendations.push('Average response time is high. Consider optimizing database queries and API logic.');
  }

  if (stats.p95ResponseTime > 3000) {
    recommendations.push('95th percentile response time is very high. Investigate slow operations.');
  }

  if (stats.totalRequests > 10000) {
    recommendations.push('High traffic detected. Consider implementing caching and load balancing.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! Continue monitoring for any changes.');
  }

  return recommendations;
}

function generateAlerts(stats: unknown): Array<{ level: 'info' | 'warning' | 'error'; message: string }> {
  const alerts: Array<{ level: 'info' | 'warning' | 'error'; message: string }> = [];

  if (stats.successRate < 90) {
    alerts.push({
      level: 'error',
      message: `Critical: Success rate is ${stats.successRate.toFixed(1)}% (below 90%)`
    });
  } else if (stats.successRate < 95) {
    alerts.push({
      level: 'warning',
      message: `Warning: Success rate is ${stats.successRate.toFixed(1)}% (below 95%)`
    });
  }

  if (stats.averageResponseTime > 2000) {
    alerts.push({
      level: 'error',
      message: `Critical: Average response time is ${stats.averageResponseTime.toFixed(0)}ms (above 2s)`
    });
  } else if (stats.averageResponseTime > 1000) {
    alerts.push({
      level: 'warning',
      message: `Warning: Average response time is ${stats.averageResponseTime.toFixed(0)}ms (above 1s)`
    });
  }

  if (stats.errorCount > 100) {
    alerts.push({
      level: 'warning',
      message: `Warning: ${stats.errorCount} errors detected in the time period`
    });
  }

  return alerts;
}
