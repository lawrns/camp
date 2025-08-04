/**
 * Mailbox Service - Database Implementation
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { conversations, mailboxes } from "@/db/schema";

type Mailbox = typeof mailboxes.$inferSelect;
type InsertMailbox = typeof mailboxes.$inferInsert;

// Custom error classes for better error handling
export class MailboxNotFoundError extends Error {
  constructor(identifier: string, type: "id" | "slug" = "id") {
    super(`Mailbox not found with ${type}: ${identifier}`);
    this.name = "MailboxNotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.cause = cause;
  }
}

/**
 * Get a mailbox by slug
 */
export async function getMailboxBySlug(slug: string): Promise<Mailbox | null> {
  try {
    const result = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.slug, slug),
    });
    return result || null;
  } catch (error) {
    throw new DatabaseError("Failed to get mailbox by slug", error);
  }
}

/**
 * Get a mailbox by ID
 */
export async function getMailboxById(id: number): Promise<Mailbox | null> {
  try {
    const result = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.id, id),
    });
    return result || null;
  } catch (error) {
    throw new DatabaseError("Failed to get mailbox by ID", error);
  }
}

/**
 * List mailboxes for an organization
 */
export async function listMailboxes(organizationId: string): Promise<Mailbox[]> {
  try {
    return await db.query.mailboxes.findMany({
      where: eq(mailboxes.organizationId, organizationId),
      orderBy: [desc(mailboxes.updatedAt)],
    });
  } catch (error) {
    throw new DatabaseError("Failed to list mailboxes", error);
  }
}

/**
 * Create a new mailbox
 */
export async function createMailbox(
  organizationId: string,
  data: {
    name: string;
    slug?: string;
  }
): Promise<Mailbox> {
  try {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const insertData: InsertMailbox = {
      slug,
      name: data.name,
      organizationId,
      // Add default values for required fields
      widgetDisplayMode: "always",
      preferences: {
        confetti: false,
      },
      promptUpdatedAt: new Date(),
      widgetHMACSecret: generateHMACSecret(),
    };

    function generateHMACSecret(): string {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    const [result] = await db.insert(mailboxes).values(insertData).returning();

    if (!result) {
      throw new DatabaseError("Failed to create mailbox - no result returned");
    }

    return result;
  } catch (error) {
    throw new DatabaseError("Failed to create mailbox", error);
  }
}

/**
 * Update a mailbox
 */
export async function updateMailbox(
  id: number,
  data: {
    name?: string | undefined;
    slug?: string | undefined;
    slackAlertChannel?: string | undefined;
    githubRepoOwner?: string | undefined;
    githubRepoName?: string | undefined;
    widgetDisplayMode?: "off" | "always" | "revenue_based" | undefined;
    widgetDisplayMinValue?: number | undefined;
    autoRespondEmailToChat?: boolean | undefined;
    widgetHost?: string | undefined;
    vipThreshold?: number | undefined;
    vipChannelId?: string | undefined;
    vipExpectedResponseHours?: number | undefined;
    autoCloseEnabled?: boolean | undefined;
    autoCloseDaysOfInactivity?: number | undefined;
  }
): Promise<Mailbox> {
  try {
    const updateData: Partial<InsertMailbox> = {};

    // Handle optional fields properly to avoid exactOptionalPropertyTypes issues
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.slackAlertChannel !== undefined) updateData.slackAlertChannel = data.slackAlertChannel;
    if (data.githubRepoOwner !== undefined) updateData.githubRepoOwner = data.githubRepoOwner;
    if (data.githubRepoName !== undefined) updateData.githubRepoName = data.githubRepoName;
    if (data.widgetDisplayMode !== undefined) updateData.widgetDisplayMode = data.widgetDisplayMode;
    if (data.widgetDisplayMinValue !== undefined) updateData.widgetDisplayMinValue = data.widgetDisplayMinValue;
    if (data.autoRespondEmailToChat !== undefined) updateData.autoRespondEmailToChat = data.autoRespondEmailToChat;
    if (data.widgetHost !== undefined) updateData.widgetHost = data.widgetHost;
    if (data.vipThreshold !== undefined) updateData.vipThreshold = data.vipThreshold;
    if (data.vipChannelId !== undefined) updateData.vipChannelId = data.vipChannelId;
    if (data.vipExpectedResponseHours !== undefined)
      updateData.vipExpectedResponseHours = data.vipExpectedResponseHours;
    if (data.autoCloseEnabled !== undefined) updateData.autoCloseEnabled = data.autoCloseEnabled;
    if (data.autoCloseDaysOfInactivity !== undefined)
      updateData.autoCloseDaysOfInactivity = data.autoCloseDaysOfInactivity;

    const [result] = await db.update(mailboxes).set(updateData).where(eq(mailboxes.id, id)).returning();

    if (!result) {
      throw new MailboxNotFoundError(id.toString(), "id");
    }

    return result;
  } catch (error) {
    if (error instanceof MailboxNotFoundError) throw error;
    throw new DatabaseError("Failed to update mailbox", error);
  }
}

