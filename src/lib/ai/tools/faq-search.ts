/**
 * FAQ Search Tool - Helper2 Style
 *
 * Searches the knowledge base using vector similarity
 * Integrates with existing vector-store package
 */

import { z } from "zod";
import { openai } from "@/lib/ai/openai";
import { supabase } from "@/lib/supabase";

// Cache for embeddings (simple in-memory cache)
const embeddingCache = new Map<string, number[]>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const cacheTimestamps = new Map<string, number>();

// Input validation
const faqSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  organizationId: z.string(),
  limit: z.number().min(1).max(10).default(5),
  threshold: z.number().min(0).max(1).default(0.7),
  includeMetadata: z.boolean().default(true),
  sources: z.array(z.string()).optional(), // Filter by specific sources
});

// Types
export interface FAQSearchParams {
  query: string;
  organizationId: string;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  sources?: string[];
}

export interface FAQSearchResult {
  success: boolean;
  data?: {
    results: {
      id: string;
      content: string;
      title?: string;
      source: string;
      relevance: number;
      metadata?: Record<string, any>;
      sourceId?: string;
      chunkIndex?: number;
    }[];
    totalFound: number;
    searchTime: number;
    cached: boolean;
  };
  error?: string;
  confidence: number;
}

// Get Supabase client
const getSupabaseClient = () => {
  return supabase.admin();
};

/**
 * Search FAQ/Knowledge base
 */
/**
 * Generate embedding with caching
 */
async function generateEmbeddingWithCache(query: string): Promise<number[] | null> {
  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();

  // Check cache
  if (embeddingCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (timestamp && now - timestamp < CACHE_TTL) {
      return embeddingCache.get(cacheKey) || null;
    }
    // Remove expired cache entry
    embeddingCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }

  try {
    // Generate new embedding using OpenAI
    const openaiClient = openai();
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      return null;
    }

    // Cache the result
    embeddingCache.set(cacheKey, embedding);
    cacheTimestamps.set(cacheKey, now);

    return embedding;
  } catch (error) {

    return null;
  }
}

export async function searchFAQ(params: FAQSearchParams): Promise<FAQSearchResult> {
  const startTime = Date.now();
  let cached = false;

  try {
    // Validate input
    const validated = faqSearchSchema.parse(params);

    // Generate embedding for the query with caching
    const embedding = await generateEmbeddingWithCache(validated.query);
    if (!embedding) {
      return {
        success: false,
        error: "Failed to generate query embedding",
        confidence: 0,
      };
    }

    // Check if this was a cache hit
    cached = embeddingCache.has(validated.query.toLowerCase().trim());

    const supabaseClient = getSupabaseClient();

    // Search knowledge chunks using the enhanced vector similarity function
    const { data: chunks, error } = await supabaseClient.rpc("search_knowledge_chunks", {
      query_embedding: embedding,
      org_id: validated.organizationId,
      limit_count: validated.limit,
      similarity_threshold: validated.threshold,
    });

    if (error) {
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        confidence: 0,
      };
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      const searchTime = Date.now() - startTime;
      return {
        success: true,
        data: {
          results: [],
          totalFound: 0,
          searchTime,
          cached,
        },
        confidence: 0.8, // High confidence that there are no results
      };
    }

    // Filter by sources if specified
    let filteredChunks = chunks;
    if (validated.sources && validated.sources.length > 0) {
      filteredChunks = chunks.filter((chunk: unknown) =>
        validated.sources!.includes(chunk.source_type || chunk.source || "knowledge_base")
      );
    }

    // Enhanced result formatting with ranking
    const results = filteredChunks
      .map((chunk: unknown) => ({
        id: chunk.id,
        content: chunk.content,
        title: chunk.document_title || chunk.title || extractTitle(chunk.content),
        source: chunk.source_type || chunk.source || "knowledge_base",
        relevance: chunk.similarity,
        metadata: validated.includeMetadata ? chunk.metadata || {} : undefined,
        sourceId: chunk.source_id,
        chunkIndex: chunk.chunk_index || 0,
        // Add ranking factors
        _rankingScore: calculateRankingScore(chunk, validated.query),
      }))
      // Sort by ranking score (combination of similarity and other factors)
      .sort((a: any, b: unknown) => b._rankingScore - a._rankingScore)
      // Remove internal ranking score from final results
      .map(({ _rankingScore, ...result }: unknown) => result);

    // Calculate confidence based on relevance scores and result quality
    const avgRelevance = results.reduce((sum: number, r: unknown) => sum + r.relevance, 0) / results.length;
    const topRelevance = results[0]?.relevance || 0;
    const confidence = Math.min((avgRelevance * 0.7 + topRelevance * 0.3) * 1.1, 1.0);

    const searchTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        results,
        totalFound: results.length,
        searchTime,
        cached,
      },
      confidence,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e: unknown) => e.message).join(", ")}`,
        confidence: 0,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      confidence: 0,
    };
  }
}

/**
 * Extract title from content (first line or sentence)
 */
function extractTitle(content: string): string {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length > 0 && lines[0]) {
    const firstLine = lines[0].trim();
    // If first line is short, it's likely a title
    if (firstLine.length < 100) {
      return firstLine;
    }
  }

  // Extract first sentence
  const sentences = content.split(/[.!?]+/);
  if (sentences.length > 0 && sentences[0]) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length < 150) {
      return firstSentence;
    }
  }

  // Fallback to truncated content
  return content.substring(0, 100) + (content.length > 100 ? "..." : "");
}

/**
 * Calculate ranking score based on multiple factors
 */
function calculateRankingScore(chunk: any, query: string): number {
  let score = chunk.similarity || 0;

  // Boost score for exact keyword matches
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentLower = chunk.content.toLowerCase();
  const titleLower = (chunk.document_title || chunk.title || "").toLowerCase();

  let keywordMatches = 0;
  queryWords.forEach((word) => {
    if (word.length > 2) {
      // Skip very short words
      if (contentLower.includes(word)) keywordMatches++;
      if (titleLower.includes(word)) keywordMatches += 2; // Title matches are more important
    }
  });

  // Add keyword bonus (up to 0.1 boost)
  const keywordBonus = Math.min(keywordMatches * 0.02, 0.1);
  score += keywordBonus;

  // Boost for shorter, more focused content (likely more relevant)
  const lengthPenalty = Math.max(0, (chunk.content.length - 500) / 10000); // Penalty for very long content
  score -= lengthPenalty;

  // Boost for recent content (if timestamp available)
  if (chunk.metadata?.created_at) {
    const age = Date.now() - new Date(chunk.metadata.created_at).getTime();
    const daysSinceCreation = age / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, (30 - daysSinceCreation) / 1000); // Small boost for content < 30 days old
    score += recencyBonus;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Helper function to format FAQ results for AI
 */
export function formatFAQContext(results: FAQSearchResult["data"]): string {
  if (!results || results.results.length === 0) {
    return "No relevant FAQ/knowledge base articles found.";
  }

  const formatted = results.results.map((result, index) => {
    const relevancePercent = (result.relevance * 100).toFixed(0);
    return `
