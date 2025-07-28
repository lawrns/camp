/**
 * Database module exports
 * 
 * Provides unified access to database connection pool and utilities
 */

export {
  getConnectionPool,
  createOptimizedDbClient,
  executeQuery,
  getPoolMetrics,
  closeConnectionPool,
  healthCheck
} from './connection-pool';

// Default export for convenience
import { createOptimizedDbClient } from './connection-pool';
export default createOptimizedDbClient;