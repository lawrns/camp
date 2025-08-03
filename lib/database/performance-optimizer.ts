/**
 * PHASE 2 CRITICAL FIX: Database Performance Optimizer
 * 
 * Comprehensive database optimization system for improving query performance,
 * managing connections, and ensuring optimal database operations.
 * 
 * Features:
 * - Query performance monitoring
 * - Connection pool optimization
 * - Index recommendations
 * - Slow query detection
 * - Database health monitoring
 * - Automated optimization suggestions
 */

import { supabase } from '@/lib/supabase/consolidated-exports';
import { monitor } from '@/lib/monitoring/comprehensive-monitoring';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  rowCount?: number;
  error?: string;
  endpoint?: string;
}

interface SlowQuery {
  query: string;
  avgDuration: number;
  count: number;
  lastSeen: number;
  maxDuration: number;
  minDuration: number;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface DatabaseHealth {
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  errorRate: number;
  avgResponseTime: number;
  lastChecked: number;
}

class DatabasePerformanceOptimizer {
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries = new Map<string, SlowQuery>();
  private readonly maxMetrics = 5000;
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly retentionMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.startCleanupInterval();
    this.startHealthMonitoring();
  }

  // Query monitoring and optimization
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    context?: { endpoint?: string; params?: any }
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      // Record successful query metrics
      const metrics: QueryMetrics = {
        query: queryName,
        duration,
        timestamp,
        success: true,
        rowCount: this.extractRowCount(result),
        endpoint: context?.endpoint
      };
      
      this.recordQueryMetrics(metrics);
      
      // Check if query is slow
      if (duration > this.slowQueryThreshold) {
        this.recordSlowQuery(queryName, duration);
      }
      
      // Record monitoring metrics
      monitor.recordTiming(`db.query.${queryName}`, startTime);
      monitor.recordCounter('db.queries.success', 1, { query: queryName });
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Record failed query metrics
      const metrics: QueryMetrics = {
        query: queryName,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: context?.endpoint
      };
      
      this.recordQueryMetrics(metrics);
      
      // Record monitoring metrics
      monitor.recordTiming(`db.query.${queryName}.error`, startTime);
      monitor.recordCounter('db.queries.error', 1, { query: queryName });
      
