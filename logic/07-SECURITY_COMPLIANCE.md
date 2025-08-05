# SECURITY & COMPLIANCE COMPREHENSIVE GUIDE

## 🔒 SECURITY ARCHITECTURE

### Security Layers Overview
```
Security Architecture:
├── Application Security
│   ├── Authentication & Authorization
│   ├── Input Validation & Sanitization
│   ├── XSS & CSRF Protection
│   └── Rate Limiting & Throttling
├── Data Security
│   ├── Encryption at Rest
│   ├── Encryption in Transit
│   ├── Data Masking & Tokenization
│   └── Secure Key Management
├── Infrastructure Security
│   ├── Network Security
│   ├── Container Security
│   ├── Secrets Management
│   └── Access Controls
└── Compliance & Governance
    ├── SOC 2 Type II
    ├── GDPR Compliance
    ├── CCPA Compliance
    └── Data Residency
```

## 🛡️ APPLICATION SECURITY

### Authentication & Authorization
```typescript
// lib/auth/next-auth-config.ts
import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user data to token
      if (user) {
        token.userId = user.id;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.userId;
      session.user.organizationId = token.organizationId;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      if (account?.provider === 'google') {
        return await validateGoogleUser(profile);
      }
      return true;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account }) {
      // Log sign-in events
      await logSecurityEvent('sign_in', {
        userId: user.id,
        provider: account?.provider,
        timestamp: new Date()
      });
    },
    async signOut({ token }) {
      // Log sign-out events
      await logSecurityEvent('sign_out', {
        userId: token?.userId,
        timestamp: new Date()
      });
    }
  }
};
```

### Role-Based Access Control (RBAC)
```typescript
// lib/auth/rbac.ts
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  TEAM_LEAD = 'team_lead',
  AGENT = 'agent',
  VIEWER = 'viewer'
}

export enum Permission {
  // Conversation permissions
  READ_CONVERSATIONS = 'read:conversations',
  CREATE_CONVERSATIONS = 'create:conversations',
  UPDATE_CONVERSATIONS = 'update:conversations',
  DELETE_CONVERSATIONS = 'delete:conversations',
  
  // User management
  READ_USERS = 'read:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Organization management
  READ_ORGANIZATION = 'read:organization',
  UPDATE_ORGANIZATION = 'update:organization',
  DELETE_ORGANIZATION = 'delete:organization',
  
  // Analytics
  READ_ANALYTICS = 'read:analytics',
  EXPORT_DATA = 'export:data'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ORGANIZATION_ADMIN]: [
    Permission.READ_CONVERSATIONS,
    Permission.CREATE_CONVERSATIONS,
    Permission.UPDATE_CONVERSATIONS,
    Permission.DELETE_CONVERSATIONS,
    Permission.READ_USERS,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_ORGANIZATION,
    Permission.UPDATE_ORGANIZATION,
    Permission.READ_ANALYTICS,
    Permission.EXPORT_DATA
  ],
  [UserRole.TEAM_LEAD]: [
    Permission.READ_CONVERSATIONS,
    Permission.CREATE_CONVERSATIONS,
    Permission.UPDATE_CONVERSATIONS,
    Permission.READ_USERS,
    Permission.UPDATE_USERS,
    Permission.READ_ANALYTICS
  ],
  [UserRole.AGENT]: [
    Permission.READ_CONVERSATIONS,
    Permission.CREATE_CONVERSATIONS,
    Permission.UPDATE_CONVERSATIONS,
    Permission.READ_USERS
  ],
  [UserRole.VIEWER]: [
    Permission.READ_CONVERSATIONS,
    Permission.READ_USERS,
    Permission.READ_ANALYTICS
  ]
};

// Middleware for permission checking
export function requirePermission(permission: Permission) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRole = await getUserRole(session.user.id);
    const permissions = rolePermissions[userRole];
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    return true;
  };
}
```

### Input Validation & Sanitization
```typescript
// lib/security/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// XSS Protection
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

// Input validation schemas
export const conversationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform(sanitizeHtml),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .transform(sanitizeHtml)
    .optional(),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  customerEmail: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase().trim()),
  
  tags: z.array(z.string().max(50)).max(10).optional()
});

// SQL Injection prevention
export const validateQuery = (query: string): string => {
  // Remove potentially dangerous SQL keywords
  const dangerousKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'UNION', 'JOIN', 'WHERE', 'OR', 'AND', '--', '/*', '*/'
  ];
  
  let sanitized = query;
  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator
  keyGenerator: (req: Request) => {
    return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  }
};
```

## 🔐 DATA SECURITY

### Encryption Configuration
```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export class DataEncryption {
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('campfire-app'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  static decrypt(encryptedData: string): string {
    const { iv, encryptedData: encrypted, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('campfire-app'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
```

