/**
 * tRPC Configuration for Campfire v2
 * 
 * This file sets up the core tRPC infrastructure with:
 * - Type-safe procedures
 * - Authentication middleware
 * - Rate limiting
 * - Supabase integration
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Context creation for tRPC
 * This runs for every request and provides the context for procedures
 */
export async function createTRPCContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // Get user session from Supabase
  async function getUserFromRequest() {
    try {
      // Try to get user from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabaseAdmin = supabase.admin();
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
          return user;
        }
      }

      // Fallback to cookie-based auth
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const supabaseServer = supabase.server(cookieStore);
      const { data: { user } } = await supabaseServer.auth.getUser();
      
      return user;
    } catch (error) {
      console.warn('[tRPC] Failed to get user from request:', error);
      return null;
    }
  }

  const user = await getUserFromRequest();

  return {
    req,
    res,
    user,
    supabase: user ? supabase.admin() : null, // Use admin client for authenticated requests
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Base router and procedure helpers
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      supabase: ctx.supabase!,
    },
  });
});

/**
 * Rate limited procedure - for AI and critical endpoints
 * TODO: Implement actual rate limiting with Upstash in Phase 3
 */
export const rateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // TODO: Implement rate limiting logic
  // const { success } = await ratelimit.limit(ctx.req.ip || 'anonymous');
  // if (!success) {
  //   throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  // }

  return next({ ctx });
});

/**
 * Organization-scoped procedure - ensures user has access to organization
 */
export const orgScopedProcedure = protectedProcedure.use(async ({ ctx, next, input }) => {
  // Extract organizationId from input (must be present in input schema)
  const organizationId = (input as any)?.organizationId;

  console.log('[orgScopedProcedure] Input:', JSON.stringify(input, null, 2));
  console.log('[orgScopedProcedure] Extracted organizationId:', organizationId);
  console.log('[orgScopedProcedure] User ID:', ctx.user.id);

  if (!organizationId) {
    console.error('[orgScopedProcedure] No organization ID found in input');
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID required',
    });
  }

  // Verify user has access to this organization
  const { data: membership } = await ctx.supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied to organization',
    });
  }

  return next({
    ctx: {
      ...ctx,
      organizationId,
      userRole: membership.role,
    },
  });
});
