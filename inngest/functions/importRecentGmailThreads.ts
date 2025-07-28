import { db } from "@/db/client";
import { conversationMessages, conversations, gmailSupportEmails, mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { findUserByEmail } from "@/lib/data/user";
import { createGmailClient, LightweightGmailClient } from "@/lib/gmail/lightweight-client";
import { captureExceptionAndThrowIfDevelopment } from "@/lib/shared/sentry";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { and, eq, inArray } from "drizzle-orm";
import { htmlToText } from "html-to-text";
import { simpleParser } from "mailparser";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";
import {
  assertSuccessResponseOrThrow,
  createMessageAndProcessAttachments,
  extractAndUploadInlineImages,
  extractQuotations,
  getParsedEmailInfo,
  isNewThread,
} from "./handleGmailWebhookEvent";

// Simple fallback functions for missing modules
const parseEmailAddress = (emailString: string): any => {
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/) || emailString.match(/^(.+)$/);
  return {
    address: match ? (match[2] || match[1])?.trim() || emailString : emailString,
    name: match && match[2] ? match[1]?.trim() : undefined,
  };
};

const getGmailService = async (gmailSupportEmail: any): Promise<LightweightGmailClient> => {
  // Extract access token from gmailSupportEmail object
  const accessToken = gmailSupportEmail?.accessToken || gmailSupportEmail?.access_token;

  if (!accessToken) {
    throw new Error("No access token found for Gmail service");
  }

  return createGmailClient(accessToken);
};

const getLast10GmailThreads = async (client: LightweightGmailClient): Promise<GmailThread[]> => {
  try {
    const response = await client.listMessages({ maxResults: 10 });
    const threads: GmailThread[] = [];

    if (response.messages) {
      for (const message of response.messages) {
        if (message.threadId) {
          // Get full thread details
          const thread = await client.getThread(message.threadId);
          threads.push(thread);
        }
      }
    }

    return threads;
  } catch (error) {
    console.error("Failed to get Gmail threads:", error);
    return [];
  }
};

const getMessageById = async (client: LightweightGmailClient, messageId: string): Promise<GmailMessage | null> => {
  try {
    return await client.getMessage(messageId, "full");
  } catch (error) {
    console.error(`Failed to get message ${messageId}:`, error);
    return null;
  }
};

const getThread = async (client: LightweightGmailClient, threadId: string): Promise<GmailThread> => {
  try {
    return await client.getThread(threadId, "full");
  } catch (error) {
    console.error(`Failed to get thread ${threadId}:`, error);
    return { id: threadId, messages: [] };
  }
};

export default inngest.createFunction(
  {
    id: "import-recent-gmail-threads",
    retries: 1,
  },
  { event: "gmail/import-recent-threads" },
  async ({ event, step }) => {
    const {
      data: { gmailSupportEmailId },
    } = event;

    const threads = await step.run("import", async () => {
      return await getNewGmailThreads(gmailSupportEmailId);
    });

    const results = await Promise.all(
      threads.map((thread: any) => {
        return step.run("process-thread", async () => {
          return await processGmailThread(gmailSupportEmailId, assertDefinedOrRaiseNonRetriableError(thread.id));
        });
      })
    );

    return results;
  }
);

export const excludeExistingGmailThreads = async (
  gmailSupportEmailId: number,
  gmailThreads: gmail_v1.Schema$Thread[]
) => {
  const gmailThreadIds = gmailThreads.map((thread: any) => assertDefinedOrRaiseNonRetriableError(thread.id));
  const existingEmails = await db
    .selectDistinct({ gmailThreadId: conversationMessages.gmailThreadId })
    .from(conversationMessages)
    .innerJoin(conversations, eq(conversations.id, conversationMessages.conversationId))
    .innerJoin(mailboxes, eq(mailboxes.id, conversations.mailboxId))
    .where(
      and(
        eq(mailboxes.gmailSupportEmailId, gmailSupportEmailId),
        inArray(conversationMessages.gmailThreadId, gmailThreadIds)
      )
    );
  const existingThreads = new Set(
    existingEmails.flatMap((email) => (email.gmailThreadId ? [email.gmailThreadId] : []))
  );
  return gmailThreads.filter((thread: any) => !existingThreads.has(assertDefinedOrRaiseNonRetriableError(thread.id)));
};

export const getNewGmailThreads = async (gmailSupportEmailId: number) => {
  const gmailSupportEmail = await db.query.gmailSupportEmails
    .findFirst({
      where: eq(gmailSupportEmails.id, gmailSupportEmailId),
    })
    .then(assertDefinedOrRaiseNonRetriableError);
  const client = await getGmailService(gmailSupportEmail);
  const response = await getLast10GmailThreads(client);
  assertSuccessResponseOrThrow(response as any);
  const threads = response ?? [];
  return excludeExistingGmailThreads(gmailSupportEmailId, threads);
};

