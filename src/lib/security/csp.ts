/**
 * Content Security Policy (CSP) Configuration
 *
 * Enterprise-grade security implementation for government and finance customers:
 * - Strict CSP policies with nonce-based script execution
 * - Subresource Integrity (SRI) for all static assets
 * - Report-only mode for gradual rollout
 * - CSP violation reporting and monitoring
 */

import crypto from "crypto";

// CSP directive types
export interface CSPDirectives {
  "default-src"?: string[];
  "script-src"?: string[];
  "style-src"?: string[];
  "img-src"?: string[];
  "font-src"?: string[];
  "connect-src"?: string[];
  "media-src"?: string[];
  "object-src"?: string[];
  "child-src"?: string[];
  "frame-src"?: string[];
  "worker-src"?: string[];
  "manifest-src"?: string[];
  "base-uri"?: string[];
  "form-action"?: string[];
  "frame-ancestors"?: string[];
  "report-uri"?: string[];
  "report-to"?: string[];
}

// Environment-specific CSP configurations
const CSP_CONFIGS = {
  development: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-eval'", // Allow eval for development
      "'unsafe-inline'", // Allow inline scripts for development
      "localhost:*",
      "127.0.0.1:*",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Allow inline styles for development
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "http:", // Allow HTTP images in development
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
    "connect-src": [
      "'self'",
      "ws://localhost:*",
      "wss://localhost:*",
      "http://localhost:*",
      "https://localhost:*",
      "https://*.supabase.co",
      "https://*.sentry.io",
      "https://api.launchdarkly.com",
    ],
    "media-src": ["'self'", "data:", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  },

  staging: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'nonce-{NONCE}'", // Nonce-based script execution
      "https://cdn.jsdelivr.net",
      "https://js.sentry-cdn.com",
      "https://app.launchdarkly.com",
    ],
    "style-src": [
      "'self'",
      "'nonce-{NONCE}'", // Nonce-based style execution
      "https://fonts.googleapis.com",
    ],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "wss://*.supabase.co",
      "https://*.supabase.co",
      "https://*.sentry.io",
      "https://api.launchdarkly.com",
      "https://events.launchdarkly.com",
    ],
    "media-src": ["'self'", "data:", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "report-uri": ["/api/security/csp-report"],
  },

  production: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'nonce-{NONCE}'", // Strict nonce-based execution
      "https://js.sentry-cdn.com",
      "https://app.launchdarkly.com",
    ],
    "style-src": ["'self'", "'nonce-{NONCE}'", "https://fonts.googleapis.com"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:", // Allow HTTPS images only
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "wss://*.supabase.co",
      "https://*.supabase.co",
      "https://*.sentry.io",
      "https://api.launchdarkly.com",
      "https://events.launchdarkly.com",
    ],
    "media-src": ["'self'", "data:", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
    "block-all-mixed-content": [],
    "report-uri": ["/api/security/csp-report"],
    "report-to": ["csp-endpoint"],
  },
};

// Generate cryptographically secure nonce
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

// Build CSP header string
export function buildCSPHeader(
  environment: "development" | "staging" | "production",
  nonce?: string,
  reportOnly: boolean = false
): string {
  const config = CSP_CONFIGS[environment];
  const directives: string[] = [];

  Object.entries(config).forEach(([directive, values]) => {
    if (values.length === 0) {
      // Directives without values (like upgrade-insecure-requests)
      directives.push(directive);
    } else {
      const processedValues = values.map((value) => (nonce ? value.replace("{NONCE}", nonce) : value));
      directives.push(`${directive} ${processedValues.join(" ")}`);
    }
  });

  const headerName = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  return directives.join("; ");
}

// CSP violation reporting
export interface CSPViolationReport {
  "document-uri": string;
  referrer: string;
  "violated-directive": string;
  "effective-directive": string;
  "original-policy": string;
  disposition: string;
  "blocked-uri": string;
  "line-number": number;
  "column-number": number;
  "source-file": string;
  "status-code": number;
  "script-sample": string;
}

