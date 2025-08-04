import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import {
  createDefaultOrganization,
  getOnboardingStatus,
  getOrganizationMembers,
  inviteMember,
} from "@/lib/data/organization";
import { tenantMiddleware } from "../middleware/tenant";
import { publicProcedure } from "../trpc";

export const organizationRouter = {
  createDefaultOrganization: publicProcedure.mutation(({ ctx }) =>
    createDefaultOrganization(ctx.user?.id || "default-user")
  ),
  getOnboardingStatus: publicProcedure
    .use(tenantMiddleware)
    .query(({ ctx }) => getOnboardingStatus((ctx as unknown).activeOrganizationId)),
  getMembers: publicProcedure
    .use(tenantMiddleware)
    .query(({ ctx }) => getOrganizationMembers((ctx as unknown).activeOrganizationId)),
  inviteMember: publicProcedure
    .use(tenantMiddleware)
    .input(z.object({ email: z.string().email() }))
    .mutation(({ ctx, input }) => inviteMember(input.email)),
} satisfies TRPCRouterRecord;
