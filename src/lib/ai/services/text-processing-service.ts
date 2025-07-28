import { createHash } from "crypto";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { GPT_4_1_MINI_MODEL, isWithinTokenLimit } from "@/lib/ai/core";

/**
 * Maximum number of tokens for text summarization
 */
export const SUMMARY_MAX_TOKENS = 7000;

/**
 * System prompt for text summarization
 */
export const SUMMARY_PROMPT =
  "Summarize the following text while preserving all key information and context. Keep the summary under 8000 tokens.";

/**
 * Options for text processing operations
 */
export interface TextProcessingOptions {
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

/**
 * Token counting result
 */
export interface TokenCountResult {
  tokenCount: number;
  withinLimit: boolean;
  limit: number;
}

/**
 * Checks if text is within token limit and summarizes if needed
 * @param text - The text to check and potentially summarize
 * @param options - Optional configuration for text processing
 * @returns The original text if within limits, or a summarized version
 */
export const checkTokenCountAndSummarizeIfNeeded = async (
  text: string,
  options?: TextProcessingOptions
): Promise<string> => {
  if (isWithinTokenLimit(text, false)) {
    return text;
  }

  const { text: summary } = await generateText({
    model: openai(options?.model || GPT_4_1_MINI_MODEL),
    system: options?.systemPrompt || SUMMARY_PROMPT,
    prompt: text,
    maxTokens: options?.maxTokens || SUMMARY_MAX_TOKENS,
  });

  return summary;
};

/**
 * Creates an MD5 hash of the given query string
 * @param query - The string to hash
 * @returns MD5 hash of the query
 */
export const hashQuery = (query: string): string => {
  return createHash("md5").update(query).digest("hex");
};

/**
 * Counts tokens in text with configurable limits
 * @param text - The text to count tokens for
 * @param isEmbedding - Whether to use embedding token limits
 * @returns Token count information
 */
export const getTokenCount = (text: string, isEmbedding = false): TokenCountResult => {
  const limit = isEmbedding ? 8191 : 128000;
  const withinLimit = isWithinTokenLimit(text, isEmbedding);

  // Since isWithinTokenLimit returns boolean, we need to estimate token count
  // This is a rough estimation - 1 token ≈ 4 characters
  const estimatedTokenCount = Math.ceil(text.length / 4);

  return {
    tokenCount: estimatedTokenCount,
    withinLimit,
    limit,
  };
};

/**
 * Truncates text to fit within token limit
 * @param text - The text to truncate
 * @param maxTokens - Maximum number of tokens allowed
 * @param isEmbedding - Whether to use embedding token limits
 * @returns Truncated text that fits within the token limit
 */
export const truncateToTokenLimit = (text: string, maxTokens?: number, isEmbedding = false): string => {
  const limit = maxTokens || (isEmbedding ? 8191 : 128000);

  // Start with full text and progressively truncate
  let truncatedText = text;
  let chunkSize = Math.floor(text.length * 0.1); // Remove 10% at a time

  while (!isWithinTokenLimit(truncatedText, isEmbedding) && truncatedText.length > 0) {
    truncatedText = truncatedText.slice(0, -chunkSize);
  }

  return truncatedText;
};
