import { createHash } from "crypto";
import { openai } from "@ai-sdk/openai";
import { APICallError, CoreMessage, CoreTool, embed, generateObject, generateText } from "ai";
import { isWithinTokenLimit as isWithinTokenLimitForCompletion } from "gpt-tokenizer/model/gpt-4o";
import { isWithinTokenLimit as isWithinTokenLimitForEmbeddings } from "gpt-tokenizer/model/text-embedding-3-small";
import { z } from "zod";
import { redis } from "@/lib/redis/client";
import { assertDefined } from "@/lib/utils/assert";
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

export const GPT_4O_MODEL = "gpt-4o";
export const GPT_4_1_MODEL = "gpt-4.1";
export const GPT_4O_MINI_MODEL = "gpt-4o-mini";
export const GPT_4_1_MINI_MODEL = "gpt-4.1-mini";

export type AvailableModel =
  | typeof GPT_4O_MINI_MODEL
  | typeof GPT_4O_MODEL
  | typeof GPT_4_1_MINI_MODEL
  | typeof GPT_4_1_MODEL;

const EMBEDDING_MODEL = "text-embedding-3-small";
export const COMPLETION_MODEL = GPT_4_1_MODEL;

export const generateEmbedding = async (
  value: string,
  functionId?: string,
  options: { skipCache: boolean } = { skipCache: false }
): Promise<number[]> => {
  const { skipCache } = options;
  const input = value.replaceAll("\n", " ");

  const inputHash = createHash("md5").update(input).digest("hex");
  const cacheKey = `embedding:${inputHash}`;

  if (!skipCache) {
    const cachedEmbedding = await redis.get<number[]>(cacheKey);
    if (cachedEmbedding) {
      return cachedEmbedding;
    }
  }

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: input,
    experimental_telemetry: {
      isEnabled: true,
      functionId: functionId ?? "generate-embedding",
    },
  });

  // Cache the result (expires in 30 days)
  if (!skipCache) {
    await redis.set(cacheKey, JSON.stringify(embedding), { ex: 60 * 60 * 24 * 30 });
  }

  return embedding;
};

export const generateCompletion = ({
  model = COMPLETION_MODEL,
  temperature = 0.1,
  shortenPromptBy,
  system,
  prompt,
  messages,
  ...options
}: {
  system?: string;
  model?: AvailableModel;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  tools?: Record<string, CoreTool>;
  functionId?: string;
  metadata?: Record<string, string | number | boolean>;
  shortenPromptBy?: ShortenPromptOptions;
} & ({ prompt: string; messages?: never } | { messages: CoreMessage[]; prompt?: never })) =>
  retryOnPromptLengthError(
    shortenPromptBy,
    {
      ...(system !== undefined && { system }),
      ...(prompt !== undefined && { prompt }),
      ...(messages !== undefined && { messages }),
    },
    (prompt) =>
      generateText({
        model: openai(model),
        temperature,
        ...options,
        ...prompt,
        experimental_telemetry: {
          isEnabled: true,
          functionId: options.functionId ?? "generate-completion",
          ...(options.metadata ? { metadata: options.metadata } : {}),
        },
      })
  );

export const generateStructuredObject = <T>({
  model = COMPLETION_MODEL,
  temperature = 0.1,
  system,
  prompt,
  messages,
  ...options
}: {
  model?: AvailableModel;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  functionId?: string;
  metadata?: Record<string, string>;
  schema: z.ZodType<T>;
  shortenPromptBy?: ShortenPromptOptions;
} & ({ prompt: string; messages?: never } | { messages: CoreMessage[]; prompt?: never })) =>
  retryOnPromptLengthError(
    options.shortenPromptBy,
    {
      ...(system !== undefined && { system }),
      ...(prompt !== undefined && { prompt }),
      ...(messages !== undefined && { messages }),
    },
    (prompt) =>
      generateObject<T>({
        model: openai(model),
        temperature,
        ...options,
        ...prompt,
        experimental_telemetry: {
          isEnabled: true,
          functionId: options.functionId ?? "generate-structured-object",
          ...(options.metadata ? { metadata: options.metadata } : {}),
        },
      })
  );

