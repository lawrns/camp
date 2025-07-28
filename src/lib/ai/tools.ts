import { waitUntil } from "@vercel/functions";
import { CoreMessage, tool, type Tool } from "ai";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { GUIDE_USER_TOOL_NAME, REQUEST_HUMAN_SUPPORT_DESCRIPTION } from "@/lib/ai/constants";
import { getConversationById, updateConversation } from "@/lib/data/conversation";
import { Mailbox } from "@/lib/data/mailbox";
import { fetchMetadata, getPastConversationsPrompt } from "@/lib/data/retrieval";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";
import { assertDefined } from "@/lib/utils/assert";

// import { getMetadataApiByMailbox } from "@/lib/data/mailboxMetadataApi"; // Module not found

// Simple fallback for getMetadataApiByMailbox
const getMetadataApiByMailbox = async (mailbox: unknown) => {
  return null; // Fallback: no metadata API
};
// import { upsertPlatformCustomer } from "@/lib/data/platformCustomer"; // Module not found

// Simple fallback for upsertPlatformCustomer
const upsertPlatformCustomer = async (params: unknown) => {
  return { params, upserted: true };
};

// import { getMailboxToolsForChat } from "@/lib/data/tools"; // Module not found

// Simple fallback for getMailboxToolsForChat
const getMailboxToolsForChat = async (mailbox: unknown) => {
  return []; // Fallback: no tools
};

// import { buildAITools, callToolApi } from "@/lib/tools/apiTool"; // Module not found

// Simple fallbacks for tool API functions
const buildAITools = (tools: unknown[]) => {
  return {}; // Fallback: no AI tools
};

const callToolApi = async (conversation: any, tool: any, params: unknown) => {
  return { conversation, tool, params, result: "fallback" };
};

const fetchUserInformation = async (email: string, mailbox: Mailbox, reason: string) => {
  try {
    const metadata = await fetchMetadata(mailbox.organization_id, { includeConversations: true });
    return `Found ${metadata.totalCount} items in metadata`;
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error as Error, {
      extra: { email, mailboxSlug: mailbox.slug },
    });
    return "Error fetching metadata";
  }
};

const searchKnowledgeBase = async (query: string, mailbox: Mailbox) => {
  try {
    const metadata = await fetchMetadata(mailbox.organization_id, {
      includeConversations: true,
      query,
    });
    const documents = getPastConversationsPrompt(metadata.conversations);
    return documents ?? `Found ${metadata.totalCount} documents in knowledge base.`;
  } catch (error) {
    return "No past conversations found";
  }
};

const updateCustomerMetadata = async (email: string, mailboxId: number, mailbox: Mailbox) => {
  try {
    const metadata = await fetchMetadata(mailbox.organization_id, { includeConversations: true });
    const customerMetadata = metadata ?? null;
    if (customerMetadata) {
      await upsertPlatformCustomer({
        email,
        mailboxId,
        customerMetadata,
      });
    }
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error as Error, {
      extra: { email, mailboxId },
    });
  }
};

const requestHumanSupport = async (
  conversationId: string,
  email: string | null,
  mailbox: Mailbox,
  reason: string,
  newEmail?: string
) => {
  const conversation = assertDefined(await getConversationById(conversationId));

  if (newEmail) {
    await updateConversation(conversation.id, {
      set: { customerEmail: newEmail },
      message: "Email set for escalation",
      type: "update",
    });
    email = newEmail;
  }

  await updateConversation(conversation.id, {
    set: { status: "open" },
    message: reason,
    type: "request_human_support",
  });

  if (email) {
    waitUntil(updateCustomerMetadata(email, conversation.mailboxId, mailbox));

    waitUntil(
      inngest.send({
        name: "conversations/human-support-requested",
        data: {
          mailboxSlug: mailbox.slug,
          conversationId: conversation.id,
        },
      })
    );
  }

  return "The conversation has been escalated to a human agent. You will be contacted soon by email.";
};

const setUserEmail = async (conversationId: string, email: string) => {
  const conversation = assertDefined(await getConversationById(conversationId));
  await updateConversation(conversation.id, {
    set: { customerEmail: email },
    message: "Email set by user",
    type: "update",
  });

  return "Your email has been set. You can now request human support if needed.";
};

