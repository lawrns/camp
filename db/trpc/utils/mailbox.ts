import { cache } from "react";
import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Get authorized mailbox for a given organization and mailbox slug
 * This function is cached to avoid repeated database queries
 *
 * Note: Using explicit select to avoid schema mismatch issues in development
 */
export const getAuthorizedMailbox = cache(
  async (orgId: string, mailboxSlug: string) => {
    try {
      // Use explicit select to only query fields that exist in the database
      const result = await db
        .select({
          id: mailboxes.id,
          organizationId: mailboxes.organizationId,
          name: mailboxes.name,
          slug: mailboxes.slug,
          description: mailboxes.description,
          settings: mailboxes.settings,
          widgetHMACSecret: mailboxes.widgetHMACSecret,
          gmailSupportEmailId: mailboxes.gmailSupportEmailId,
          createdAt: mailboxes.createdAt,
          updatedAt: mailboxes.updatedAt,
          agentId: mailboxes.agentId,
          autoAssignment: mailboxes.autoAssignment,
          maxQueueSize: mailboxes.maxQueueSize,
        })
        .from(mailboxes)
        .where(and(eq(mailboxes.slug, mailboxSlug), eq(mailboxes.organizationId, orgId)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('[getAuthorizedMailbox] Database error:', error);

      // In development, provide a fallback mailbox
      if (process.env.NODE_ENV === "development") {
        console.warn(`⚠️ Database query failed for mailbox ${mailboxSlug}, using development fallback`);
        return {
          id: 1,
          organizationId: orgId,
          name: "Development Mailbox",
          slug: mailboxSlug,
          description: "Development fallback mailbox",
          settings: {},
          widgetHMACSecret: "dev-secret",
          gmailSupportEmailId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          agentId: null,
          autoAssignment: false,
          maxQueueSize: 100,
        };
      }

      throw error;
    }
  }
);
