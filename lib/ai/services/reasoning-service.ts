import { randomUUID } from "crypto";
import { fireworks } from "@ai-sdk/fireworks";
import { DataStreamWriter, LanguageModelUsage, LanguageModelV1, streamText, type CoreMessage, type Tool } from "ai";

/**
 * The language model used for reasoning generation.
 * Uses Fireworks' DeepSeek R1 model for advanced reasoning capabilities.
 */
export const REASONING_MODEL = fireworks("accounts/fireworks/models/deepseek-r1");

/**
 * Options for generating reasoning with AI.
 */
export interface GenerateReasoningOptions {
  /** Available tools for the AI to use */
  tools: Record<string, Tool>;
  /** System messages providing context */
  systemMessages: CoreMessage[];
  /** Core conversation messages */
  coreMessages: CoreMessage[];
  /** The language model to use for reasoning */
  reasoningModel: LanguageModelV1;
  /** User email for tracking */
  email: string | null;
  /** Conversation ID for context */
  conversationId: string;
  /** Mailbox slug identifier */
  mailboxSlug: string;
  /** Optional trace ID for debugging */
  traceId?: string | null;
  /** Whether this is for evaluation purposes */
  evaluation?: boolean;
  /** Optional data stream for real-time updates */
  dataStream?: DataStreamWriter;
}

/**
 * Result of reasoning generation.
 */
export interface ReasoningResult {
  /** The extracted reasoning text, or null if generation failed */
  reasoning: string | null;
  /** Token usage statistics, or null if generation failed */
  usage: LanguageModelUsage | null;
}

// Type alias for backward compatibility
export type GenerateReasoningParams = GenerateReasoningOptions;

// Simple fallback error handlers - these should be replaced with proper Sentry integration
const captureExceptionAndLogIfDevelopment = (error: unknown, extra?: unknown) => {
  // In production, this would send to Sentry
  if (process.env.NODE_ENV === "development") {
     
  }
};

const captureExceptionAndThrowIfDevelopment = (error: unknown, extra?: unknown) => {
  // In production, this would send to Sentry
  if (process.env.NODE_ENV === "development") {
     
  }
  throw error;
};

/**
 * Generates reasoning for AI responses by analyzing the conversation context
 * and available tools, then extracting structured thinking from the model's output.
 *
 * The reasoning is extracted from `<think>...</think>` tags in the model's response,
 * and progress is streamed to the client via the dataStream if provided.
 *
 * @param options - Configuration options for reasoning generation
 * @returns Promise containing the extracted reasoning and token usage
 *
 * @example
 * ```typescript
 * const { reasoning, usage } = await generateReasoning({
 *   tools: availableTools,
 *   systemMessages: systemContext,
 *   coreMessages: conversation,
 *   reasoningModel: REASONING_MODEL,
 *   email: user.email,
 *   conversationId: conv.id,
 *   mailboxSlug: mailbox.slug,
 *   dataStream: stream
 * });
 * ```
 */
export const generateReasoning = async ({
  tools,
  systemMessages,
  coreMessages,
  reasoningModel,
  email,
  conversationId,
  mailboxSlug,
  traceId = null,
  evaluation = false,
  dataStream,
}: GenerateReasoningOptions): Promise<ReasoningResult> => {
  // Prepare tool descriptions for the reasoning model
  const toolsAvailable = Object.keys(tools).map((tool: unknown) => {
    const toolObj = tools[tool] as Tool & { description: string };
    const params = toolObj.parameters.shape as Record<string, { description?: string }>;
    const paramsString = Object.keys(params)
      .map((key: unknown) => `${key}: ${params[key]?.description ?? "No description"}`)
      .join(", ");
    return `${tool}: ${toolObj.description} Params: ${paramsString}`;
  });

  // Check if screenshots are present in the conversation
  const hasScreenshot = coreMessages.some(
    (m) => Array.isArray(m.content) && m.content.some((c: unknown) => c.type === "image")
  );

  // Filter out image content from messages for reasoning (text-only)
  coreMessages = coreMessages.map((message: unknown) =>
    message.role === "user"
      ? {
          ...message,
          content: Array.isArray(message.content)
            ? message.content.filter((c: unknown) => c.type === "text")
            : message.content,
        }
      : message
  );

  // Build reasoning-specific system messages
  const reasoningSystemMessages: CoreMessage[] = [
    {
      role: "system",
      content: `The following tools are available:\n${toolsAvailable.join("\n")}`,
    },
    {
      role: "system",
      content: `Think about how you can give the best answer to the user's question.`,
    },
  ];

  // Add screenshot-specific instruction if needed
  if (hasScreenshot) {
    reasoningSystemMessages.push({
      role: "system",
      content:
        "Don't worry if there's no screenshot, as sometimes it's not sent due to lack of multimodal functionality. Just move on.",
    });
  }

  try {
    const startTime = Date.now();

    // Stream reasoning generation
    const { textStream, usage } = streamText({
      model: reasoningModel,
      messages: [...systemMessages, ...reasoningSystemMessages, ...coreMessages],
      temperature: 0.6,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(evaluation ? 50000 : 30000),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "reasoning",
        metadata: {
          sessionId: conversationId,
          userId: email ?? "anonymous",
          email: email ?? "anonymous",
          mailboxSlug,
        },
      },
    });

    // Notify stream of reasoning start
    dataStream?.writeData({
      event: "reasoningStarted",
      data: {
        id: traceId || randomUUID(),
      },
    });

    let text = "";
    let finished = false;

    // Process the text stream
    for await (const textPart of textStream) {
      text += textPart;
      if (textPart === "</think>") {
        finished = true;
        dataStream?.writeData({
          event: "reasoningFinished",
          data: {
            id: traceId || randomUUID(),
          },
        });
      } else if (!textPart.includes("<think>") && !finished) {
        dataStream?.writeData({ reasoning: textPart });
      }
    }

    // Extract reasoning from <think> tags
    const thinkMatch = /<think>(.*?)<\/think>/su.exec(text);
    const reasoning = thinkMatch?.[1]?.trim() ?? null;

    // Write reasoning annotation with timing
    dataStream?.writeMessageAnnotation({
      reasoning: { message: reasoning, reasoningTimeSeconds: Math.round((Date.now() - startTime) / 1000) },
    });

    return { reasoning, usage: await usage };
  } catch (error) {
    // Handle errors based on evaluation mode
    if (evaluation) {
      captureExceptionAndThrowIfDevelopment(error);
    } else {
      captureExceptionAndLogIfDevelopment(error);
    }
    return { reasoning: null, usage: null };
  }
};
