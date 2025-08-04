import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { getSubscriptionDetails, manageSubscription, startCheckout, subscribe } from "@/services/billingService";
import { mailboxProcedure } from "./mailbox/procedure";

export const billingRouter = {
  startCheckout: mailboxProcedure.mutation(({ ctx }) => startCheckout(ctx.mailbox as unknown)),

  subscribe: mailboxProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => subscribe(input.sessionId)),

  manage: mailboxProcedure.mutation(({ ctx }) => manageSubscription(ctx.mailbox as unknown)),

  get: mailboxProcedure.query(({ ctx }) => getSubscriptionDetails(ctx.mailbox as unknown)),
} satisfies TRPCRouterRecord;
