/**
 * Embeddings - Helper2 Approach
 * Simple exported functions instead of complex service classes
 */

import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase/consolidated-exports";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingOptions {
  model?: "text-embedding-3-small" | "text-embedding-3-large" | "text-embedding-ada-002";
  organizationId?: string;
  useCache?: boolean;
}

// HELPER2 APPROACH: Simple exported functions instead of complex service classes
export async function generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
  const { model = "text-embedding-3-small", organizationId, useCache = true } = options;

  // Simple cache check
  if (useCache && organizationId) {
    const cached = await getCachedEmbedding(text, organizationId);
    if (cached) return cached;
  }

  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error("Failed to generate embedding: No embedding data received");
    }

    // Simple cache storage
    if (useCache && organizationId) {
      await cacheEmbedding(text, embedding, organizationId);
    }

    return embedding;
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateBatchEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<number[][]> {
  const { model = "text-embedding-3-small" } = options;

  try {
    const response = await openai.embeddings.create({
      model,
      input: texts,
    });

    return response.data.map((item: unknown) => item.embedding);
  } catch (error) {
    throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateConversationEmbedding(
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
  organizationId: string
): Promise<number[]> {
  const conversationText = messages
    .slice(-5) // Last 5 messages for context
    .map((msg: unknown) => `${msg.role}: ${msg.content}`)
    .join("\n");

  return generateEmbedding(conversationText, { organizationId });
}

export async function generateDocumentEmbedding(content: string, organizationId: string): Promise<number[]> {
  // Chunk large documents
  const chunks = chunkText(content, 8000); // ~8k chars per chunk

  if (chunks.length === 1) {
    return generateEmbedding(chunks[0]!, { organizationId });
  }

  // For multiple chunks, generate embeddings and average them
  const embeddings = await generateBatchEmbeddings(chunks, { organizationId });
  return averageEmbeddings(embeddings);
}

// Helper functions
function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxChars * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks;
}

function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return embeddings[0] || [];

  const dimension = embeddings[0]?.length || 0;
  const averaged = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      averaged[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    averaged[i] /= embeddings.length;
  }

  return averaged;
}

// Simple caching functions
async function getCachedEmbedding(text: string, organizationId: string): Promise<number[] | null> {
  const supabaseClient = supabase.admin();
  const textHash = hashText(text);

  const { data, error } = await supabase
    .from("embedding_cache")
    .select("embedding")
    .eq("text_hash", textHash)
    .eq("organization_id", organizationId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days
    .single();

  if (error || !data) return null;
  return data.embedding;
}

async function cacheEmbedding(text: string, embedding: number[], organizationId: string): Promise<void> {
  const supabaseClient = supabase.admin();
  const textHash = hashText(text);

  await supabase.from("embedding_cache").upsert({
    text_hash: textHash,
    organization_id: organizationId,
    embedding,
    created_at: new Date().toISOString(),
  });
}

function hashText(text: string): string {
  // Simple hash function for caching
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Vector similarity functions
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] || 0) * (b[i] || 0);
    normA += (a[i] || 0) * (a[i] || 0);
    normB += (b[i] || 0) * (b[i] || 0);
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findSimilarEmbeddings(
  queryEmbedding: number[],
  embeddings: Array<{ id: string; embedding: number[]; metadata?: unknown }>,
  threshold: number = 0.7,
  limit: number = 10
): Array<{ id: string; similarity: number; metadata?: unknown }> {
  const similarities = embeddings.map((item: unknown) => ({
    id: item.id,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
    metadata: item.metadata,
  }));

  return similarities
    .filter((item: unknown) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
