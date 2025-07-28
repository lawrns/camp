import { createHash, randomUUID } from "crypto";
import { fireworks } from "@ai-sdk/fireworks";
import { openai } from "@ai-sdk/openai";
import {
  appendClientMessage,
  convertToCoreMessages,
  createDataStreamResponse,
  DataStreamWriter,
  formatDataStreamPart,
  generateText,
  LanguageModelUsage,
  LanguageModelV1,
  streamText,
  type CoreMessage,
  type Message,
  type TextStreamPart,
  type Tool,
} from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ReadPageToolConfig } from "@/app/types";
import { db } from "@/db/client";
import { conversationMessages, conversations, files, MessageMetadata } from "@/db/schema";
import type { Tool as HelperTool } from "@/db/schema/tools";
import { inngest } from "@/inngest/client";
import { COMPLETION_MODEL, GPT_4_1_MINI_MODEL, GPT_4_1_MODEL, isWithinTokenLimit } from "@/lib/ai/core";
import { CHAT_SYSTEM_PROMPT, GUIDE_INSTRUCTIONS } from "@/lib/ai/prompts";
import { buildTools } from "@/lib/ai/tools";
import { Conversation, updateOriginalConversation } from "@/lib/data/conversation";
import { createConversationMessage, getMessagesOnly } from "@/lib/data/conversationMessage";
import { createAndUploadFile } from "@/lib/data/files";
import { type Mailbox } from "@/lib/data/mailbox";
import { getCachedSubscriptionStatus } from "@/lib/data/organization";
import type { AIStep, ExperimentalProviderMetadata, ToolCall } from "@/types/common";

// Simple fallback type for missing PlatformCustomer
type PlatformCustomer = {
  id: number;
  email: string;
  name?: string;
  isVip?: boolean;
};

// Simple fallback for redis
const redis = {
  get: async (key: string) => null,
  set: async (key: string, value: any, options?: unknown) => true,
};

// import { getPlatformCustomer, PlatformCustomer } from "@/lib/data/platformCustomer"; // Module not found
// import { fetchPromptRetrievalData } from "@/lib/data/retrieval"; // Module not found
// import { redis } from "@/lib/redis/client"; // Module not found
// import { createPresignedDownloadUrl } from "@/lib/s3/utils"; // Module not found

// Simple fallback for createPresignedDownloadUrl
const createPresignedDownloadUrl = async (url: string) => {
  return url; // Return the original URL as fallback
};

// import { trackAIUsageEvent } from "../data/aiUsageEvents"; // Module not found

// Simple fallback for trackAIUsageEvent
const trackAIUsageEvent = async (params: unknown) => {};
// import { captureExceptionAndLogIfDevelopment, captureExceptionAndThrowIfDevelopment } from "../shared/sentry"; // Module not found

// Simple fallbacks for sentry functions
const captureExceptionAndLogIfDevelopment = (error: any, extra?: unknown) => {};

const captureExceptionAndThrowIfDevelopment = (error: any, extra?: unknown) => {
  throw error;
};

// Simple fallback for fetchPromptRetrievalData
const fetchPromptRetrievalData = async (mailbox: any, query: string, metadata: unknown) => {
  return {
    knowledgeBank: null,
    websitePagesPrompt: null,
    websitePages: [],
  };
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

const SUMMARY_MAX_TOKENS = 7000;
const SUMMARY_PROMPT =
  "Summarize the following text while preserving all key information and context. Keep the summary under 8000 tokens.";
export const REASONING_MODEL = fireworks("accounts/fireworks/models/deepseek-r1");

function hideToolResults<TOOLS extends Record<string, Tool>>(): (options: {
  tools: TOOLS;
}) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> {
  return () => {
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        if (chunk.type !== "tool-result") {
          controller.enqueue(chunk);
        }
      },
    });
  };
}

export const checkTokenCountAndSummarizeIfNeeded = async (text: string): Promise<string> => {
  if (isWithinTokenLimit(text, false)) {
    return text;
  }

  const { text: summary } = await generateText({
    model: openai(GPT_4_1_MINI_MODEL),
    system: SUMMARY_PROMPT,
    prompt: text,
    maxTokens: SUMMARY_MAX_TOKENS,
  });

  return summary;
};

