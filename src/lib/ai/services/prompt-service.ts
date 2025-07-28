import type { CoreMessage } from "ai";
import { CHAT_SYSTEM_PROMPT, GUIDE_INSTRUCTIONS } from "@/lib/ai/prompts";
import type { Mailbox } from "@/lib/data/mailbox";

/**
 * Interface for retrieval data sources
 */
export interface RetrievalSource {
  url: string;
  pageTitle: string;
  markdown: string;
  similarity: number;
}

/**
 * Interface for prompt retrieval data
 */
export interface PromptRetrievalData {
  knowledgeBank: string | null;
  websitePagesPrompt: string | null;
  websitePages: RetrievalSource[];
}

/**
 * Interface for the result of building prompt messages
 */
export interface PromptBuildResult {
  messages: CoreMessage[];
  sources: RetrievalSource[];
}

/**
 * Service for handling AI prompt construction and management
 */
/**
 * Builds the system prompt with all necessary context
 *
 * @param mailbox - The mailbox configuration
 * @param email - The user's email (null for anonymous users)
 * @param guideEnabled - Whether to include guide instructions
 * @param retrievalData - Additional retrieval data for context
 * @returns The constructed system prompt
 */
function buildSystemPrompt(
  mailbox: Mailbox,
  email: string | null,
  guideEnabled: boolean,
  retrievalData: PromptRetrievalData
): string {
  // Build the base prompt components
  const promptComponents = [
    CHAT_SYSTEM_PROMPT.replaceAll("MAILBOX_NAME", mailbox.name).replaceAll(
      "{{CURRENT_DATE}}",
      new Date().toISOString()
    ),
    guideEnabled ? GUIDE_INSTRUCTIONS : null,
  ].filter(Boolean);

  // Combine base prompts
  let systemPrompt = promptComponents.join("\n");

  // Add retrieval data if available
  if (retrievalData.knowledgeBank) {
    systemPrompt += `\n${retrievalData.knowledgeBank}`;
  }
  if (retrievalData.websitePagesPrompt) {
    systemPrompt += `\n${retrievalData.websitePagesPrompt}`;
  }

  // Add user context
  systemPrompt += email ? `\nCurrent user email: ${email}` : "\nAnonymous user";

  return systemPrompt;
}

/**
 * Builds prompt messages for AI chat interactions
 *
 * @param mailbox - The mailbox configuration
 * @param email - The user's email (null for anonymous users)
 * @param query - The user's query/message
 * @param guideEnabled - Whether to include guide instructions
 * @param fetchRetrievalData - Function to fetch retrieval data
 * @returns Promise resolving to messages and sources
 */
export async function buildPromptMessages(
  mailbox: Mailbox,
  email: string | null,
  query: string,
  guideEnabled = false,
  fetchRetrievalData: (mailbox: Mailbox, query: string, metadata: unknown) => Promise<PromptRetrievalData>
): Promise<PromptBuildResult> {
  // Fetch retrieval data for the query
  const retrievalData = await fetchRetrievalData(mailbox, query, null);

  // Build the system prompt
  const systemPrompt = buildSystemPrompt(mailbox, email, guideEnabled, retrievalData);

  return {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    sources: retrievalData.websitePages,
  };
}

/**
 * Creates a user message
 *
 * @param content - The message content
 * @returns A CoreMessage with user role
 */
export function createUserMessage(content: string): CoreMessage {
  return {
    role: "user",
    content,
  };
}

/**
 * Creates an assistant message
 *
 * @param content - The message content
 * @returns A CoreMessage with assistant role
 */
export function createAssistantMessage(content: string): CoreMessage {
  return {
    role: "assistant",
    content,
  };
}

/**
 * Creates a system message
 *
 * @param content - The message content
 * @returns A CoreMessage with system role
 */
export function createSystemMessage(content: string): CoreMessage {
  return {
    role: "system",
    content,
  };
}

/**
 * Validates and sanitizes prompt messages
 *
 * @param messages - Array of messages to validate
 * @returns Validated and sanitized messages
 */
export function validateMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.filter((message: unknown) => {
    // Ensure message has valid role and content
    return (
      message.content &&
      typeof message.content === "string" &&
      ["system", "user", "assistant", "tool"].includes(message.role)
    );
  });
}