export type ShortenPromptOptions = {
  removeSystem?: (string | null | undefined)[];
  truncateMessages?: boolean;
};

const retryOnPromptLengthError = async <Result>(
  shortenPromptBy: ShortenPromptOptions | undefined,
  options: Parameters<typeof shortenPrompt>[0],
  generate: (options: Parameters<typeof shortenPrompt>[0]) => Promise<Result>
) => {
  const maxRetries = 3;
  for (let retries = 0; ; retries++) {
    try {
      return await generate(options);
    } catch (error) {
      if (!shortenPromptBy || !APICallError.isInstance(error) || retries >= maxRetries) throw error;
      const [_, actual, maximum] = /prompt is too long: (\d+) tokens > (\d+) maximum/.exec(error.message) ?? [];
      if (actual && maximum)
        options = {
          ...shortenPrompt(options, parseInt(maximum, 10) / parseInt(actual, 10), shortenPromptBy),
        };
      else throw error;
    }
  }
};

const shortenPrompt = (
  { system, prompt, messages }: { system?: string; prompt?: string; messages?: CoreMessage[] },
  ratio: number,
  shortenPromptBy: ShortenPromptOptions
) => {
  const maxIterations = 10;
  const originalLength = characterLength({
    ...(system !== undefined && { system }),
    ...(prompt !== undefined && { prompt }),
    ...(messages !== undefined && { messages }),
  });
  const targetLength = Math.floor(originalLength * ratio * 0.9); // Reduce by an extra 10% to be safe
  const shortenSystemBy = [...(shortenPromptBy?.removeSystem ?? [])];

  const result = { system, prompt, messages };
  for (let i = 0; i < maxIterations; i++) {
    if (result.messages && shortenPromptBy?.truncateMessages) {
      const longestMessageIndex = result.messages.reduce(
        (maxIndex, message, index, arr) =>
          typeof message.content === "string" && message.content.length > assertDefined(arr[maxIndex]).content.length
            ? index
            : maxIndex,
        0
      );
      result.messages = result.messages.map((message, index) =>
        index === longestMessageIndex && typeof message.content === "string"
          ? ({ ...message, content: message.content.slice(0, Math.floor(message.content.length / 2)) } as CoreMessage)
          : message
      );
    } else if (result.prompt && shortenPromptBy?.truncateMessages) {
      result.prompt = result.prompt.slice(0, result.prompt.length / 2);
    }
    if (
      characterLength({
        ...(result.system !== undefined && { system: result.system }),
        ...(result.prompt !== undefined && { prompt: result.prompt }),
        ...(result.messages !== undefined && { messages: result.messages }),
      }) <= targetLength
    )
      break;
    if (shortenSystemBy.length > 0) {
      result.system = result.system?.replace(shortenSystemBy.shift() ?? "", "");
    }
    if (
      characterLength({
        ...(result.system !== undefined && { system: result.system }),
        ...(result.prompt !== undefined && { prompt: result.prompt }),
        ...(result.messages !== undefined && { messages: result.messages }),
      }) <= targetLength
    )
      break;
  }

  return {
    ...(result.system !== undefined && { system: result.system }),
    ...(result.prompt !== undefined && { prompt: result.prompt }),
    ...(result.messages !== undefined && { messages: result.messages }),
  };
};

const characterLength = ({
  system,
  prompt,
  messages,
}: {
  system?: string;
  prompt?: string;
  messages?: CoreMessage[];
}) => {
  return (
    (system?.length ?? 0) +
    (prompt?.length ?? 0) +
    (messages?.reduce((total: unknown, message: unknown) => total + message.content.length, 0) ?? 0)
  );
};

