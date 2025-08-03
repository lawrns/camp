/**
 * PHASE 2 CRITICAL FIX: Comprehensive Security Audit System
 * 
 * Advanced security monitoring and audit system for detecting
 * and preventing security threats in real-time.
 * 
 * Features:
 * - Real-time threat detection
 * - Automated security scanning
 * - Audit logging and compliance
 * - Intrusion detection
 * - Vulnerability assessment
 * - Security metrics and reporting
 */

import { NextRequest } from 'next/server';
import { monitor } from '@/lib/monitoring/comprehensive-monitoring';

// Security event types
type SecurityEventType = 
  | 'authentication_failure'
  | 'authorization_violation'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'injection_attempt'
  | 'xss_attempt'
  | 'csrf_violation'
  | 'data_breach_attempt'
  | 'privilege_escalation'
  | 'malicious_payload';

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
    organizationId?: string;
  };
  details: {
    endpoint?: string;
    method?: string;
    payload?: any;
    headers?: Record<string, string>;
    description: string;
    evidence?: any;
  };
  risk_score: number; // 0-100
  blocked: boolean;
}

interface SecurityRule {
  id: string;
  name: string;
  type: SecurityEventType;
  enabled: boolean;
  check: (request: NextRequest, context?: any) => Promise<SecurityThreat | null>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoBlock: boolean;
}

interface SecurityThreat {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: any;
  riskScore: number;
  shouldBlock: boolean;
}

// Security audit system
class SecurityAuditSystem {
  private events: SecurityEvent[] = [];
  private rules: SecurityRule[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();
  private readonly maxEvents = 10000;
  private readonly retentionMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.setupDefaultRules();
    this.startCleanupInterval();
  }

  // Main security check function
  async checkSecurity(request: NextRequest, context?: any): Promise<{
    allowed: boolean;
    threats: SecurityThreat[];
    events: SecurityEvent[];
  }> {
    const threats: SecurityThreat[] = [];
    const events: SecurityEvent[] = [];
    
    // Extract request info
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      const threat: SecurityThreat = {
        type: 'suspicious_activity',
        severity: 'high',
        description: 'Request from blocked IP address',
        riskScore: 90,
        shouldBlock: true
      };
      threats.push(threat);
    }

