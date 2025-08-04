"use client";

import { supabase } from "@/lib/supabase/client";
import { typingSimulator } from "./human-like-typing";

export interface RAGContext {
  query: string;
  organizationId: string;
  conversationId: string;
  userContext?: unknown;
  previousMessages?: Message[];
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources: DocumentSource[];
  reasoning: string;
  shouldHandover: boolean;
  agentName?: string;
  responseTime: number;
}

export interface DocumentSource {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  url?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "ai";
  timestamp: Date;
}

export class RAGAIService {
  private static instance: RAGAIService;
  private confidenceThreshold = 0.7;
  private maxContextLength = 4000; // tokens
  private responseCache = new Map<string, AIResponse>();

  static getInstance(): RAGAIService {
    if (!RAGAIService.instance) {
      RAGAIService.instance = new RAGAIService();
    }
    return RAGAIService.instance;
  }

  /**
   * Generate AI response using RAG with human-like behavior
   */
  async generateResponse(context: RAGContext): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // 1. Check cache first
      const cacheKey = this.getCacheKey(context);
      if (this.responseCache.has(cacheKey)) {

        return this.responseCache.get(cacheKey)!;
      }

      // 2. Retrieve relevant documents using vector search
      const relevantDocs = await this.retrieveRelevantDocuments(context.query, context.organizationId);

      // 3. Build context with conversation history
      const conversationContext = await this.buildConversationContext(context.conversationId, context.previousMessages);

      // 4. Generate response using RAG
      const aiResponse = await this.generateRAGResponse(
        context.query,
        relevantDocs,
        conversationContext,
        context.organizationId
      );

      // 5. Calculate confidence and determine if handover needed
      const confidence = this.calculateConfidence(aiResponse, relevantDocs);
      const shouldHandover = confidence < this.confidenceThreshold;

      const response: AIResponse = {
        content: aiResponse,
        confidence,
        sources: relevantDocs,
        reasoning: this.generateReasoning(confidence, relevantDocs),
        shouldHandover,
        responseTime: Date.now() - startTime,
      };

      // 6. Cache response
      this.responseCache.set(cacheKey, response);

      // 7. Log for analytics
      await this.logAIInteraction(context, response);

