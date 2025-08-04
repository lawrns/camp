/**
 * Conversation Embedding Service
 * Wrapper for embedding conversation content using the core AI functions
 */

import { isWithinTokenLimit } from "@/lib/ai/core";
import { getConversationById } from "@/lib/data/conversation";
import { getMessages } from "@/lib/data/conversationMessage";
import { getMailboxById } from "@/lib/data/mailbox";
import { generateConversationEmbedding as generateConversationEmbeddingCore } from "@/lib/embeddings";

export class PromptTooLongError extends Error {
  constructor(message: string = "Conversation content exceeds token limit for embedding") {
    super(message);
    this.name = "PromptTooLongError";
  }
}

export async function createConversationEmbedding(
  conversationId: string
): Promise<{ id: number; embedding: number[] }> {
  // Get conversation and its mailbox
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // Get the mailbox
  const mailbox = await getMailboxById(conversation.mailboxId);
  if (!mailbox) {
    throw new Error(`Mailbox ${conversation.mailboxId} not found`);
  }

  // Get messages using the correct function
  const messages = await getMessages(conversationId, mailbox);

  // Convert messages to text format for embedding
  const conversationText = messages
    .slice(-10) // Last 10 messages for context
    .map((msg) => `${(msg as unknown).senderType || (msg as unknown).role}: ${(msg as unknown).content || (msg as unknown).body}`)
    .join("\n");

  // Check if content is within token limits
  if (!isWithinTokenLimit(conversationText, true)) {
    throw new PromptTooLongError(`Conversation ${conversationId} content exceeds embedding token limit`);
  }

  // Get organization ID from the conversation (instead of message)
  const organizationId = conversation.organizationId;
  if (!organizationId) {
    throw new Error(`No organization found for conversation ${conversationId}`);
  }

  // Generate embedding using the core function
  const embedding = await generateConversationEmbeddingCore(
    conversationId.toString(),
    messages.map((msg) => ({
      role: (msg as unknown).senderType || (msg as unknown).role,
      content: (msg as unknown).content || (msg as unknown).body,
    })),
    organizationId
  );

  return {
    id: conversationId,
    embedding,
  };
}
