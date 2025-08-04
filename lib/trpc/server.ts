/**
 * tRPC Server Configuration
 * Following Helper.ai's lean architecture approach
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { extractAuthFromRequest } from "@/lib/api/unified-auth";
import { supabase } from "@/lib/supabase";

/**
 * Create context for tRPC requests
 * Includes authenticated Supabase client and user info
 */
export async function createTRPCContext(opts: { req: unknown; res: unknown }) {
  const { req, res } = opts;

  // Extract authentication from request
  const authResult = await extractAuthFromRequest(req);

  // Create appropriate client based on authentication
  const supabaseClient = authResult.success ? supabase.admin() : supabase.browser();

  return {
    supabase: supabaseClient,
    session: authResult.success ? { user: authResult.user } : null,
    user: authResult.user || null,
    organizationId: authResult.organizationId || null,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }: unknown) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }: unknown) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Organization-scoped procedure that requires org membership
 */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }: unknown) => {
  if (!ctx.organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization context required",
    });
  }

  // Get user's role in the organization
  const { data: member } = await ctx.supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", ctx.user.id)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "active")
    .single();

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not a member of this organization",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userRole: member.role,
    },
  });
});

/**
 * Admin procedure that requires admin role
 */
export const adminProcedure = orgProcedure.use(({ ctx, next }: unknown) => {
  if (ctx.userRole !== "admin" && ctx.userRole !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});
