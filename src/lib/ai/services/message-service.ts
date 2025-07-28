import type { CoreMessage, Message } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationMessages, files, type MessageMetadata } from "@/db/schema";
import type { Tool as HelperTool } from "@/db/schema/tools";
import { createConversationMessage, getMessagesOnly } from "@/lib/data/conversationMessage";
import { createAndUploadFile } from "@/lib/data/files";

// Types and Interfaces
export interface ConversationMessageInput {
  conversationId: string;
  emailFrom?: string | null;
  body: string;
  cleanedUpText: string;
  role: string;
  isPerfect: boolean;
  isPinned: boolean;
  isFlaggedAsBad: boolean;
  metadata?: Record<string, any>;
  responseToId?: number;
  status?: string;
}

export interface MessageAttachment {
  messageId: number;
  name: string;
  contentType: string;
  url: string;
}

export interface CreateUserMessageOptions {
  conversationId: string;
  email: string | null;
  query: string;
  screenshotData?: string;
}

export interface CreateAssistantMessageOptions {
  conversationId: string;
  userMessageId: number;
  text: string;
  options?: {
    traceId?: string | null;
    reasoning?: string | null;
    sendEmail?: boolean;
  };
}

// Fallback for missing import - should be replaced with actual implementation
const createPresignedDownloadUrl = async (url: string): Promise<string> => {
  return url; // Return the original URL as fallback
};

/**
 * Service for managing conversation messages
 * Handles creation, retrieval, and management of messages in conversations
 */
export class MessageService {
  /**
   * Load screenshot attachments for messages
   * @param messages Array of conversation messages
   * @returns Array of message attachments with presigned URLs
   */
  static async loadScreenshotAttachments(
    messages: (typeof conversationMessages.$inferSelect)[]
  ): Promise<MessageAttachment[]> {
    try {
      const messageIds = messages
        .filter((m: unknown) => (m.metadata as MessageMetadata)?.includesScreenshot)
        .map((m: unknown) => m.id);

      if (messageIds.length === 0) {
        return [];
      }

      const attachments = await db.query.files.findMany({
        where: inArray(files.messageId, messageIds),
      });

      return await Promise.all(
        attachments.map(async (attachment: unknown) => {
          const url = await createPresignedDownloadUrl(attachment.url);
          return {
            messageId: attachment.messageId,
            name: attachment.name,
            contentType: attachment.mimetype,
            url,
          };
        })
      );
    } catch (error) {
      throw new Error("Failed to load screenshot attachments");
    }
  }

  /**
   * Load previous messages for a conversation
   * @param conversationId The conversation ID
   * @param latestMessageId Optional ID of the latest message to exclude
   * @returns Array of formatted messages for AI context
   */
  static async loadPreviousMessages(conversationId: string, latestMessageId?: number): Promise<Message[]> {
    try {
      const conversationMessages = await getMessagesOnly(conversationId);
      const attachments = await this.loadScreenshotAttachments(conversationMessages);

      return conversationMessages
        .filter((message: unknown) => message.body && message.id !== latestMessageId)
        .map((message: unknown) => {
          // Handle tool messages
          if (message.role === "tool") {
            const tool = message.metadata?.tool as HelperTool;
            return {
              id: message.id.toString(),
              role: "assistant",
              content: "",
              toolInvocations: [
                {
                  id: message.id.toString(),
                  toolName: tool.slug,
                  result: message.metadata?.result,
                  step: 0,
                  state: "result",
                  toolCallId: `tool_${message.id}`,
                  args: message.metadata?.parameters,
                },
              ],
            };
          }

          // Handle regular messages
          return {
            id: message.id.toString(),
            role: message.role === "staff" || message.role === "ai_assistant" ? "assistant" : message.role,
            content: message.body || "",
            experimental_attachments: attachments.filter((a: unknown) => a.messageId === message.id),
          };
        });
    } catch (error) {
      throw new Error("Failed to load previous messages");
    }
  }

  /**
   * Create a user message in the conversation
   * @param options Message creation options
   * @returns The created message
   */
  static async createUserMessage({
    conversationId,
    email,
    query,
    screenshotData,
  }: CreateUserMessageOptions): Promise<typeof conversationMessages.$inferSelect> {
    try {
      const message = await createConversationMessage({
        conversationId,
        emailFrom: email,
        body: query,
        cleanedUpText: query,
        role: "user",
        isPerfect: false,
        isPinned: false,
        isFlaggedAsBad: false,
        metadata: { includesScreenshot: !!screenshotData },
      });

      if (screenshotData) {
        await createAndUploadFile({
          data: Buffer.from(screenshotData, "base64"),
          fileName: `screenshot-${Date.now()}.png`,
          prefix: `screenshots/${conversationId}`,
          messageId: message.id,
        });
      }

      return message;
    } catch (error) {
      throw new Error("Failed to create user message");
    }
  }

  /**
   * Create an assistant message in the conversation
   * @param options Message creation options
   * @returns The created message
   */
  static async createAssistantMessage({
    conversationId,
    userMessageId,
    text,
    options,
  }: CreateAssistantMessageOptions): Promise<typeof conversationMessages.$inferSelect> {
    try {
      return await createConversationMessage({
        conversationId,
        responseToId: userMessageId,
        status: options?.sendEmail ? "queueing" : "sent",
        body: text,
        cleanedUpText: text,
        role: "ai_assistant",
        isPerfect: false,
        isPinned: false,
        isFlaggedAsBad: false,
        metadata: {
          ...(options?.traceId && { trace_id: options.traceId }),
          ...(options?.reasoning && { reasoning: options.reasoning }),
        },
      });
    } catch (error) {
      throw new Error("Failed to create assistant message");
    }
  }

  /**
   * Get the last assistant message in a conversation
   * @param conversationId The conversation ID
   * @returns The last assistant message or null
   */
  static async lastAssistantMessage(
    conversationId: string
  ): Promise<typeof conversationMessages.$inferSelect | undefined> {
    try {
      return await db.query.conversationMessages.findFirst({
        where: and(
          eq(conversationMessages.conversationId, conversationId),
          eq(conversationMessages.role, "ai_assistant")
        ),
        orderBy: desc(conversationMessages.createdAt),
      });
    } catch (error) {
      throw new Error("Failed to fetch last assistant message");
    }
  }

  /**
   * Get the last user message in a conversation
   * @param conversationId The conversation ID
   * @returns The last user message or null
   */
  static async lastUserMessage(conversationId: string): Promise<typeof conversationMessages.$inferSelect | undefined> {
    try {
      return await db.query.conversationMessages.findFirst({
        where: and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.role, "user")),
        orderBy: desc(conversationMessages.createdAt),
      });
    } catch (error) {
      throw new Error("Failed to fetch last user message");
    }
  }
}

// Export individual functions for backward compatibility
export const loadScreenshotAttachments = MessageService.loadScreenshotAttachments.bind(MessageService);
export const loadPreviousMessages = MessageService.loadPreviousMessages.bind(MessageService);
export const createUserMessage = MessageService.createUserMessage.bind(MessageService);
export const createAssistantMessage = MessageService.createAssistantMessage.bind(MessageService);
export const lastAssistantMessage = MessageService.lastAssistantMessage.bind(MessageService);
export const lastUserMessage = MessageService.lastUserMessage.bind(MessageService);
