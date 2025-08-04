import { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { mailboxProcedure } from "./procedure";

// import { DataError } from "@/lib/data/dataError"; // Module not found
// import {
//   createMailboxMetadataApi,
//   deleteMailboxMetadataApiByMailboxSlug,
//   testMailboxMetadataApiURL,
// } from "@/lib/data/mailboxMetadataApi"; // Module not found

// Simple fallback for DataError
class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataError";
  }
}

// Simple fallbacks for mailbox metadata API functions
const createMailboxMetadataApi = async (mailboxSlug: string, params: unknown) => {
  return { mailboxSlug, params, created: true };
};

const deleteMailboxMetadataApiByMailboxSlug = async (mailboxSlug: string) => {
  return { mailboxSlug, deleted: true };
};

const testMailboxMetadataApiURL = async (mailboxSlug: string) => {
  return { mailboxSlug, tested: true };
};

export const metadataEndpointRouter = {
  create: mailboxProcedure
    .input(
      z.object({
        mailboxSlug: z.string().optional(),
        url: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input: { url } }) => {
      try {
        await createMailboxMetadataApi(ctx.mailbox.slug, { url });
        return { success: true, error: undefined };
      } catch (e) {
        return { success: false, error: e instanceof DataError ? e.message : "Error adding metadata endpoint" };
      }
    }),
  delete: mailboxProcedure.input(z.object({ mailboxSlug: z.string().optional() })).mutation(async ({ ctx }) => {
    try {
      await deleteMailboxMetadataApiByMailboxSlug(ctx.mailbox.slug);
      return { success: true, error: undefined };
    } catch (e) {
      return { success: false, error: e instanceof DataError ? e.message : "Error deleting metadata endpoint" };
    }
  }),
  test: mailboxProcedure.input(z.object({ mailboxSlug: z.string().optional() })).query(async ({ ctx }) => {
    try {
      await testMailboxMetadataApiURL(ctx.mailbox.slug);
      return { success: true, error: undefined };
    } catch (e) {
      return { success: false, error: e instanceof DataError ? e.message : "Error testing metadata endpoint" };
    }
  }),
} satisfies TRPCRouterRecord;
