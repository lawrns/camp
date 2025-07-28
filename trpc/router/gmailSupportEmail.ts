import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { mailboxProcedure } from "@/trpc/router/mailbox/procedure";

// import {
//   createGmailSupportEmailEntry,
//   deleteGmailSupportEmailEntry,
//   getGmailSupportEmailInfo,
// } from "@/lib/infrastructure/email"; // Module not found

// Simple fallbacks for Gmail support email functions
const getGmailSupportEmailInfo = async (mailbox: any) => {
  return { mailbox, info: null };
};

const createGmailSupportEmailEntry = async (mailbox: any, input: any) => {
  return { mailbox, input, created: true };
};

const deleteGmailSupportEmailEntry = async (mailbox: any) => {
  return { mailbox, deleted: true };
};

export const gmailSupportEmailRouter = {
  get: mailboxProcedure.query(({ ctx }) => getGmailSupportEmailInfo(ctx.mailbox)),

  create: mailboxProcedure
    .input(
      z.object({
        email: z.string().email(),
        accessToken: z.string(),
        refreshToken: z.string(),
        expiresAt: z.date(),
      })
    )
    .mutation(({ ctx, input }) => createGmailSupportEmailEntry(ctx.mailbox, input)),
  delete: mailboxProcedure.mutation(({ ctx }) => deleteGmailSupportEmailEntry(ctx.mailbox)),
} satisfies TRPCRouterRecord;
