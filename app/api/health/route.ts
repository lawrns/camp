import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity (basic connection test)
    let dbStatus = 'ok';
    try {
      const supabaseClient = createClient();
      const { error: dbError } = await supabaseClient
        .from('organizations')
        .select('id')
        .limit(1);

      // If we get a permission error, the connection is working
      if (dbError && !dbError.message.includes('permission denied')) {
        dbStatus = 'connection_failed';
      }
    } catch (error) {
      dbStatus = 'connection_failed';
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        environment: 'ok',
      },
      metrics: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
      },
      version: process.env.npm_package_version || '1.0.0',
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
          uptime: process.uptime(),
        },
      },
      { status: 503 }
    );
  }
}

// Add readiness check
export async function HEAD(request: NextRequest) {
  try {
    // Quick readiness check - just verify we can respond
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
