/**
 * Typing Simulation Library
 *
 * Creates realistic typing behavior for AI responses including:
 * - Variable typing speeds (WPM)
 * - Natural pauses and jitter
 * - Partial message bubbles
 * - Real-time typing indicators
 */

import { HUMAN_AI_CONFIG } from "@/app/config/features";
import { supabase } from "@/lib/supabase";
import { generatePartialContent, shouldSendPartialMessage } from "./human-mode-helpers";

export interface TypingSimulationOptions {
  organizationId: string;
  conversationId: string;
  content: string;
  sendPartial?: boolean;
  customWPM?: number;
  customJitter?: number;
  skipTypingIndicator?: boolean;
  metadata?: Record<string, any>;
}

export interface TypingTimings {
  totalDelay: number;
  partialDelay: number;
  thinkingPause: number;
  typingSpeed: number; // WPM
  jitterFactor: number;
  characterDelay: number; // ms per character
}

export interface TypingSimulationResult {
  success: boolean;
  timings: TypingTimings;
  partialMessageSent: boolean;
  partialMessageId?: string;
  totalDuration: number;
  error?: string;
}

/**
 * Calculate realistic typing timings based on content
 */
export function calculateTypingTimings(content: string, options: Partial<TypingSimulationOptions> = {}): TypingTimings {
  const words = content.split(/\s+/).length;
  const characters = content.length;

  // Base typing speed with variation
  const baseWPM =
    options.customWPM ||
    HUMAN_AI_CONFIG.TYPING_WPM_MIN + Math.random() * (HUMAN_AI_CONFIG.TYPING_WPM_MAX - HUMAN_AI_CONFIG.TYPING_WPM_MIN);

  // Calculate base typing time
  const baseTypingTime = (words / baseWPM) * 60 * 1000; // Convert to milliseconds

  // Add thinking pause (proportional to complexity)
  const thinkingPause = Math.min(
    Math.max(words * 50, 500), // 50ms per word, min 500ms
    3000 // max 3 seconds thinking
  );

  // Add complexity delay
  const complexityDelay = Math.min(
    words * HUMAN_AI_CONFIG.COMPLEXITY_DELAY_FACTOR,
    5000 // max 5 seconds complexity delay
  );

  // Calculate jitter
  const jitterFactor = options.customJitter || HUMAN_AI_CONFIG.TYPING_JITTER_FACTOR;
  const jitter = baseTypingTime * jitterFactor * (Math.random() - 0.5);

  // Total delay calculation
  const totalDelay = Math.max(
    HUMAN_AI_CONFIG.MIN_RESPONSE_DELAY,
    Math.min(baseTypingTime + thinkingPause + complexityDelay + jitter, HUMAN_AI_CONFIG.MAX_RESPONSE_DELAY)
  );

  // Partial message timing (60% of total)
  const partialDelay = Math.round(totalDelay * 0.6);

  // Character delay for progressive typing
  const characterDelay = totalDelay / characters;

  return {
    totalDelay: Math.round(totalDelay),
    partialDelay,
    thinkingPause: Math.round(thinkingPause),
    typingSpeed: baseWPM,
    jitterFactor,
    characterDelay: Math.round(characterDelay),
  };
}

/**
 * Simulate realistic typing behavior with real-time updates
 */
