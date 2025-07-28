/**
 * Enterprise Security Integration
 *
 * Centralized security configuration and middleware integration:
 * - CSP and SRI enforcement
 * - Audit logging initialization
 * - Security headers configuration
 * - Feature flag integration for gradual security rollout
 */

import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { AuditEventType, AuditSeverity, initializeAuditLogger } from "./audit-logging";
import { createCSPMiddleware, generateNonce } from "./csp";

// Security configuration
export interface SecurityConfig {
  csp: {
    enabled: boolean;
    reportOnly: boolean;
    nonce: boolean;
    environment: "development" | "staging" | "production";
  };
  sri: {
    enabled: boolean;
    algorithm: "sha256" | "sha384" | "sha512";
    manifestPath: string;
  };
  auditLogging: {
    enabled: boolean;
    destinations: ("console" | "file" | "database" | "siem")[];
    logLevel: "low" | "medium" | "high" | "critical";
    retentionDays: number;
  };
  headers: {
    hsts: boolean;
    nosniff: boolean;
    frameOptions: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
    xssProtection: boolean;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
}

// Environment-specific security configurations
const SECURITY_CONFIGS: Record<string, SecurityConfig> = {
  development: {
    csp: {
      enabled: false, // Disabled for development ease
      reportOnly: true,
      nonce: false,
      environment: "development",
    },
    sri: {
      enabled: false, // Disabled for development
      algorithm: "sha384",
      manifestPath: "./public/sri-manifest.json",
    },
    auditLogging: {
      enabled: true,
      destinations: ["console"],
      logLevel: "low",
      retentionDays: 7,
    },
    headers: {
      hsts: false,
      nosniff: true,
      frameOptions: "DENY",
      xssProtection: true,
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsPolicy: "camera=(), microphone=(), geolocation=()",
    },
  },

  staging: {
    csp: {
      enabled: true,
      reportOnly: true, // Report-only for testing
      nonce: true,
      environment: "staging",
    },
    sri: {
      enabled: true,
      algorithm: "sha384",
      manifestPath: "./public/sri-manifest.json",
    },
    auditLogging: {
      enabled: true,
      destinations: ["console", "database"],
      logLevel: "medium",
      retentionDays: 30,
    },
    headers: {
      hsts: true,
      nosniff: true,
      frameOptions: "DENY",
      xssProtection: true,
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsPolicy: "camera=(), microphone=(), geolocation=()",
    },
  },

  production: {
    csp: {
      enabled: true,
      reportOnly: false, // Enforce in production
      nonce: true,
      environment: "production",
    },
    sri: {
      enabled: true,
      algorithm: "sha384",
      manifestPath: "./public/sri-manifest.json",
    },
    auditLogging: {
      enabled: true,
      destinations: ["database", "siem"],
      logLevel: "medium",
      retentionDays: 2555, // 7 years for compliance
    },
    headers: {
      hsts: true,
      nosniff: true,
      frameOptions: "DENY",
      xssProtection: true,
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsPolicy: "camera=(), microphone=(), geolocation=()",
    },
  },
};

// Get security configuration based on environment
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || "development";
  return SECURITY_CONFIGS[env] || SECURITY_CONFIGS.development;
}

// Initialize security systems
export function initializeSecurity(): {
  config: SecurityConfig;
  nonce?: string;
} {
  const config = getSecurityConfig();

  // Initialize audit logging
  if (config.auditLogging.enabled) {
    initializeAuditLogger({
      enabled: true,
      destinations: config.auditLogging.destinations,
      logLevel: config.auditLogging.logLevel as any,
      retentionDays: config.auditLogging.retentionDays,
      signingKey: process.env.AUDIT_SIGNING_KEY || "default-signing-key",
      batchSize: 10,
      flushInterval: 5000,
    });
  }

  // Generate nonce for CSP if enabled
  const nonce = config.csp.enabled && config.csp.nonce ? generateNonce() : undefined;

  return { config, nonce };
}

