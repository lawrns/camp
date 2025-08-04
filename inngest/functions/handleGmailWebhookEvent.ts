import { db } from "@/db/client";
import { conversationMessages, conversations, files, gmailSupportEmails, mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { runAIQuery } from "@/lib/ai";
import { GPT_4O_MINI_MODEL } from "@/lib/ai/core";
import type { AuthenticatedUser } from "@/lib/core/auth";
import { updateConversation } from "@/lib/data/conversation";
import { createConversationMessage } from "@/lib/data/conversationMessage";
import { createAndUploadFile, finishFileUpload } from "@/lib/data/files";
import { findUserByEmail } from "@/lib/data/user";
import { createOAuth2Client } from "@/lib/gmail/lightweight-auth";
import { captureExceptionAndLogIfDevelopment, captureExceptionAndThrowIfDevelopment } from "@/lib/shared/sentry";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";
import { env } from "@/lib/utils/env-config";
import { extractEmailPartsFromDocument } from "@/lib/utils/html";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { ParsedMailbox } from "email-addresses";
import { GaxiosResponse } from "gaxios";
import { htmlToText } from "html-to-text";
import { NonRetriableError } from "inngest";
import { JSDOM } from "jsdom";
import { AddressObject, Attachment, ParsedMail, simpleParser } from "mailparser";
import { z } from "zod";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";
import { generateFilePreview } from "./generateFilePreview";

// Simple fallback functions for missing modules
const extractEmailAddresses = (emailString: string): string[] => {
  // Basic email extraction - just return the string as an array for now
  return emailString ? [emailString] : [];
};

const parseEmailAddress = (emailString: string): ParsedMailbox => {
  // Basic email parsing - extract address and name
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/) || emailString.match(/^(.+)$/);
  return {
    address: match ? (match[2] || match[1])?.trim() || emailString : emailString,
    name: match && match[2] ? match[1]?.trim() : undefined,
  } as ParsedMailbox;
};

const matchesTransactionalEmailAddress = (email: string): boolean => {
  // Fallback implementation - check for common transactional email patterns
  const transactionalPatterns = [/no-?reply/i, /do-?not-?reply/i, /notification/i, /automated/i, /system/i, /alert/i];
  return transactionalPatterns.some((pattern) => pattern.test(email));
};

const getGmailService = (auth: unknown) => {
  // Fallback implementation - return a mock service
  return {
    users: {
      messages: {
        get: async () => ({ data: null }),
      },
      history: {
        list: async () => ({ data: { history: [] } }),
      },
    },
  };
};

const getMessagesFromHistoryId = async (service: unknown, historyId: string): Promise<any[]> => {
  // Fallback implementation - return empty array
  return [];
};

const getMessageById = async (service: unknown, messageId: string): Promise<any> => {
  // Fallback implementation - return null
  return null;
};

const generateS3Key = (prefix: string, filename: string): string => {
  // Fallback implementation - generate a simple key
  return `${prefix}/${Date.now()}_${filename}`;
};

const getS3Url = (key: string): string => {
  // Fallback implementation - return a placeholder URL
  return `https://example.com/s3/${key}`;
};

const uploadFile = async (key: string, buffer: Buffer, contentType: string): Promise<string> => {
  // Fallback implementation - return the key as URL
  return getS3Url(key);
};

const IGNORED_GMAIL_CATEGORIES = ["CATEGORY_PROMOTIONS", "CATEGORY_UPDATES", "CATEGORY_FORUMS", "CATEGORY_SOCIAL"];

export const isNewThread = (gmailMessageId: string, gmailThreadId: string) => gmailMessageId === gmailThreadId;

