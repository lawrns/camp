/**
 * Slack Agent Message Handler
 * Processes incoming Slack messages and generates appropriate responses
 */

import type { SlackEvent, SlackMessage } from "../client";
import type { Mailbox } from "./findMailboxForEvent";

export interface MessageContext {
  event: SlackEvent;
  mailbox: Mailbox;
  user: {
    id: string;
    name: string;
    email?: string;
  };
  channel: {
    id: string;
    name: string;
    isPrivate: boolean;
  };
  thread?: {
    ts: string;
    messageCount: number;
  };
}

export interface MessageResponse {
  text?: string;
  blocks?: any[];
  attachments?: any[];
  threadTs?: string;
  ephemeral?: boolean;
  responseType: "immediate" | "delayed" | "escalate" | "ignore";
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface HandleMessageResult {
  success: boolean;
  response?: MessageResponse;
  error?: string;
  actions?: Array<{
    type: "send_message" | "create_ticket" | "escalate" | "log";
    data: any;
  }>;
}

export class MessageHandler {
  private responses: Map<string, string> = new Map();
  private conversations: Map<string, Array<{ message: string; response: string; timestamp: Date }>> = new Map();

  constructor() {
    this.initializeResponses();
  }

  private initializeResponses(): void {
    // Mock predefined responses
    this.responses.set("hello", "Hello! How can I help you today?");
    this.responses.set("help", "I'm here to assist you. You can ask me questions about our products or services.");
    this.responses.set("support", "I'll connect you with our support team. Please describe your issue.");
    this.responses.set("thanks", "You're welcome! Is there anything else I can help you with?");
    this.responses.set("bye", "Goodbye! Feel free to reach out if you need any assistance.");
    this.responses.set(
      "status",
      "All systems are currently operational. You can check our status page for real-time updates."
    );
    this.responses.set(
      "pricing",
      "You can find our pricing information on our website. Would you like me to send you a link?"
    );
    this.responses.set("demo", "I'd be happy to help you schedule a demo. Let me connect you with our sales team.");
  }

