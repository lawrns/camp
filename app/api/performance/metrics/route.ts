import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache/redis-cache';
import { queryOptimizer } from '@/lib/database/query-optimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    let data;

    switch (type) {
      case 'cache':
        data = getCacheMetrics();
        break;
      
      case 'database':
        data = getDatabaseMetrics();
        break;
      
      case 'summary':
        data = getPerformanceSummary();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: cache, database, or summary' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Performance metrics API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getCacheMetrics() {
  const stats = cacheService.getStats();
  
  return {
    cache: {
      size: stats.size,
      maxSize: stats.maxSize,
      utilizationPercentage: (stats.size / stats.maxSize) * 100,
      status: stats.size < stats.maxSize * 0.8 ? 'healthy' : 'warning',
    },
  };
}

function getDatabaseMetrics() {
  const dbMetrics = queryOptimizer.getPerformanceAnalytics();
  
  // Calculate aggregate metrics from the analytics data
  const queryTypes = Object.keys(dbMetrics);
  const totalQueries = queryTypes.reduce((sum, type) => sum + dbMetrics[type].totalQueries, 0);
  const avgQueryTime = queryTypes.length > 0
    ? queryTypes.reduce((sum, type) => sum + dbMetrics[type].averageTime, 0) / queryTypes.length
    : 0;
  const cacheHitRate = queryTypes.length > 0
    ? queryTypes.reduce((sum, type) => sum + dbMetrics[type].cacheHitRate, 0) / queryTypes.length
    : 0;

  return {
    database: {
      averageQueryTime: avgQueryTime,
      cacheHitRate: cacheHitRate,
      totalQueries: totalQueries,
      queryTypes: dbMetrics,
      status: avgQueryTime < 500 ? 'healthy' : 'warning',
    },
  };
}

function getPerformanceSummary() {
  const cacheMetrics = getCacheMetrics();
  const dbMetrics = getDatabaseMetrics();
  
  // Calculate overall health score
  let healthScore = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Cache health
  if (cacheMetrics.cache.utilizationPercentage > 90) {
    healthScore -= 10;
    issues.push('Cache utilization high');
    recommendations.push('Consider increasing cache size or reducing TTL');
  }

  // Database health
  if (dbMetrics.database.averageQueryTime > 1000) {
    healthScore -= 20;
    issues.push('Slow database queries');
    recommendations.push('Optimize database queries and add indexes');
  }

  if (dbMetrics.database.cacheHitRate < 0.7) {
    healthScore -= 15;
    issues.push('Low cache hit rate');
    recommendations.push('Improve caching strategy');
  }

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (healthScore < 70) status = 'critical';
  else if (healthScore < 85) status = 'warning';

  return {
    summary: {
      healthScore: Math.max(0, healthScore),
      status,
      issues,
      recommendations,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
    ...cacheMetrics,
    ...dbMetrics,
  };
}

// Health check endpoint
export async function HEAD() {
  try {
    const summary = getPerformanceSummary();
    const status = summary.summary.status === 'critical' ? 503 : 200;
    
    return new NextResponse(null, { 
      status,
      headers: {
        'X-Health-Score': summary.summary.healthScore.toString(),
        'X-Health-Status': summary.summary.status,
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