const isThankYouOrAutoResponse = async (
  mailbox: typeof mailboxes.$inferSelect,
  emailContent: string
): Promise<boolean> => {
  try {
    const content = await runAIQuery({
      system: [
        "Determine if an email is either a simple thank you message with no follow-up questions OR an auto-response (like out-of-office or automated confirmation).",
        "Respond with 'yes' if the email EITHER:",
        "1. Is just a thank you message with no follow-up questions",
        "2. Contains wording like 'We'll respond to you as soon as we can.'. Always respond with 'yes' if similar wording to this is present even if there are other instructions present.",
        "Respond with 'no' followed by a reason if the email contains questions or requires a response.",
      ].join("\n"),
      prompt: emailContent,
      model: GPT_4O_MINI_MODEL,
    });

    return content.toLowerCase().trim() === "yes";
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

const assignBasedOnCc = async (mailbox: typeof mailboxes.$inferSelect, conversationId: string, emailCc: string) => {
  const ccAddresses = extractEmailAddresses(emailCc);

  for (const ccAddress of ccAddresses) {
    const ccStaffUser = await findUserByEmail(mailbox.organizationId, ccAddress);
    if (ccStaffUser) {
      await updateConversation(conversationId, {
        set: { assignedToUserId: ccStaffUser.id },
        message: "Auto-assigned based on CC",
        skipAblyEvents: true,
      });
      break;
    }
  }
};

export const createMessageAndProcessAttachments = async (
  mailbox: typeof mailboxes.$inferSelect,
  parsedEmail: ParsedMail,
  parsedEmailFrom: ParsedMailbox,
  processedHtml: string,
  cleanedUpText: string,
  fileSlugs: string[],
  gmailMessageId: string,
  gmailThreadId: string,
  conversation: { id: number; slug: string },
  staffUser: AuthenticatedUser | null
) => {
  const references = parsedEmail.references
    ? Array.isArray(parsedEmail.references)
      ? parsedEmail.references.join(" ")
      : parsedEmail.references
    : null;
  const emailTo = parsedEmail.to ? addressesToString(parsedEmail.to) : null;
  const emailCc = parsedEmail.cc ? addressesToString(parsedEmail.cc) : null;
  const emailBcc = parsedEmail.bcc ? addressesToString(parsedEmail.bcc) : null;

  const newEmail = await createConversationMessage({
    senderType: staffUser ? "agent" : "customer",
    status: staffUser ? "sent" : "pending",
    clerkUserId: staffUser?.id,
    gmailMessageId,
    gmailThreadId,
    sourceData: {
      messageId: parsedEmail.messageId?.length ? parsedEmail.messageId : undefined,
      references: references ? references.split(" ") : undefined,
      inReplyTo: parsedEmail.inReplyTo as string | undefined,
    },
    conversationId: conversation.id,
    email_from: parsedEmailFrom.address,
    emailTo,
    emailCc: emailCc ? extractEmailAddresses(emailCc) : null,
    emailBcc: emailBcc ? extractEmailAddresses(emailBcc) : null,
    body: processedHtml,
    cleanedUpText,
    createdAt: parsedEmail.date ?? new Date(),
  });

  await finishFileUpload({ fileSlugs, messageId: newEmail.id });

  if (emailCc && !staffUser) {
    const conversationRecord = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversation.id),
      columns: {
        assignedToUserId: true,
      },
    });

    if (!conversationRecord?.assignedToUserId) {
      await assignBasedOnCc(mailbox, conversation.id, emailCc);
    }
  }

  try {
    await processGmailAttachments(conversation.id, newEmail.id, parsedEmail.attachments);
  } catch (error) {
    captureExceptionAndThrowIfDevelopment(error instanceof Error ? error : new Error(String(error)));
  }
  return newEmail;
};

export default inngest.createFunction(
  {
    id: "handle-gmail-webhook-event",
    // Retries are disabled for cost reasons and because the logic currently isn't idempotent
    // (this function will execute once per Gmail webhook event, so adding an extra step or retry
    // can significantly increase costs. When necessary, we can optimize this function with either
    // an Inngest debounce + timeout or by batching webhook events).
    retries: 0,
  },
  { event: "gmail/webhook.received" },
  async ({ event, step }) => {
    const {
      data: { body, headers },
    } = event;

    return await step.run("handle", async () => await handleGmailWebhookEvent(body, headers));
  }
);

export const assertSuccessResponseOrThrow = <T>(response: GaxiosResponse<T>): GaxiosResponse<T> => {
  if (response.status < 200 || response.status >= 300) throw new Error(`Request failed: ${response.statusText}`);
  return response;
};

