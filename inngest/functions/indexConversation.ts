import { addSeconds } from "date-fns";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NonRetriableError, RetryAfterError } from "inngest";
import { db } from "@/db/client";
import { conversationMessages } from "@/db/schema/conversationMessages";
import { inngest } from "@/inngest/client";
import { getConversationById } from "@/lib/data/conversation";
import { ensureCleanedUpText, getConversationMessageById } from "@/lib/data/conversationMessage";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";
import { extractHashedWordsFromEmail } from "@/lib/utils/extractHashedWordsFromEmail";

const MAX_LENGTH = 5000;

export default inngest.createFunction(
  {
    id: "index-conversation-message",
    batchEvents: {
      maxSize: 30,
      timeout: "60s",
    },
    retries: 1,
  },
  { event: "conversations/message.created" },
  async ({ events, step }) => {
    const messageIds = events.map((event: any) => event.data.messageId);

    await step.run("index-messages", async (): Promise<void> => {
      const messagesToIndex = await db.query.conversationMessages.findMany({
        where: inArray(conversationMessages.id, messageIds),
        columns: {
          id: true,
        },
      });
      const results = await Promise.allSettled(messagesToIndex.map(({ id }) => indexMessage(id)));
      const failedIds: number[] = [];
      results.forEach((result: any, index: any) => {
        if (result.status === "rejected" && messagesToIndex[index]?.id) {
          captureExceptionAndLogIfDevelopment(result.reason);
          failedIds.push(messagesToIndex[index].id);
        }
      });
      if (failedIds.length > 0) {
        throw new RetryAfterError(`Failed to index messages: ${failedIds.join(", ")}`, addSeconds(new Date(), 60));
      }
    });
  }
);

export const indexMessage = async (messageId: number) => {
  const message = await getConversationMessageById(messageId);
  if (!message) {
    throw new NonRetriableError("Message not found");
  }

  const conversation = await getConversationById(message.conversationId);
  if (!conversation) {
    throw new NonRetriableError("Conversation not found");
  }

  const messageBody = await ensureCleanedUpText(message);

  // Collect words from subject and body
  const uniqueHashedWords = extractHashedWordsFromEmail({
    customerEmail: conversation.customerEmail,
    subject: conversation.subject,
    body: messageBody,
  });

  // Generate the search index
  let totalLength = 0;
  const searchIndexWords = [];

  for (const word of uniqueHashedWords) {
    // +1 accounts for the space between words
    if (totalLength + word.length + 1 > MAX_LENGTH) {
      break;
    }
    searchIndexWords.push(word);
    totalLength += word.length + 1;
  }

  const searchIndex = searchIndexWords.join(" ");

  // Note: searchIndex field doesn't exist in schema - storing in embeddingText instead
  await db
    .update(conversationMessages)
    .set({ embeddingText: searchIndex })
    .where(eq(conversationMessages.id, message.id));
};
