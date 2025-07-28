import { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { getUser } from "@/lib/core/auth";
import { addNote } from "@/lib/data/note";
import { assertDefined } from "@/lib/utils/assert";
import { conversationProcedure } from "./procedure";

export const notesRouter = {
  add: conversationProcedure
    .input(
      z.object({
        message: z.string(),
        fileSlugs: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = assertDefined(ctx.user);
      const note = await addNote({
        conversationId: ctx.conversation.id.toString(),
        message: input.message,
        fileSlugs: input.fileSlugs,
        user,
      });
      return { id: note.id };
    }),
} satisfies TRPCRouterRecord;
