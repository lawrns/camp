/**
 * Database Connection Pool Optimization
 *
 * Implements intelligent connection pooling for optimal database performance
 * Target: <50ms query response times with efficient resource utilization
 */

import { Pool, PoolConfig, PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

// Performance monitoring interface
interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  averageQueryTime: number;
  totalQueries: number;
}

// Connection pool configuration based on environment
const getPoolConfig = (): PoolConfig => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    connectionString: process.env.DATABASE_URL,
    // Optimize pool size based on environment and expected load
    max: isProduction ? 25 : isDevelopment ? 5 : 15,
    min: isProduction ? 5 : 2,

    // Connection lifecycle settings
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 2000, // 2 seconds
    acquireTimeoutMillis: 5000, // 5 seconds

    // Performance optimizations
    allowExitOnIdle: true,
    maxUses: 7500, // Rotate connections after 7500 uses

    // SSL configuration
    ssl: isProduction ? { rejectUnauthorized: false } : false,

    // Query timeout
    query_timeout: 10000, // 10 seconds
    statement_timeout: 15000, // 15 seconds

    // Application name for monitoring
    application_name: `campfire-${process.env.NODE_ENV || "unknown"}`,
  };
};

// Global pool instance
let globalPool: Pool | null = null;
const poolMetrics: PoolMetrics = {
  totalConnections: 0,
  idleConnections: 0,
  activeConnections: 0,
  waitingClients: 0,
  averageQueryTime: 0,
  totalQueries: 0,
};

// Query performance tracking
const queryTimes: number[] = [];
const MAX_QUERY_HISTORY = 1000;

/**
 * Get or create the global connection pool
 */
export function getConnectionPool(): Pool {
  if (!globalPool) {
    const config = getPoolConfig();
    globalPool = new Pool(config);

    // Set up pool event listeners for monitoring
    setupPoolMonitoring(globalPool);

  }

  return globalPool;
}

/**
 * Create a Drizzle client with optimized connection pool
 */
export function createOptimizedDbClient() {
  const pool = getConnectionPool();

  return drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });
}

/**
 * Execute a query with performance tracking
 */
export async function executeQuery<T>(queryFn: (client: any) => Promise<T>, queryName?: string): Promise<T> {
  const startTime = Date.now();
  const client = createOptimizedDbClient();

  try {
    const result = await queryFn(client);

    // Track query performance
    const queryTime = Date.now() - startTime;
    trackQueryPerformance(queryTime, queryName);

    // Log slow queries in development
    if (process.env.NODE_ENV === "development" && queryTime > 100) {

    }

    return result;
  } catch (error) {
    const queryTime = Date.now() - startTime;

    throw error;
  }
}

/**
 * Set up pool monitoring and event handlers
 */
function setupPoolMonitoring(pool: Pool): void {
  // Connection events
  pool.on("connect", (client: PoolClient) => {
    poolMetrics.totalConnections++;

  });

  pool.on("acquire", (client: PoolClient) => {
    poolMetrics.activeConnections++;
    poolMetrics.idleConnections = Math.max(0, poolMetrics.idleConnections - 1);
  });

  pool.on("release", (err: Error | undefined, client: PoolClient) => {
    poolMetrics.activeConnections = Math.max(0, poolMetrics.activeConnections - 1);
    poolMetrics.idleConnections++;

    if (err) {

    }
  });

  pool.on("remove", (client: PoolClient) => {
    poolMetrics.totalConnections = Math.max(0, poolMetrics.totalConnections - 1);

  });

  pool.on("error", (err: Error, client: PoolClient) => {

  });

  // Periodic metrics logging in development
  if (process.env.NODE_ENV === "development") {
    setInterval(() => {
      logPoolMetrics();
    }, 30000); // Every 30 seconds
  }
}

/**
 * Track query performance metrics
 */
function trackQueryPerformance(queryTime: number, queryName?: string): void {
  poolMetrics.totalQueries++;

  // Maintain rolling average
  queryTimes.push(queryTime);
  if (queryTimes.length > MAX_QUERY_HISTORY) {
    queryTimes.shift();
  }

  poolMetrics.averageQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;

  // Log performance alerts
  if (queryTime > 1000) {
    // > 1 second

  } else if (queryTime > 500) {
    // > 500ms

  }
}

/**
 * Get current pool metrics
 */
export function getPoolMetrics(): PoolMetrics & { pool: any } {
  const pool = getConnectionPool();

  return {
    ...poolMetrics,
    waitingClients: pool.waitingCount,
    pool: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
  };
}

/**
 * Log pool metrics for monitoring
 */
function logPoolMetrics(): void {
  const metrics = getPoolMetrics();

}

/**
 * Gracefully close the connection pool
 */
export async function closeConnectionPool(): Promise<void> {
  if (globalPool) {

    await globalPool.end();
    globalPool = null;

  }
}

/**
 * Health check for the connection pool
 */
export async function healthCheck(): Promise<{ healthy: boolean; metrics: any; error?: string }> {
  try {
    const pool = getConnectionPool();
    const client = await pool.connect();

    const startTime = Date.now();
    await client.query("SELECT 1");
    const queryTime = Date.now() - startTime;

    client.release();

    const metrics = getPoolMetrics();

    return {
      healthy: queryTime < 100, // Healthy if query < 100ms
      metrics: {
        queryTime,
        ...metrics,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      healthy: false,
      metrics: getPoolMetrics(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Graceful shutdown handling
process.on("SIGINT", closeConnectionPool);
process.on("SIGTERM", closeConnectionPool);
process.on("beforeExit", closeConnectionPool);
