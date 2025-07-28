import { and, eq, gt, gte, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { conversations } from "@/db/schema/conversations";
import { inngest } from "@/inngest/client";

const BATCH_SIZE = 50;
const CLOSED_STATUS = "closed";
const MAX_CONVERSATIONS = 5000;

export default inngest.createFunction(
  { id: "bulk-embedding-closed-conversations" },
  { cron: "TZ=America/New_York 0 0 * * *" },
  async () => {
    let lastId = 0;
    let processedConversations = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    while (processedConversations < MAX_CONVERSATIONS) {
      const conversationsBatch = await db
        .select({
          id: conversations.id,
          slug: conversations.uid,
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.status, CLOSED_STATUS),
            isNull(conversations.embedding),
            gt(conversations.id, lastId),
            gte(conversations.closedAt, thirtyDaysAgo)
          )
        )
        .orderBy(conversations.id)
        .limit(BATCH_SIZE);

      if (!conversationsBatch || conversationsBatch.length === 0) {
        break;
      }

      const events = conversationsBatch.map(
        (conversation): { name: "conversations/embedding.create"; data: { conversationSlug: string } } => ({
          name: "conversations/embedding.create",
          data: { conversationSlug: conversation.slug },
        })
      );

      await inngest.send(events);

      processedConversations += conversationsBatch.length;
      lastId = conversationsBatch[conversationsBatch.length - 1]?.id ?? lastId;
    }

    return { success: true, processedConversations };
  }
);
