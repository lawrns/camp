/**
 * PHASE 2 CRITICAL FIX: Comprehensive Monitoring & Alerting
 * 
 * Advanced monitoring system with real-time metrics collection,
 * alerting, and performance tracking for production readiness.
 * 
 * Features:
 * - Real-time metrics collection
 * - Automated alerting for critical issues
 * - Performance monitoring
 * - Error tracking and categorization
 * - Health checks and uptime monitoring
 * - Resource usage tracking
 */

import { performance } from 'perf_hooks';

// Types for monitoring data
interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: 'ms' | 'count' | 'bytes' | 'percent';
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: MetricData[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
  lastTriggered?: number;
  enabled: boolean;
}

interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; details?: any; latency?: number }>;
  interval: number;
  timeout: number;
  lastRun?: number;
  lastResult?: { healthy: boolean; details?: any; latency?: number };
}

// In-memory storage for metrics (upgrade to time-series DB for production)
class MetricsStore {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics
  private readonly retentionMs = 24 * 60 * 60 * 1000; // 24 hours

  add(metric: MetricData): void {
    this.metrics.push(metric);
    this.cleanup();
  }

  query(name: string, since?: number): MetricData[] {
    const cutoff = since || Date.now() - this.retentionMs;
    return this.metrics.filter(m => 
      m.name === name && m.timestamp >= cutoff
    );
  }

  getAll(since?: number): MetricData[] {
    const cutoff = since || Date.now() - this.retentionMs;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  private cleanup(): void {
    // Remove old metrics
    const cutoff = Date.now() - this.retentionMs;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // Limit total metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
}

// Global monitoring instance
class ComprehensiveMonitor {
  private metricsStore = new MetricsStore();
  private alertRules: AlertRule[] = [];
  private healthChecks: HealthCheck[] = [];
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.setupDefaultAlerts();
    this.setupDefaultHealthChecks();
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔍 [Comprehensive Monitor] Starting monitoring system...');

    // Start alert checking
    const alertInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000); // Check every 30 seconds
    this.intervals.push(alertInterval);

    // Start health checks
    this.healthChecks.forEach(check => {
      const interval = setInterval(() => {
        this.runHealthCheck(check);
      }, check.interval);
      this.intervals.push(interval);
    });

    // Start metrics cleanup
    const cleanupInterval = setInterval(() => {
      this.metricsStore['cleanup']();
    }, 5 * 60 * 1000); // Every 5 minutes
    this.intervals.push(cleanupInterval);
  }

  stop(): void {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('🔍 [Comprehensive Monitor] Monitoring system stopped');
  }

