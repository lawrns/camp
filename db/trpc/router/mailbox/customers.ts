import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { getCustomersForMailbox } from "@/services/customerService";
import { mailboxProcedure } from "./procedure";

export const customersRouter = {
  list: mailboxProcedure.input(z.object({ search: z.string().optional() })).query(({ ctx, input }) =>
    getCustomersForMailbox(ctx.mailbox.id, {
      ...(input.search ? { searchTerm: input.search } : {}),
    })
  ),
} satisfies TRPCRouterRecord;