export const processGmailThread = async (
  gmailSupportEmailId: number,
  gmailThreadId: string,
  conversationOverrides?: Partial<typeof conversations.$inferSelect>
) => {
  const gmailSupportEmail = await db.query.gmailSupportEmails
    .findFirst({
      where: eq(gmailSupportEmails.id, gmailSupportEmailId),
    })
    .then(assertDefinedOrRaiseNonRetriableError);
  const client = await getGmailService(gmailSupportEmail);
  return processGmailThreadWithClient(client, gmailSupportEmail, gmailThreadId, conversationOverrides);
};

export const processGmailThreadWithClient = async (
  client: GmailClient,
  gmailSupportEmail: typeof gmailSupportEmails.$inferSelect,
  gmailThreadId: string,
  conversationOverrides?: Partial<typeof conversations.$inferSelect>
) => {
  const response = await getThread(client, gmailThreadId);
  assertSuccessResponseOrThrow(response);
  const messages = response.data.messages ?? [];
  // This happened at least once in local development; this will use Sentry to track how common this case is.
  if (messages[0]?.id !== gmailThreadId) {
    const errorMessage = `Thread ID ${gmailThreadId} doesn't match the first message ID ${messages[0]?.id}`;
    captureExceptionAndThrowIfDevelopment(new Error(errorMessage));
    return { gmailThreadId, error: errorMessage };
  }
  const firstMessageHeaders = messages[0].payload?.headers;
  const parsedEmailFrom = assertDefinedOrRaiseNonRetriableError(
    parseEmailAddress(firstMessageHeaders?.find((h: any) => h.name?.toLowerCase() === "from")?.value ?? "")
  );
  const subject = firstMessageHeaders?.find((h: any) => h.name?.toLowerCase() === "subject")?.value ?? "";
  const mailbox = await db.query.mailboxes
    .findFirst({
      where: eq(mailboxes.gmailSupportEmailId, gmailSupportEmail.id),
      columns: {
        id: true,
        organizationId: true,
      },
    })
    .then(assertDefinedOrRaiseNonRetriableError);
  const conversation = await db
    .insert(conversations)
    .values({
      organizationId: mailbox.organizationId,
      mailboxId: mailbox.id,
      customerEmail: parsedEmailFrom.address,
      customerDisplayName: parsedEmailFrom.name,
      subject,
      status: "open",
      source: "email",
      ...conversationOverrides,
    })
    .returning({ id: conversations.id, uid: conversations.uid })
    .then(takeUniqueOrThrow);

  let lastUserEmailCreatedAt: Date | null = null;
  const messageInfos = await Promise.all(
    messages.map((message: any) => {
      return getMessageById(client, assertDefinedOrRaiseNonRetriableError(message.id)).then(
        assertSuccessResponseOrThrow
      );
    })
  );
  for (const message of messageInfos) {
    const parsedEmail = await simpleParser(
      Buffer.from(assertDefinedOrRaiseNonRetriableError(message.data.raw), "base64url").toString("utf-8")
    );
    const { parsedEmailFrom, parsedEmailBody } = getParsedEmailInfo(parsedEmail);
    const { processedHtml, fileSlugs } = await extractAndUploadInlineImages(parsedEmailBody);
    const cleanedUpText = htmlToText(
      isNewThread(assertDefinedOrRaiseNonRetriableError(message.data.id), gmailThreadId)
        ? processedHtml
        : extractQuotations(processedHtml)
    );
    // Process messages serially since we rely on the database ID for message ordering
    const staffUser = await findUserByEmail(mailbox.organizationId, parsedEmailFrom.address);
    await createMessageAndProcessAttachments(
      mailbox.id,
      parsedEmail,
      parsedEmailFrom,
      processedHtml,
      cleanedUpText,
      fileSlugs,
      assertDefinedOrRaiseNonRetriableError(message.data.id),
      gmailThreadId,
      { id: conversation.id, slug: conversation.uid },
      staffUser
    );
    const isUserEmail = parsedEmailFrom.address.toLowerCase() !== gmailSupportEmail.email.toLowerCase();
    if (isUserEmail && parsedEmail.date && (!lastUserEmailCreatedAt || lastUserEmailCreatedAt < parsedEmail.date)) {
      lastUserEmailCreatedAt = parsedEmail.date;
    }
  }
  await db.update(conversations).set({ lastUserEmailCreatedAt }).where(eq(conversations.id, conversation.id));

  return {
    gmailThreadId,
    lastUserEmailCreatedAt,
    conversationId: conversation.id,
    conversationSlug: conversation.uid,
  };
};