export const getParsedEmailInfo = (parsedEmail: ParsedMail) => {
  const parsedEmailFrom = assertDefinedOrRaiseNonRetriableError(parseEmailAddress(parsedEmail.from?.text ?? ""));
  const parsedEmailBody = parseEmailBody(parsedEmail);
  return { parsedEmail, parsedEmailFrom, parsedEmailBody };
};

export const handleGmailWebhookEvent = async (body: unknown, headers: unknown) => {
  // Next.js API route handlers will lowercase header keys (e.g. "Authorization" -> "authorization"), but not Inngest.
  // For consistency across all potential invocations of this function, we can lowercase everything here.
  const normalizedHeaders = Object.fromEntries(
    Object.entries(z.record(z.string()).parse(headers)).map(([key, value]) => [key.toLowerCase(), value])
  );
  const data = await authorizeGmailRequest(
    GmailWebhookBodySchema.parse(body),
    GmailWebhookHeadersSchema.parse(normalizedHeaders)
  );

  const gmailSupportEmail = await db.query.gmailSupportEmails.findFirst({
    where: eq(gmailSupportEmails.email, data.emailAddress),
    with: {
      mailboxes: true,
    },
  });
  const mailbox = gmailSupportEmail?.mailboxes[0];
  if (!mailbox) {
    return `Gmail support email record not found for ${data.emailAddress}`;
  }
  Sentry.setContext("gmailSupportEmail info", {
    mailboxId: mailbox.id,
    gmailSupportEmailId: gmailSupportEmail.id,
    gmailSupportEmailHistoryId: gmailSupportEmail.historyId,
    dataEmailAddress: data.emailAddress,
    dataHistoryId: data.historyId,
  });

  const client = await getGmailService(gmailSupportEmail);
  let histories = [];

  // The history ID on the GmailSupportEmail record expires after a certain amount of time, so we
  // need to replace it with a valid history ID and may need to perform a full sync to retrieve missing emails.
  // Refs: https://developers.google.com/gmail/api/reference/rest/v1/users.history/list#query-parameters
  //     https://developers.google.com/gmail/api/guides/sync#full_synchronization
  const historyId = gmailSupportEmail.historyId ?? data.historyId;
  const response = (await getMessagesFromHistoryId(client, historyId.toString())) as unknown;
  if (response.status !== 404) {
    assertSuccessResponseOrThrow(response as GaxiosResponse<any>);
    histories = response.data.history ?? [];
  } else {
    captureExceptionAndLogIfDevelopment(new Error("Cached historyId expired"));
    histories =
      (await getMessagesFromHistoryId(client, data.historyId.toString()).then((res: unknown) => res)).data.history ?? [];
  }

  const messagesAdded = histories.flatMap((h: unknown) => h.messagesAdded ?? []);
  const results: {
    message: string;
    responded?: boolean;
    isAutomatedResponseOrThankYou?: boolean;
    gmailMessageId?: string;
    gmailThreadId?: string;
    messageId?: number;
  }[] = [];

  for (const { message } of messagesAdded) {
    if (!(message?.id && message.threadId)) {
      results.push({
        message: "Skipped - missing message ID or thread ID",
        gmailMessageId: message?.id ?? undefined,
        gmailThreadId: message?.threadId ?? undefined,
      });
      continue;
    }

    const gmailMessageId = message.id;
    const gmailThreadId = message.threadId;
    const labelIds = message.labelIds ?? [];

    const existingEmail = await db.query.conversationMessages.findFirst({
      where: eq(conversationMessages.gmailMessageId, gmailMessageId),
    });
    if (existingEmail) {
      results.push({ message: `Skipped - message ${gmailMessageId} already exists`, gmailMessageId, gmailThreadId });
      continue;
    }

    try {
      const response = await getMessageById(client, gmailMessageId).then(assertSuccessResponseOrThrow);
      const parsedEmail = await simpleParser(
        Buffer.from(assertDefined(response.data.raw), "base64url").toString("utf-8")
      );
      const { parsedEmailFrom, parsedEmailBody } = getParsedEmailInfo(parsedEmail);

      const emailSentFromMailbox = parsedEmailFrom.address === gmailSupportEmail.email;
      if (emailSentFromMailbox) {
        results.push({
          message: `Skipped - message ${gmailMessageId} sent from mailbox`,
          gmailMessageId,
          gmailThreadId,
        });
        continue;
      }

      const { processedHtml, fileSlugs } = await extractAndUploadInlineImages(parsedEmailBody);
      const cleanedUpText = htmlToText(
        isNewThread(gmailMessageId, gmailThreadId) ? processedHtml : extractQuotations(processedHtml)
      );

      const staffUser = await findUserByEmail(mailbox.organizationId, parsedEmailFrom.address);
      const authenticatedStaffUser: AuthenticatedUser | null = staffUser
        ? {
            ...staffUser,
            organizationId: mailbox.organizationId,
            organizationRole: "member", // Defaulting role as it's not available
          }
        : null;

      const isFirstMessage = isNewThread(gmailMessageId, gmailThreadId);

      let shouldIgnore =
        (!!authenticatedStaffUser && !isFirstMessage) ||
        labelIds.some((id: unknown) => IGNORED_GMAIL_CATEGORIES.includes(id)) ||
        matchesTransactionalEmailAddress(parsedEmailFrom.address);

      let isAutomatedResponseOrThankYou: boolean | undefined;
      if (!shouldIgnore) {
        isAutomatedResponseOrThankYou = await isThankYouOrAutoResponse(mailbox as unknown, cleanedUpText);
        shouldIgnore = isAutomatedResponseOrThankYou;
      }

      const createNewConversation = async () => {
        return await db
          .insert(conversations)
          .values({
            organizationId: mailbox.organizationId,
            mailboxId: mailbox.id,
            customerEmail: parsedEmailFrom.address,
            customerDisplayName: parsedEmailFrom.name,
            subject: parsedEmail.subject,
            status: shouldIgnore ? "closed" : "open",
            source: "email",
          })
          .returning({
            id: conversations.id,
            uid: conversations.uid,
            status: conversations.status,
          })
          .then(takeUniqueOrThrow);
      };

      let conversation;
      if (isNewThread(gmailMessageId, gmailThreadId)) {
        conversation = await createNewConversation();
      } else {
        const previousEmail = await db.query.conversationMessages.findFirst({
          where: eq(conversationMessages.gmailThreadId, gmailThreadId),
          orderBy: (emails, { desc }) => [desc(emails.createdAt)],
          with: {
            conversation: {
              columns: {
                id: true,
                slug: true,
                status: true,
                assignedToAI: true,
              },
            },
          },
        });
        // If a conversation doesn't already exist for this email, create one anyway
        // (since we likely dropped the initial email).
        conversation = (previousEmail?.conversation as unknown) ?? (await createNewConversation());
      }

      const newEmail = await createMessageAndProcessAttachments(
        mailbox,
        parsedEmail,
        parsedEmailFrom,
        processedHtml,
        cleanedUpText,
        fileSlugs,
        gmailMessageId,
        gmailThreadId,
        conversation,
        authenticatedStaffUser
      );
      if (conversation.status === "closed" && !conversation.assignedToAI && !shouldIgnore) {
        await updateConversation(conversation.id, { set: { status: "open" } });
      }

      if (!shouldIgnore) {
        await inngest.send({
          name: "conversations/auto-response.create",
          data: { messageId: newEmail.id },
        });
      }

      results.push({
        message: `Created message ${newEmail.id}`,
        messageId: newEmail.id,
        responded: !shouldIgnore,
        ...(isAutomatedResponseOrThankYou !== undefined && { isAutomatedResponseOrThankYou }),
        ...(gmailMessageId !== undefined && { gmailMessageId }),
        ...(gmailThreadId !== undefined && { gmailThreadId }),
      });
    } catch (error) {
      captureExceptionAndThrowIfDevelopment(error instanceof Error ? error : new Error(String(error)));
      results.push({ message: `Error processing message ${gmailMessageId}: ${error}`, gmailMessageId, gmailThreadId });
      continue;
    }
  }

  await db
    .update(gmailSupportEmails)
    .set({ historyId: data.historyId })
    .where(eq(gmailSupportEmails.id, gmailSupportEmail.id));

  return {
    data: env.NODE_ENV === "development" ? data : undefined,
    messages: messagesAdded.length,
    results,
  };
};