export const isWithinTokenLimit = (text: string, isEmbedding = false): boolean => {
  const maxTokens = isEmbedding ? 8191 : 128000;
  // Check if text is within the token limit
  // returns false if the limit is exceeded, otherwise returns the actual number of tokens (truthy value)
  const isWithinTokenLimit = isEmbedding
    ? isWithinTokenLimitForEmbeddings(text, maxTokens)
    : isWithinTokenLimitForCompletion(text, maxTokens);

  return isWithinTokenLimit !== false;
};

export const cleanUpTextForAI = (text: string | null) => {
  if (!text) return "";
  const withoutBase64 = text.replace(/data:image\/[^;]+;base64,[^\s"']+/g, "[IMAGE]");
  const withSingleLineBreaks = withoutBase64.replace(/\n{2,}/g, "\n");
  return withSingleLineBreaks.replace(/\s+/g, " ").trim();
};

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIResponse {
  content: string;
  confidence: number;
  shouldHandoff: boolean;
  reasoning?: string;
}

export interface ConversationContext {
  conversationId: string;
  customerId: string;
  organizationId: string;
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  customerProfile?: {
    name: string;
    email: string;
    tier: string;
    previousIssues: string[];
  };
  knowledgeBase?: string[];
}

export async function generateAIResponse(
  query: string,
  context?: ConversationContext,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(context);
    const messages = buildMessageHistory(query, context);

    if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }))
      });
      
      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI response generation failed:', error);
    return 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact a human agent.';
  }
}

export async function analyzeQuery(
  query: string,
  context?: ConversationContext
): Promise<AIResponse> {
  try {
    const analysisPrompt = `
Analyze this customer query and provide a JSON response with:
- content: Your response to the customer
- confidence: Number 0-1 indicating confidence in your response
- shouldHandoff: Boolean indicating if human agent is needed
- reasoning: Brief explanation of your decision

Query: "${query}"
Context: ${JSON.stringify(context, null, 2)}

Respond only with valid JSON.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content) as AIResponse;
  } catch (error) {
    console.error('Query analysis failed:', error);
    return {
      content: 'I\'ll help you with that. Let me connect you with a human agent for the best assistance.',
      confidence: 0.1,
      shouldHandoff: true,
      reasoning: 'Analysis failed, defaulting to human handoff'
    };
  }
}

function buildSystemPrompt(context?: ConversationContext): string {
  let prompt = `You are Campfire AI, a helpful customer support assistant. You provide accurate, empathetic, and efficient support.

Guidelines:
- Be concise but thorough
- Show empathy for customer concerns
- Provide step-by-step solutions when applicable
- If you're unsure, recommend human agent assistance
- Always maintain a professional, friendly tone`;

  if (context?.customerProfile) {
    prompt += `\n\nCustomer Profile:
- Name: ${context.customerProfile.name}
- Tier: ${context.customerProfile.tier}
- Previous Issues: ${context.customerProfile.previousIssues.join(', ')}`;
  }

  if (context?.knowledgeBase?.length) {
    prompt += `\n\nRelevant Knowledge Base Articles:\n${context.knowledgeBase.join('\n')}`;
  }

  return prompt;
}

function buildMessageHistory(
  currentQuery: string,
  context?: ConversationContext
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (context?.previousMessages) {
    // Include last 5 messages for context
    const recentMessages = context.previousMessages.slice(-5);
    messages.push(...recentMessages);
  }

  messages.push({ role: 'user', content: currentQuery });
  return messages;
}

export async function generateEmbeddingFromOpenAI(text: string): Promise<number[]> {
  try {
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw error;
  }
}

export async function searchKnowledgeBase(
  query: string,
  organizationId: string,
  limit: number = 5
): Promise<string[]> {
  try {
    const embedding = await generateEmbeddingFromOpenAI(query);
    
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('content, title')
      .eq('organization_id', organizationId)
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (error) throw error;

    return data?.map(article => `${article.title}: ${article.content}`) || [];
  } catch (error) {
    console.error('Knowledge base search failed:', error);
    return [];
  }
}
