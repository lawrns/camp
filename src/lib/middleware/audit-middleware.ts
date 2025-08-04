/**
 * Audit Middleware
 *
 * Automatically integrates audit logging into API endpoints
 * and provides decorators for easy audit trail implementation
 */

import { AuditLogEntry, createAuditLogger, extractAuditContext } from "@/lib/audit/audit-logger";
import { NextRequest, NextResponse } from "next/server";

export interface AuditConfig {
  action: string;
  resourceType: AuditLogEntry["resource_type"];
  resourceIdExtractor?: (req: NextRequest, params: unknown, body?: unknown) => string | undefined;
  detailsExtractor?: (req: NextRequest, params: unknown, body?: unknown, response?: unknown) => Record<string, any>;
  skipAudit?: (req: NextRequest, params: unknown, body?: unknown) => boolean;
  actorType?: AuditLogEntry["actor_type"];
}

/**
 * Audit middleware wrapper for API endpoints
 */
export function withAuditLogging<T extends any[]>(
  handler: (req: NextRequest, context: unknown, ...args: T) => Promise<NextResponse>,
  config: AuditConfig
) {
  return async (req: NextRequest, context: unknown, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let response: NextResponse;
    let body: unknown;

    try {
      // Parse request body if present
      if (req.method !== "GET" && req.method !== "DELETE") {
        try {
          body = await req.clone().json();
        } catch {
          // Body might not be JSON or might be empty
          body = {};
        }
      }

      // Check if audit should be skipped
      if (config.skipAudit && config.skipAudit(req, context, body)) {
        return await handler(req, context, ...args);
      }

      // Execute the handler
      response = await handler(req, context, ...args);
      success = response.status < 400;

      return response;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      success = false;
      throw err;
    } finally {
      // Log audit event
      try {
        const duration = Date.now() - startTime;

        // Extract organization ID from context or params
        const organizationId =
          context?.organizationId || context?.params?.organizationId || req.nextUrl.searchParams.get("organizationId");

        if (organizationId) {
          const auditContext = extractAuditContext(req, organizationId, context?.user?.id);
          auditContext.actorType = config.actorType || auditContext.actorType;

          const logger = createAuditLogger(auditContext);

          const resourceId = config.resourceIdExtractor
            ? config.resourceIdExtractor(req, context, body)
            : context?.params?.id || context?.params?.conversationId || context?.params?.ticketId;

          const details = config.detailsExtractor
            ? config.detailsExtractor(req, context, body, response)
            : {
                method: req.method,
                url: req.nextUrl.pathname,
                query: Object.fromEntries(req.nextUrl.searchParams.entries()),
                body:
                  body && Object.keys(body).length > 0 ? { ...body, password: undefined, token: undefined } : undefined,
                status: response?.status,
              };

          await logger.log({
            action: config.action,
            resource_type: config.resourceType,
            resource_id: resourceId,
            details,
            success,
            error_message: error,
            duration_ms: duration,
          });
        }
      } catch (auditError) {

        // Don't fail the request if audit logging fails
      }
    }
  };
}

/**
 * Audit decorator for class methods
 */
export function AuditLog(config: AuditConfig) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;
      let result: unknown;

      try {
        result = await originalMethod.apply(this, args);
        success = true;
        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        success = false;
        throw err;
      } finally {
        try {
          const duration = Date.now() - startTime;

          // Extract context from 'this' or arguments
          const context = this.auditContext || (args[0] && args[0].auditContext);

          if (context && context.organizationId) {
            const logger = createAuditLogger(context);

            const resourceId = config.resourceIdExtractor
              ? config.resourceIdExtractor(null, null, args[0])
              : args[0]?.id || args[0]?.conversationId || args[0]?.ticketId;

            const details = config.detailsExtractor
              ? config.detailsExtractor(null, null, args[0], result)
              : {
                  method: propertyKey,
                  arguments: args.length > 0 ? { count: args.length } : {},
                  result: success ? { success: true } : undefined,
                };

            await logger.log({
              action: config.action,
              resource_type: config.resourceType,
              resource_id: resourceId,
              details,
              success,
              error_message: error,
              duration_ms: duration,
            });
          }
        } catch (auditError) {

        }
      }
    };

    return descriptor;
  };
}

/**
 * Common audit configurations for different operations
 */
