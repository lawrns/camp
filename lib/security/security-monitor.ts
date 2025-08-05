/**
 * Security Monitoring and Event Logging System
 * 
 * Features:
 * - Real-time security event detection
 * - Audit trail logging
 * - Anomaly detection
 * - Rate limiting
 * - Session monitoring
 * - Compliance logging
 */

'use client';

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  organizationId?: string;
}

type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'token_expired'
  | 'session_revoked'
  | 'password_change'
  | 'email_change'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'export_request'
  | 'admin_action'
  | 'api_key_usage'
  | 'webhook_received'
  | 'error_occurred';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

interface AnomalyPattern {
  type: string;
  threshold: number;
  timeWindow: number;
  action: 'log' | 'alert' | 'block';
}

// ============================================================================
// SECURITY MONITOR CLASS
// ============================================================================

export class SecurityMonitor {
  private rateLimitStore: Map<string, { count: number; resetTime: number; blocked: boolean }> = new Map();
  private eventBuffer: SecurityEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private anomalyPatterns: AnomalyPattern[] = [];

  constructor() {
    this.initializeAnomalyPatterns();
    this.setupPeriodicFlush();
  }

  // ============================================================================
  // EVENT LOGGING
  // ============================================================================

  public async logSecurityEvent(
    type: SecurityEventType,
    details: Record<string, any> = {},
    severity: SecurityEvent['severity'] = 'medium'
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        type,
        severity,
        userId: await this.getCurrentUserId(),
        sessionId: await this.getCurrentSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: this.getUserAgent(),
        details,
        timestamp: new Date().toISOString(),
        organizationId: await this.getCurrentOrganizationId(),
      };

      // Add to buffer for batch processing
      this.eventBuffer.push(event);

      // Check for anomalies
      this.checkForAnomalies(event);

