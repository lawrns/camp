/**
 * Security Optimization System
 *
 * Implements comprehensive security measures including rate limiting,
 * input validation, XSS protection, and security monitoring
 */

import { NextRequest, NextResponse } from "next/server";

interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  validation: {
    maxPayloadSize: number;
    allowedOrigins: string[];
    requiredHeaders: string[];
  };
  monitoring: {
    logSuspiciousActivity: boolean;
    alertThreshold: number;
    blockDuration: number;
  };
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  lastThreat: Date | null;
  threatsByType: Record<string, number>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class SecurityOptimizer {
  private static instance: SecurityOptimizer;
  private config: SecurityConfig;
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private blockedIPs = new Set<string>();
  private metrics: SecurityMetrics;

  constructor() {
    this.config = {
      rateLimiting: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false,
      },
      validation: {
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        allowedOrigins: ["http://localhost:3000", "https://campfire.com"],
        requiredHeaders: ["user-agent"],
      },
      monitoring: {
        logSuspiciousActivity: true,
        alertThreshold: 10,
        blockDuration: 300000, // 5 minutes
      },
    };

    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivity: 0,
      lastThreat: null,
      threatsByType: {},
    };

    this.initializeCleanup();
  }

  static getInstance(): SecurityOptimizer {
    if (!SecurityOptimizer.instance) {
      SecurityOptimizer.instance = new SecurityOptimizer();
    }
    return SecurityOptimizer.instance;
  }

  /**
   * Main security middleware
   */
  async securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
    this.metrics.totalRequests++;

    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    try {
      // Check if IP is blocked
      if (this.blockedIPs.has(clientIP)) {
        this.recordThreat("blocked_ip", clientIP);
        return this.createBlockedResponse("IP temporarily blocked");
      }

      // Rate limiting
      if (!this.checkRateLimit(clientIP)) {
        this.recordThreat("rate_limit_exceeded", clientIP);
        return this.createBlockedResponse("Rate limit exceeded");
      }

      // Input validation
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        this.recordThreat("validation_failed", clientIP);
        return this.createBlockedResponse(validationResult.reason);
      }

      // Suspicious activity detection
      if (this.detectSuspiciousActivity(request, userAgent)) {
        this.recordThreat("suspicious_activity", clientIP);
        this.blockIP(clientIP);
        return this.createBlockedResponse("Suspicious activity detected");
      }

      // XSS and injection protection
      if (this.detectXSSAttempt(request)) {
        this.recordThreat("xss_attempt", clientIP);
        return this.createBlockedResponse("Malicious content detected");
      }

      return null; // Allow request to proceed
    } catch (error) {

      return null; // Allow request on error to avoid blocking legitimate traffic
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const key = clientIP;

    let entry = this.rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.config.rateLimiting.windowMs,
        blocked: false,
      };
      this.rateLimitStore.set(key, entry);
      return true;
    }

    entry.count++;

    if (entry.count > this.config.rateLimiting.maxRequests) {
      entry.blocked = true;
      return false;
    }

    return true;
  }

  /**
   * Request validation
   */
  private async validateRequest(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
    // Check content length
    const contentLength = parseInt(request.headers.get("content-length") || "0");
    if (contentLength > this.config.validation.maxPayloadSize) {
      return { valid: false, reason: "Payload too large" };
    }

    // Check origin for CORS
    const origin = request.headers.get("origin");
    if (origin && !this.config.validation.allowedOrigins.includes(origin)) {
      return { valid: false, reason: "Invalid origin" };
    }

    // Check required headers
    for (const header of this.config.validation.requiredHeaders) {
      if (!request.headers.get(header)) {
        return { valid: false, reason: `Missing required header: ${header}` };
      }
    }

    // Validate request body if present
    if (request.method === "POST" || request.method === "PUT") {
      try {
        const body = await request.clone().text();
        if (body && !this.validateJSONStructure(body)) {
          return { valid: false, reason: "Invalid JSON structure" };
        }
      } catch (error) {
        return { valid: false, reason: "Invalid request body" };
      }
    }

    return { valid: true };
  }

  /**
   * Detect suspicious activity
   */
  private detectSuspiciousActivity(request: NextRequest, userAgent: string): boolean {
    const url = request.url;
    const method = request.method;

    // Check for bot-like behavior
    if (this.isSuspiciousUserAgent(userAgent)) {
      return true;
    }

    // Check for path traversal attempts
    if (url.includes("../") || url.includes("..\\")) {
      return true;
    }

    // Check for SQL injection patterns
    const sqlPatterns = ["union select", "drop table", "insert into", "delete from"];
    if (sqlPatterns.some((pattern) => url.toLowerCase().includes(pattern))) {
      return true;
    }

    // Check for excessive requests to sensitive endpoints
    if (url.includes("/api/auth") || url.includes("/api/admin")) {
      const clientIP = this.getClientIP(request);
      const recentRequests = this.getRecentRequestCount(clientIP, 60000); // 1 minute
      if (recentRequests > 10) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect XSS attempts
   */
  private detectXSSAttempt(request: NextRequest): boolean {
    const url = request.url;

    const xssPatterns = ["<script", "javascript:", "onload=", "onerror=", "eval(", "document.cookie"];

    return xssPatterns.some((pattern) => url.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Validate JSON structure
   */
  private validateJSONStructure(body: string): boolean {
    try {
      const parsed = JSON.parse(body);

      // Check for deeply nested objects (potential DoS)
      if (this.getObjectDepth(parsed) > 10) {
        return false;
      }

      // Check for excessively large arrays
      if (Array.isArray(parsed) && parsed.length > 1000) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = ["bot", "crawler", "spider", "scraper", "curl", "wget", "python-requests"];

    const normalizedUA = userAgent.toLowerCase();
    return suspiciousPatterns.some((pattern) => normalizedUA.includes(pattern));
  }

  /**
   * Get recent request count for IP
   */
  private getRecentRequestCount(clientIP: string, timeWindow: number): number {
    const entry = this.rateLimitStore.get(clientIP);
    if (!entry) return 0;

    const now = Date.now();
    if (now - (entry.resetTime - this.config.rateLimiting.windowMs) < timeWindow) {
      return entry.count;
    }

    return 0;
  }

  /**
   * Get object depth for DoS protection
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (depth > 20) return depth; // Prevent stack overflow

    if (typeof obj !== "object" || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const childDepth = this.getObjectDepth(obj[key], depth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Block IP address
   */
  private blockIP(ip: string): void {
    this.blockedIPs.add(ip);

    // Auto-unblock after configured duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, this.config.monitoring.blockDuration);
  }

  /**
   * Record security threat
   */
  private recordThreat(type: string, clientIP: string): void {
    this.metrics.blockedRequests++;
    this.metrics.suspiciousActivity++;
    this.metrics.lastThreat = new Date();
    this.metrics.threatsByType[type] = (this.metrics.threatsByType[type] || 0) + 1;

    if (this.config.monitoring.logSuspiciousActivity) {

    }
  }

  /**
   * Create blocked response
   */
  private createBlockedResponse(reason: string): NextResponse {
    return NextResponse.json(
      {
        error: "Request blocked",
        reason,
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-Security-Block": "true",
          "X-Block-Reason": reason,
          "Retry-After": "300",
        },
      }
    );
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    return "unknown";
  }

  /**
   * Initialize cleanup processes
   */
  private initializeCleanup(): void {
    // Clean up rate limit store every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 300000);
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    const metrics = this.getMetrics();
    const blockRate = metrics.totalRequests > 0 ? (metrics.blockedRequests / metrics.totalRequests) * 100 : 0;

    return {
      status: blockRate > 10 ? "high_threat" : blockRate > 5 ? "elevated" : "normal",
      totalRequests: metrics.totalRequests,
      blockedRequests: metrics.blockedRequests,
      blockRate,
      activeBans: this.blockedIPs.size,
      lastThreat: metrics.lastThreat,
      threatsByType: metrics.threatsByType,
    };
  }

  /**
   * Clear security metrics
   */
  clearMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivity: 0,
      lastThreat: null,
      threatsByType: {},
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const securityOptimizer = SecurityOptimizer.getInstance();
export default securityOptimizer;
