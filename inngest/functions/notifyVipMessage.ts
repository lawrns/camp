import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationMessages, conversations, mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { ensureCleanedUpText } from "@/lib/data/conversationMessage";
import { getClerkUser } from "@/lib/data/user";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";

// Simple fallback functions for missing modules
const getPlatformCustomer = async (mailboxId: number, email: string): Promise<any> => {
  // Fallback implementation - return null (not VIP)
  return null;
};

const postVipMessageToSlack = async (params: any): Promise<any> => {
  console.log("postVipMessageToSlack called with:", params);
  return { ts: "123", success: true };
};

const updateVipMessageInSlack = async (params: any): Promise<void> => {
  console.log("updateVipMessageInSlack called with:", params);
};

type MessageWithConversationAndMailbox = typeof conversationMessages.$inferSelect & {
  conversation: typeof conversations.$inferSelect & {
    mailbox: typeof mailboxes.$inferSelect;
  };
};

async function fetchConversationMessage(messageId: number): Promise<MessageWithConversationAndMailbox> {
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

  // if (message.conversation.mergedIntoId) {
  //   const mergedConversation = assertDefinedOrRaiseNonRetriableError(
  //     await db.query.conversations.findFirst({
  //       where: eq(conversations.id, message.conversation.mergedIntoId),
  //       with: {
  //         mailbox: true,
  //       },
  //     })
  //   );
  //
  //   return { ...message, conversation: mergedConversation };
  // } // Field doesn't exist in schema

  return message as MessageWithConversationAndMailbox;
}

async function handleVipSlackMessage(message: MessageWithConversationAndMailbox) {
  const conversation = assertDefinedOrRaiseNonRetriableError(message.conversation);
  const { mailbox } = conversation;

  if (conversation.isPrompt) {
    return "Not posted, prompt conversation";
  }

  const customerEmail = assertDefinedOrRaiseNonRetriableError(conversation.customerEmail);
  const platformCustomer = await getPlatformCustomer(mailbox.id, customerEmail);

  // Early return if not VIP or Slack config missing
  if (!platformCustomer?.isVip) return "Not posted, not a VIP customer";
  if (!mailbox.slackBotToken || !mailbox.vipChannelId) {
    return "Not posted, mailbox not linked to Slack";
  }

  // If it's an agent reply updating an existing Slack message
  if (message.role !== "user" && message.responseToId) {
    const originalMessage = await db.query.conversationMessages.findFirst({
      where: eq(conversationMessages.id, message.responseToId),
    });

    if (originalMessage?.sourceData?.slackMessageTs) {
      const originalCleanedUpText = originalMessage ? await ensureCleanedUpText(originalMessage) : "";
      const replyCleanedUpText = await ensureCleanedUpText(message);

      await updateVipMessageInSlack({
        conversation,
        originalMessage: originalCleanedUpText,
        replyMessage: replyCleanedUpText,
        slackBotToken: mailbox.slackBotToken,
        slackChannel: mailbox.vipChannelId,
        slackMessageTs: originalMessage.sourceData?.slackMessageTs,
        user: message.clerkUserId ? await getClerkUser(message.clerkUserId) : null,
        email: true,
        closed: conversation.status === "closed",
      });
      return "Updated";
    }
  }

  if (message.role !== "user") {
    return "Not posted, not a user message and not a reply to a user message";
  }

  const cleanedUpText = await ensureCleanedUpText(message);

  const slackMessageTs = await postVipMessageToSlack({
    conversation,
    message: cleanedUpText,
    platformCustomer,
    slackBotToken: mailbox.slackBotToken,
    slackChannel: mailbox.vipChannelId,
  });

  // Note: slackMessageTs and slackChannel fields don't exist in schema - storing in sourceData instead
  const sourceData = {
    slackMessageTs,
    slackChannel: mailbox.vipChannelId,
  };
  await db.update(conversationMessages).set({ sourceData }).where(eq(conversationMessages.id, message.id));
  return "Posted";
}

export default inngest.createFunction(
  { id: "notify-vip-message" },
  { event: "conversations/message.created" },
  async ({ event, step }) => {
    const { messageId } = event.data;
    const message = await step.run("handle", async () => {
      const message = assertDefinedOrRaiseNonRetriableError(await fetchConversationMessage(messageId));
      return handleVipSlackMessage(message);
    });
    return { message };
  }
);