      // Immediate flush for critical events
      if (severity === 'critical') {
        await this.flushEvents();
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SecurityMonitor] ${type}:`, event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      // Store in Supabase
      const { error } = await supabase.browser()
        .from('security_events')
        .insert(events);

      if (error) {
        console.error('Failed to store security events:', error);
        // Re-add events to buffer for retry
        this.eventBuffer.unshift(...events);
      }

    } catch (error) {
      console.error('Error flushing security events:', error);
    }
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  public checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    let entry = this.rateLimitStore.get(key);

    // Initialize or reset if window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.rateLimitStore.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked && now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      entry.blocked = true;
      entry.resetTime = now + config.blockDurationMs;

      this.logSecurityEvent('rate_limit_exceeded', {
        identifier,
        count: entry.count,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      }, 'high');

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  private initializeAnomalyPatterns(): void {
    this.anomalyPatterns = [
      {
        type: 'rapid_login_attempts',
        threshold: 5,
        timeWindow: 300000, // 5 minutes
        action: 'alert',
      },
      {
        type: 'multiple_failed_logins',
        threshold: 3,
        timeWindow: 600000, // 10 minutes
        action: 'block',
      },
      {
        type: 'unusual_data_access',
        threshold: 100,
        timeWindow: 3600000, // 1 hour
        action: 'log',
      },
      {
        type: 'admin_actions',
        threshold: 10,
        timeWindow: 3600000, // 1 hour
        action: 'alert',
      },
    ];
  }

  private checkForAnomalies(event: SecurityEvent): void {
    this.anomalyPatterns.forEach(pattern => {
      if (this.matchesPattern(event, pattern)) {
        this.handleAnomaly(event, pattern);
      }
    });
  }

  private matchesPattern(event: SecurityEvent, pattern: AnomalyPattern): boolean {
    const now = Date.now();
    const windowStart = now - pattern.timeWindow;

    // Count matching events in time window
    const matchingEvents = this.eventBuffer.filter(e => {
      const eventTime = new Date(e.timestamp).getTime();
      return eventTime >= windowStart && this.eventMatchesPatternType(e, pattern.type);
    });

    return matchingEvents.length >= pattern.threshold;
  }

  private eventMatchesPatternType(event: SecurityEvent, patternType: string): boolean {
    switch (patternType) {
      case 'rapid_login_attempts':
        return ['login_attempt', 'login_success', 'login_failure'].includes(event.type);
      
      case 'multiple_failed_logins':
        return event.type === 'login_failure';
      
      case 'unusual_data_access':
        return event.type === 'data_access';
      
      case 'admin_actions':
        return event.type === 'admin_action';
      
      default:
        return false;
    }
  }

  private handleAnomaly(event: SecurityEvent, pattern: AnomalyPattern): void {
    const anomalyEvent: SecurityEvent = {
      id: this.generateEventId(),
      type: 'suspicious_activity',
      severity: 'high',
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: {
        anomalyType: pattern.type,
        threshold: pattern.threshold,
        timeWindow: pattern.timeWindow,
        triggeringEvent: event,
      },
      timestamp: new Date().toISOString(),
      organizationId: event.organizationId,
    };

    this.eventBuffer.push(anomalyEvent);

    // Take action based on pattern
    switch (pattern.action) {
      case 'alert':
        this.sendSecurityAlert(anomalyEvent);
        break;
      
      case 'block':
        this.blockUser(event.userId, event.ipAddress);
        break;
      
      case 'log':
        // Already logged by adding to buffer
        break;
    }
  }

  // ============================================================================
  // SECURITY ACTIONS
  // ============================================================================

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, this would send alerts via email, Slack, etc.
      console.warn('[SECURITY ALERT]', event);

      // Store alert in database
      await supabase.browser()
        .from('security_alerts')
        .insert({
          event_id: event.id,
          type: event.details.anomalyType,
          severity: event.severity,
          user_id: event.userId,
          organization_id: event.organizationId,
          details: event.details,
          created_at: event.timestamp,
        });

    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  private blockUser(userId?: string, ipAddress?: string): void {
    if (userId) {
      // Add user to temporary block list
      this.rateLimitStore.set(`blocked_user_${userId}`, {
        count: 0,
        resetTime: Date.now() + 3600000, // 1 hour block
        blocked: true,
      });
    }

    if (ipAddress) {
      // Add IP to temporary block list
      this.rateLimitStore.set(`blocked_ip_${ipAddress}`, {
        count: 0,
        resetTime: Date.now() + 3600000, // 1 hour block
        blocked: true,
      });
    }
  }

  // ============================================================================
  // COMPLIANCE LOGGING
  // ============================================================================

  public async logDataAccess(
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('data_access', {
      resourceType,
      resourceId,
      action,
      ...details,
    });
  }

  public async logDataModification(
    resourceType: string,
    resourceId: string,
    changes: Record<string, any>,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('data_modification', {
      resourceType,
      resourceId,
      changes,
      ...details,
    }, 'medium');
  }

  public async logDataDeletion(
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('data_deletion', {
      resourceType,
      resourceId,
      ...details,
    }, 'high');
  }

  public async logExportRequest(
    dataType: string,
    recordCount: number,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('export_request', {
      dataType,
      recordCount,
      ...details,
    }, 'medium');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.browser().auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private async getCurrentSessionId(): Promise<string | undefined> {
    try {
      const { data: { session } } = await supabase.browser().auth.getSession();
      return session?.access_token ? this.hashString(session.access_token) : undefined;
    } catch {
      return undefined;
    }
  }

  private async getCurrentOrganizationId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.browser().auth.getUser();
      return user?.user_metadata?.organization_id;
    } catch {
      return undefined;
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    // In a real implementation, this would get the client IP
    // For now, we'll use a placeholder
    return 'client_ip';
  }

  private getUserAgent(): string | undefined {
    return typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush remaining events
    this.flushEvents();
    
    this.rateLimitStore.clear();
    this.eventBuffer = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const securityMonitor = new SecurityMonitor();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const logSecurityEvent = (
  type: SecurityEventType,
  details?: Record<string, any>,
  severity?: SecurityEvent['severity']
) => securityMonitor.logSecurityEvent(type, details, severity);

export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig
) => securityMonitor.checkRateLimit(identifier, config);

export const logDataAccess = (
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete',
  details?: Record<string, any>
) => securityMonitor.logDataAccess(resourceType, resourceId, action, details);

export const logDataModification = (
  resourceType: string,
  resourceId: string,
  changes: Record<string, any>,
  details?: Record<string, any>
) => securityMonitor.logDataModification(resourceType, resourceId, changes, details);

export const logDataDeletion = (
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) => securityMonitor.logDataDeletion(resourceType, resourceId, details);
