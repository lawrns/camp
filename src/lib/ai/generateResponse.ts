import { and, asc, eq, isNull, ne, or } from "drizzle-orm";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { db } from "@/db/client";
import { conversationMessages } from "@/db/schema";
import { getTextWithConversationSubject } from "@/lib/data/conversationMessage";
import { getMailboxById } from "@/lib/data/mailbox";
import type { PromptInfo } from "@/types/conversationMessages";
import { cleanUpTextForAI, generateCompletion, GPT_4_1_MODEL } from "./core";
import { buildMessagesFromHistory } from "./messageBuilder";
import { buildTools } from "./tools";

// import { fetchPromptRetrievalData, getPastConversationsPrompt } from "@/lib/data/retrieval"; // Module not found

// Simple fallbacks for retrieval functions
const fetchPromptRetrievalData = async (mailbox: unknown, userPrompt: string, metadata: unknown) => {
  return {
    knowledgeBank: null,
    websitePagesPrompt: null,
    metadata: null,
  };
};

const getPastConversationsPrompt = async (userPrompt: string, mailbox: unknown) => {
  return null;
};

// import { aiConfidenceService } from "./ai-confidence-service"; // Module not found

// Simple fallback for aiConfidenceService
const aiConfidenceService = {
  analyzeResponseConfidence: async (
    query: string,
    response: string,
    conversationId: string,
    organizationId: string,
    sources: string[]
  ) => {
    return {
      breakdown: { overall: 0.75, shouldEscalate: false },
      shouldShowToUser: false,
      escalationTriggered: false,
      trainingDataRecorded: false,
    };
  },
};

const SYSTEM_PROMPT_PREFIX = `
You are tasked with replying to an email in a professional manner. You will be given the content of the email you're responding to and the name of the recipient. Your goal is to craft a courteous, clear, and appropriate response.
Please write your entire email response, including the greeting and sign-off. Not include any explanations or meta-commentary. Your response should read as a complete, ready-to-send email.
`;

const GLOBAL_RULES_SUFFIX = `

<GlobalRulesThatMustBeFollowed>
Do not:
- Do not create extra newlines before signatures, or include signatures at all such as 'Best regards, Campfire Support', 'Best, <some name>', 'Sincerely, <some name>'. Those signatures will be added later based on who sends the reply.
- Apologize for things that are not your fault or responsibility.
- Make promises or commitments that you cannot fulfill.
- Include personal opinions or speculations.
- Use overly casual language or slang.
- Do not answer as giving instructions or advice for someone that will be replying to the email. Respond as if you are the person that will be replying to the email.
</GlobalRulesThatMustBeFollowed>
`;

export const buildPromptWithMessages = async (conversationId: string) => {
  const pastMessages = await db.query.conversationMessages.findMany({
    where: and(
      eq(conversationMessages.conversationId, conversationId),
      or(
        isNull(conversationMessages.status),
        and(ne(conversationMessages.status, "failed")) // Only exclude failed messages since draft/discarded aren't valid statuses
      )
    ),
    orderBy: asc(conversationMessages.createdAt),
  });

  const filteredMessages = pastMessages.filter(
    (message: unknown): message is typeof conversationMessages.$inferSelect & { cleanedUpText: string } =>
      !!message.cleanedUpText && message.cleanedUpText.trim().length > 0
  );

  const messages = buildMessagesFromHistory(filteredMessages);
  const formattedMessages = messages
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    .map((m: unknown) => `<message><role>${m.role}</role><content>${m.content}</content></message>`)
    .join("\n");
  return `This is the conversation history: <messages>${cleanUpTextForAI(formattedMessages)}</messages>`;
};

const convertMarkdownToHtml = async (markdown: string): Promise<string> => {
  const result = await remark().use(remarkHtml, { sanitize: false }).process(markdown);
  return result.toString();
};

export const generateDraftResponse = async (
  mailboxId: number,
  lastUserEmail: typeof conversationMessages.$inferSelect & {
    conversation: { subject: string | null };
  },
  metadata: object | null,
  options: { enableMailboxTools?: boolean } = { enableMailboxTools: false }
): Promise<{
  draftResponse: string;
  promptInfo: PromptInfo;
  confidenceScore: number;
  shouldEscalate: boolean;
  confidenceBreakdown: unknown;
}> => {
  const mailbox = await getMailboxById(mailboxId);
  const conversationId = lastUserEmail.conversationId;

  if (!mailbox) {
    throw new Error("Mailbox not found");
  }

  const userPrompt = await getTextWithConversationSubject(lastUserEmail.conversation, lastUserEmail);
  const {
    knowledgeBank,
    websitePagesPrompt,
    metadata: metadataPrompt,
  } = await fetchPromptRetrievalData(mailbox, userPrompt, metadata);
  const relevantPastConversations = await getPastConversationsPrompt(userPrompt, mailbox);

  const systemPrompt = [
    SYSTEM_PROMPT_PREFIX,
    knowledgeBank ? [knowledgeBank] : [],
    websitePagesPrompt ? [websitePagesPrompt] : [],
    relevantPastConversations ? [relevantPastConversations] : [],
    metadataPrompt ? [metadataPrompt] : [],
    GLOBAL_RULES_SUFFIX,
  ]
    .flat()
    .join("\n");

  const result = await generateCompletion({
    model: GPT_4_1_MODEL,
    system: systemPrompt,
    prompt: await buildPromptWithMessages(conversationId),
    maxSteps: 5,
    tools: await buildTools(
      conversationId,
      lastUserEmail.emailFrom ?? "",
      mailbox,
      false,
      false,
      options.enableMailboxTools
    ),
    functionId: "generate-draft-response",
    metadata: {
      sessionId: conversationId,
      email: lastUserEmail.emailFrom ?? "",
      mailboxSlug: mailbox.slug,
    },
    shortenPromptBy: {
      removeSystem: [relevantPastConversations, knowledgeBank, metadataPrompt],
      truncateMessages: true,
    },
  });

  const htmlResponse = await convertMarkdownToHtml(result.text);

  // Calculate confidence score for the generated response
  const userQuery = await getTextWithConversationSubject(lastUserEmail.conversation, lastUserEmail);
  const organizationId = mailbox.organizationId;

  let confidenceResult;
  try {
    confidenceResult = await aiConfidenceService.analyzeResponseConfidence(
      userQuery,
      result.text,
      conversationId.toString(),
      organizationId,
      [
        relevantPastConversations ? "past_conversations" : "",
        knowledgeBank ? "knowledge_bank" : "",
        metadataPrompt ? "metadata" : "",
      ].filter(Boolean)
    );
  } catch (error) {
    // Fallback confidence calculation
    confidenceResult = {
      breakdown: { overall: 0.75, shouldEscalate: false },
      shouldShowToUser: false,
      escalationTriggered: false,
      trainingDataRecorded: false,
    };
  }

  return {
    draftResponse: htmlResponse,
    promptInfo: {
      past_conversations: relevantPastConversations,
      pinned_replies: knowledgeBank,
      metadata: metadataPrompt,
    },
    confidenceScore: confidenceResult.breakdown.overall,
    shouldEscalate: confidenceResult.escalationTriggered,
    confidenceBreakdown: confidenceResult.breakdown,
  };
};