${index + 1}. ${result.title || "Knowledge Article"} (${relevancePercent}% relevant)
${result.content}
Source: ${result.source}
`.trim();
  });

  const cacheInfo = results.cached ? " (cached)" : "";
  return `Found ${results.totalFound} relevant article(s) in ${results.searchTime}ms${cacheInfo}:\n\n${formatted.join("\n\n")}`;
}

/**
 * Batch search multiple queries
 */
export async function batchSearchFAQ(
  queries: string[],
  organizationId: string,
  options?: Omit<FAQSearchParams, "query" | "organizationId">
): Promise<{ query: string; result: FAQSearchResult }[]> {
  const results = await Promise.all(
    queries.map(async (query) => ({
      query,
      result: await searchFAQ({ query, organizationId, ...options }),
    }))
  );

  return results;
}

/**
 * Get search analytics for an organization
 */
export async function getFAQSearchAnalytics(
  organizationId: string,
  days: number = 30
): Promise<{
  totalSearches: number;
  avgSearchTime: number;
  cacheHitRate: number;
  topQueries: { query: string; count: number }[];
  avgConfidence: number;
}> {
  // This would typically be stored in a separate analytics table
  // For now, return mock data structure
  return {
    totalSearches: 0,
    avgSearchTime: 0,
    cacheHitRate: 0,
    topQueries: [],
    avgConfidence: 0,
  };
}

/**
 * Clear embedding cache (useful for testing or memory management)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
  cacheTimestamps.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  hitRate: number;
  oldestEntry: Date | null;
} {
  const now = Date.now();
  let oldestTimestamp = now;

  cacheTimestamps.forEach((timestamp) => {
    if (timestamp < oldestTimestamp) {
      oldestTimestamp = timestamp;
    }
  });

  return {
    size: embeddingCache.size,
    hitRate: 0, // Would need to track hits/misses to calculate this
    oldestEntry: embeddingCache.size > 0 ? new Date(oldestTimestamp) : null,
  };
}

/**
 * Create RPC function in Supabase (run this migration):
 *
 * CREATE OR REPLACE FUNCTION search_knowledge_chunks(
 *   query_embedding vector(1536),
 *   organization_id uuid,
 *   match_count integer DEFAULT 5,
 *   threshold float DEFAULT 0.7
 * )
 * RETURNS TABLE (
 *   id uuid,
 *   content text,
 *   document_title text,
 *   source text,
 *   metadata jsonb,
 *   similarity float
 * )
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     kc.id,
 *     kc.content,
 *     kd.title as document_title,
 *     kd.source,
 *     kc.metadata,
 *     1 - (kc.embedding <=> query_embedding) as similarity
 *   FROM knowledge_chunks kc
 *   JOIN knowledge_documents kd ON kc.document_id = kd.id
 *   WHERE
 *     kd.organization_id = search_knowledge_chunks.organization_id
 *     AND kd.is_active = true
 *     AND 1 - (kc.embedding <=> query_embedding) >= threshold
 *   ORDER BY kc.embedding <=> query_embedding
 *   LIMIT match_count;
 * END;
 * $$;
 */