    // Run all security rules
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const threat = await rule.check(request, context);
        if (threat) {
          threats.push(threat);
          
          // Create security event
          const event = this.createSecurityEvent(threat, request, rule);
          events.push(event);
          this.logSecurityEvent(event);
          
          // Auto-block if configured
          if (rule.autoBlock && threat.shouldBlock) {
            this.blockIP(ip, `Auto-blocked due to ${threat.type}`);
          }
        }
      } catch (error) {
        console.error(`Security rule ${rule.id} failed:`, error);
      }
    }

    // Update suspicious activity tracking
    this.trackSuspiciousActivity(ip, threats.length > 0);

    // Determine if request should be allowed
    const criticalThreats = threats.filter(t => t.severity === 'critical' || t.shouldBlock);
    const allowed = criticalThreats.length === 0;

    // Record security metrics
    monitor.recordCounter('security.requests_checked', 1);
    monitor.recordCounter('security.threats_detected', threats.length);
    if (!allowed) {
      monitor.recordCounter('security.requests_blocked', 1);
    }

    return { allowed, threats, events };
  }

  // Security event logging
  private createSecurityEvent(
    threat: SecurityThreat, 
    request: NextRequest, 
    rule: SecurityRule
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: threat.type,
      severity: threat.severity,
      timestamp: Date.now(),
      source: {
        ip: this.extractIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        userId: request.headers.get('x-user-id') || undefined,
        organizationId: request.headers.get('x-organization-id') || undefined
      },
      details: {
        endpoint: request.url,
        method: request.method,
        description: threat.description,
        evidence: threat.evidence
      },
      risk_score: threat.riskScore,
      blocked: threat.shouldBlock
    };

    return event;
  }

  private logSecurityEvent(event: SecurityEvent): void {
    this.events.push(event);
    this.cleanup();

    // Log to console with appropriate level
    const logLevel = event.severity === 'critical' ? 'error' : 
                    event.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel](`🔒 [Security Event] ${event.type}:`, {
      id: event.id,
      severity: event.severity,
      ip: event.source.ip,
      description: event.details.description,
      riskScore: event.risk_score
    });

    // Send to external security monitoring in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityMonitoring(event);
    }
  }

  // IP blocking and tracking
  private blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    console.warn(`🚫 [Security] Blocked IP ${ip}: ${reason}`);
    
    // In production, also update firewall rules or WAF
    monitor.recordCounter('security.ips_blocked', 1, { reason });
  }

  private trackSuspiciousActivity(ip: string, isSuspicious: boolean): void {
    if (isSuspicious) {
      const current = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: 0 };
      current.count++;
      current.lastSeen = Date.now();
      this.suspiciousIPs.set(ip, current);

      // Auto-block after multiple suspicious activities
      if (current.count >= 5) {
        this.blockIP(ip, `Multiple suspicious activities (${current.count})`);
      }
    }
  }

  // Default security rules
  private setupDefaultRules(): void {
    // SQL Injection detection
    this.addRule({
      id: 'sql_injection',
      name: 'SQL Injection Detection',
      type: 'injection_attempt',
      enabled: true,
      severity: 'high',
      autoBlock: true,
      check: async (request) => {
        const url = request.url.toLowerCase();
        const sqlPatterns = [
          /union\s+select/i,
          /drop\s+table/i,
          /insert\s+into/i,
          /delete\s+from/i,
          /update\s+.*set/i,
          /exec\s*\(/i,
          /script\s*>/i,
          /'.*or.*'.*=/i
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(url)) {
            return {
              type: 'injection_attempt',
              severity: 'high',
              description: 'Potential SQL injection attempt detected in URL',
              evidence: { pattern: pattern.source, url },
              riskScore: 85,
              shouldBlock: true
            };
          }
        }

        // Check request body if present
        try {
          const body = await request.clone().text();
          for (const pattern of sqlPatterns) {
            if (pattern.test(body)) {
              return {
                type: 'injection_attempt',
                severity: 'high',
                description: 'Potential SQL injection attempt detected in request body',
                evidence: { pattern: pattern.source },
                riskScore: 85,
                shouldBlock: true
              };
            }
          }
        } catch (error) {
          // Body already consumed or not available
        }

        return null;
      }
    });

    // XSS detection
    this.addRule({
      id: 'xss_detection',
      name: 'XSS Attack Detection',
      type: 'xss_attempt',
      enabled: true,
      severity: 'high',
      autoBlock: true,
      check: async (request) => {
        const url = request.url.toLowerCase();
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /<iframe[^>]*>/i,
          /eval\s*\(/i,
          /alert\s*\(/i
        ];

        for (const pattern of xssPatterns) {
          if (pattern.test(url)) {
            return {
              type: 'xss_attempt',
              severity: 'high',
              description: 'Potential XSS attempt detected',
              evidence: { pattern: pattern.source, url },
              riskScore: 80,
              shouldBlock: true
            };
          }
        }

        return null;
      }
    });

    // Suspicious user agent detection
    this.addRule({
      id: 'suspicious_user_agent',
      name: 'Suspicious User Agent Detection',
      type: 'suspicious_activity',
      enabled: true,
      severity: 'medium',
      autoBlock: false,
      check: async (request) => {
        const userAgent = request.headers.get('user-agent') || '';
        const suspiciousPatterns = [
          /bot/i,
          /crawler/i,
          /spider/i,
          /scraper/i,
          /curl/i,
          /wget/i,
          /python/i,
          /scanner/i
        ];

        // Allow legitimate bots
        const legitimateBots = [
          /googlebot/i,
          /bingbot/i,
          /slackbot/i,
          /facebookexternalhit/i
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
        const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));

        if (isSuspicious && !isLegitimate) {
          return {
            type: 'suspicious_activity',
            severity: 'medium',
            description: 'Suspicious user agent detected',
            evidence: { userAgent },
            riskScore: 60,
            shouldBlock: false
          };
        }

        return null;
      }
    });

    // Rate limit violation detection
    this.addRule({
      id: 'rate_limit_violation',
      name: 'Rate Limit Violation Detection',
      type: 'rate_limit_exceeded',
      enabled: true,
      severity: 'medium',
      autoBlock: false,
      check: async (request, context) => {
        // This would integrate with the rate limiting system
        if (context?.rateLimitExceeded) {
          return {
            type: 'rate_limit_exceeded',
            severity: 'medium',
            description: 'Rate limit exceeded',
            evidence: context.rateLimitInfo,
            riskScore: 50,
            shouldBlock: true
          };
        }
        return null;
      }
    });
  }

  // Rule management
  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = true;
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = false;
  }

  // Utility functions
  private extractIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return ip.trim();
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionMs;
    this.events = this.events.filter(event => event.timestamp >= cutoff);
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Clean up suspicious IP tracking
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen < cutoff) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Every hour
  }

  private async sendToSecurityMonitoring(event: SecurityEvent): Promise<void> {
    // Integration with external security monitoring services
    // Examples: Splunk, DataDog Security, AWS Security Hub, etc.
    try {
      const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.error('Failed to send security event to monitoring:', error);
    }
  }

  // Public API for querying security data
  getSecurityEvents(since?: number, type?: SecurityEventType): SecurityEvent[] {
    const cutoff = since || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
    return this.events.filter(event => 
      event.timestamp >= cutoff && 
      (!type || event.type === type)
    );
  }

  getSecurityMetrics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    suspiciousIPs: number;
  } {
    const recentEvents = this.getSecurityEvents();
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size
    };
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    console.info(`🔓 [Security] Unblocked IP ${ip}`);
  }
}

// Global security audit instance
export const securityAudit = new SecurityAuditSystem();

// Convenience functions
export const checkSecurity = securityAudit.checkSecurity.bind(securityAudit);
export const isIPBlocked = securityAudit.isIPBlocked.bind(securityAudit);
export const getSecurityEvents = securityAudit.getSecurityEvents.bind(securityAudit);
export const getSecurityMetrics = securityAudit.getSecurityMetrics.bind(securityAudit);
