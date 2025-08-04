import { randomUUID } from "crypto";
import { fireworks } from "@ai-sdk/fireworks";
import { openai } from "@ai-sdk/openai";
import {
  convertToCoreMessages,
  DataStreamWriter,
  LanguageModelUsage,
  LanguageModelV1,
  streamText,
  type CoreMessage,
  type Message,
  type TextStreamPart,
  type Tool,
} from "ai";
import { z } from "zod";
import { ReadPageToolConfig } from "@/app/types";
import { COMPLETION_MODEL, GPT_4_1_MODEL } from "@/lib/ai/core";
import { hideToolResults } from "@/lib/ai/services/stream-service";
import { buildTools } from "@/lib/ai/tools";
import { type Mailbox } from "@/lib/data/mailbox";
import type { AIStep, ExperimentalProviderMetadata } from "@/types/common";
// Import reasoning functionality
import { generateReasoning, GenerateReasoningOptions, REASONING_MODEL, ReasoningResult } from "./reasoning-service";

// Interfaces
export interface GenerateAIResponseParams {
  messages: Message[];
  mailbox: Mailbox;
  conversationId: string;
  email: string | null;
  readPageTool?: ReadPageToolConfig | null;
  guideEnabled: boolean;
  onFinish?: (params: {
    text: string;
    finishReason: string;
    experimental_providerMetadata: ExperimentalProviderMetadata;
    steps: AIStep[];
    traceId: string;
    sources: { url: string; pageTitle: string }[];
  }) => Promise<void>;
  model?: LanguageModelV1;
  addReasoning?: boolean;
  reasoningModel?: LanguageModelV1;
  seed?: number | undefined;
  evaluation?: boolean;
  dataStream?: DataStreamWriter;
}

export interface ConfidenceResult {
  breakdown: {
    overall: number;
    shouldEscalate?: boolean;
    [key: string]: unknown;
  };
  escalationTriggered: boolean;
  shouldShowToUser: boolean;
}

// Error handling utilities
const captureExceptionAndLogIfDevelopment = (error: unknown, extra?: unknown) => {};

const captureExceptionAndThrowIfDevelopment = (error: unknown, extra?: unknown) => {
  throw error;
};

// Simple fallback for trackAIUsageEvent
const trackAIUsageEvent = async (params: unknown) => {};

// Simple fallback for aiConfidenceService
const aiConfidenceService = {
  analyzeResponseConfidence: async (
    query: string,
    response: string,
    conversationId: string,
    organizationId: string,
    sources: string[]
  ): Promise<ConfidenceResult> => {
    // Mock implementation for confidence analysis
    return {
      breakdown: {
        overall: 0.85,
        shouldEscalate: false,
        queryComplexity: 0.5,
        responseQuality: 0.9,
        sourcesRelevance: 0.8,
      },
      escalationTriggered: false,
      shouldShowToUser: true,
    };
  },
};

/**
 * Generate AI response with streaming, tool execution, and confidence scoring
 */
export const generateAIResponse = async ({
  messages,
  mailbox,
  conversationId,
  email,
  readPageTool = null,
  onFinish,
  dataStream,
  model = openai(COMPLETION_MODEL),
  addReasoning = false,
  reasoningModel = REASONING_MODEL,
  evaluation = false,
  guideEnabled = false,
}: GenerateAIResponseParams) => {
  const lastMessage = messages.findLast((m: Message) => m.role === "user");
  const query = lastMessage?.content || "";

  const coreMessages = convertToCoreMessages(messages, { tools: {} });
  // Import buildPromptMessages from parent module to avoid circular dependency
  const { buildPromptMessages } = await import("@/lib/ai/chat");
  const { messages: systemMessages, sources } = await buildPromptMessages(mailbox, email, query, guideEnabled);

  const tools = await buildTools(conversationId, email, mailbox, true, guideEnabled);
  if (readPageTool) {
    tools[readPageTool.toolName] = {
      description: readPageTool.toolDescription,
      parameters: z.object({}),
    };
  }

  const traceId = randomUUID();
  const finalMessages = [...systemMessages, ...coreMessages];

  let reasoning: string | null = null;
  if (addReasoning) {
    const { reasoning: reasoningText, usage } = await generateReasoning({
      tools,
      systemMessages,
      coreMessages,
      reasoningModel,
      email,
      conversationId,
      mailboxSlug: mailbox.slug,
      traceId,
      ...(evaluation !== undefined && { evaluation }),
      ...(dataStream !== undefined && { dataStream }),
    });

    if (!evaluation) {
      await trackAIUsageEvent({
        mailbox,
        model: "fireworks/deepseek-r1",
        queryType: "reasoning",
        usage: {
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
          cachedTokens: 0,
        },
      });
    }

    if (reasoningText) {
      reasoning = reasoningText;
      finalMessages.push({
        role: "system",
        content: `Reasoning: ${reasoning}`,
      });
    }
  }

  return streamText({
    model,
    messages: finalMessages,
    maxSteps: 4,
    tools,
    temperature: 0.1,
    ...(evaluation ? { seed: 100 } : {}),
    experimental_transform: hideToolResults(),
    experimental_providerMetadata: {
      openai: {
        store: true,
        metadata: {
          conversationId: conversationId.toString(),
          mailboxSlug: mailbox.slug,
          email: email ?? "anonymous",
          usingReasoning: addReasoning.toString(),
        },
      },
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "chat-completion",
      metadata: {
        sessionId: conversationId,
        userId: email ?? "anonymous",
        email: email ?? "anonymous",
        mailboxSlug: mailbox.slug,
        usingReasoning: addReasoning,
      },
    },
    async onFinish({ text, finishReason, experimental_providerMetadata, steps, usage }: unknown) {
      const metadata = experimental_providerMetadata?.openai;
      const openAIUsage = {
        ...usage,
        cachedTokens: metadata?.cachedPromptTokens ?? 0,
      };

      // Calculate confidence score for the response
      let confidenceResult;
      try {
        const query = messages.findLast((m: Message) => m.role === "user")?.content || "";
        confidenceResult = await aiConfidenceService.analyzeResponseConfidence(
          query,
          text,
          conversationId.toString(),
          mailbox.organizationId || "unknown",
          sources.map((s: unknown) => s.url)
        );

        // Add confidence data to the stream
        dataStream?.writeData({
          confidence: {
            score: confidenceResult.breakdown.overall,
            shouldEscalate: confidenceResult.escalationTriggered,
            breakdown: confidenceResult.breakdown,
            shouldShowToUser: confidenceResult.shouldShowToUser,
          },
        });
      } catch (error) {
        confidenceResult = {
          breakdown: { overall: 0.75, shouldEscalate: false },
          escalationTriggered: false,
          shouldShowToUser: false,
        };
      }

      if (!evaluation) {
        await trackAIUsageEvent({
          mailbox,
          model: GPT_4_1_MODEL,
          queryType: "chat_completion",
          usage: openAIUsage,
        });
      }
      if (onFinish) {
        await onFinish({
          text,
          finishReason,
          experimental_providerMetadata: {
            ...experimental_providerMetadata,
            reasoning,
            confidence: confidenceResult?.breakdown,
          },
          steps,
          traceId,
          sources: sources.map((source: unknown) => ({ url: source.url, pageTitle: source.pageTitle })),
        });
      }
    },
  });
};