      return response;
    } catch (error) {

      // Fallback response with low confidence
      return {
        content:
          "I'm having trouble accessing my knowledge base right now. Let me connect you with a human agent who can help you better.",
        confidence: 0.1,
        sources: [],
        reasoning: "System error - knowledge base unavailable",
        shouldHandover: true,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Retrieve relevant documents using vector similarity search
   */
  private async retrieveRelevantDocuments(
    query: string,
    organizationId: string,
    limit: number = 5
  ): Promise<DocumentSource[]> {
    try {
      // Use Supabase vector search on vector_documents table
      const { data, error } = await supabase.rpc("search_documents", {
        query_text: query,
        org_id: organizationId,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) {

        return [];
      }

      return (data || []).map((doc: unknown) => ({
        id: doc.id,
        title: doc.title || "Knowledge Base Article",
        content: doc.content,
        relevanceScore: doc.similarity || 0,
        url: doc.url,
      }));
    } catch (error) {

      return [];
    }
  }

  /**
   * Build conversation context from recent messages
   */
  private async buildConversationContext(conversationId: string, previousMessages?: Message[]): Promise<string> {
    try {
      let messages = previousMessages;

      if (!messages) {
        // Fetch recent messages from database
        const { data } = await supabase
          .from("messages")
          .select("id, content, sender_type, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(10);

        messages = (data || [])
          .map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.senderType as "user" | "agent" | "ai",
            timestamp: new Date(msg.created_at),
          }))
          .reverse(); // Chronological order
      }

      // Build context string
      const contextLines = messages.map((msg) => `${msg.sender}: ${msg.content}`);

      return contextLines.join("\n");
    } catch (error) {

      return "";
    }
  }

  /**
   * Generate RAG response using retrieved documents and context
   */
  private async generateRAGResponse(
    query: string,
    documents: DocumentSource[],
    conversationContext: string,
    organizationId: string
  ): Promise<string> {
    // Build prompt with RAG context
    const documentContext = documents.map((doc) => `[${doc.title}]: ${doc.content}`).join("\n\n");

    const prompt = `
You are a helpful customer support agent. Use the following knowledge base articles and conversation context to answer the user's question.

KNOWLEDGE BASE:
${documentContext}

CONVERSATION HISTORY:
${conversationContext}

USER QUESTION: ${query}

Instructions:
- Provide a helpful, accurate response based on the knowledge base
- Be conversational and empathetic
- If the knowledge base doesn't contain relevant information, say so honestly
- Keep responses concise but complete
- Use a friendly, professional tone

RESPONSE:`;

    try {
      // Use a simple AI service or OpenAI API
      // For now, we'll use a rule-based approach with the documents
      return this.generateRuleBasedResponse(query, documents, conversationContext);
    } catch (error) {

      return this.generateFallbackResponse(query, documents);
    }
  }

  /**
   * Rule-based response generation (fallback for when AI API is unavailable)
   */
  private generateRuleBasedResponse(query: string, documents: DocumentSource[], context: string): string {
    const queryLower = query.toLowerCase();

    // If we have relevant documents, use them
    if (documents.length > 0) {
      const bestDoc = documents[0];

      // Extract relevant section from the document
      const sentences = bestDoc.content.split(/[.!?]+/);
      const relevantSentences = sentences
        .filter((sentence) => this.calculateRelevance(sentence, queryLower) > 0.3)
        .slice(0, 3);

      if (relevantSentences.length > 0) {
        return `Based on our knowledge base, ${relevantSentences.join(". ")}.

Is there anything specific about this you'd like me to clarify?`;
      }
    }

    // Common support patterns
    if (queryLower.includes("password") || queryLower.includes("login")) {
      return "I can help you with login issues. You can reset your password using the 'Forgot Password' link on the login page. If you continue having trouble, I can connect you with our technical support team.";
    }

    if (queryLower.includes("billing") || queryLower.includes("payment")) {
      return "For billing and payment questions, I'd be happy to connect you with our billing specialist who can access your account details and help resolve any payment issues.";
    }

    if (queryLower.includes("cancel") || queryLower.includes("refund")) {
      return "I understand you're looking into cancellation or refund options. Let me connect you with a specialist who can review your account and discuss the available options with you.";
    }

    // Generic helpful response
    return "I want to make sure I give you the most accurate information. Let me connect you with one of our specialists who can provide detailed assistance with your specific question.";
  }

  /**
   * Generate fallback response when documents aren't helpful
   */
  private generateFallbackResponse(query: string, documents: DocumentSource[]): string {
    if (documents.length === 0) {
      return "I don't have specific information about that in my current knowledge base. Let me connect you with a human agent who can provide more detailed assistance.";
    }

    return "While I found some related information, I want to make sure you get the most accurate answer. Let me connect you with a specialist who can help you with this specific question.";
  }

  /**
   * Calculate confidence score based on document relevance and response quality
   */
  private calculateConfidence(response: string, documents: DocumentSource[]): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence if we have relevant documents
    if (documents.length > 0) {
      const avgRelevance = documents.reduce((sum, doc) => sum + doc.relevanceScore, 0) / documents.length;
      confidence += avgRelevance * 0.3;
    }

    // Boost confidence for specific response patterns
    if (response.includes("Based on our knowledge base")) {
      confidence += 0.2;
    }

    // Reduce confidence for fallback responses
    if (response.includes("connect you with") || response.includes("specialist")) {
      confidence -= 0.3;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate reasoning for the confidence score
   */
  private generateReasoning(confidence: number, documents: DocumentSource[]): string {
    if (confidence >= 0.8) {
      return `High confidence: Found ${documents.length} highly relevant knowledge base articles`;
    } else if (confidence >= 0.6) {
      return `Medium confidence: Found ${documents.length} somewhat relevant articles`;
    } else if (confidence >= 0.4) {
      return `Low confidence: Limited relevant information available`;
    } else {
      return `Very low confidence: No relevant knowledge base articles found`;
    }
  }

  /**
   * Calculate relevance between text and query
   */
  private calculateRelevance(text: string, query: string): number {
    const textWords = text.toLowerCase().split(/\W+/);
    const queryWords = query.toLowerCase().split(/\W+/);

    const matches = queryWords.filter(
      (word) => word.length > 2 && textWords.some((textWord) => textWord.includes(word) || word.includes(textWord))
    );

    return matches.length / queryWords.length;
  }

  /**
   * Generate cache key for response caching
   */
  private getCacheKey(context: RAGContext): string {
    return `${context.organizationId}:${context.query.slice(0, 100)}`;
  }

  /**
   * Log AI interaction for analytics
   */
  private async logAIInteraction(context: RAGContext, response: AIResponse): Promise<void> {
    try {
      await supabase.from("ai_processing_logs").insert({
        conversation_id: context.conversationId,
        organization_id: context.organizationId,
        input_text: context.query,
        output_text: response.content,
        confidence_score: response.confidence,
        processing_time_ms: response.responseTime,
        model_used: "rag-v1",
        sources_used: response.sources.length,
        handover_triggered: response.shouldHandover,
      });
    } catch (error) {

    }
  }

  /**
   * Simulate human-like AI response with typing
   */
  async simulateHumanResponse(
    context: RAGContext,
    onTypingStart?: () => void,
    onTypingComplete?: (agentName: string) => void
  ): Promise<AIResponse> {
    // Generate the AI response
    const aiResponse = await this.generateResponse(context);

    // If confidence is high enough, simulate human typing
    if (!aiResponse.shouldHandover) {
      onTypingStart?.();

      const agentName = await typingSimulator.simulateAIResponse(
        context.conversationId,
        context.organizationId,
        aiResponse.content,
        onTypingComplete
      );

      aiResponse.agentName = agentName;
    }

    return aiResponse;
  }
}