export const AuditConfigs = {
  // Authentication
  LOGIN: {
    action: "auth.login",
    resourceType: "auth" as const,
    detailsExtractor: (req, params, body) => ({
      email: body?.email,
      method: body?.method || "email",
      remember: body?.remember,
    }),
  },

  LOGOUT: {
    action: "auth.logout",
    resourceType: "auth" as const,
  },

  // Conversations
  CREATE_CONVERSATION: {
    action: "conversation.create",
    resourceType: "conversation" as const,
    resourceIdExtractor: (req, params, body, response) => {
      try {
        const responseData = response?.json();
        return responseData?.conversation?.id || responseData?.id;
      } catch {
        return undefined;
      }
    },
    detailsExtractor: (req, params, body) => ({
      customerEmail: body?.customerEmail,
      customerName: body?.customerName,
      subject: body?.subject,
      source: body?.source || "dashboard",
    }),
  },

  UPDATE_CONVERSATION: {
    action: "conversation.update",
    resourceType: "conversation" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.conversationId,
    detailsExtractor: (req, params, body) => ({
      updates: body,
      conversation_id: params?.id || params?.conversationId,
    }),
  },

  DELETE_CONVERSATION: {
    action: "conversation.delete",
    resourceType: "conversation" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.conversationId,
  },

  // Messages
  SEND_MESSAGE: {
    action: "message.send",
    resourceType: "message" as const,
    resourceIdExtractor: (req, params, body, response) => {
      try {
        const responseData = response?.json();
        return responseData?.message?.id || responseData?.id;
      } catch {
        return undefined;
      }
    },
    detailsExtractor: (req, params, body) => ({
      content_length: body?.content?.length || 0,
      senderType: body?.senderType || body?.senderType,
      conversation_id: body?.conversation_id || body?.conversationId,
      has_attachments: !!(body?.attachments && body.attachments.length > 0),
    }),
  },

  // Assignments
  ASSIGN_CONVERSATION: {
    action: "assignment.assign",
    resourceType: "assignment" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.conversationId,
    detailsExtractor: (req, params, body) => ({
      assignee_id: body?.assigneeId,
      previous_assignee_id: body?.previousAssigneeId,
      conversation_id: params?.id || params?.conversationId,
      assigned_by: body?.assignedBy,
    }),
  },

  UNASSIGN_CONVERSATION: {
    action: "assignment.unassign",
    resourceType: "assignment" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.conversationId,
    detailsExtractor: (req, params, body) => ({
      previous_assignee_id: body?.previousAssigneeId,
      conversation_id: params?.id || params?.conversationId,
      unassigned_by: body?.unassignedBy,
    }),
  },

  // Tickets
  CREATE_TICKET: {
    action: "ticket.create",
    resourceType: "ticket" as const,
    resourceIdExtractor: (req, params, body, response) => {
      try {
        const responseData = response?.json();
        return responseData?.ticket?.id || responseData?.id;
      } catch {
        return undefined;
      }
    },
    detailsExtractor: (req, params, body) => ({
      title: body?.title,
      priority: body?.priority,
      category: body?.category,
      conversation_id: body?.conversationId,
      customerEmail: body?.customerEmail,
    }),
  },

  UPDATE_TICKET: {
    action: "ticket.update",
    resourceType: "ticket" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.ticketId,
    detailsExtractor: (req, params, body) => ({
      updates: body,
      ticket_id: params?.id || params?.ticketId,
    }),
  },

  // Widget
  WIDGET_MESSAGE: {
    action: "widget.message",
    resourceType: "widget" as const,
    actorType: "widget" as const,
    detailsExtractor: (req, params, body) => ({
      content_length: body?.content?.length || 0,
      conversation_id: body?.conversationId,
      senderType: body?.senderType || "visitor",
      organization_id: body?.organizationId,
    }),
  },

  WIDGET_INIT: {
    action: "widget.init",
    resourceType: "widget" as const,
    actorType: "widget" as const,
    detailsExtractor: (req, params, body) => ({
      organization_id: body?.organizationId || req.nextUrl.searchParams.get("organizationId"),
      visitor_id: body?.visitorId,
      page_url: body?.pageUrl,
    }),
  },

  // Analytics
  VIEW_ANALYTICS: {
    action: "analytics.view",
    resourceType: "analytics" as const,
    detailsExtractor: (req, params, body) => ({
      dashboard_type: req.nextUrl.pathname.split("/").pop(),
      time_range: req.nextUrl.searchParams.get("range"),
      filters: Object.fromEntries(req.nextUrl.searchParams.entries()),
    }),
  },

  EXPORT_ANALYTICS: {
    action: "analytics.export",
    resourceType: "analytics" as const,
    detailsExtractor: (req, params, body) => ({
      export_type: body?.type || "csv",
      date_range: body?.dateRange,
      filters: body?.filters,
    }),
  },

  // User Management
  CREATE_USER: {
    action: "user.create",
    resourceType: "user" as const,
    resourceIdExtractor: (req, params, body, response) => {
      try {
        const responseData = response?.json();
        return responseData?.user?.id || responseData?.id;
      } catch {
        return undefined;
      }
    },
    detailsExtractor: (req, params, body) => ({
      email: body?.email,
      role: body?.role,
      organization_id: body?.organizationId,
    }),
  },

  UPDATE_USER: {
    action: "user.update",
    resourceType: "user" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.userId,
    detailsExtractor: (req, params, body) => ({
      updates: { ...body, password: undefined },
      user_id: params?.id || params?.userId,
    }),
  },

  DELETE_USER: {
    action: "user.delete",
    resourceType: "user" as const,
    resourceIdExtractor: (req, params) => params?.id || params?.userId,
  },
};

/**
 * Helper function to create custom audit config
 */
export function createAuditConfig(
  action: string,
  resourceType: AuditLogEntry["resource_type"],
  options: Partial<AuditConfig> = {}
): AuditConfig {
  return {
    action,
    resourceType,
    ...options,
  };
}