// Security middleware for Next.js
export function createSecurityMiddleware() {
  return function securityMiddleware(request: NextRequest) {
    const { config, nonce } = initializeSecurity();
    const response = NextResponse.next();

    // Apply security headers
    if (config.headers.hsts && request.nextUrl.protocol === "https:") {
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    if (config.headers.nosniff) {
      response.headers.set("X-Content-Type-Options", "nosniff");
    }

    response.headers.set("X-Frame-Options", config.headers.frameOptions);

    if (config.headers.xssProtection) {
      response.headers.set("X-XSS-Protection", "1; mode=block");
    }

    response.headers.set("Referrer-Policy", config.headers.referrerPolicy);
    response.headers.set("Permissions-Policy", config.headers.permissionsPolicy);

    // Apply CSP if enabled
    if (config.csp.enabled) {
      const cspMiddleware = createCSPMiddleware(config.csp.environment, {
        reportOnly: config.csp.reportOnly,
        enableNonce: config.csp.nonce,
      });

      // Simulate middleware execution
      const mockReq = { nextUrl: request.nextUrl };
      const mockRes = {
        setHeader: (name: string, value: string) => {
          response.headers.set(name, value);
        },
        locals: {},
      };

      cspMiddleware(mockReq, mockRes, () => {});

      // Add nonce to response if generated
      if (nonce) {
        response.headers.set("X-CSP-Nonce", nonce);
      }
    }

    return response;
  };
}

// Security event reporting
export async function reportSecurityEvent(
  type: "csp_violation" | "sri_failure" | "suspicious_activity",
  details: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  const { auditLog } = await import("./audit-logging");

  let eventType: AuditEventType;
  let severity: AuditSeverity;

  switch (type) {
    case "csp_violation":
      eventType = AuditEventType.CSP_VIOLATION;
      severity = AuditSeverity.HIGH;
      break;
    case "sri_failure":
      eventType = AuditEventType.SRI_FAILURE;
      severity = AuditSeverity.HIGH;
      break;
    case "suspicious_activity":
      eventType = AuditEventType.SUSPICIOUS_ACTIVITY;
      severity = AuditSeverity.CRITICAL;
      break;
    default:
      eventType = AuditEventType.SECURITY_VIOLATION;
      severity = AuditSeverity.MEDIUM;
  }

  await auditLog(eventType, `Security event: ${type}`, {
    severity,
    actor: {
      ipAddress: request?.ip,
      userAgent: request?.headers.get("user-agent") || undefined,
    },
    resource: {
      type: "security_event",
      path: request?.nextUrl.pathname,
    },
    outcome: "failure",
    details,
  });
}

// CSP violation report handler
export async function handleCSPViolation(report: any, request: NextRequest): Promise<NextResponse> {
  await reportSecurityEvent("csp_violation", report, request);

  // Send to external monitoring if configured
  if (process.env.SENTRY_DSN) {
    // In a real implementation, send to Sentry

  }

  return NextResponse.json({ status: "received" }, { status: 200 });
}

// Security health check
export function getSecurityHealth(): {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, boolean>;
  timestamp: string;
} {
  const config = getSecurityConfig();

  const checks = {
    csp_enabled: config.csp.enabled,
    sri_enabled: config.sri.enabled,
    audit_logging_enabled: config.auditLogging.enabled,
    hsts_enabled: config.headers.hsts,
    secure_headers_enabled: true,
  };

  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const healthPercentage = (healthyChecks / totalChecks) * 100;

  let status: "healthy" | "degraded" | "unhealthy";
  if (healthPercentage >= 90) {
    status = "healthy";
  } else if (healthPercentage >= 70) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

// React hook for security context
export function useSecurityContext() {
  const [securityHealth, setSecurityHealth] = React.useState(getSecurityHealth());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSecurityHealth(getSecurityHealth());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    health: securityHealth,
    isSecure: securityHealth.status === "healthy",
    config: getSecurityConfig(),
  };
}

export default {
  getSecurityConfig,
  initializeSecurity,
  createSecurityMiddleware,
  reportSecurityEvent,
  handleCSPViolation,
  getSecurityHealth,
  useSecurityContext,
};
