/**
 * Comprehensive Audit Logging System
 *
 * Tracks all critical operations across authentication, tickets,
 * conversations, and analytics domains for production monitoring
 */

import { supabase } from "@/lib/supabase";

export interface AuditLogEntry {
  id?: string;
  organization_id: string;
  user_id?: string;
  actor_type: "user" | "system" | "api" | "widget" | "ai";
  actor_id?: string;
  action: string;
  resource_type:
    | "conversation"
    | "message"
    | "ticket"
    | "user"
    | "organization"
    | "assignment"
    | "auth"
    | "analytics"
    | "widget";
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  api_key_id?: string;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AuditContext {
  organizationId: string;
  userId?: string;
  actorType?: AuditLogEntry["actor_type"];
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  apiKeyId?: string;
}

/**
 * Audit Logger Class
 */
export class AuditLogger {
  private context: AuditContext;
  private batchSize: number = 100;
  private batchTimeout: number = 5000; // 5 seconds
  private pendingLogs: AuditLogEntry[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(context: AuditContext) {
    this.context = context;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, "organization_id" | "created_at">): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      organization_id: this.context.organizationId,
      user_id: entry.user_id || this.context.userId,
      actor_type: entry.actor_type || this.context.actorType || "user",
      actor_id: entry.actor_id || this.context.actorId,
      ipAddress: entry.ipAddress || this.context.ipAddress,
      userAgent: entry.userAgent || this.context.userAgent,
      session_id: entry.session_id || this.context.sessionId,
      api_key_id: entry.api_key_id || this.context.apiKeyId,
      created_at: new Date().toISOString(),
    };

    // Add to batch
    this.pendingLogs.push(auditEntry);

    // Flush if batch is full
    if (this.pendingLogs.length >= this.batchSize) {
      await this.flush();
    } else {
      // Set timer for batch flush
      this.scheduleBatchFlush();
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(action: string, details: Record<string, any>, success: boolean, error?: string): Promise<void> {
    await this.log({
      action: `auth.${action}`,
      resource_type: "auth",
      details,
      success,
      error_message: error,
    });
  }

  /**
   * Log conversation events
   */
  async logConversation(
    action: string,
    conversationId: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action: `conversation.${action}`,
      resource_type: "conversation",
      resource_id: conversationId,
      details,
      success,
    });
  }

  /**
   * Log message events
   */
  async logMessage(
    action: string,
    messageId: string,
    conversationId: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action: `message.${action}`,
      resource_type: "message",
      resource_id: messageId,
      details: {
        ...details,
        conversation_id: conversationId,
      },
      success,
    });
  }

  /**
   * Log ticket events
   */
  async logTicket(
    action: string,
    ticketId: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action: `ticket.${action}`,
      resource_type: "ticket",
      resource_id: ticketId,
      details,
      success,
    });
  }

  /**
   * Log assignment events
   */
  async logAssignment(
    action: string,
    conversationId: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action: `assignment.${action}`,
      resource_type: "assignment",
      resource_id: conversationId,
      details,
      success,
    });
  }

  /**
   * Log analytics events
   */
  async logAnalytics(action: string, details: Record<string, any>, success: boolean = true): Promise<void> {
    await this.log({
      action: `analytics.${action}`,
      resource_type: "analytics",
      details,
      success,
    });
  }

  /**
   * Log widget events
   */
  async logWidget(action: string, details: Record<string, any>, success: boolean = true): Promise<void> {
    await this.log({
      action: `widget.${action}`,
      resource_type: "widget",
      details,
      success,
    });
  }

  /**
   * Log user events
   */
  async logUser(
    action: string,
    targetUserId: string,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action: `user.${action}`,
      resource_type: "user",
      resource_id: targetUserId,
      details,
      success,
    });
  }

  /**
   * Log organization events
   */
  async logOrganization(action: string, details: Record<string, any>, success: boolean = true): Promise<void> {
    await this.log({
      action: `organization.${action}`,
      resource_type: "organization",
      resource_id: this.context.organizationId,
      details,
      success,
    });
  }

  /**
   * Schedule batch flush
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flush().catch((error) => {

      });
    }, this.batchTimeout);
  }

  /**
   * Flush pending logs to database
   */
  async flush(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToFlush = [...this.pendingLogs];
    this.pendingLogs = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    try {
      const supabaseClient = supabase.admin();

      const { error } = await supabaseClient.from("audit_logs").insert(logsToFlush);

      if (error) {

        // Re-add failed logs to pending (with limit to prevent infinite growth)
        if (this.pendingLogs.length < 1000) {
          this.pendingLogs.unshift(...logsToFlush);
        }
      } else {

      }
    } catch (error) {

      // Re-add failed logs to pending (with limit)
      if (this.pendingLogs.length < 1000) {
        this.pendingLogs.unshift(...logsToFlush);
      }
    }
  }

  /**
   * Force flush all pending logs
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Get pending logs count
   */
  getPendingCount(): number {
    return this.pendingLogs.length;
  }
}

/**
 * Create audit logger with context
 */
export function createAuditLogger(context: AuditContext): AuditLogger {
  return new AuditLogger(context);
}

/**
 * Extract audit context from request
 */
export function extractAuditContext(request: Request, organizationId: string, userId?: string): AuditContext {
  const headers = request.headers;

  return {
    organizationId,
    userId,
    actorType: userId ? "user" : "api",
    actorId: userId,
    ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown",
    userAgent: headers.get("user-agent") || "unknown",
    sessionId: headers.get("x-session-id") || undefined,
    apiKeyId: headers.get("x-api-key") ? "api-key" : undefined,
  };
}

/**
 * Audit decorator for functions
 */
export function withAudit<T extends any[], R>(
  logger: AuditLogger,
  action: string,
  resourceType: AuditLogEntry["resource_type"],
  resourceIdExtractor?: (...args: T) => string
) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;
      let result: R;

      try {
        result = await originalMethod.apply(this, args);
        success = true;
        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        const resourceId = resourceIdExtractor ? resourceIdExtractor(...args) : undefined;

        await logger
          .log({
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: {
              method: propertyKey,
              arguments: args.length > 0 ? { count: args.length } : {},
              result: success ? { success: true } : undefined,
            },
            success,
            error_message: error,
            duration_ms: duration,
          })
          .catch((auditError) => {

          });
      }
    };

    return descriptor;
  };
}

/**
 * Global audit logger instances (per organization)
 */
const auditLoggers = new Map<string, AuditLogger>();

/**
 * Get or create audit logger for organization
 */
export function getAuditLogger(context: AuditContext): AuditLogger {
  const key = `${context.organizationId}:${context.userId || "system"}`;

  if (!auditLoggers.has(key)) {
    auditLoggers.set(key, new AuditLogger(context));
  }

  return auditLoggers.get(key)!;
}

/**
 * Flush all audit loggers
 */
export async function flushAllAuditLoggers(): Promise<void> {
  const flushPromises = Array.from(auditLoggers.values()).map((logger) =>
    logger.forceFlush().catch((error) => {

    })
  );

  await Promise.all(flushPromises);
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    flushAllAuditLoggers().catch((error) => {

    });
  });

  process.on("SIGINT", () => {
    flushAllAuditLoggers()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {

        process.exit(1);
      });
  });

  process.on("SIGTERM", () => {
    flushAllAuditLoggers()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {

        process.exit(1);
      });
  });
}
