/**
 * OpenAI client infrastructure
 */

import { OpenAI } from "openai";

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  functions?: any[];
  functionCall?: any;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string | string[];
}

export class OpenAIClient {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || "gpt-4",
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false,
        functions: options.functions,
        function_call: options.functionCall,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0,
        stop: options.stop,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async createStreamingChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || "gpt-4",
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
        functions: options.functions,
        function_call: options.functionCall,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0,
        stop: options.stop,
      });

      return stream;
    } catch (error) {
      throw error;
    }
  }

  async createEmbedding(text: string, model: string = "text-embedding-ada-002"): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw error;
    }
  }

  async createBatchEmbeddings(texts: string[], model: string = "text-embedding-ada-002"): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: model,
        input: texts,
      });

      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      throw error;
    }
  }

  async moderateContent(text: string): Promise<OpenAI.Moderations.ModerationCreateResponse> {
    try {
      const response = await this.client.moderations.create({
        input: text,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to count tokens (approximate)
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Helper method to truncate text to fit token limit
  truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    const ratio = maxTokens / estimatedTokens;
    const truncatedLength = Math.floor(text.length * ratio);
    return text.substring(0, truncatedLength) + "...";
  }

  // Get model information
  async getModels(): Promise<OpenAI.Models.Model[]> {
    try {
      const response = await this.client.models.list();
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get current usage (if available)
  async getUsage(): Promise<any> {
    try {
      // This would require the OpenAI API to support usage endpoints
      // For now, return a placeholder
      return { usage: "not_available" };
    } catch (error) {
      throw error;
    }
  }
}

// Default client instance
const clientConfig: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  timeout: 30000,
  maxRetries: 3,
};

if (process.env.OPENAI_ORGANIZATION) {
  clientConfig.organization = process.env.OPENAI_ORGANIZATION;
}

export const openaiClient = new OpenAIClient(clientConfig);

// Helper functions
export async function createChatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return openaiClient.createChatCompletion(messages, options);
}

export async function createStreamingChatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  return openaiClient.createStreamingChatCompletion(messages, options);
}

export async function createEmbedding(text: string, model?: string): Promise<number[]> {
  return openaiClient.createEmbedding(text, model);
}

export async function createBatchEmbeddings(texts: string[], model?: string): Promise<number[][]> {
  return openaiClient.createBatchEmbeddings(texts, model);
}

export async function moderateContent(text: string): Promise<OpenAI.Moderations.ModerationCreateResponse> {
  return openaiClient.moderateContent(text);
}
