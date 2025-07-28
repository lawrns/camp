import { db } from "@/db/client";
import { notes } from "@/db/schema/notes";
import type { AuthenticatedUser } from "@/lib/core/auth";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { finishFileUpload } from "./files";

export const addNote = async ({
  conversationId,
  message,
  user,
  slackChannel,
  slackMessageTs,
  fileSlugs = [],
}: {
  conversationId: string;
  message: string;
  user: AuthenticatedUser | null;
  slackChannel?: string | null;
  slackMessageTs?: string | null;
  fileSlugs?: string[];
}) => {
  return await db.transaction(async (tx: any) => {
    const note = await tx
      .insert(notes)
      .values([
        {
          conversationId,
          body: message,
          clerkUserId: user?.id,
          role: "staff",
          slackChannel,
          slackMessageTs,
        },
      ])
      .returning()
      .then(takeUniqueOrThrow);

    await finishFileUpload({ fileSlugs, noteId: note.id }, tx);

    return note;
  });
};
