import { and, asc, desc, eq, inArray, not } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages } from "@/db/schema/conversationMessages";
import { conversations } from "@/db/schema/conversations";
import { inngest } from "@/inngest/client";
import { runAIObjectQuery } from "@/lib/ai";
import { getMailboxById } from "@/lib/data/mailbox";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";

export default inngest.createFunction(
  { id: "merge-similar-conversations" },
  { event: "conversations/message.created" },
  async ({ event }) => {
    const { messageId } = event.data;

    const conversation = assertDefinedOrRaiseNonRetriableError(
      await db.query.conversations.findFirst({
        where: inArray(
          conversations.id,
          db
            .select({ id: conversationMessages.conversationId })
            .from(conversationMessages)
            .where(eq(conversationMessages.id, messageId))
        ),
        with: {
          messages: {
            columns: {
              id: true,
              role: true,
              cleanedUpText: true,
            },
          },
        },
      })
    );

    if (!conversation.customerEmail) return { message: "Skipped: no email from" };

    const userMessageCount = conversation.messages.filter((m: { role: string }) => m.role === "customer").length;
    if (userMessageCount !== 1) {
      return { message: "Skipped: not the first message" };
    }

    const mailbox = assertDefinedOrRaiseNonRetriableError(await getMailboxById(String(conversation.mailboxId)));

    const otherConversations = await db.query.conversations.findMany({
      where: and(
        eq(conversations.customerEmail, conversation.customerEmail),
        not(eq(conversations.id, conversation.id)),
        eq(conversations.status, "open")
      ),
      with: {
        messages: {
          columns: {
            id: true,
            senderType: true,
            embeddingText: true,
            createdAt: true,
          },
          orderBy: [asc(conversationMessages.createdAt)],
        },
      },
      orderBy: [desc(conversations.createdAt)],
      limit: 10,
    });

    if (otherConversations.length === 0) {
      return { message: "No other conversations from this customer found" };
    }

    const currentConversationText = `
Current Conversation (ID: ${conversation.id})
Subject: ${conversation.subject || "(no subject)"}
Created: ${conversation.createdAt.toISOString()}
Status: ${conversation.status}
Messages:
${conversation.messages
  .map(
    (msg: { id: any; role: any; cleanedUpText: any }) =>
      `- ${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.cleanedUpText ?? ""}`
  )
  .join("\n")
  .slice(0, 10000)}
  `;

    const otherConversationsText = otherConversations
      .map((conv) => {
        return `
Conversation (ID: ${conv.id})
Subject: ${conv.subject || "(no subject)"}
Created: ${conv.createdAt.toISOString()}
Status: ${conv.status}
Messages:
${conv.messages
  .map(
    (msg: { id: any; createdAt: any; senderType: any; embeddingText: any }) =>
      `- ${msg.senderType === "customer" ? "Customer" : "Assistant"}: ${msg.embeddingText ?? ""}`
  )
  .join("\n")
  .slice(0, 10000)}
    `;
      })
      .join("\n");

    const systemMessage = `
You are an assistant tasked with determining if a conversation should be merged into another existing conversation.
Only merge conversations if they are clearly about the same topic or issue from the same customer.
Consider the subject, message content, and timing of the conversations.
Don't merge if they appear to be distinct topics or issues.
Return a JSON object that will be validated against a schema with these fields:
- shouldMerge: boolean indicating if the conversations should be merged
- mergeIntoId: number representing the conversation ID to merge into, or null if no merge is needed
- reason: string explaining your decision
  `;

    const userMessage = `
I need to determine if the current conversation should be merged into one of the other existing conversations from the same customer.

${currentConversationText}

Other conversations from the same customer:
${otherConversationsText}

Should the current conversation be merged into any of the others? If so, which one?
`;

    const result = await runAIObjectQuery({
      messages: [{ role: "user", content: userMessage }],
      mailbox,
      queryType: "reasoning",
      schema: z.object({
        shouldMerge: z.boolean(),
        mergeIntoId: z.number().nullable(),
        reason: z.string(),
      }),
      model: "gpt-4o",
      system: systemMessage,
      temperature: 0.0,
      maxTokens: 500,
      functionId: "merge-similar-conversations",
    });

    const typedResult = result as any;
    if (typedResult.shouldMerge && typedResult.mergeIntoId) {
      const { mergeIntoId } = typedResult;

      const targetConversation = otherConversations.find((c) => c.id === mergeIntoId);
      if (!targetConversation) {
        return { message: `Invalid merge target ID: ${mergeIntoId}` };
      }

      return {
        message: `Conversation ${conversation.id} merged into ${mergeIntoId}`,
        reason: typedResult.reason,
      };
    }

    return {
      message: "No merge needed",
      reason: typedResult.reason,
    };
  }
);