### Data Masking for PII
```typescript
// lib/security/data-masking.ts
export class DataMasking {
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return `***-***-${cleaned.slice(-4)}`;
  }

  static maskCreditCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    return `****-****-****-${cleaned.slice(-4)}`;
  }

  static maskSSN(ssn: string): string {
    const cleaned = ssn.replace(/\D/g, '');
    return `***-**-${cleaned.slice(-4)}`;
  }

  static maskSensitiveData(data: any, fieldsToMask: string[]): any {
    const masked = { ...data };
    
    fieldsToMask.forEach(field => {
      if (masked[field]) {
        if (field.includes('email')) {
          masked[field] = this.maskEmail(masked[field]);
        } else if (field.includes('phone')) {
          masked[field] = this.maskPhone(masked[field]);
        } else if (field.includes('card')) {
          masked[field] = this.maskCreditCard(masked[field]);
        } else if (field.includes('ssn')) {
          masked[field] = this.maskSSN(masked[field]);
        } else {
          masked[field] = '***REDACTED***';
        }
      }
    });
    
    return masked;
  }
}
```

## 🏛️ COMPLIANCE FRAMEWORKS

### GDPR Compliance
```typescript
// lib/compliance/gdpr.ts
export class GDPRCompliance {
  static async handleDataSubjectRequest(userId: string, requestType: 'access' | 'deletion' | 'portability') {
    switch (requestType) {
      case 'access':
        return await this.exportUserData(userId);
      case 'deletion':
        return await this.deleteUserData(userId);
      case 'portability':
        return await this.exportPortableData(userId);
      default:
        throw new Error('Invalid request type');
    }
  }

  private static async exportUserData(userId: string) {
    const userData = await db.query(`
      SELECT * FROM users WHERE id = $1
      UNION ALL
      SELECT * FROM conversations WHERE customer_id = $1
      UNION ALL
      SELECT * FROM messages WHERE sender_id = $1
    `, [userId]);

    return {
      personalData: userData,
      generatedAt: new Date().toISOString(),
      format: 'JSON',
      dataController: 'Campfire Inc.',
      contact: 'privacy@campfire.dev'
    };
  }

  private static async deleteUserData(userId: string) {
    // Soft delete with 30-day retention
    await db.query(`
      UPDATE users SET deleted_at = NOW() WHERE id = $1;
      UPDATE conversations SET deleted_at = NOW() WHERE customer_id = $1;
      UPDATE messages SET deleted_at = NOW() WHERE sender_id = $1;
    `, [userId]);

    // Schedule hard delete after 30 days
    await scheduleHardDelete(userId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }

  static async logConsent(userId: string, consentType: string, granted: boolean) {
    await db.query(`
      INSERT INTO consent_logs (user_id, consent_type, granted, timestamp)
      VALUES ($1, $2, $3, NOW())
    `, [userId, consentType, granted]);
  }

  static async getConsentHistory(userId: string) {
    return await db.query(`
      SELECT * FROM consent_logs WHERE user_id = $1 ORDER BY timestamp DESC
    `, [userId]);
  }
}
```

### CCPA Compliance
```typescript
// lib/compliance/ccpa.ts
export class CCPACompliance {
  static async handleConsumerRequest(userId: string, requestType: 'know' | 'delete' | 'opt-out') {
    switch (requestType) {
      case 'know':
        return await this.providePersonalInfo(userId);
      case 'delete':
        return await this.deletePersonalInfo(userId);
      case 'opt-out':
        return await this.optOutOfSale(userId);
      default:
        throw new Error('Invalid request type');
    }
  }

  private static async providePersonalInfo(userId: string) {
    const data = await GDPRCompliance.exportUserData(userId);
    
    return {
      ...data,
      categories: [
        'Identifiers',
        'Commercial Information',
        'Internet Activity',
        'Geolocation Data'
      ],
      sources: ['Direct from consumer', 'Service providers'],
      businessPurposes: ['Providing customer support', 'Analytics', 'Service improvement']
    };
  }

  static async verifyConsumerIdentity(userId: string, verificationData: any) {
    // Implement identity verification logic
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    // Verify email, phone, or other identifiers
    return this.matchVerificationData(user, verificationData);
  }
}
```

## 🔍 SECURITY MONITORING

