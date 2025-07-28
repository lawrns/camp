import { cache } from "react";
import { db } from "@/db/client";

/**
 * Get authorized mailbox for a given organization and mailbox slug
 * This function is cached to avoid repeated database queries
 */
export const getAuthorizedMailbox = cache(
  async (orgId: string, mailboxSlug: string) =>
    await db.query.mailboxes.findFirst({
      where: (mailboxes, { and, eq }) => and(eq(mailboxes.slug, mailboxSlug), eq(mailboxes.organizationId, orgId)),
    })
);
