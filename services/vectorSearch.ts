/**
 * Vector Search Service
 *
 * Handles vector similarity search for knowledge retrieval and RAG functionality
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import { OpenAI } from "openai";
import { db } from "@/db/client";
import { knowledgeChunks, knowledgeDocuments } from "@/db/schema";
// import { performanceMonitor } from "@/lib/performance/monitor"; // TODO: Re-enable when monitor is available
import { createClient } from "@/lib/supabase";

// import { getCachedEmbedding, setCachedEmbedding } from "./embeddingCache"; // TODO: Re-enable when cache is available
// import { generateEmbedding } from "./embeddings"; // TODO: Re-enable when embeddings are available

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SearchResult = {
  documentId: number;
  documentTitle: string;
  chunkId: number;
  content: string;
  similarity: number;
  metadata: any;
};

export type KnowledgeSearchResult = {
  id: string;
  content: string;
  article_id: string;
  similarity: number;
  metadata?: any;
  title?: string;
};

/**
 * Search knowledge base using vector similarity
 */
export async function searchKnowledgeBase(
  query: string,
  tenantId: string,
  limit: number = 5,
  threshold: number = 0.7,
  options: {
    sources?: string[];
    includeMetadata?: boolean;
  } = {}
): Promise<KnowledgeSearchResult[]> {
  // TODO: Re-enable performance monitoring when available
  // return performanceMonitor.time("knowledge_search", async () => {
  try {
    // For now, return mock results since we don't have vector search setup
    const mockResults: KnowledgeSearchResult[] = [
      {
        id: "1",
        content: `This is a mock knowledge article about: ${query}. It contains relevant information that would help answer user questions.`,
        article_id: "1",
        similarity: 0.85,
        title: "Getting Started Guide",
        metadata: { source: "documentation", category: "help" },
      },
      {
        id: "2",
        content: `Another relevant article discussing ${query} in detail. This provides additional context and solutions.`,
        article_id: "2",
        similarity: 0.75,
        title: "Troubleshooting Common Issues",
        metadata: { source: "support", category: "troubleshooting" },
      },
    ];

    // Filter by limit
    return mockResults.slice(0, limit);
  } catch (error) {
    // Return empty results instead of throwing
    return [];
  }
  // }, { tenantId, limit: limit.toString(), threshold: threshold.toString() });
}

/**
 * Perform a vector similarity search on knowledge chunks
 * @param query The search query
 * @param mailboxId The mailbox ID to search within
 * @param options Search options including limit and filters
 * @returns Array of search results with similarity scores
 */
export async function search(
  query: string,
  mailboxId: string | number,
  options: {
    limit?: number;
    minSimilarity?: number;
    categories?: string[];
    documentIds?: number[];
    includeDisabled?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const { limit = 5, minSimilarity = 0.7, categories = [], documentIds = [], includeDisabled = false } = options;

  // Generate embedding for the query
  // TODO: Re-enable when embeddings service is available
  // const queryEmbedding = await generateEmbedding(query);
  const queryEmbedding = new Array(1536).fill(0); // Mock embedding for now

  // Build the query conditions
  const conditions = [];

  // Add mailbox condition - convert to number since that's what the schema expects
  conditions.push(eq(knowledgeChunks.mailboxId, typeof mailboxId === "number" ? mailboxId : Number(mailboxId)));

  // Filter by document IDs if provided
  if (documentIds.length > 0) {
    conditions.push(inArray(knowledgeChunks.documentId, documentIds));
  }

  // Join with documents to filter by categories and enabled status
  const knowledgeChunksWithDocs = db.$with("knowledge_chunks_with_docs").as(
    db
      .select({
        chunkId: knowledgeChunks.id,
        documentId: knowledgeChunks.documentId,
        documentTitle: knowledgeDocuments.title,
        content: knowledgeChunks.content,
        embedding: knowledgeChunks.embedding,
        metadata: knowledgeChunks.metadata,
      })
      .from(knowledgeChunks)
      .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
      .where(
        and(
          ...conditions,
          ...(includeDisabled ? [] : [eq(knowledgeDocuments.enabled, true)]),
          ...(categories.length > 0 ? [inArray(knowledgeDocuments.category, categories)] : [])
        )
      )
  );

  // Perform the vector similarity search
  const results = await db
    .with(knowledgeChunksWithDocs)
    .select({
      documentId: knowledgeChunksWithDocs.documentId,
      documentTitle: knowledgeChunksWithDocs.documentTitle,
      chunkId: knowledgeChunksWithDocs.chunkId,
      content: knowledgeChunksWithDocs.content,
      similarity: sql<number>`1 - (${knowledgeChunksWithDocs.embedding} <=> ${queryEmbedding})`,
      metadata: knowledgeChunksWithDocs.metadata,
    })
    .from(knowledgeChunksWithDocs)
    .where(sql`1 - (${knowledgeChunksWithDocs.embedding} <=> ${queryEmbedding}) >= ${minSimilarity}`)
    .orderBy(sql`similarity DESC`)
    .limit(limit);

  return results;
}

/**
 * Retrieve the most relevant knowledge chunks for a query using RAG
 * @param query The search query
 * @param mailboxId The mailbox ID
 * @param options Search options
 * @returns The formatted context from the most relevant knowledge chunks
 */
export async function getKnowledgeContext(
  query: string,
  mailboxId: string | number,
  options: {
    limit?: number;
    minSimilarity?: number;
    categories?: string[];
    documentIds?: number[];
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { limit = 5, maxTokens = 3000 } = options;

  // Perform similarity search
  const results = await search(query, mailboxId, options);

  if (results.length === 0) {
    return "";
  }

  // Format the results into a context string
  let context = "";
  let tokenEstimate = 0;

  for (const result of results) {
    // Estimate tokens - simple approximation (4 chars ≈ 1 token)
    const contentTokens = Math.ceil(result.content.length / 4);
    const headerTokens = Math.ceil((result.documentTitle || "").length / 4) + 30; // Add some overhead for formatting

    if (tokenEstimate + contentTokens + headerTokens > maxTokens) {
      // Stop adding content if we've reached the token limit
      break;
    }

    // Add document info and content
    const chunk = `
---
Document: ${result.documentTitle}
Relevance: ${(result.similarity * 100).toFixed(2)}%
Content:
${result.content}
---
`;

    context += chunk;
    tokenEstimate += contentTokens + headerTokens;
  }

  return context.trim();
}

export default {
  searchKnowledgeBase,
  search, // Use the actual function name
  getKnowledgeContext, // Use the actual function name
};