export const loadScreenshotAttachments = async (messages: (typeof conversationMessages.$inferSelect)[]) => {
  const attachments = await db.query.files.findMany({
    where: inArray(
      files.messageId,
      messages
        .filter((m: unknown) => (m.metadata as MessageMetadata)?.includesScreenshot)
        .map((m: typeof conversationMessages.$inferSelect) => m.id)
    ),
  });
  return await Promise.all(
    attachments.map(async (a: typeof files.$inferSelect) => {
      const url = await createPresignedDownloadUrl(a.url);
      return { messageId: a.messageId, name: a.name, contentType: a.mimetype, url };
    })
  );
};

export const loadPreviousMessages = async (conversationId: string, latestMessageId?: number): Promise<Message[]> => {
  const conversationMessages = await getMessagesOnly(conversationId);
  const attachments = await loadScreenshotAttachments(conversationMessages);

  return conversationMessages
    .filter((message: unknown) => message.body && message.id !== latestMessageId)
    .map((message: unknown) => {
      if (message.senderType === "system") {
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

      return {
        id: message.id.toString(),
        role: message.senderType === "agent" || (message as any).role === "ai_assistant" ? "assistant" : "user",
        content: message.body || "",
        experimental_attachments: attachments.filter(
          (a: { messageId: number | null; name: string; contentType: string; url: string }) =>
            a.messageId === message.id
        ),
      };
    });
};

export const buildPromptMessages = async (
  mailbox: Mailbox,
  email: string | null,
  query: string,
  guideEnabled = false
): Promise<{
  messages: CoreMessage[];
  sources: { url: string; pageTitle: string; markdown: string; similarity: number }[];
}> => {
  const { knowledgeBank, websitePagesPrompt, websitePages } = await fetchPromptRetrievalData(mailbox, query, null);

  const prompt = [
    CHAT_SYSTEM_PROMPT.replaceAll("MAILBOX_NAME", mailbox.name).replaceAll(
      "{{CURRENT_DATE}}",
      new Date().toISOString()
    ),
    guideEnabled ? GUIDE_INSTRUCTIONS : null,
  ].filter(Boolean);

  let systemPrompt = prompt.join("\n");
  if (knowledgeBank) {
    systemPrompt += `\n${knowledgeBank}`;
  }
  if (websitePagesPrompt) {
    systemPrompt += `\n${websitePagesPrompt}`;
  }
  systemPrompt += email ? `\nCurrent user email: ${email}` : "Anonymous user";

  return {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    sources: websitePages,
  };
};

const generateReasoning = async ({
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
}: {
  tools: Record<string, Tool>;
  systemMessages: CoreMessage[];
  coreMessages: CoreMessage[];
  reasoningModel: LanguageModelV1;
  email: string | null;
  conversationId: string;
  mailboxSlug: string;
  traceId?: string | null;
  evaluation?: boolean;
  dataStream?: DataStreamWriter;
}): Promise<{ reasoning: string | null; usage: LanguageModelUsage | null }> => {
  const toolsAvailable = Object.keys(tools).map((tool: unknown) => {
    const toolObj = tools[tool] as Tool & { description: string };
    const params = toolObj?.parameters.shape;
    const paramsString = Object.keys(params)
      .map((key: unknown) => `${key}: ${params[key].description}`)
      .join(", ");
    return `${tool}: ${toolObj?.description ?? ""} Params: ${paramsString}`;
  });

  const hasScreenshot = coreMessages.some(
    (m) => Array.isArray(m.content) && m.content.some((c: unknown) => c.type === "image")
  );
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

  if (hasScreenshot) {
    reasoningSystemMessages.push({
      role: "system",
      content:
        "Don't worry if there's no screenshot, as sometimes it's not sent due to lack of multimodal functionality. Just move on.",
    });
  }

  try {
    const startTime = Date.now();
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

    dataStream?.writeData({
      event: "reasoningStarted",
      data: {
        id: traceId || randomUUID(),
      },
    });

    let text = "";
    let finished = false;
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
    const thinkMatch = /<think>(.*?)<\/think>/s.exec(text);
    const reasoning = thinkMatch?.[1]?.trim() ?? null;

    dataStream?.writeMessageAnnotation({
      reasoning: { message: reasoning, reasoningTimeSeconds: Math.round((Date.now() - startTime) / 1000) },
    });

    return { reasoning, usage: await usage };
  } catch (error) {
    if (evaluation) {
      captureExceptionAndThrowIfDevelopment(error);
    } else {
      captureExceptionAndLogIfDevelopment(error);
    }
    return { reasoning: null, usage: null };
  }
};

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
}: {
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
}) => {
  const lastMessage = messages.findLast((m: Message) => m.role === "user");
  const query = lastMessage?.content || "";

  const coreMessages = convertToCoreMessages(messages, { tools: {} });
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
      evaluation,
      ...(dataStream && { dataStream }),
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
    ...(evaluation && { seed: 100 }),
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

export const createUserMessage = async (
  conversationId: string,
  email: string | null,
  query: string,
  screenshotData?: string
) => {
  // Get conversation to get the organization ID
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await createConversationMessage({
    organizationId: conversation.organizationId,
    conversationId,
    content: query,
    embeddingText: query,
    senderType: "customer",
    senderEmail: email,
    deliveryStatus: "delivered",
    source: "chat",
    sourceData: { includesScreenshot: !!screenshotData },
    isDeleted: false,
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
};

export const createAssistantMessage = async (
  conversationId: string,
  userMessageId: number,
  text: string,
  options?: {
    traceId?: string | null;
    reasoning?: string | null;
    sendEmail?: boolean;
  }
) => {
  // Get conversation to get the organization ID
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return createConversationMessage({
    organizationId: conversation.organizationId,
    conversationId,
    inReplyToId: userMessageId,
    deliveryStatus: options?.sendEmail ? "pending" : "delivered",
    content: text,
    embeddingText: text,
    senderType: "agent",
    source: "chat",
    sourceData: {
      trace_id: options?.traceId,
      reasoning: options?.reasoning,
    },
    isDeleted: false,
  });
};

export const lastAssistantMessage = (conversationId: string) =>
  db.query.conversationMessages.findFirst({
    where: and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.senderType, "agent")),
    orderBy: desc(conversationMessages.createdAt),
  });

export const lastUserMessage = (conversationId: string) =>
  db.query.conversationMessages.findFirst({
    where: and(
      eq(conversationMessages.conversationId, conversationId),
      eq(conversationMessages.senderType, "customer")
    ),
    orderBy: desc(conversationMessages.createdAt),
  });

export const respondWithAI = async ({
  conversation,
  mailbox,
  userEmail,
  sendEmail,
  message,
  messageId,
  readPageTool,
  guideEnabled,
  onResponse,
  reasoningEnabled = true,
}: {
  conversation: Conversation;
  mailbox: Mailbox;
  userEmail: string | null;
  sendEmail: boolean;
  message: Message;
  messageId: number;
  readPageTool: ReadPageToolConfig | null;
  guideEnabled: boolean;
  onResponse?: (result: {
    messages: Message[];
    platformCustomer: PlatformCustomer | null;
    isPromptConversation: boolean;
    isFirstMessage: boolean;
    humanSupportRequested: boolean;
  }) => void | Promise<void>;
  reasoningEnabled?: boolean;
}) => {
  const previousMessages = await loadPreviousMessages(conversation.id, messageId);
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  let platformCustomer: unknown = null;
  if (userEmail) platformCustomer = await getPlatformCustomer(mailbox.id, userEmail);

  const isPromptConversation = conversation.isPrompt;
  const isFirstMessage = messages.length === 1;

  const handleAssistantMessage = async (
    text: string,
    humanSupportRequested: boolean,
    traceId: string | null = null,
    reasoning: string | null = null
  ) => {
    if (!humanSupportRequested) {
      await updateOriginalConversation(conversation.id, { set: { assignedToAI: true } });
    }

    const assistantMessage = await createAssistantMessage(conversation.id, messageId, text, {
      traceId,
      reasoning,
      sendEmail,
    });
    onResponse?.({
      messages,
      platformCustomer,
      isPromptConversation,
      isFirstMessage,
      humanSupportRequested,
    });
    return assistantMessage;
  };

  if (!conversation.assignedToAI && (!isPromptConversation || !isFirstMessage)) {
    await updateOriginalConversation(conversation.id, { set: { status: "open" } });
    if (
      messages.length === 1 ||
      (isPromptConversation && messages.filter((message: unknown) => message.role === "user").length === 2)
    ) {
      const message = "Our support team will respond to your message shortly. Thank you for your patience.";
      const assistantMessage = await handleAssistantMessage(message, true);
      return createTextResponse(message, assistantMessage.id.toString());
    }
    onResponse?.({
      messages,
      platformCustomer,
      isPromptConversation,
      isFirstMessage,
      humanSupportRequested: true,
    });
    return createTextResponse("", Date.now().toString());
  }

  const cacheKey = `chat:v2:mailbox-${mailbox.id}:initial-response:${hashQuery(message.content)}`;
  if (isFirstMessage && isPromptConversation) {
    const cached: string | null = await redis.get(cacheKey);
    if (cached != null) {
      const assistantMessage = await handleAssistantMessage(cached, false);
      return createTextResponse(cached, assistantMessage.id.toString());
    }
  }

  if ((await getCachedSubscriptionStatus(mailbox.organizationId)) === "free_trial_expired") {
    return createTextResponse("Free trial expired. Please upgrade to continue using Campfire.", Date.now().toString());
  }

  return createDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    execute: async (dataStream: unknown) => {
      const result = await generateAIResponse({
        messages,
        mailbox,
        conversationId: conversation.id,
        email: userEmail,
        readPageTool,
        guideEnabled,
        addReasoning: reasoningEnabled,
        dataStream,
        async onFinish({ text, finishReason, steps, traceId, experimental_providerMetadata, sources }) {
          const hasSensitiveToolCall = steps.some((step: AIStep) =>
            step.toolCalls.some((toolCall: ToolCall) => toolCall.toolName.includes("fetch_user_information"))
          );

          const hasRequestHumanSupportCall = steps.some((step: AIStep) =>
            step.toolCalls.some((toolCall: ToolCall) => toolCall.toolName === "request_human_support")
          );

          // Check if confidence requires escalation
          const confidence = experimental_providerMetadata?.confidence;
          const confidenceBasedEscalation =
            (confidence as any)?.shouldEscalate || ((confidence as any)?.overall && (confidence as any).overall < 0.6);

          if (finishReason !== "stop" && finishReason !== "tool-calls") return;

          const reasoning = experimental_providerMetadata?.reasoning;
          const finalEscalation = hasRequestHumanSupportCall || confidenceBasedEscalation;

          const responseText = finalEscalation ? "_Escalated to a human! You will be contacted soon by email._" : text;
          const assistantMessage = await handleAssistantMessage(responseText, finalEscalation, traceId, reasoning);
          await inngest.send({
            name: "conversations/check-resolution",
            data: {
              conversationId: conversation.id,
              messageId: assistantMessage.id,
            },
          });

          // Extract sources from markdown links like [(1)](url)
          const markdownSources = Array.from(text.matchAll(/\[\((\d+)\)\]\((https?:\/\/[^\s)]+)\)/g)).map(
            (match: unknown) => {
              const [, id, url] = match;
              const existingSource = sources.find((source) => source.url === url);
              const title = existingSource ? existingSource.pageTitle : url;
              return { id, url, title };
            }
          );

          const uniqueMarkdownSources = Array.from(new Map(markdownSources.map((s: unknown) => [s.id, s])).values());

          uniqueMarkdownSources.sort((a, b) => {
            if (!a.id || !b.id) return 0;
            return parseInt(a.id) - parseInt(b.id);
          });

          for (const source of uniqueMarkdownSources) {
            dataStream.writeSource({
              sourceType: "url",
              id: source.id ?? "",
              url: source.url ?? "",
              title: source.title ?? "",
            });
          }

          dataStream.writeMessageAnnotation({
            id: assistantMessage.id.toString(),
            traceId,
          });

          if (finishReason === "stop" && isFirstMessage && !hasSensitiveToolCall && !hasRequestHumanSupportCall) {
            await redis.set(cacheKey, responseText, { ex: 60 * 60 * 24 });
          }
        },
      });

      // consume the stream to ensure it runs to completion & triggers onFinish
      // even when the client response is aborted
      result.consumeStream();

      result.mergeIntoDataStream(dataStream);
    },
    onError(error: unknown) {
      captureExceptionAndLogIfDevelopment(error);
      return "Error generating AI response";
    },
  });
};

const createTextResponse = (text: string, messageId: string) => {
  return createDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    execute: (dataStream: unknown) => {
      const textStream = new ReadableStream({
        start(controller) {
          controller.enqueue(formatDataStreamPart("text", text));
          controller.close();
        },
      });
      dataStream.merge(textStream);
      dataStream.writeMessageAnnotation({
        id: messageId,
      });
    },
  });
};

const hashQuery = (query: string): string => {
  return createHash("md5").update(query).digest("hex");
};