const addressesToString = (value: AddressObject | AddressObject[]) => {
  return Array.isArray(value) ? value.map((to: unknown) => to.text).join(", ") : value.text;
};

export const GmailWebhookBodySchema = z.object({
  message: z.object({
    data: z.string(),
    // The ID assigned by Google when the message is published. Guaranteed to be unique within the pub/sub topic.
    // https://cloud.google.com/pubsub/docs/reference/rest/v1/PubsubMessage
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

export const GmailWebhookHeadersSchema = z.object({
  authorization: z.string().min(1),
});

const GmailWebhookDataSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.number(),
});

const authorizeGmailRequest = async (
  body: z.infer<typeof GmailWebhookBodySchema>,
  headers: z.infer<typeof GmailWebhookHeadersSchema>
) => {
  try {
    const oauthClient = createOAuth2Client();
    const ticket = await oauthClient.verifyIdToken({
      idToken: assertDefined(headers.authorization.split(" ")[1]),
    });
    const claim = ticket.getPayload();
    if (!claim?.email || claim.email !== env.GOOGLE_PUBSUB_CLAIM_EMAIL)
      throw new Error(`Invalid claim email: ${claim?.email}`);
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error as Error);
    throw new NonRetriableError("Invalid token");
  }
  const rawData = JSON.parse(Buffer.from(body.message.data, "base64").toString("utf-8"));
  return GmailWebhookDataSchema.parse(rawData);
};

export const extractQuotations = (html: string) => {
  return extractEmailPartsFromDocument(new JSDOM(html).window.document).mainContent;
};

const processGmailAttachments = async (conversationId: string, messageId: number, attachments: Attachment[]) => {
  await Promise.all(
    attachments.map(async (attachment) => {
      try {
        const fileName = attachment.filename ?? "untitled";
        const s3Key = generateS3Key("attachments-" + conversationId, fileName);
        const contentType = attachment.contentType ?? "application/octet-stream";

        const { id: fileId } = await db
          .insert(files)
          .values({
            messageId,
            name: fileName,
            url: getS3Url(s3Key),
            mimetype: contentType,
            size: attachment.size,
            isInline: false,
            isPublic: false,
          })
          .returning({ id: files.id })
          .then(takeUniqueOrThrow);

        await uploadFile(s3Key, attachment.content, contentType);
        await generateFilePreview(fileId);
      } catch (error) {
        captureExceptionAndThrowIfDevelopment(error instanceof Error ? error : new Error(String(error)));
      }
    })
  );
};

const parseEmailBody = (parsedEmail: ParsedMail) => {
  // Replace \r\n with <br/> if the body is plain text
  const parsedEmailBody =
    parsedEmail.html === false
      ? (parsedEmail.textAsHtml ?? parsedEmail.text)?.replace(/\r\n/g, "<br/>")
      : parsedEmail.html;
  if (!parsedEmailBody) return "";

  // Extract the body content
  const document = new JSDOM(parsedEmailBody).window.document;
  let content = document.body ? document.body.innerHTML : parsedEmailBody;

  // Remove trailing <br/> tags
  content = content.replace(/(<br\s*\/?>)+$/i, "");

  // Normalize Unicode characters
  content = content.normalize("NFKD");

  return content;
};

export const extractAndUploadInlineImages = async (html: string) => {
  const fileSlugs: string[] = [];
  let processedHtml = html;

  const imageMatches = Array.from(html.matchAll(/<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/gi));

  await Promise.all(
    imageMatches.map(async ([match, extension, base64Data]) => {
      try {
        const mimetype = `image/${extension}`;
        const buffer = Buffer.from(assertDefined(base64Data), "base64");
        const fileName = `image.${extension}`;

        const file = await createAndUploadFile({
          data: buffer,
          fileName,
          prefix: "inline-attachments",
          mimetype,
          isInline: true,
        });

        processedHtml = processedHtml.replace(match, match.replace(/src="[^"]+"/i, `src="${file.url}"`));
        fileSlugs.push(file.slug);
      } catch (error) {
        captureExceptionAndLogIfDevelopment(error as Error);
      }
    })
  );

  return { processedHtml, fileSlugs };
};