export const buildTools = async (
  conversationId: string,
  email: string | null,
  mailbox: Mailbox,
  includeHumanSupport = true,
  guideEnabled = false,
  includeMailboxTools = true,
  reasoningMiddlewarePrompt?: string
): Promise<Record<string, Tool>> => {
  const metadataApi = await getMetadataApiByMailbox(mailbox);

  const reasoningMiddleware = async (
    result: Promise<string | undefined> | string | undefined,
    messages: CoreMessage[]
  ) => {
    const resultString = await result;
    if (reasoningMiddlewarePrompt && resultString) {
      return `${reasoningMiddlewarePrompt}\n\n${resultString}`;
    }
    return resultString;
  };

  const tools: Record<string, Tool> = {
    knowledge_base: tool({
      description: "search the knowledge base",
      parameters: z.object({
        query: z.string().describe("query to search the knowledge base"),
      }),
      execute: ({ query }: any, { messages }: unknown) =>
        reasoningMiddleware(searchKnowledgeBase(query, mailbox), messages),
    }),
  };

  if (guideEnabled) {
    tools[GUIDE_USER_TOOL_NAME] = tool({
      description: "call this tool to guide the user in the interface instead of returning a text response",
      parameters: z.object({
        title: z.string().describe("title of the guide that will be displayed to the user"),
        instructions: z.string().describe("instructions for the guide based on the current page and knowledge base"),
      }),
      execute: async ({ title, instructions }: unknown) => {
        return JSON.stringify({ title, instructions });
      },
    });
  }

  if (!email) {
    tools.set_user_email = tool({
      description: "Set the email address for the current anonymous user, so that the user can be contacted later",
      parameters: z.object({
        email: z.string().email().describe("email address to set for the user"),
      }),
      execute: ({ email }: any, { messages }: unknown) =>
        reasoningMiddleware(setUserEmail(conversationId, email), messages),
    });
  }

  if (includeHumanSupport) {
    tools.request_human_support = tool({
      description: REQUEST_HUMAN_SUPPORT_DESCRIPTION,
      parameters: z.object({
        reason: z
          .string()
          .describe(
            "Escalation reasons must include specific details about the issue. Simply stating a human is needed without context is not acceptable, even if the user stated several times or said it's urgent."
          ),
        email: email
          ? z.string().optional()
          : z.string().email().describe("email address to contact you (required for anonymous users)"),
      }),
      execute: ({ reason, email: newEmail }: any, { messages }: unknown) =>
        reasoningMiddleware(requestHumanSupport(conversationId, email, mailbox, reason, newEmail), messages),
    });
  }

  if (metadataApi && email) {
    tools.fetch_user_information = tool({
      description: "fetch user related information",
      parameters: z.object({
        reason: z.string().describe("reason for fetching user information"),
      }),
      execute: ({ reason }: any, { messages }: unknown) =>
        reasoningMiddleware(fetchUserInformation(email, mailbox, reason), messages),
    });
  }

  if (includeMailboxTools) {
    const mailboxTools = (await getMailboxToolsForChat(mailbox)) as { slug: string; customerEmailParameter?: string }[];
    const aiTools = buildAITools(mailboxTools) as Record<string, { description: string; parameters: z.ZodObject<any> }>;

    for (const [slug, aiTool] of Object.entries(aiTools)) {
      const mailboxTool = mailboxTools.find((t) => t.slug === slug);
      if (!mailboxTool) continue;

      tools[slug] = tool({
        description: aiTool.description,
        parameters: aiTool.parameters,
        execute: async (params: any, { messages }: unknown) => {
          const conversation = assertDefined(await getConversationById(conversationId));
          if (mailboxTool.customerEmailParameter) {
            params = { ...params, [mailboxTool.customerEmailParameter]: conversation.customerEmail };
          }
          const result = await callToolApi(conversation, mailboxTool, params);
          return reasoningMiddleware(JSON.stringify(result), messages);
        },
      });
    }
  }

  return tools;
};