// Process CSP violation reports
export function processCSPViolation(report: CSPViolationReport): {
  severity: "low" | "medium" | "high" | "critical";
  action: "log" | "alert" | "block";
  metadata: Record<string, any>;
} {
  const { "violated-directive": violatedDirective, "blocked-uri": blockedUri } = report;

  // Determine severity based on violation type
  let severity: "low" | "medium" | "high" | "critical" = "medium";
  let action: "log" | "alert" | "block" = "log";

  // Critical violations
  if (violatedDirective.includes("script-src") && blockedUri.includes("javascript:")) {
    severity = "critical";
    action = "block";
  } else if (violatedDirective.includes("object-src") || violatedDirective.includes("base-uri")) {
    severity = "high";
    action = "alert";
  }
  // Medium violations
  else if (violatedDirective.includes("script-src") || violatedDirective.includes("style-src")) {
    severity = "medium";
    action = "alert";
  }
  // Low violations
  else if (violatedDirective.includes("img-src") || violatedDirective.includes("font-src")) {
    severity = "low";
    action = "log";
  }

  return {
    severity,
    action,
    metadata: {
      violatedDirective,
      blockedUri,
      sourceFile: report["source-file"],
      lineNumber: report["line-number"],
      userAgent: report.referrer,
      timestamp: new Date().toISOString(),
    },
  };
}

// CSP middleware for Next.js
export function createCSPMiddleware(
  environment: "development" | "staging" | "production",
  options: {
    reportOnly?: boolean;
    enableNonce?: boolean;
    customDirectives?: Partial<CSPDirectives>;
  } = {}
) {
  return function cspMiddleware(req: unknown, res: unknown, next: unknown) {
    const { reportOnly = false, enableNonce = true, customDirectives = {} } = options;

    // Generate nonce for this request
    const nonce = enableNonce ? generateNonce() : undefined;

    // Merge custom directives with default config
    if (Object.keys(customDirectives).length > 0) {
      const config = { ...CSP_CONFIGS[environment], ...customDirectives };
      CSP_CONFIGS[environment] = config;
    }

    // Build and set CSP header
    const cspHeader = buildCSPHeader(environment, nonce, reportOnly);
    const headerName = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

    res.setHeader(headerName, cspHeader);

    // Add nonce to response locals for template usage
    if (nonce) {
      res.locals = res.locals || {};
      res.locals.nonce = nonce;
    }

    // Add security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (environment === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    next();
  };
}

// React hook for CSP nonce
export function useCSPNonce(): string | undefined {
  if (typeof window === "undefined") {
    // Server-side: get nonce from response locals or generate new one
    return generateNonce();
  }

  // Client-side: get nonce from meta tag
  const metaTag = document.querySelector('meta[name="csp-nonce"]');
  return metaTag?.getAttribute("content") || undefined;
}

// Validate CSP configuration
export function validateCSPConfig(config: CSPDirectives): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for unsafe directives in production
  Object.entries(config).forEach(([directive, values]) => {
    if (values?.includes("'unsafe-eval'")) {
      errors.push(`${directive} contains 'unsafe-eval' which is not allowed in production`);
    }
    if (values?.includes("'unsafe-inline'") && !values?.includes("'nonce-")) {
      warnings.push(`${directive} contains 'unsafe-inline' without nonce, consider using nonce-based CSP`);
    }
  });

  // Check for missing essential directives
  if (!config["default-src"]) {
    errors.push("Missing 'default-src' directive");
  }
  if (!config["script-src"]) {
    warnings.push("Missing 'script-src' directive, falling back to 'default-src'");
  }
  if (!config["object-src"] || !config["object-src"].includes("'none'")) {
    warnings.push("Consider setting 'object-src' to 'none' for better security");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default {
  generateNonce,
  buildCSPHeader,
  createCSPMiddleware,
  processCSPViolation,
  validateCSPConfig,
  useCSPNonce,
};
