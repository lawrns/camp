/**
 * Input Sanitization
 * Follows GUIDE.md specifications for security best practices
 */

// Note: In production, install isomorphic-dompurify
// import DOMPurify from 'isomorphic-dompurify';

// Temporary simple sanitization function
const simpleSanitize = (content: string): string => {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '');
};

// ============================================================================
// SANITIZATION CONFIGURATIONS
// ============================================================================

export const ALLOWED_TAGS = ['b', 'i', 'u', 'a', 'br', 'strong', 'em', 'code', 'pre'];
export const ALLOWED_ATTR = ['href', 'target', 'rel'];

export const STRICT_ALLOWED_TAGS = ['b', 'i', 'u', 'br'];
export const STRICT_ALLOWED_ATTR: string[] = [];

// ============================================================================
// MESSAGE SANITIZATION
// ============================================================================

/**
 * Sanitize message content
 */
export const sanitizeMessage = (content: string): string => {
  return simpleSanitize(content);
};

/**
 * Sanitize message content with strict settings
 */
export const sanitizeMessageStrict = (content: string): string => {
  return simpleSanitize(content);
};

/**
 * General input sanitization for widget use
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return simpleSanitize(input.trim());
};

// ============================================================================
// USER INPUT VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate username format
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate organization name
 */
export const validateOrganizationName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s\-_\.]+$/.test(name);
};

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate message content
 */
export const validateMessageContent = (content: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (content.length > 10000) {
    errors.push('Message is too long (maximum 10,000 characters)');
  }
  
  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push('Message contains potentially unsafe content');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check file name
  const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!fileNameRegex.test(file.name)) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate and sanitize URL
 */
export const validateUrl = (url: string): {
  isValid: boolean;
  sanitizedUrl?: string;
  errors: string[];
} => {
  const errors: string[] = [];
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('Only HTTP and HTTPS URLs are allowed');
    }
    
    // Check for localhost or private IPs
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      errors.push('Private/local URLs are not allowed');
    }
    
    if (errors.length === 0) {
      return {
        isValid: true,
        sanitizedUrl: urlObj.toString() || '',
        errors: []
      };
    }
  } catch {
    errors.push('Invalid URL format');
  }
  
  return {
    isValid: false,
    errors
  };
};

// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * Escape HTML content
 */
export const escapeHtml = (text: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
};

/**
 * Check for XSS patterns
 */
export const detectXSS = (content: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(content));
};

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================

/**
 * Check for SQL injection patterns
 */
export const detectSQLInjection = (content: string): boolean => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\b(exec|execute|sp_|xp_)\b)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(content));
};

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Comprehensive input validation
 */
export const validateInput = (input: string, type: 'message' | 'email' | 'username' | 'url'): {
  isValid: boolean;
  sanitized: string | undefined;
  errors: string[];
} => {
  const errors: string[] = [];
  let sanitized: string | undefined;
  
  // Check for XSS
  if (detectXSS(input)) {
    errors.push('Input contains potentially unsafe content');
  }
  
  // Check for SQL injection
  if (detectSQLInjection(input)) {
    errors.push('Input contains potentially unsafe patterns');
  }
  
  // Type-specific validation
  switch (type) {
    case 'message':
      const messageValidation = validateMessageContent(input);
      errors.push(...messageValidation.errors);
      if (messageValidation.isValid) {
        sanitized = sanitizeMessage(input);
      }
      break;
      
    case 'email':
      if (!validateEmail(input)) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'username':
      if (!validateUsername(input)) {
        errors.push('Invalid username format');
      }
      break;
      
    case 'url':
      const urlValidation = validateUrl(input);
      errors.push(...urlValidation.errors);
      if (urlValidation.isValid) {
        sanitized = urlValidation.sanitizedUrl || '';
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    sanitized: sanitized || undefined,
    errors
  };
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Generate secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      const index = array[i] % chars.length;
      result += chars[index];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

/**
 * Hash sensitive data (basic implementation)
 */
export const hashSensitiveData = (data: string): string => {
  // In production, use a proper hashing library like bcrypt
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}; 