export async function simulateTyping(options: TypingSimulationOptions): Promise<TypingSimulationResult> {
  const {
    organizationId,
    conversationId,
    content,
    sendPartial = true,
    skipTypingIndicator = false,
    metadata = {},
  } = options;

  const startTime = Date.now();
  let partialMessageSent = false;
  let partialMessageId: string | undefined;

  try {
    const supabaseClient = supabase.admin();
    const timings = calculateTypingTimings(content, options);

    // Step 1: Send typing indicator
    if (!skipTypingIndicator) {
      await sendTypingIndicator(organizationId, conversationId, "start");
    }

    // Step 2: Thinking pause
    if (timings.thinkingPause > 0) {
      await delay(timings.thinkingPause);
    }

    // Step 3: Send partial message if enabled and appropriate
    if (sendPartial && shouldSendPartialMessage(content)) {
      const partialContent = generatePartialContent(content);

      if (partialContent && partialContent.length > 10) {
        partialMessageId = await sendPartialMessage(supabase, organizationId, conversationId, partialContent, metadata);
        partialMessageSent = true;

        // Wait for remaining typing time
        const remainingDelay = timings.totalDelay - timings.partialDelay;
        if (remainingDelay > 0) {
          await delay(remainingDelay);
        }
      } else {
        // No partial message, wait full time
        await delay(timings.totalDelay - timings.thinkingPause);
      }
    } else {
      // No partial message, wait full typing time
      await delay(timings.totalDelay - timings.thinkingPause);
    }

    // Step 4: Stop typing indicator
    if (!skipTypingIndicator) {
      await sendTypingIndicator(organizationId, conversationId, "stop");
    }

    const totalDuration = Date.now() - startTime;

    const result: TypingSimulationResult = {
      success: true,
      timings,
      partialMessageSent,
      totalDuration,
    };

    if (partialMessageId !== undefined) {
      result.partialMessageId = partialMessageId;
    }

    return result;
  } catch (error) {
    // Cleanup: stop typing indicator
    try {
      if (!skipTypingIndicator) {
        await sendTypingIndicator(organizationId, conversationId, "stop");
      }
    } catch (cleanupError) {}

    return {
      success: false,
      timings: calculateTypingTimings(content, options),
      partialMessageSent,
      totalDuration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send typing indicator via real-time channel
 */
async function sendTypingIndicator(
  organizationId: string,
  conversationId: string,
  action: "start" | "stop"
): Promise<void> {
  try {
    const supabaseClient = supabase.admin();
    const channel = `${organizationId}:conversation:${conversationId}`;

    await supabase.channel(channel).send({
      type: "broadcast",
      event: "typing_indicator",
      payload: {
        action,
        senderType: "ai_assistant",
        senderName: "AI Assistant",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {}
}

/**
 * Send partial message to database and broadcast
 */
async function sendPartialMessage(
  supabase: unknown,
  organizationId: string,
  conversationId: string,
  content: string,
  metadata: Record<string, any>
): Promise<string> {
  try {
    // Insert partial message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        content,
        senderType: "ai_assistant",
        senderName: "AI Assistant",
        message_type: "text",
        content_type: "text",
        status: "sent",
        is_partial: true,
        metadata: {
          ...metadata,
          partial_message: true,
          typing_simulation: true,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert partial message: ${error.message}`);
    }

    // Broadcast partial message
    const channel = `${organizationId}:conversation:${conversationId}`;
    await supabase.channel(channel).send({
      type: "broadcast",
      event: "new_message",
      payload: {
        message,
        partial: true,
      },
    });

    return message.id;
  } catch (error) {
    throw error;
  }
}

/**
 * Update partial message with final content
 */
export async function updatePartialMessage(
  organizationId: string,
  conversationId: string,
  partialMessageId: string,
  finalContent: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; messageId: string; error?: string }> {
  try {
    const supabaseClient = supabase.admin();

    // Update the partial message to final content
    const { data: updatedMessage, error } = await supabase
      .from("messages")
      .update({
        content: finalContent,
        is_partial: false,
        metadata: {
          ...metadata,
          partial_message_updated: true,
          typing_simulation_complete: true,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("id", partialMessageId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update partial message: ${error.message}`);
    }

    // Broadcast the updated message
    const channel = `${organizationId}:conversation:${conversationId}`;
    await supabase.channel(channel).send({
      type: "broadcast",
      event: "message_updated",
      payload: {
        message: updatedMessage,
        partial: false,
        updated: true,
      },
    });

    return {
      success: true,
      messageId: updatedMessage.id,
    };
  } catch (error) {
    return {
      success: false,
      messageId: partialMessageId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Progressive typing simulation (character by character)
 */
export async function simulateProgressiveTyping(
  options: TypingSimulationOptions & {
    onProgress?: (progress: { content: string; percentage: number }) => void;
  }
): Promise<TypingSimulationResult> {
  const { content, onProgress } = options;
  const timings = calculateTypingTimings(content, options);
  const startTime = Date.now();

  try {
    // Send typing indicator
    if (!options.skipTypingIndicator) {
      await sendTypingIndicator(options.organizationId, options.conversationId, "start");
    }

    // Thinking pause
    await delay(timings.thinkingPause);

    // Progressive typing
    const words = content.split(" ");
    let currentContent = "";

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? " " : "") + words[i];

      // Call progress callback
      if (onProgress) {
        onProgress({
          content: currentContent,
          percentage: ((i + 1) / words.length) * 100,
        });
      }

      // Wait between words (with variation)
      const wordDelay = (timings.totalDelay - timings.thinkingPause) / words.length;
      const variation = wordDelay * 0.3 * (Math.random() - 0.5); // ±30% variation
      await delay(Math.max(50, wordDelay + variation)); // Minimum 50ms between words
    }

    // Stop typing indicator
    if (!options.skipTypingIndicator) {
      await sendTypingIndicator(options.organizationId, options.conversationId, "stop");
    }

    return {
      success: true,
      timings,
      partialMessageSent: false,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      timings,
      partialMessageSent: false,
      totalDuration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch typing simulation for multiple messages
 */
export async function simulateBatchTyping(
  messages: Array<{ content: string; delay?: number }>,
  baseOptions: Omit<TypingSimulationOptions, "content">
): Promise<TypingSimulationResult[]> {
  const results: TypingSimulationResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message) continue;

    // Add delay between messages if specified
    if (i > 0 && message.delay) {
      await delay(message.delay);
    }

    const result = await simulateTyping({
      ...baseOptions,
      content: message.content,
      // Only send partial for longer messages in batch
      sendPartial: message.content.length > 100,
    });

    results.push(result);

    // If simulation failed, stop the batch
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Development utilities for testing typing simulation
 */
export const TypingSimDevUtils = {
  /**
   * Test typing timing calculations
   */
  testTypingTimings() {
    if (process.env.NODE_ENV !== "development") return;

    const testMessages = [
      "Hi there!",
      "I understand your frustration with this issue. Let me help you resolve it step by step.",
      "To configure the API authentication, you'll need to first generate an API key from your dashboard, then add it to your request headers using the Authorization field. Here's a detailed example of how to do this properly.",
      "Thank you for contacting us! I'd be happy to help you with your account settings. What specifically would you like to update today?",
    ];

    testMessages.forEach((message, i) => {
      const timings = calculateTypingTimings(message);
    });
  },

  /**
   * Test typing simulation (dry run)
   */
  async testTypingSimulation() {
    if (process.env.NODE_ENV !== "development") return;

    const testOptions: TypingSimulationOptions = {
      organizationId: "test-org",
      conversationId: "test-conv",
      content: "This is a test message for typing simulation.",
      sendPartial: true,
      skipTypingIndicator: true, // Skip for testing
    };

    const startTime = Date.now();

    // Simulate without actual database/broadcast calls
    const timings = calculateTypingTimings(testOptions.content);
    await delay(timings.totalDelay);

    const duration = Date.now() - startTime;
  },
} as const;
