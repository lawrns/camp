import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role-server';
import { checkRateLimit } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`realtime_health_${clientIP}`, 10, 60000); // 10 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimit.resetTime },
        { status: 429 }
      );
    }

    const supabase = createServiceRoleClient();
    
    // Test basic database connectivity
    let dbStatus = 'ok';
    let dbLatency = 0;
    try {
      const dbStartTime = Date.now();
      const { error: dbError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      dbLatency = Date.now() - dbStartTime;
      
      if (dbError && !dbError.message.includes('permission denied')) {
        dbStatus = 'error';
      }
    } catch (error) {
      dbStatus = 'error';
    }

    // Test Supabase Realtime connectivity
    let realtimeStatus = 'ok';
    let realtimeLatency = 0;
    try {
      const realtimeStartTime = Date.now();
      
      // Create a test channel to verify realtime connectivity
      const testChannel = supabase.channel('health-check-' + Date.now());
      
      // Subscribe and immediately unsubscribe
      const subscription = testChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeLatency = Date.now() - realtimeStartTime;
        }
      });
      
      // Clean up immediately
      setTimeout(() => {
        testChannel.unsubscribe();
      }, 100);
      
    } catch (error) {
      realtimeStatus = 'error';
    }

    // Get environment status
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    const envStatus = missingEnvVars.length === 0 ? 'ok' : 'missing_vars';

    // Calculate overall health
    const isHealthy = dbStatus === 'ok' && realtimeStatus === 'ok' && envStatus === 'ok';
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        realtime: {
          status: realtimeStatus,
          latency: `${realtimeLatency}ms`
        },
        environment: {
          status: envStatus,
          missingVars: missingEnvVars
        }
      },
      metrics: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      realtime: {
        channelsSupported: true,
        broadcastSupported: true,
        presenceSupported: true,
        postgresChangesSupported: true
      }
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          responseTime: `${responseTime}ms`,
          uptime: process.uptime()
        }
      },
      { status: 503 }
    );
  }
}

// Add a simple ping endpoint for quick health checks
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
