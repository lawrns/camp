import { db } from "@/db/client";
import { conversationMessages, conversations } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { captureExceptionAndThrowIfDevelopment } from "@/lib/shared/sentry";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";

// Import lightweight Gmail client
import { createGmailClient, LightweightGmailClient } from "@/lib/gmail/lightweight-client";

// Simple fallback functions for missing modules
const getGmailService = async (gmailSupportEmail: unknown): Promise<LightweightGmailClient> => {
  // Extract access token from gmailSupportEmail object
  const accessToken = gmailSupportEmail?.accessToken || gmailSupportEmail?.access_token;

  if (!accessToken) {
    throw new Error("No access token found for Gmail service");
  }

  return createGmailClient(accessToken);
};

const convertConversationMessageToRaw = async (message: unknown, gmailSupportEmailAddress: string): Promise<string> => {
  // Fallback implementation - return a basic email format
  return `To: ${message.emailTo}\nSubject: ${message.conversation.subject}\n\n${message.body}`;
};

const sendGmailEmail = async (
  client: LightweightGmailClient,
  rawEmail: string,
  threadId?: string | null
): Promise<any> => {
  try {
    console.log("sendGmailEmail called");
    const result = await client.sendMessage(rawEmail, threadId || undefined);
    return { id: result.id, threadId: result.threadId };
  } catch (error) {
    console.error("Failed to send Gmail email:", error);
    throw error;
  }
};

const getMessageMetadataById = async (client: LightweightGmailClient, messageId: string): Promise<any> => {
  try {
    const message = await client.getMessage(messageId, "minimal");
    return { threadId: message.threadId };
  } catch (error) {
    console.error(`Failed to get message metadata for ${messageId}:`, error);
    return { threadId: null };
  }
};

const markSent = async (emailId: number) => {
  await db.update(conversationMessages).set({ status: "sent" }).where(eq(conversationMessages.id, emailId));
  return null;
};

const markFailed = async (emailId: number, conversationId: string, error: string) => {
  await db.transaction(async (tx) => {
    await tx.update(conversationMessages).set({ status: "failed" }).where(eq(conversationMessages.id, emailId));
    await tx.update(conversations).set({ status: "open" }).where(eq(conversations.id, conversationId));
  });
  return error;
};

export const postEmailToGmail = async (emailId: number) => {
  const email = await db.query.conversationMessages.findFirst({
    where: and(
      eq(conversationMessages.id, emailId),
      eq(conversationMessages.status, "pending"), // Changed from "queueing" to valid "pending" status
      isNull(conversationMessages.deletedAt)
    ),
    with: {
      conversation: {
        with: {
          mailbox: {
            columns: {
              id: true,
              slug: true,
              organizationId: true,
              name: true,
              widgetHost: true,
            },
            with: {
              gmailSupportEmail: true,
            },
          },
        },
      },
      files: true,
    },
  });
  if (!email) {
    // The email was likely undone
    return null;
  }

  try {
    if (!(email as unknown).conversation?.email_from) {
      return await markFailed(emailId, email.conversationId, "The conversation email_from is missing.");
    }
    if (!(email as unknown).conversation?.mailbox?.gmailSupportEmail) {
      return await markFailed(emailId, email.conversationId, "The mailbox does not have a connected Gmail account.");
    }

    const pastThreadEmail = await db.query.conversationMessages.findFirst({
      where: and(
        eq(conversationMessages.conversationId, email.conversationId),
        isNotNull(conversationMessages.gmailThreadId),
        isNull(conversationMessages.deletedAt)
      ),
      orderBy: desc(conversationMessages.createdAt),
    });

    const gmailService = await getGmailService((email as unknown).conversation.mailbox.gmailSupportEmail);
    const gmailSupportEmailAddress = (email as unknown).conversation.mailbox.gmailSupportEmail.email;

    const rawEmail = await convertConversationMessageToRaw(
      {
        ...email,
        conversation: { ...(email as unknown).conversation, email_from: (email as unknown).conversation.email_from },
      },
      gmailSupportEmailAddress
    );
    const response = await sendGmailEmail(gmailService, rawEmail, pastThreadEmail?.gmailThreadId ?? null);
    if ((response as unknown).status < 200 || (response as unknown).status >= 300) {
      return await markFailed(
        emailId,
        email.conversationId,
        `Failed to post to Gmail: ${(response as unknown).statusText}`
      );
    }
    const sentEmail = await getMessageMetadataById(
      gmailService,
      assertDefinedOrRaiseNonRetriableError((response as unknown).data.id)
    );
    const sentEmailHeaders = sentEmail?.data?.payload?.headers ?? [];

    await db
      .update(conversationMessages)
      .set({
        gmailMessageId: (response as unknown).data.id,
        gmailThreadId: (response as unknown).data.threadId,
        messageId: sentEmailHeaders.find((header: unknown) => header.name?.toLowerCase() === "message-id")?.value ?? null,
        references: sentEmailHeaders.find((header: unknown) => header.name?.toLowerCase() === "references")?.value ?? null,
      })
      .where(eq(conversationMessages.id, emailId));

    const result = await markSent(emailId);

    return result;
  } catch (e) {
    captureExceptionAndThrowIfDevelopment(e);
    return await markFailed(emailId, email.conversationId, `Unexpected error: ${e}`);
  }
};

export default inngest.createFunction(
  {
    id: "post-email-to-gmail",
  },
  { event: "conversations/email.enqueued" },
  async ({ event, step }) => {
    const {
      data: { messageId },
    } = event;

    await step.run("handle", async () => await postEmailToGmail(messageId));
  }
);
