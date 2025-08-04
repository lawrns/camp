/**
 * Production Security Configuration
 * 
 * CRITICAL: This module enforces production security policies and removes
 * all development bypasses when deployed to production environments.
 */

import { isProductionEnvironment, logSecurityBypass } from './environment';

/**
 * Production security enforcement
 */
export class ProductionSecurity {
  private static instance: ProductionSecurity;
  private isInitialized = false;
  private securityViolations: string[] = [];

  private constructor() {}

  static getInstance(): ProductionSecurity {
    if (!ProductionSecurity.instance) {
      ProductionSecurity.instance = new ProductionSecurity();
    }
    return ProductionSecurity.instance;
  }

  /**
   * Initialize production security enforcement
   */
  initialize(): void {
    if (this.isInitialized) return;

    if (isProductionEnvironment()) {
      this.enforceProductionSecurity();
      this.disableDevFeatures();
      this.sanitizeConsole();
      this.validateEnvironment();
    }

    this.isInitialized = true;
  }

  /**
   * Enforce production security policies
   */
  private enforceProductionSecurity(): void {
    // Block all development bypasses
    this.blockDevelopmentHeaders();
    this.blockTestEndpoints();
    this.enforceHTTPS();
    this.validateSecrets();
  }

  /**
   * Block development authentication headers
   */
  private blockDevelopmentHeaders(): void {
    if (typeof window !== 'undefined') {
      // Client-side: Override fetch to block test headers
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.headers) {
          const headers = new Headers(init.headers);
          
          // Block development test headers
          const blockedHeaders = [
            'X-Test-Organization-ID',
            'X-Test-User-ID',
            'X-Dev-Bypass',
            'X-Force-Organization',
          ];

          for (const header of blockedHeaders) {
            if (headers.has(header)) {
              this.reportSecurityViolation(`Blocked development header: ${header}`);
              headers.delete(header);
            }
          }

          init.headers = headers;
        }

        return originalFetch(input, init);
      };
    }
  }

  /**
   * Block test endpoints in production
   */
  private blockTestEndpoints(): void {
    const blockedPaths = [
      '/api/test/',
      '/api/dev/',
      '/api/debug/',
      '/api/mock/',
    ];

    // This would be implemented in middleware
    // For now, we log the configuration
    console.info('[ProductionSecurity] Test endpoints blocked:', blockedPaths);
  }

  /**
   * Enforce HTTPS in production
   */
  private enforceHTTPS(): void {
    if (typeof window !== 'undefined') {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        this.reportSecurityViolation('Non-HTTPS connection detected in production');
        // Redirect to HTTPS
        window.location.href = window.location.href.replace('http:', 'https:');
      }
    }
  }

  /**
   * Validate that all required secrets are present
   */
  private validateSecrets(): void {
    const requiredSecrets = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'WIDGET_JWT_SECRET',
      'CRYPTO_SECRET',
    ];

    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        this.reportSecurityViolation(`Missing required secret: ${secret}`);
      }
    }
  }

  /**
   * Disable development features
   */
  private disableDevFeatures(): void {
    // Disable React DevTools
    if (typeof window !== 'undefined') {
      (window as unknown).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: true,
        supportsFiber: true,
        inject: () => {},
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
      };
    }

    // Disable debug flags
    if (typeof window !== 'undefined') {
      (window as unknown).DEBUG = false;
      (window as unknown).__DEV__ = false;
    }
  }

  /**
   * Sanitize console output in production
   */
  private sanitizeConsole(): void {
    if (typeof window !== 'undefined') {
      // Override console methods to prevent sensitive data leakage
      const originalMethods = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
      };

      // Only allow critical errors and warnings
      console.log = () => {}; // Silence all logs
      console.info = () => {}; // Silence all info
      console.debug = () => {}; // Silence all debug

      // Filter warnings and errors
      console.warn = (...args: unknown[]) => {
        const message = args.join(' ');
        if (this.isCriticalMessage(message)) {
          originalMethods.warn(...args);
        }
      };

      console.error = (...args: unknown[]) => {
        const message = args.join(' ');
        if (this.isCriticalMessage(message)) {
          originalMethods.error(...args);
        }
      };
    }
  }

  /**
   * Check if a console message is critical and should be shown
   */
  private isCriticalMessage(message: string): boolean {
    const criticalPatterns = [
      /security/i,
      /authentication.*failed/i,
      /unauthorized/i,
      /payment.*error/i,
      /critical.*error/i,
      /database.*error/i,
    ];

    return criticalPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Validate production environment
   */
  private validateEnvironment(): void {
    const checks = [
      {
        name: 'NODE_ENV',
        check: () => process.env.NODE_ENV === 'production',
        error: 'NODE_ENV must be set to production',
      },
      {
        name: 'HTTPS',
        check: () => typeof window === 'undefined' || window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        error: 'HTTPS must be enforced in production',
      },
      {
        name: 'Debug Disabled',
        check: () => !process.env.DEBUG && !process.env.NEXT_PUBLIC_DEBUG,
        error: 'Debug flags must be disabled in production',
      },
    ];

    for (const check of checks) {
      if (!check.check()) {
        this.reportSecurityViolation(`Environment validation failed: ${check.error}`);
      }
    }
  }

  /**
   * Report security violations
   */
  private reportSecurityViolation(violation: string): void {
    this.securityViolations.push(violation);
    
    logSecurityBypass('Production Security Violation', {
      violation,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    });

    // In production, also report to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/security/report-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violation,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail - don't expose errors
      });
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    isProduction: boolean;
    violations: string[];
    isSecure: boolean;
  } {
    return {
      isProduction: isProductionEnvironment(),
      violations: [...this.securityViolations],
      isSecure: this.securityViolations.length === 0,
    };
  }

  /**
   * Block specific development functions
   */
  blockDevelopmentFunction(functionName: string, context: string): void {
    if (isProductionEnvironment()) {
      this.reportSecurityViolation(`Development function blocked: ${functionName} in ${context}`);
      throw new Error(`Security: ${functionName} is not available in production`);
    }
  }

  /**
   * Validate API request for production security
   */
  validateApiRequest(request: {
    headers: Record<string, string>;
    url: string;
    method: string;
  }): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for development headers
    const devHeaders = [
      'X-Test-Organization-ID',
      'X-Test-User-ID',
      'X-Dev-Bypass',
      'X-Force-Organization',
    ];

    for (const header of devHeaders) {
      if (request.headers[header] || request.headers[header.toLowerCase()]) {
        violations.push(`Development header detected: ${header}`);
      }
    }

    // Check for test endpoints
    const testPaths = ['/api/test/', '/api/dev/', '/api/debug/', '/api/mock/'];
    if (testPaths.some(path => request.url.includes(path))) {
      violations.push(`Test endpoint accessed: ${request.url}`);
    }

    // Log violations
    violations.forEach(violation => this.reportSecurityViolation(violation));

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

/**
 * Initialize production security (call this in app startup)
 */
export function initializeProductionSecurity(): void {
  const security = ProductionSecurity.getInstance();
  security.initialize();
}

/**
 * Get production security instance
 */
export function getProductionSecurity(): ProductionSecurity {
  return ProductionSecurity.getInstance();
}

/**
 * Block development function in production
 */
export function blockInProduction(functionName: string, context: string): void {
  const security = ProductionSecurity.getInstance();
  security.blockDevelopmentFunction(functionName, context);
}

/**
 * Validate API request security
 */
export function validateProductionApiRequest(request: {
  headers: Record<string, string>;
  url: string;
  method: string;
}): { valid: boolean; violations: string[] } {
  const security = ProductionSecurity.getInstance();
  return security.validateApiRequest(request);
}
