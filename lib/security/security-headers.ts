/**
 * Security Headers and Middleware
 * Implements comprehensive security headers and validation
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  corsOrigins: string[];
  rateLimitByIP: boolean;
  validateUserAgent: boolean;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  corsOrigins: ['http://localhost:3000', 'http://localhost:3001', 'https://*.vercel.app'],
  rateLimitByIP: true,
  validateUserAgent: true
};

export function addSecurityHeaders(
  response: NextResponse,
  config: Partial<SecurityConfig> = {}
): NextResponse {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  // Content Security Policy
  if (securityConfig.enableCSP) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
  }

  // HTTP Strict Transport Security
  if (securityConfig.enableHSTS) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Frame-Options
  if (securityConfig.enableXFrameOptions) {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  // X-Content-Type-Options
  if (securityConfig.enableXContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Referrer Policy
  if (securityConfig.enableReferrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  // Permissions Policy
  if (securityConfig.enablePermissionsPolicy) {
    const permissions = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ');
    
    response.headers.set('Permissions-Policy', permissions);
  }

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

export function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  // Check for suspicious user agents
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /curl.*bot/i,
    /python-requests/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return { valid: false, error: 'Suspicious user agent detected' };
  }

  // Check for common attack patterns in URL
  const url = request.url;
  const attackPatterns = [
    /\.\.\//,  // Directory traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /exec\(/i, // Code injection
    /eval\(/i, // Code injection
    /javascript:/i, // XSS
    /vbscript:/i, // XSS
    /onload=/i, // XSS
    /onerror=/i // XSS
  ];

  if (attackPatterns.some(pattern => pattern.test(url))) {
    return { valid: false, error: 'Malicious pattern detected in URL' };
  }

  // Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'Request too large' };
  }

  return { valid: true };
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload\s*=/gi, '')
      .replace(/onerror\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function hashSensitiveData(data: string): string {
  // Simple hash for logging purposes (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export function createSecureResponse(
  data: any,
  status: number = 200,
  config?: Partial<SecurityConfig>
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addSecurityHeaders(response, config);
}

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkAdvancedRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
  burstLimit?: number
): { allowed: boolean; remaining: number; resetTime: number; burst?: boolean } {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    };
  }

  // Check burst limit
  if (burstLimit && current.count >= burstLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      burst: true
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
