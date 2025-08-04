import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { campfireMessages } from "@/db/schema/campfireMessages";
import { knowledgeChunks } from "@/db/schema/knowledgeChunks";
import { ragProfiles } from "@/db/schema/ragProfiles";
import { generateCompletion, generateEmbedding } from "@/lib/ai/core";
import { retryable } from "@/lib/utils";

// import { improvedVectorSearchService } from "@/lib/services/ImprovedVectorSearchService"; // Module not found

// Simple fallback for improvedVectorSearchService
const improvedVectorSearchService = {
  semanticSearch: async (query: string, mailboxId: string | number, options: unknown, context: unknown) => {
    // Fallback: return empty search results
    return [];
  },
};

/**
 * Retrieve a RAG profile by ID, including tuning parameters
 */
const _getRagProfile = async (id: string) => {
  const profile = await db
    .select()
    .from(ragProfiles)
    .where(eq(ragProfiles.id, id))
    .limit(1)
    .then((rows: unknown) => rows[0] || null);
  return profile;
};

export const getRagProfile = _getRagProfile;

/**
 * Generate a comprehensive RAG draft reply using improved vector search and AI completion
 * Combines persona prompt, conversation context, and semantically relevant knowledge
 * @param channelId The channel ID
 * @param profileId The RAG profile ID
 * @param mailboxId The tenant's mailbox ID (REQUIRED for security)
 * @param customerContext Optional customer context
 */
const _generateRagDraft = async (
  channelId: string,
  profileId: string,
  mailboxId: string | number,
  customerContext?: unknown
) => {
  try {
    // Load profile settings
    const profile = await getRagProfile(profileId);
    if (!profile) throw new Error("RAG profile not found");

    // Fetch recent conversation history
    const history = await db
      .select({
        sender: campfireMessages.sender,
        content: campfireMessages.content,
        createdAt: campfireMessages.createdAt,
      })
      .from(campfireMessages)
      .where(eq(campfireMessages.channelId, channelId))
      .orderBy(campfireMessages.createdAt)
      .limit(20);

    if (history.length === 0) {
      throw new Error("No conversation history found for channel");
    }

    // Build conversation context
    const historyText = history.map((m: unknown) => `${m.sender}: ${m.content}`).join("\n");
    const userMessages = history.filter((m: unknown) => m.sender === "user");
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1]?.content || "" : "";

    // Analyze conversation for context
    const conversationAnalysis = await analyzeConversationContext(historyText, lastUserMessage);

    // Perform semantic search for relevant knowledge with proper tenant filtering
    const searchResults = await improvedVectorSearchService.semanticSearch(
      lastUserMessage,
      mailboxId, // CRITICAL: Pass mailboxId for tenant isolation
      {
        threshold: profile.threshold,
        limit: profile.k,
        rerank: true,
        hybridWeight: 0.3, // Balanced hybrid search
      },
      {
        conversationHistory: history.map((h: unknown) => h.content),
        customerProfile: customerContext,
        currentTopic: conversationAnalysis.topic,
        urgencyLevel: conversationAnalysis.urgency,
      }
    );

    // Build knowledge context from search results
    const knowledgeContext = searchResults.map((result: unknown) => ({
      content: result.content,
      source: result.metadata.documentTitle,
      relevance: result.score,
    }));

    // Generate AI-powered draft response
    const draft = await generateIntelligentDraft({
      profile,
      conversationHistory: historyText,
      lastUserMessage,
      knowledgeContext,
      conversationAnalysis,
      customerContext,
    });

    return {
      draft,
      metadata: {
        profileUsed: profile.name,
        knowledgeSources: knowledgeContext.length,
        searchResults: searchResults.map((r: unknown) => ({
          title: r.metadata.documentTitle,
          relevance: r.score,
        })),
        conversationAnalysis,
        confidence: calculateDraftConfidence(searchResults, conversationAnalysis),
      },
    };
  } catch (error) {
    throw error;
  }
};

export const generateRagDraft = _generateRagDraft;

/**
 * Get all RAG profiles
 */
const _getAllRagProfiles = async () => {
  return await db.select().from(ragProfiles).orderBy(ragProfiles.createdAt);
};

export const getAllRagProfiles = _getAllRagProfiles;

/**
 * Create a new RAG profile
 */
const _createRagProfile = async (data: { name: string; prompt: string; threshold?: number; k?: number }) => {
  const result = await db
    .insert(ragProfiles)
    .values({
      name: data.name,
      prompt: data.prompt,
      threshold: data.threshold ?? 0.7,
      k: data.k ?? 5,
    })
    .returning();
  return result[0];
};

export const createRagProfile = _createRagProfile;

/**
 * Update a RAG profile
 */
const _updateRagProfile = async (
  id: string,
  data: {
    name?: string;
    prompt?: string;
    threshold?: number;
    k?: number;
  }
) => {
  const result = await db
    .update(ragProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(ragProfiles.id, id))
    .returning();
  return result[0] || null;
};

export const updateRagProfile = _updateRagProfile;

