import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, faqs, mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { assertDefinedOrRaiseNonRetriableError } from "@/inngest/utils";
import { runAIObjectQuery } from "@/lib/ai";
import { getBaseUrl } from "@/lib/constants";
import { postSlackMessage } from "@/lib/slack/client";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";

// Simple fallback functions for missing modules
const findEnabledKnowledgeBankEntries = async (mailbox: any): Promise<any[]> => {
  // Fallback implementation - return empty array
  return [];
};

const getSuggestedEditButtons = (suggestion: any, messageId: number) => {
  return [
    {
      type: "button",
      text: { type: "plain_text", text: "Approve" },
      action_id: "approve_suggestion",
      value: JSON.stringify({ suggestionId: suggestion.id, messageId }),
    },
    {
      type: "button",
      text: { type: "plain_text", text: "Reject" },
      action_id: "reject_suggestion",
      value: JSON.stringify({ suggestionId: suggestion.id, messageId }),
    },
  ];
};

const suggestionResponseSchema = z.object({
  action: z.enum(["no_action", "create_entry", "update_entry"]),
  reason: z.string(),
  content: z.string().optional(),
  faqIdToReplace: z.number().optional(),
});

export const suggestKnowledgeBankChanges = async (messageId: number, reason: string | null) => {
  const message = assertDefinedOrRaiseNonRetriableError(
    await db.query.conversationMessages.findFirst({
      where: eq(conversationMessages.id, messageId),
      with: {
        conversation: {
          with: {
            mailbox: true,
          },
        },
      },
    })
  );

  const mailbox = message.conversation.mailbox;
  const messageContent = message.body || message.cleanedUpText || "";
  const flagReason = reason || "No reason provided";

  const similarFAQs = await findEnabledKnowledgeBankEntries(mailbox);
  const existingSuggestions = await db.query.faqs.findMany({
    where: and(eq(faqs.suggested, true), eq(faqs.mailboxId, mailbox.id)),
  });

  const systemPrompt = `
  You are analyzing a message that was flagged as a bad response in a customer support system.
  Your task is to determine if this should lead to a change in the knowledge bank.
  
  Based on the message content, the reason it was flagged as bad, and existing entries in the knowledge bank,
  decide on one of these actions:
  1. no_action - No change needed to the knowledge bank. Choose this if the flagged issue is already sufficiently covered by an existing entry.
  2. create_entry - Create a new entry in the knowledge bank. Choose this if the flagged issue is an entirely new problem that is not closely related to any existing entries.
  3. update_entry - Update an existing entry in the knowledge bank. Choose this if an existing entry is close to the flagged issue but appears to have missing or incorrect information.
  
  If you choose create_entry or update_entry, provide the content for the new or updated entry. This should be only the bare information, without extra pleasantries or canned phrases. Use Markdown for any formatting.
  If you choose update_entry, specify which existing entry should be replaced by its ID.
  
  Respond with a JSON object with these fields:
  - action: "no_action", "create_entry", or "update_entry"
  - reason: A brief explanation of your decision
  - content: The content for the new or updated entry (only for create_entry or update_entry)
  - faqIdToReplace: The ID of the entry to replace (only for update_entry)
  `;

  const userPrompt = `
  Message that was flagged as bad:
  "${messageContent}"
  
  Reason for flagging:
  "${flagReason}"
  
  Existing entries in knowledge bank:

  ${similarFAQs
    .map(
      (faq) => `ID: ${faq.id}
  Content: "${faq.content}"`
    )
    .join("\n\n")}
  ${existingSuggestions
    .map(
      (faq) => `ID: ${faq.id}
  Content: "${faq.content}"`
    )
    .join("\n\n")}
  `;

  const suggestion = await runAIObjectQuery({
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    mailbox,
    queryType: "suggest_knowledge_bank_changes",
    schema: suggestionResponseSchema,
  });

  const typedSuggestion = suggestion as any;
  if (typedSuggestion.action === "create_entry") {
    const newFaq = await db
      .insert(faqs)
      .values({
        content: typedSuggestion.content || "",
        mailboxId: mailbox.id,
        suggested: true,
        enabled: false,
        messageId: message.id,
      })
      .returning()
      .then(takeUniqueOrThrow);

    notifySuggestedEdit(newFaq, mailbox);
  } else if (typedSuggestion.action === "update_entry" && typedSuggestion.faqIdToReplace) {
    const suggestionToUpdate =
      existingSuggestions.find((faq) => faq.id === typedSuggestion.faqIdToReplace) ||
      (await db.query.faqs.findFirst({
        where: eq(faqs.suggestedReplacementForId, typedSuggestion.faqIdToReplace),
      }));
    if (suggestionToUpdate) {
      await db
        .update(faqs)
        .set({
          content: typedSuggestion.content || "",
          messageId: message.id,
        })
        .where(eq(faqs.id, typedSuggestion.faqIdToReplace));
    } else {
      const newFaq = await db
        .insert(faqs)
        .values({
          content: typedSuggestion.content || "",
          mailboxId: mailbox.id,
          suggested: true,
          enabled: false,
          suggestedReplacementForId: typedSuggestion.action === "update_entry" ? typedSuggestion.faqIdToReplace : null,
          messageId: message.id,
        })
        .returning()
        .then(takeUniqueOrThrow);

      notifySuggestedEdit(newFaq, mailbox);
    }
  }

  return suggestion;
};

const notifySuggestedEdit = async (faq: typeof faqs.$inferSelect, mailbox: typeof mailboxes.$inferSelect) => {
  if (!mailbox.slackBotToken || !mailbox.slackAlertChannel) {
    return "Not posted, mailbox not linked to Slack or missing alert channel";
  }

  let originalContent = "";
  if (faq.suggestedReplacementForId) {
    const replacementFaq = await db.query.faqs.findFirst({
      where: eq(faqs.id, faq.suggestedReplacementForId),
    });
    originalContent = replacementFaq?.content ?? "";
  }

  const messageTs = await postSlackMessage(mailbox.slackBotToken, {
    channel: mailbox.slackAlertChannel,
    text: originalContent
      ? `💡 New suggested edit for the knowledge bank`
      : `💡 New suggested addition to the knowledge bank`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: originalContent
            ? `💡 New suggested edit for the knowledge bank\n\n*Suggested content:*\n${faq.content}\n\n*This will overwrite the current entry:*\n${originalContent}`
            : `💡 New suggested addition to the knowledge bank\n\n*Suggested content:*\n${faq.content}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${getBaseUrl()}/mailboxes/${mailbox.slug}/settings?tab=knowledge|View knowledge bank>`,
        },
      },
      {
        type: "actions",
        elements: getSuggestedEditButtons(faq, faq.messageId || 0),
      },
    ],
  });

  await db
    .update(faqs)
    .set({ slackChannel: mailbox.slackAlertChannel, slackMessageTs: messageTs })
    .where(eq(faqs.id, faq.id));

  return undefined;
};

export default inngest.createFunction(
  { id: "suggest-knowledge-bank-changes", concurrency: 10, retries: 1 },
  { event: "messages/flagged.bad" },
  async ({ event, step }) => {
    const { messageId, reason } = event.data;

    return await step.run("suggest-knowledge-bank-changes", () => suggestKnowledgeBankChanges(messageId, reason));
  }
);
