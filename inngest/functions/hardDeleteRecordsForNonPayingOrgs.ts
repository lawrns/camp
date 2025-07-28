import { subDays } from "date-fns";
import { and, eq, getTableName, inArray, isNull, lte, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  conversationEvents,
  conversationMessages,
  conversations,
  faqs,
  files,
  guideSessionEvents,
  guideSessionReplays,
  guideSessions,
  mailboxes,
  messageNotifications,
  notes,
  subscriptions,
} from "@/db/schema";
import { inngest } from "@/inngest/client";
import { FREE_TRIAL_PERIOD_DAYS } from "@/lib/auth/account";
import { ADDITIONAL_PAID_ORGANIZATION_IDS, getClerkOrganization } from "@/lib/data/organization";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";
import { assert, assertDefined } from "@/lib/utils/assert";

const getRelationsReferencingConversationRecords = () => {
  const allRelations = Object.values(assertDefined(db._.schema)).flatMap((table) => Object.values(table.relations));
  const relationsReferencingConversationRecords = Object.values(allRelations).filter((r: any) =>
    [getTableName(conversationMessages), getTableName(conversations)].includes(assertDefined(r.referencedTableName))
  );
  return relationsReferencingConversationRecords;
};

const EXPECTED_RELATION_COUNT = 12;
export const hardDeleteRecordsForNonPayingOrgs = async () => {
  // When this assert fails, please manually consider whether
  // this code needs to be updated. For example, if a new table is
  // added that references `conversationMessages`, then those records
  // will need to be hard-deleted before hard-deleting the `conversationMessages`
  // records to avoid orphan database records, since we don't
  // use foreign keys in the database to auto-cascade delete them.
  const relations = getRelationsReferencingConversationRecords();
  assert(
    relations.length === EXPECTED_RELATION_COUNT,
    `Expected exactly ${EXPECTED_RELATION_COUNT} relations in the Drizzle schema referencing conversation records; detected ${relations.length}. Here are the tables referencing these records:\n${relations.map((r: any) => getTableName(r.sourceTable)).join("\n")}`
  );

  const nonPayingMailboxesWithConversations = await db
    .selectDistinct({ id: mailboxes.id, organizationId: mailboxes.organizationId })
    .from(mailboxes)
    .innerJoin(conversations, eq(conversations.mailboxId, mailboxes.id))
    .leftJoin(subscriptions, eq(subscriptions.organizationId, mailboxes.organizationId))
    .where(
      and(
        notInArray(mailboxes.organizationId, ADDITIONAL_PAID_ORGANIZATION_IDS),
        isNull(subscriptions.id),
        lte(mailboxes.createdAt, subDays(new Date(), FREE_TRIAL_PERIOD_DAYS + 31))
      )
    );

  for (const mailbox of nonPayingMailboxesWithConversations) {
    try {
      const organization = await getClerkOrganization(mailbox.organizationId);
      if (
        !organization.privateMetadata?.freeTrialEndsAt ||
        new Date(organization.privateMetadata.freeTrialEndsAt) > subDays(new Date(), 31)
      )
        continue;
    } catch (error) {
      captureExceptionAndLogIfDevelopment(error as Error, {
        extra: { mailboxId: mailbox.id, organizationId: mailbox.organizationId },
      });
      continue; // Skip this mailbox and continue with the next one
    }

    await db.delete(faqs).where(eq(faqs.mailboxId, mailbox.id));

    const mailboxConversations = db
      .$with("mailbox_conversations")
      .as(db.select({ id: conversations.id }).from(conversations).where(eq(conversations.mailboxId, mailbox.id)));

    const mailboxMessages = db
      .$with("mailbox_messages")
      .as(
        db
          .selectDistinct({ id: conversationMessages.id })
          .from(conversationMessages)
          .innerJoin(conversations, eq(conversations.id, conversationMessages.conversationId))
          .where(eq(conversations.mailboxId, mailbox.id))
      );

    const mailboxNotes = db
      .$with("mailbox_notes")
      .as(
        db
          .selectDistinct({ id: notes.id })
          .from(notes)
          .innerJoin(conversations, eq(conversations.id, notes.conversationId))
          .where(eq(conversations.mailboxId, mailbox.id))
      );

    // Dangling file records get cleaned up by `cleanupDanglingFiles`
    await db
      .with(mailboxNotes, mailboxMessages)
      .update(files)
      .set({ messageId: null, noteId: null })
      .where(
        or(
          inArray(files.messageId, sql`(SELECT id FROM ${mailboxMessages})`),
          inArray(files.noteId, sql`(SELECT id FROM ${mailboxNotes})`)
        )
      );

    await db
      .with(mailboxConversations)
      .delete(notes)
      .where(inArray(notes.conversationId, sql`(SELECT id FROM ${mailboxConversations})`));

    await db
      .with(mailboxConversations)
      .delete(messageNotifications)
      .where(inArray(messageNotifications.conversationId, sql`(SELECT id FROM ${mailboxConversations})`));

    await db
      .with(mailboxConversations)
      .delete(conversationEvents)
      .where(inArray(conversationEvents.conversationId, sql`(SELECT id FROM ${mailboxConversations})`));

    await db
      .with(mailboxConversations)
      .delete(conversationMessages)
      .where(inArray(conversationMessages.conversationId, sql`(SELECT id FROM ${mailboxConversations})`));

    await db
      .with(mailboxConversations)
      .delete(conversations)
      .where(inArray(conversations.id, sql`(SELECT id FROM ${mailboxConversations})`));

    await db.delete(guideSessions).where(eq(guideSessions.mailboxId, mailbox.id));
    await db.delete(guideSessionEvents).where(eq(guideSessionEvents.mailboxId, mailbox.id));
    await db.delete(guideSessionReplays).where(eq(guideSessionReplays.mailboxId, mailbox.id));
  }
};

export default inngest.createFunction(
  { id: "hard-delete-records-for-non-paying-orgs" },
  { cron: "0 1 * * *" }, // Every day at 1AM UTC
  async () => {
    await hardDeleteRecordsForNonPayingOrgs();
  }
);