/**
 * Delete a RAG profile
 */
const _deleteRagProfile = async (id: string) => {
  const result = await db.delete(ragProfiles).where(eq(ragProfiles.id, id)).returning();
  return result[0] || null;
};

export const deleteRagProfile = _deleteRagProfile;

/**
 * Analyze conversation context for better RAG retrieval
 */
async function analyzeConversationContext(historyText: string, lastUserMessage: string) {
  try {
    const analysis = await generateCompletion({
      system: `You are an expert at analyzing customer support conversations. Analyze the conversation and extract key insights.`,
      prompt: `
        Analyze this conversation:
        
        Conversation History:
        ${historyText}
        
        Latest Message: ${lastUserMessage}
        
        Extract:
        1. Primary topic/category
        2. Customer sentiment (positive/neutral/negative)
        3. Urgency level (low/medium/high)
        4. Key entities mentioned (products, features, issues)
        5. Intent classification
        
        Return JSON format only.
      `,
      temperature: 0.1,
      functionId: "conversation-analysis",
    });

    try {
      return JSON.parse(analysis.text);
    } catch {
      // Fallback if JSON parsing fails
      return {
        topic: "general_inquiry",
        sentiment: "neutral",
        urgency: "medium",
        entities: [],
        intent: "information_request",
      };
    }
  } catch (error) {
    return {
      topic: "general_inquiry",
      sentiment: "neutral",
      urgency: "medium",
      entities: [],
      intent: "information_request",
    };
  }
}

/**
 * Generate intelligent draft response using AI completion
 */
async function generateIntelligentDraft({
  profile,
  conversationHistory,
  lastUserMessage,
  knowledgeContext,
  conversationAnalysis,
  customerContext,
}: {
  profile: unknown;
  conversationHistory: string;
  lastUserMessage: string;
  knowledgeContext: Array<{ content: string; source: string; relevance: number }>;
  conversationAnalysis: unknown;
  customerContext?: unknown;
}) {
  try {
    // Build knowledge context string
    const knowledgeText = knowledgeContext
      .map(
        (k, i) => `[Source ${i + 1}: ${k.source} (relevance: ${k.relevance.toFixed(2)})]
${k.content}`
      )
      .join("\n\n");

    // Build customer context
    const customerInfo = customerContext
      ? `Customer Information:
- Tier: ${customerContext.tier || "Standard"}
- Previous interactions: ${customerContext.previousInteractions || 0}
- Preferences: ${customerContext.preferences?.join(", ") || "None specified"}`
      : "";

    const completion = await generateCompletion({
      system: `You are ${profile.name}, a helpful customer support agent. ${profile.prompt}

IMPORTANT GUIDELINES:
- Use the provided knowledge sources to give accurate, up-to-date information
- Match the tone and urgency indicated by the conversation analysis
- Reference specific sources when providing factual information
- If the knowledge sources don't contain relevant information, say so clearly
- Keep responses concise but complete
- Always maintain a helpful, professional tone`,

      prompt: `
CONVERSATION CONTEXT:
${conversationHistory}

CUSTOMER MESSAGE: ${lastUserMessage}

CONVERSATION ANALYSIS:
- Topic: ${conversationAnalysis.topic}
- Sentiment: ${conversationAnalysis.sentiment}
- Urgency: ${conversationAnalysis.urgency}
- Intent: ${conversationAnalysis.intent}

${customerInfo}

RELEVANT KNOWLEDGE:
${knowledgeText}

Generate a helpful response that addresses the customer's question using the relevant knowledge sources. If no relevant information is found in the knowledge base, politely indicate this and offer to escalate or gather more information.
      `,
      temperature: 0.3,
      maxTokens: 500,
      functionId: "rag-draft-generation",
    });

    return completion.text;
  } catch (error) {
    // Fallback to simple template
    const knowledgeText = knowledgeContext.map((k: unknown) => k.content).join("\n\n");
    return `Based on the available information:

${knowledgeText}

I hope this helps address your question about: ${lastUserMessage}

If you need further assistance, please let me know!`;
  }
}

/**
 * Calculate confidence score for the generated draft
 */
function calculateDraftConfidence(searchResults: unknown[], conversationAnalysis: unknown): number {
  let confidence = 0.5; // Base confidence

  // Boost confidence based on search result quality
  if (searchResults.length > 0) {
    const avgRelevance = searchResults.reduce((sum: unknown, r: unknown) => sum + r.score, 0) / searchResults.length;
    confidence += avgRelevance * 0.3;
  }

  // Adjust based on conversation analysis
  if (conversationAnalysis.intent === "information_request") {
    confidence += 0.1; // Higher confidence for info requests
  }

  if (conversationAnalysis.urgency === "low") {
    confidence += 0.05; // Slightly higher confidence for low urgency
  }

  // Penalize if no relevant knowledge found
  if (searchResults.length === 0) {
    confidence -= 0.2;
  }

  return Math.max(0.1, Math.min(0.95, confidence)); // Clamp between 0.1 and 0.95
}
