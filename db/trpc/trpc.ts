import * as Sentry from "@sentry/nextjs";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/core/auth";
// import { createRateLimitMiddleware } from "@/lib/middleware/rateLimiting"; // Module not implemented yet
import { createApiClient } from "@/lib/supabase";
import type { BaseContext, TenantContext } from "./types";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }): Promise<BaseContext> => {
  const source = opts.headers.get("x-trpc-source") ?? "unknown";

  // Create Supabase client and get user session
  let user: AuthenticatedUser | null = null;
  let supabase: ReturnType<typeof createApiClient> | null = null;
  let tenantContext: TenantContext | null = null;

  try {
    supabase = createApiClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (supabaseUser && !error) {
      // Get user's profile and organization membership
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          organization_id,
          full_name,
          email
        `
        )
        .eq("user_id", supabaseUser.id)
        .single();

      if (profile?.organization_id) {
        // Get user's role from organization_members
        const { data: membership } = await supabase
          .from("organization_members")
          .select("role")
          .eq("user_id", supabaseUser.id)
          .eq("organization_id", profile.organization_id)
          .single();

        user = {
          id: supabaseUser.id,
          email: supabaseUser.email || profile.email || "",
          organizationId: profile.organization_id,
          organizationRole: membership?.role || "agent",
          fullName:
            profile.fullName || supabaseUser.user_metadata?.fullName || supabaseUser.user_metadata?.name || "",
          firstName: supabaseUser.user_metadata?.firstName,
          lastName: supabaseUser.user_metadata?.lastName,
          access_token: undefined, // Will be set by session management
        } satisfies AuthenticatedUser;

        // Create tenant context only when user has an organization
        tenantContext = {
          user: supabaseUser,
          organizationId: profile.organization_id,
          scopedClient: supabase,
        };
      }
    }
  } catch (error) {
    // Silently handle auth errors in production
  }

  return {
    user,
    db,
    headers: opts.headers,
    supabase,
    tenantContext,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return {
        ...shape,
        message: "Something went wrong",
        cause: process.env.NODE_ENV === "development" ? error.cause : undefined,
      };
    }
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export { t as trpcContext };

// Export Context type for middleware
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Note: mailboxProcedure is defined in ./router/mailbox/procedure.ts to avoid circular dependency

/**
 * Adds an artificial delay in development to help catch unwanted waterfalls
 * (by simulating network latency as if it were a production environment).
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  return result;
});

const sentryMiddleware = t.middleware(Sentry.trpcMiddleware({ attachRpcInput: true }));

// Temporary stub for rate limiting
const createRateLimitMiddleware = (type: string) => {
  return t.middleware(({ next }) => {
    // Stub implementation - no rate limiting for now
    return next();
  });
};

// Rate limiting middlewares
const apiRateLimitMiddleware = createRateLimitMiddleware("api");
const aiRateLimitMiddleware = createRateLimitMiddleware("ai");
const authRateLimitMiddleware = createRateLimitMiddleware("auth");

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(sentryMiddleware).use(apiRateLimitMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 */
export const protectedProcedure = t.procedure
  .use(sentryMiddleware)
  .use(apiRateLimitMiddleware)
  .use(({ ctx, next }) => {
    // Verify user is authenticated
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user, // Ensure user is available in the context
      },
    });
  });

// AI-specific procedure with stricter rate limiting
export const aiProcedure = t.procedure
  .use(sentryMiddleware)
  .use(aiRateLimitMiddleware)
  .use(({ ctx, next }) => {
    // Verify user is authenticated
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user, // Ensure user is available in the context
      },
    });
  });

// Auth-specific procedure with auth rate limiting
export const authProcedure = t.procedure.use(sentryMiddleware).use(authRateLimitMiddleware);

// getAuthorizedMailbox moved to @/trpc/utils/mailbox to avoid circular dependency