/**
 * Delete a mailbox
 */
export async function deleteMailbox(id: number): Promise<{ success: boolean }> {
  try {
    const [result] = await db.delete(mailboxes).where(eq(mailboxes.id, id)).returning();

    if (!result) {
      throw new MailboxNotFoundError(id.toString(), "id");
    }

    return { success: true };
  } catch (error) {
    if (error instanceof MailboxNotFoundError) throw error;
    throw new DatabaseError("Failed to delete mailbox", error);
  }
}

/**
 * Reorder mailboxes for an organization
 */
export async function reorderMailboxes(organizationId: string, newOrder: string[]): Promise<Mailbox[]> {
  try {
    // Get all mailboxes for the organization
    const allMailboxes = await db.query.mailboxes.findMany({
      where: eq(mailboxes.organizationId, organizationId),
    });

    // Create a map for quick lookup
    const mailboxMap = new Map(allMailboxes.map((m: unknown) => [m.slug, m]));

    // Reorder based on newOrder
    const ordered: Mailbox[] = [];
    for (const slug of newOrder) {
      const mailbox = mailboxMap.get(slug);
      if (mailbox) {
        ordered.push(mailbox);
      }
    }

    // Add any remaining mailboxes not in newOrder
    const orderedSlugs = new Set(newOrder);
    const remaining = allMailboxes.filter((m: unknown) => !orderedSlugs.has(m.slug));

    return [...ordered, ...remaining];
  } catch (error) {
    throw new DatabaseError("Failed to reorder mailboxes", error);
  }
}

/**
 * Get latest mailbox events
 */
export async function getLatestMailboxEvents(mailbox: Mailbox, cursor?: Date) {
  // Mock implementation - return empty array for now
  return {
    events: [],
    nextCursor: null,
  };
}

/**
 * Get open conversation counts
 */
export async function getOpenConversationCounts(mailboxId: number, userId?: string) {
  try {
    const totalOpenQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(and(eq(conversations.mailboxId, mailboxId), eq(conversations.status, "open")));

    const [totalResult] = await totalOpenQuery;
    const totalOpen = totalResult?.count || 0;

    let assignedToUser = 0;
    if (userId) {
      const assignedQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(conversations)
        .where(
          and(
            eq(conversations.mailboxId, mailboxId),
            eq(conversations.status, "open"),
            eq(conversations.assignedToId, userId)
          )
        );

      const [assignedResult] = await assignedQuery;
      assignedToUser = assignedResult?.count || 0;
    }

    return {
      totalOpen,
      assignedToUser,
    };
  } catch (error) {
    throw new DatabaseError("Failed to get conversation counts", error);
  }
}

/**
 * Get mailbox details
 */
export async function getMailboxDetails(mailbox: Mailbox) {
  return mailbox;
}

/**
 * Send auto close job
 */
export async function sendAutoCloseJob(mailboxId: number) {
  return { success: true };
}

/**
 * Get sessions paginated
 */
export async function getSessionsPaginated(mailboxId: number, cursor: number, limit: number) {
  return {
    sessions: [],
    nextCursor: null,
  };
}

export default {
  getMailboxBySlug,
  getMailboxById,
  listMailboxes,
  createMailbox,
  updateMailbox,
  deleteMailbox,
  getLatestMailboxEvents,
  getOpenConversationCounts,
  getMailboxDetails,
  sendAutoCloseJob,
  getSessionsPaginated,
};