  async handleMessage(context: MessageContext): Promise<HandleMessageResult> {
    try {
      const { event, mailbox, user, channel } = context;

      // Extract message text
      const messageText = event.text?.toLowerCase().trim() || "";

      if (!messageText) {
        return {
          success: true,
          response: {
            responseType: "ignore",
            confidence: 0,
          },
        };
      }

      // Check if it's a bot message (ignore)
      if (event.bot_id || event.subtype === "bot_message") {
        return {
          success: true,
          response: {
            responseType: "ignore",
            confidence: 1,
          },
        };
      }

      // Check business hours
      const shouldRespond = await this.shouldAutoRespond(mailbox);

      if (!shouldRespond) {
        return this.createOutOfHoursResponse(context);
      }

      // Generate response based on message content
      const response = await this.generateResponse(messageText, context);

      // Store conversation history
      this.storeConversation(user.id, messageText, response.text || "");

      // Determine if escalation is needed
      if (response.confidence < 0.5 || (await this.shouldEscalate(context))) {
        return this.createEscalationResponse(context);
      }

      return {
        success: true,
        response,
        actions: [
          {
            type: "send_message",
            data: {
              channel: channel.id,
              text: response.text,
              thread_ts: event.thread_ts || event.ts,
            },
          },
          {
            type: "log",
            data: {
              event: "message_handled",
              user: user.id,
              channel: channel.id,
              confidence: response.confidence,
            },
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async generateResponse(messageText: string, context: MessageContext): Promise<MessageResponse> {
    // Simple keyword matching
    const keywords = messageText.split(" ").filter((word: any) => word.length > 2);
    let bestMatch = "";
    let bestScore = 0;

    for (const [key, response] of this.responses.entries()) {
      const score = this.calculateSimilarity(messageText, key);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = response;
      }
    }

    // Check for specific patterns
    if (messageText.includes("urgent") || messageText.includes("emergency")) {
      return {
        text: "I understand this is urgent. Let me escalate this to our support team immediately.",
        responseType: "escalate",
        confidence: 0.9,
        metadata: { priority: "high" },
      };
    }

    if (messageText.includes("bug") || messageText.includes("error") || messageText.includes("issue")) {
      return {
        text: "I see you're experiencing an issue. Could you provide more details about what you're seeing? This will help our team assist you better.",
        responseType: "immediate",
        confidence: 0.8,
        metadata: { category: "technical" },
      };
    }

    if (messageText.includes("account") || messageText.includes("billing") || messageText.includes("payment")) {
      return {
        text: "For account and billing questions, I'll connect you with our billing team who can provide specific details about your account.",
        responseType: "escalate",
        confidence: 0.7,
        metadata: { category: "billing" },
      };
    }

    // Use best match or fallback
    if (bestScore > 0.3) {
      return {
        text: bestMatch,
        responseType: "immediate",
        confidence: bestScore,
      };
    }

    // Fallback response
    return {
      text: "Thanks for your message! I'm not sure I understand exactly what you need, but I'll make sure someone from our team gets back to you soon.",
      responseType: "delayed",
      confidence: 0.3,
      metadata: { fallback: true },
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation
    const words1 = text1.toLowerCase().split(" ");
    const words2 = text2.toLowerCase().split(" ");

    let matches = 0;
    for (const word1 of words1) {
      if (words2.some((word2) => word1.includes(word2) || word2.includes(word1))) {
        matches++;
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private async shouldAutoRespond(mailbox: Mailbox): Promise<boolean> {
    if (!mailbox.settings.autoRespond) {
      return false;
    }

    // Check business hours
    if (mailbox.settings.businessHours?.enabled) {
      const now = new Date();
      const timezone = mailbox.settings.businessHours.timezone;

      const dayOfWeek = now
        .toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: timezone,
        })
        .toLowerCase() as keyof typeof mailbox.settings.businessHours.schedule;

      const schedule = mailbox.settings.businessHours.schedule[dayOfWeek];

      if (!schedule) {
        return false; // No schedule for this day
      }

      const currentTime = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      });

      return currentTime >= schedule.start && currentTime <= schedule.end;
    }

    return true; // Always respond if business hours not enabled
  }

  private async shouldEscalate(context: MessageContext): Promise<boolean> {
    const { mailbox, user } = context;

    if (!mailbox.settings.escalateToHuman) {
      return false;
    }

    // Check conversation history for repeated questions
    const userConversations = this.conversations.get(user.id) || [];
    const recentConversations = userConversations.filter(
      (conv) => Date.now() - conv.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );

    // Escalate if user has had multiple interactions recently
    return recentConversations.length > 3;
  }

  private createOutOfHoursResponse(context: MessageContext): HandleMessageResult {
    const { mailbox } = context;
    const schedule = mailbox.settings.businessHours?.schedule;

    let scheduleText = "";
    if (schedule) {
      const workingDays = Object.entries(schedule)
        .filter(([_, hours]) => hours !== null)
        .map(([day, hours]) => `${day}: ${hours!.start}-${hours!.end}`)
        .join(", ");

      scheduleText = workingDays ? ` Our support hours are: ${workingDays}.` : "";
    }

    return {
      success: true,
      response: {
        text: `Thanks for your message! We're currently outside of our support hours.${scheduleText} We'll get back to you as soon as possible.`,
        responseType: "delayed",
        confidence: 1,
        metadata: { outOfHours: true },
      },
      actions: [
        {
          type: "create_ticket",
          data: {
            subject: "Out of hours inquiry",
            user: context.user,
            channel: context.channel,
            message: context.event.text,
          },
        },
      ],
    };
  }

  private createEscalationResponse(context: MessageContext): HandleMessageResult {
    return {
      success: true,
      response: {
        text: "Let me connect you with a member of our team who can better assist you. Someone will be with you shortly.",
        responseType: "escalate",
        confidence: 1,
        metadata: { escalated: true },
      },
      actions: [
        {
          type: "escalate",
          data: {
            user: context.user,
            channel: context.channel,
            message: context.event.text,
            mailbox: context.mailbox,
            priority: "normal",
          },
        },
        {
          type: "create_ticket",
          data: {
            subject: "Escalated inquiry",
            user: context.user,
            channel: context.channel,
            message: context.event.text,
            assignedTo: "human_agent",
          },
        },
      ],
    };
  }

  private storeConversation(userId: string, message: string, response: string): void {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const userConversations = this.conversations.get(userId)!;
    userConversations.push({
      message,
      response,
      timestamp: new Date(),
    });

    // Keep only last 20 conversations per user
    if (userConversations.length > 20) {
      userConversations.splice(0, userConversations.length - 20);
    }
  }

  async getConversationHistory(userId: string): Promise<Array<{ message: string; response: string; timestamp: Date }>> {
    return this.conversations.get(userId) || [];
  }

  async clearConversationHistory(userId: string): Promise<void> {
    this.conversations.delete(userId);
  }

  addResponse(keyword: string, response: string): void {
    this.responses.set(keyword.toLowerCase(), response);
  }

  removeResponse(keyword: string): boolean {
    return this.responses.delete(keyword.toLowerCase());
  }

  getResponses(): Map<string, string> {
    return new Map(this.responses);
  }
}

// Default instance
export const messageHandler = new MessageHandler();

// Utility functions
export async function handleSlackMessage(context: MessageContext): Promise<HandleMessageResult> {
  return messageHandler.handleMessage(context);
}

export async function generateMessageResponse(messageText: string, context: MessageContext): Promise<MessageResponse> {
  return messageHandler["generateResponse"](messageText, context);
}

export function addCustomResponse(keyword: string, response: string): void {
  messageHandler.addResponse(keyword, response);
}

export async function getConversationHistory(
  userId: string
): Promise<Array<{ message: string; response: string; timestamp: Date }>> {
  return messageHandler.getConversationHistory(userId);
}

// Additional exports for webhook compatibility
export const handleMessage = handleSlackMessage;

export function isAgentThread(event: SlackEvent): boolean {
  // Check if the message is in a thread that the agent is participating in
  if (!event.thread_ts) return false;

  // In a real implementation, this would check if the agent has previously
  // responded in this thread or if it's assigned to handle it
  return true; // For now, assume all threads are agent threads
}

export async function handleAssistantThreadMessage(context: MessageContext): Promise<HandleMessageResult> {
  // Special handling for assistant threads
  // This could include different logic for ongoing conversations
  return messageHandler.handleMessage(context);
}