### Security Event Logging
```typescript
// lib/security/security-logger.ts
export class SecurityLogger {
  static async logSecurityEvent(event: SecurityEvent) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details,
      requestId: event.requestId
    };

    // Log to security events table
    await db.query(`
      INSERT INTO security_events (timestamp, event_type, severity, user_id, ip_address, user_agent, details, request_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, Object.values(logEntry));

    // Send to SIEM if critical
    if (event.severity === 'critical') {
      await this.sendToSIEM(logEntry);
    }
  }

  static async detectAnomalies(userId: string) {
    const recentEvents = await db.query(`
      SELECT * FROM security_events 
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 hour'
      ORDER BY timestamp DESC
    `, [userId]);

    const anomalies = [];

    // Check for failed login attempts
    const failedLogins = recentEvents.filter(e => e.event_type === 'failed_login');
    if (failedLogins.length > 5) {
      anomalies.push({
        type: 'brute_force_attempt',
        severity: 'high',
        details: `${failedLogins.length} failed login attempts`
      });
    }

    // Check for unusual locations
    const locations = [...new Set(recentEvents.map(e => e.ip_address))];
    if (locations.length > 3) {
      anomalies.push({
        type: 'suspicious_location',
        severity: 'medium',
        details: `Access from ${locations.length} different locations`
      });
    }

    return anomalies;
  }

  private static async sendToSIEM(event: any) {
    // Send to security information and event management system
    await fetch(process.env.SIEM_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SIEM_API_KEY}`
      },
      body: JSON.stringify(event)
    });
  }
}

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  requestId?: string;
}
```

### Vulnerability Scanning
```typescript
// scripts/security-scan.ts
import { execSync } from 'child_process';

class SecurityScanner {
  async runSecurityScan() {
    console.log('Starting security scan...');

    // NPM audit
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata.vulnerabilities.total > 0) {
        console.warn(`Found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
        await this.createSecurityIssue('npm_audit', audit);
      }
    } catch (error) {
      console.error('NPM audit failed:', error);
    }

    // Dependency check
    try {
      const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdatedPackages = JSON.parse(outdated);
      
      const criticalOutdated = Object.entries(outdatedPackages)
        .filter(([_, info]: [any, any]) => info.type === 'major');
      
      if (criticalOutdated.length > 0) {
        await this.createSecurityIssue('outdated_dependencies', criticalOutdated);
      }
    } catch (error) {
      // npm outdated returns non-zero exit code when packages are outdated
    }

    // Secret scanning
    await this.scanForSecrets();
  }

  private async scanForSecrets() {
    const secrets = [
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
      /AKIA[0-9A-Z]{16}/,   // AWS Access Keys
      /[0-9a-f]{40}/,       // GitHub tokens
      /ya29\.[0-9A-Za-z\-_]+/ // Google OAuth tokens
    ];

    // Scan source code for secrets
    const files = execSync('find . -type f -name "*.js" -o -name "*.ts" -o -name "*.json"', { encoding: 'utf8' });
    
    for (const file of files.split('\n').filter(f => f)) {
      const content = require('fs').readFileSync(file, 'utf8');
      
      for (const pattern of secrets) {
        if (pattern.test(content)) {
          console.error(`Potential secret found in ${file}`);
          await this.createSecurityIssue('exposed_secret', { file, pattern: pattern.source });
        }
      }
    }
  }

  private async createSecurityIssue(type: string, details: any) {
    await SecurityLogger.logSecurityEvent({
      type: `security_scan_${type}`,
      severity: 'high',
      details
    });
  }
}
```

## 🏛️ COMPLIANCE AUDIT TRAIL

### Audit Log Configuration
```typescript
// lib/compliance/audit-logger.ts
export class AuditLogger {
  static async logDataAccess(event: DataAccessEvent) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      userId: event.userId,
      userRole: event.userRole,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      query: event.query,
      dataAccessed: event.dataAccessed,
      justification: event.justification
    };

    await db.query(`
      INSERT INTO audit_logs (timestamp, action, resource, resource_id, user_id, user_role, ip_address, user_agent, query, data_accessed, justification)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, Object.values(logEntry));

    // Real-time alerting for sensitive data access
    if (event.resource === 'PII' || event.resource === 'financial') {
      await this.alertSensitiveDataAccess(logEntry);
    }
  }

  static async generateAuditReport(startDate: Date, endDate: Date) {
    const logs = await db.query(`
      SELECT * FROM audit_logs 
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `, [startDate, endDate]);

    const report = {
      period: { start: startDate, end: endDate },
      totalEvents: logs.length,
      dataAccessEvents: logs.filter(l => l.action === 'read').length,
      modificationEvents: logs.filter(l => l.action === 'update').length,
      deletionEvents: logs.filter(l => l.action === 'delete').length,
      uniqueUsers: [...new Set(logs.map(l => l.user_id))].length,
      topAccessedResources: this.getTopAccessedResources(logs),
      suspiciousActivities: await this.detectSuspiciousActivities(logs)
    };

    return report;
  }

  private static async alertSensitiveDataAccess(event: any) {
    // Send real-time alert for sensitive data access
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Sensitive data access detected`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'User', value: event.userId, short: true },
            { title: 'Resource', value: event.resource, short: true },
            { title: 'Action', value: event.action, short: true },
            { title: 'IP', value: event.ipAddress, short: true }
          ]
        }]
      })
    });
  }
}

interface DataAccessEvent {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: string;
  resourceId?: string;
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  query?: string;
  dataAccessed?: any;
  justification?: string;
}
```