      throw error;
    }
  }

  // Optimized query builders for common patterns
  async optimizedConversationQuery(organizationId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
    assignedTo?: string;
  } = {}): Promise<any> {
    return this.monitorQuery('get_conversations', async () => {
      const { limit = 20, offset = 0, status, assignedTo } = options;
      
      let query = supabase.admin()
        .from('conversations')
        .select(`
          id,
          customer_name,
          customer_email,
          status,
          priority,
          assigned_to,
          created_at,
          updated_at,
          last_message_at,
          message_count:messages(count)
        `)
        .eq('organization_id', organizationId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }, { endpoint: 'conversations', params: options });
  }

  async optimizedMessageQuery(conversationId: string, options: {
    limit?: number;
    since?: string;
    before?: string;
  } = {}): Promise<any> {
    return this.monitorQuery('get_messages', async () => {
      const { limit = 50, since, before } = options;
      
      let query = supabase.admin()
        .from('messages')
        .select(`
          id,
          content,
          sender_type,
          sender_name,
          sender_email,
          created_at,
          metadata
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (since) {
        query = query.gte('created_at', since);
      }
      
      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }, { endpoint: 'messages', params: options });
  }

  // Connection pool optimization
  async optimizeConnectionPool(): Promise<{
    currentConnections: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    // Check current connection usage
    const connectionMetrics = await this.getConnectionMetrics();
    
    if (connectionMetrics.activeConnections > 80) {
      recommendations.push('Consider implementing connection pooling');
      recommendations.push('Review long-running queries that may be holding connections');
    }
    
    if (connectionMetrics.idleConnections > 20) {
      recommendations.push('Consider reducing connection pool size');
      recommendations.push('Implement connection timeout for idle connections');
    }
    
    return {
      currentConnections: connectionMetrics.totalConnections,
      recommendations
    };
  }

  // Index recommendations
  generateIndexRecommendations(): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    
    // Analyze slow queries for index opportunities
    for (const [queryName, slowQuery] of this.slowQueries) {
      if (queryName.includes('conversation') && slowQuery.avgDuration > 2000) {
        recommendations.push({
          table: 'conversations',
          columns: ['organization_id', 'status', 'last_message_at'],
          reason: 'Frequent filtering and sorting on these columns',
          estimatedImprovement: '60-80% faster queries',
          priority: 'high'
        });
      }
      
      if (queryName.includes('message') && slowQuery.avgDuration > 1500) {
        recommendations.push({
          table: 'messages',
          columns: ['conversation_id', 'created_at'],
          reason: 'Common filtering pattern for message retrieval',
          estimatedImprovement: '50-70% faster queries',
          priority: 'medium'
        });
      }
    }
    
    // Standard recommendations based on common patterns
    recommendations.push({
      table: 'conversations',
      columns: ['organization_id', 'assigned_to'],
      reason: 'Common filtering pattern for dashboard queries',
      estimatedImprovement: '40-60% faster queries',
      priority: 'medium'
    });
    
    recommendations.push({
      table: 'messages',
      columns: ['sender_email'],
      reason: 'Improve customer message lookup performance',
      estimatedImprovement: '30-50% faster queries',
      priority: 'low'
    });
    
    return recommendations;
  }

  // Database health monitoring
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    const connectionMetrics = await this.getConnectionMetrics();
    
    const totalQueries = recentMetrics.length;
    const errorQueries = recentMetrics.filter(m => !m.success).length;
    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    
    const avgResponseTime = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const errorRate = totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;
    
    return {
      connectionCount: connectionMetrics.totalConnections,
      activeQueries: connectionMetrics.activeConnections,
      slowQueries,
      errorRate,
      avgResponseTime,
      lastChecked: Date.now()
    };
  }

  // Query analysis and optimization suggestions
  getQueryAnalysis(): {
    slowQueries: SlowQuery[];
    topQueries: { query: string; count: number; avgDuration: number }[];
    errorQueries: { query: string; errorRate: number; lastError: string }[];
  } {
    const recentMetrics = this.getRecentMetrics();
    
    // Group queries by name
    const queryGroups = new Map<string, QueryMetrics[]>();
    recentMetrics.forEach(metric => {
      const existing = queryGroups.get(metric.query) || [];
      existing.push(metric);
      queryGroups.set(metric.query, existing);
    });
    
    // Calculate statistics
    const topQueries = Array.from(queryGroups.entries())
      .map(([query, metrics]) => ({
        query,
        count: metrics.length,
        avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const errorQueries = Array.from(queryGroups.entries())
      .map(([query, metrics]) => {
        const errors = metrics.filter(m => !m.success);
        const errorRate = (errors.length / metrics.length) * 100;
        const lastError = errors[errors.length - 1]?.error || '';
        return { query, errorRate, lastError };
      })
      .filter(q => q.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate);
    
    return {
      slowQueries: Array.from(this.slowQueries.values()),
      topQueries,
      errorQueries
    };
  }

  // Automated optimization suggestions
  getOptimizationSuggestions(): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const health = this.getDatabaseHealth();
    const analysis = this.getQueryAnalysis();
    
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // Immediate actions
    if (analysis.slowQueries.length > 5) {
      immediate.push('Review and optimize slow queries');
      immediate.push('Consider adding database indexes for frequently queried columns');
    }
    
    if (analysis.errorQueries.length > 0) {
      immediate.push('Investigate and fix queries with high error rates');
    }
    
    // Short-term improvements
    shortTerm.push('Implement query result caching for frequently accessed data');
    shortTerm.push('Add database connection pooling if not already implemented');
    shortTerm.push('Set up automated database performance monitoring');
    
    // Long-term optimizations
    longTerm.push('Consider database partitioning for large tables');
    longTerm.push('Implement read replicas for read-heavy workloads');
    longTerm.push('Set up automated index maintenance and optimization');
    
    return { immediate, shortTerm, longTerm };
  }

  // Private helper methods
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    this.cleanup();
  }

  private recordSlowQuery(queryName: string, duration: number): void {
    const existing = this.slowQueries.get(queryName);
    
    if (existing) {
      existing.count++;
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + duration) / existing.count;
      existing.lastSeen = Date.now();
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.minDuration = Math.min(existing.minDuration, duration);
    } else {
      this.slowQueries.set(queryName, {
        query: queryName,
        avgDuration: duration,
        count: 1,
        lastSeen: Date.now(),
        maxDuration: duration,
        minDuration: duration
      });
    }
    
    // Log slow query
    console.warn(`🐌 [DB] Slow query detected: ${queryName} (${duration.toFixed(2)}ms)`);
    monitor.recordCounter('db.slow_queries', 1, { query: queryName });
  }

  private extractRowCount(result: any): number | undefined {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
      return result.data.length;
    }
    return undefined;
  }

  private getRecentMetrics(timeWindow: number = this.retentionMs): QueryMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.queryMetrics.filter(metric => metric.timestamp >= cutoff);
  }

  private async getConnectionMetrics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  }> {
    // This would integrate with actual database connection monitoring
    // For now, return mock data
    return {
      totalConnections: 10,
      activeConnections: 3,
      idleConnections: 7
    };
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionMs;
    this.queryMetrics = this.queryMetrics.filter(metric => metric.timestamp >= cutoff);
    
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
    
    // Clean up slow queries
    for (const [queryName, slowQuery] of this.slowQueries) {
      if (slowQuery.lastSeen < cutoff) {
        this.slowQueries.delete(queryName);
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Every hour
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const health = await this.getDatabaseHealth();
        
        // Record health metrics
        monitor.recordGauge('db.connections', health.connectionCount);
        monitor.recordGauge('db.active_queries', health.activeQueries);
        monitor.recordGauge('db.slow_queries', health.slowQueries);
        monitor.recordGauge('db.error_rate', health.errorRate);
        monitor.recordGauge('db.avg_response_time', health.avgResponseTime);
        
        // Alert on concerning metrics
        if (health.errorRate > 5) {
          console.warn(`⚠️ [DB Health] High error rate: ${health.errorRate.toFixed(2)}%`);
        }
        
        if (health.avgResponseTime > 2000) {
          console.warn(`⚠️ [DB Health] Slow average response time: ${health.avgResponseTime.toFixed(2)}ms`);
        }
        
      } catch (error) {
        console.error('Database health monitoring failed:', error);
      }
    }, 60000); // Every minute
  }
}

// Global database optimizer instance
export const dbOptimizer = new DatabasePerformanceOptimizer();

// Convenience functions
export const monitorQuery = dbOptimizer.monitorQuery.bind(dbOptimizer);
export const optimizedConversationQuery = dbOptimizer.optimizedConversationQuery.bind(dbOptimizer);
export const optimizedMessageQuery = dbOptimizer.optimizedMessageQuery.bind(dbOptimizer);
export const getDatabaseHealth = dbOptimizer.getDatabaseHealth.bind(dbOptimizer);
export const getQueryAnalysis = dbOptimizer.getQueryAnalysis.bind(dbOptimizer);
export const getOptimizationSuggestions = dbOptimizer.getOptimizationSuggestions.bind(dbOptimizer);
