#!/usr/bin/env tsx
import { eq, inArray, not, sql } from "drizzle-orm";
import { db } from "../client";
import { conversationEvents } from "../schema/conversationEvents";
import { conversationMessages } from "../schema/conversationMessages";
import { conversations } from "../schema/conversations";
import { files } from "../schema/files";
import { messageNotifications } from "../schema/messageNotifications";
import { notes } from "../schema/notes";

async function backfillOrphans() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`Running in ${dryRun ? "DRY RUN" : "LIVE"} mode`);

  // Delete messages pointing to non-existent conversations
  // First get all valid conversation IDs
  const validConversations = await db.select({ id: conversations.id }).from(conversations);
  const validConversationIds = validConversations.map((c) => c.id);

  // Then find orphaned messages
  const orphanedMessages = await db
    .select()
    .from(conversationMessages)
    .where(
      validConversationIds.length > 0
        ? not(inArray(conversationMessages.conversationId, validConversationIds))
        : sql`true` // If no valid conversations, all messages are orphaned
    );

  console.log(`Found ${orphanedMessages.length} orphaned messages. ${dryRun ? "Would delete" : "Deleting..."}`);
  if (!dryRun && orphanedMessages.length > 0) {
    for (const msg of orphanedMessages) {
      await db.delete(conversationMessages).where(eq(conversationMessages.id, msg.id));
    }
  }

  // Nullify response_to_id for messages referencing deleted messages
  const allMessages = await db.select({ id: conversationMessages.id }).from(conversationMessages);
  const validMessageIds = allMessages.map((m) => m.id);

  const messagesWithResponseIds = await db
    .select()
    .from(conversationMessages)
    .where(sql`${conversationMessages.responseToId} IS NOT NULL`);

  const invalidResponses = messagesWithResponseIds.filter(
    (msg) => msg.responseToId && !validMessageIds.includes(msg.responseToId)
  );

  console.log(
    `Found ${invalidResponses.length} invalid response references. ${dryRun ? "Would nullify" : "Nullifying..."}`
  );
  if (!dryRun && invalidResponses.length > 0) {
    for (const msg of invalidResponses) {
      await db.update(conversationMessages).set({ responseToId: null }).where(eq(conversationMessages.id, msg.id));
    }
  }

  // Delete notifications for non-existent messages
  const orphanedNotifications = await db
    .select()
    .from(messageNotifications)
    .where(validMessageIds.length > 0 ? not(inArray(messageNotifications.messageId, validMessageIds)) : sql`true`);

  console.log(
    `Found ${orphanedNotifications.length} orphaned notifications. ${dryRun ? "Would delete" : "Deleting..."}`
  );
  if (!dryRun && orphanedNotifications.length > 0) {
    for (const n of orphanedNotifications) {
      await db.delete(messageNotifications).where(eq(messageNotifications.id, n.id));
    }
  }

  // Delete events for non-existent conversations
  const orphanedEvents = await db
    .select()
    .from(conversationEvents)
    .where(
      validConversationIds.length > 0
        ? not(inArray(conversationEvents.conversationId, validConversationIds))
        : sql`true`
    );

  console.log(`Found ${orphanedEvents.length} orphaned events. ${dryRun ? "Would delete" : "Deleting..."}`);
  if (!dryRun && orphanedEvents.length > 0) {
    for (const e of orphanedEvents) {
      await db.delete(conversationEvents).where(eq(conversationEvents.id, e.id));
    }
  }

  console.log("Backfill complete!");
}

backfillOrphans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill encountered an error:", err);
    process.exit(1);
  });