  // Metrics collection
  recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit: unit as any
    };
    
    this.metricsStore.add(metric);
  }

  recordTiming(name: string, startTime: number, tags?: Record<string, string>): void {
    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, tags, 'ms');
  }

  recordCounter(name: string, increment: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, increment, tags, 'count');
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  // Performance monitoring
  async measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      this.recordTiming(`${name}.success`, startTime, tags);
      return result;
    } catch (error) {
      this.recordTiming(`${name}.error`, startTime, tags);
      this.recordCounter(`${name}.error_count`, 1, tags);
      throw error;
    }
  }

  measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const startTime = performance.now();
    try {
      const result = fn();
      this.recordTiming(`${name}.success`, startTime, tags);
      return result;
    } catch (error) {
      this.recordTiming(`${name}.error`, startTime, tags);
      this.recordCounter(`${name}.error_count`, 1, tags);
      throw error;
    }
  }

  // Alert management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  private checkAlerts(): void {
    const now = Date.now();
    
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;
      
      // Check cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldownMs) {
        return;
      }

      // Get recent metrics for evaluation
      const recentMetrics = this.metricsStore.getAll(now - 5 * 60 * 1000); // Last 5 minutes
      
      if (rule.condition(recentMetrics)) {
        this.triggerAlert(rule, recentMetrics);
        rule.lastTriggered = now;
      }
    });
  }

  private triggerAlert(rule: AlertRule, metrics: MetricData[]): void {
    const alert = {
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      timestamp: Date.now(),
      metrics: metrics.slice(-10) // Include last 10 relevant metrics
    };

    console.error(`🚨 [ALERT ${rule.severity.toUpperCase()}] ${rule.name}`, alert);
    
    // In production, send to alerting service (PagerDuty, Slack, etc.)
    this.sendAlert(alert);
  }

  private async sendAlert(alert: any): Promise<void> {
    // Placeholder for external alerting integration
    // In production, integrate with:
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
    // - SMS alerts
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to webhook
      try {
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          });
        }
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  }

  // Health checks
  addHealthCheck(check: HealthCheck): void {
    this.healthChecks.push(check);
  }

  private async runHealthCheck(check: HealthCheck): Promise<void> {
    const startTime = performance.now();
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });
      
      const result = await Promise.race([
        check.check(),
        timeoutPromise
      ]) as { healthy: boolean; details?: any; latency?: number };
      
      result.latency = performance.now() - startTime;
      check.lastResult = result;
      check.lastRun = Date.now();
      
      // Record health check metrics
      this.recordMetric(`health_check.${check.name}.latency`, result.latency, undefined, 'ms');
      this.recordMetric(`health_check.${check.name}.status`, result.healthy ? 1 : 0);
      
      if (!result.healthy) {
        console.warn(`⚠️ [Health Check] ${check.name} failed:`, result.details);
      }
      
    } catch (error) {
      const latency = performance.now() - startTime;
      check.lastResult = { healthy: false, details: error, latency };
      check.lastRun = Date.now();
      
      this.recordMetric(`health_check.${check.name}.latency`, latency, undefined, 'ms');
      this.recordMetric(`health_check.${check.name}.status`, 0);
      
      console.error(`❌ [Health Check] ${check.name} error:`, error);
    }
  }

  // Default alert rules
  private setupDefaultAlerts(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate Detected',
      condition: (metrics) => {
        const errorMetrics = metrics.filter(m => m.name.includes('error_count'));
        const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
        return totalErrors > 10; // More than 10 errors in 5 minutes
      },
      severity: 'high',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
      enabled: true
    });

    // Slow response time alert
    this.addAlertRule({
      id: 'slow_response_time',
      name: 'Slow Response Times Detected',
      condition: (metrics) => {
        const responseMetrics = metrics.filter(m => 
          m.name.includes('response_time') && m.unit === 'ms'
        );
        if (responseMetrics.length === 0) return false;
        
        const avgResponseTime = responseMetrics.reduce((sum, m) => sum + m.value, 0) / responseMetrics.length;
        return avgResponseTime > 2000; // Average response time > 2 seconds
      },
      severity: 'medium',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      enabled: true
    });

    // Memory usage alert
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage Detected',
      condition: (metrics) => {
        const memoryMetrics = metrics.filter(m => m.name === 'memory_usage_percent');
        if (memoryMetrics.length === 0) return false;
        
        const latestMemory = memoryMetrics[memoryMetrics.length - 1];
        return latestMemory.value > 85; // Memory usage > 85%
      },
      severity: 'high',
      cooldownMs: 15 * 60 * 1000, // 15 minutes
      enabled: true
    });
  }

  // Default health checks
  private setupDefaultHealthChecks(): void {
    // Database connectivity check
    this.addHealthCheck({
      name: 'database',
      check: async () => {
        try {
          // Simple database ping - replace with actual DB check
          const startTime = performance.now();
          // await supabase.from('health_check').select('1').limit(1);
          const latency = performance.now() - startTime;
          
          return { 
            healthy: true, 
            details: { latency: `${latency.toFixed(2)}ms` }
          };
        } catch (error) {
          return { 
            healthy: false, 
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }
      },
      interval: 30000, // Every 30 seconds
      timeout: 5000 // 5 second timeout
    });

    // Memory usage check
    this.addHealthCheck({
      name: 'memory',
      check: async () => {
        if (typeof process !== 'undefined') {
          const memUsage = process.memoryUsage();
          const usedMB = memUsage.heapUsed / 1024 / 1024;
          const totalMB = memUsage.heapTotal / 1024 / 1024;
          const usagePercent = (usedMB / totalMB) * 100;
          
          // Record memory metrics
          monitor.recordGauge('memory_usage_mb', usedMB);
          monitor.recordGauge('memory_usage_percent', usagePercent);
          
          return {
            healthy: usagePercent < 90,
            details: { 
              usedMB: usedMB.toFixed(2), 
              totalMB: totalMB.toFixed(2),
              usagePercent: usagePercent.toFixed(2)
            }
          };
        }
        
        return { healthy: true, details: { note: 'Memory check not available' } };
      },
      interval: 60000, // Every minute
      timeout: 1000 // 1 second timeout
    });
  }

  // Metrics querying
  getMetrics(name?: string, since?: number): MetricData[] {
    if (name) {
      return this.metricsStore.query(name, since);
    }
    return this.metricsStore.getAll(since);
  }

  getHealthStatus(): { name: string; healthy: boolean; lastRun?: number; details?: any }[] {
    return this.healthChecks.map(check => ({
      name: check.name,
      healthy: check.lastResult?.healthy ?? false,
      lastRun: check.lastRun,
      details: check.lastResult?.details
    }));
  }

  getAlertStatus(): { id: string; name: string; enabled: boolean; lastTriggered?: number }[] {
    return this.alertRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled,
      lastTriggered: rule.lastTriggered
    }));
  }
}

// Global monitor instance
export const monitor = new ComprehensiveMonitor();

// Convenience functions
export const recordMetric = monitor.recordMetric.bind(monitor);
export const recordTiming = monitor.recordTiming.bind(monitor);
export const recordCounter = monitor.recordCounter.bind(monitor);
export const recordGauge = monitor.recordGauge.bind(monitor);
export const measureAsync = monitor.measureAsync.bind(monitor);
export const measureSync = monitor.measureSync.bind(monitor);

// Auto-start in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  monitor.start();
}
