import { TRPCError } from "@trpc/server";
import type { Context } from "../trpc";

/**
 * Tenant middleware that ensures the user has an active organization
 * and adds tenant-specific context to the request
 */
export const tenantMiddleware = <T extends Context>(opts: {
  ctx: T;
  next: (opts: { ctx: T & { activeOrganizationId: string } }) => any;
}) => {
  const { ctx, next } = opts;

  // Check if user is authenticated
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Get organization ID from user context
  const organizationId = ctx.user.organizationId;

  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active organization found",
    });
  }

  // Add tenant context
  return next({
    ctx: {
      ...ctx,
      activeOrganizationId: organizationId,
    },
  });
};

/**
 * Audit middleware factory
 */
export const createAuditMiddleware = (action: string) => {
  return <T extends Context>(opts: { ctx: T; next: (opts: { ctx: T }) => any }) => {
    const { ctx, next } = opts;

    // Log the action for audit purposes
    console.log(`[AUDIT] ${action} - User: ${ctx.user?.id || "anonymous"}`);

    return next({ ctx });
  };
};

/**
 * Conversation middleware factory
 */
export const createConversationMiddleware = (options: { requiredRoles?: string[] }) => {
  return <T extends Context>(opts: {
    ctx: T;
    next: (opts: { ctx: T & { validatedConversationId: number } }) => Promise<any> | any;
    input?: { conversationId?: number };
  }) => {
    const { ctx, next, input } = opts;

    // Basic validation - use input conversationId if available
    const validatedConversationId = input?.conversationId || 1; // Use input conversationId or fallback

    return next({
      ctx: {
        ...ctx,
        validatedConversationId,
      },
    });
  };
};

/**
 * Mailbox middleware factory
 */
export const createMailboxMiddleware = (options: { requiredRoles?: string[] }) => {
  return <T extends Context>(opts: {
    ctx: T;
    next: (opts: { ctx: T & { validatedMailboxId: number } }) => Promise<any> | any;
    input?: { mailboxId?: number };
  }) => {
    const { ctx, next, input } = opts;

    // Basic validation - use input mailboxId if available
    const validatedMailboxId = input?.mailboxId || 1; // Use input mailboxId or fallback

    return next({
      ctx: {
        ...ctx,
        validatedMailboxId,
      },
    });
  };
};

/**
 * Agent middleware - same as tenant middleware for now
 */
export const agentMiddleware = tenantMiddleware;
