/**
 * Human-like AI Response Pipeline
 *
 * Orchestrates the complete pipeline from user message to human-like AI response
 * including sentiment analysis, tone adaptation, content generation, filtering,
 * personalization, typing simulation, and real-time delivery.
 */

import { FEATURE_FLAGS, HUMAN_AI_CONFIG } from "@/app/config/features";
// Improved typing patterns
import {
  calculateEnhancedTypingTimings,
  getContextualPersona,
  simulateEnhancedTyping,
  type EnhancedTypingTimings,
} from "@/lib/ai/enhanced-typing-patterns";
// Human-like AI imports
import { getHumanAIConfig, isHumanAIModeEnabled, shouldBypassHumanAI } from "@/lib/ai/human-mode-helpers";
import { openaiService } from "@/lib/ai/openai";
import { personalize, phraseFilter, type PersonalizationContext } from "@/lib/ai/phrase-filter";
import { analyzeSentiment, analyzeConversationSentiment, getRecommendedTone } from '@/lib/ai/sentiment';
import { buildAdvancedToneContext, type ToneAdaptationInput } from "@/lib/ai/tone-adapter";
import { calculateTypingTimings, simulateTyping } from "@/lib/ai/typing-sim";
import { typoInjector } from "@/lib/ai/typo-injector";
import { broadcastToConversation } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

export interface HumanLikePipelineInput {
  // Core message data
  conversationId: string;
  organizationId: string;
  messageContent: string;
  messageId?: string;
  senderId?: string;

  // Context
  conversationHistory?: Array<{ content: string; senderType: string; created_at?: string }>;
  organizationPersona?: string;
  conversationSubject?: string;

  // Customer context
  customerInfo?: {
    name?: string;
    tier?: string;
    previousInteractions?: number;
    satisfactionScore?: number;
  };

  // Processing options
  options?: {
    skipTypingSimulation?: boolean;
    skipPersonalization?: boolean;
    skipTypoInjection?: boolean;
    confidenceThreshold?: number;
    maxProcessingTime?: number;
  };
}

export interface HumanLikePipelineResult {
  success: boolean;
  messageId?: string;
  response?: string;
  confidence: number;
  escalated: boolean;

  // Human-like processing details
  humanLikeProcessing: {
    enabled: boolean;
    sentimentAnalysis?: unknown;
    toneAdaptation?: unknown;
    contentFiltering?: unknown;
    personalization?: unknown;
    typingSimulation?: unknown;
    enhancedTyping?: {
      persona: string;
      burstPatterns: number;
      naturalPauses: number;
      correctionPauses: number;
      readingTime: number;
      emotionalModifier: number;
    };
    typoInjection?: unknown;
  };

  // Performance metrics
  processingTime: number;
  tokensUsed: number;

  // Error handling
  error?: string;
  escalationReason?: string;
}

export class HumanLikeAIPipeline {
  private supabase: ReturnType<typeof createServiceRoleClient>;

  constructor() {
    this.supabase = supabase.admin();
  }

  /**
   * Process a message through the complete human-like AI pipeline
   */
  async processMessage(input: HumanLikePipelineInput): Promise<HumanLikePipelineResult> {
    const startTime = Date.now();
    const processingDetails = {
      enabled: false,
      sentimentAnalysis: null as unknown,
      toneAdaptation: null as unknown,
      contentFiltering: null as unknown,
      personalization: null as unknown,
      typingSimulation: null as unknown,
      typoInjection: null as unknown,
    };

    try {
      // Step 1: Check if human-like AI is enabled
      const humanAIEnabled = await isHumanAIModeEnabled(input.organizationId);
      const humanAIConfig = await getHumanAIConfig(input.organizationId);

      processingDetails.enabled = humanAIEnabled;

      if (!humanAIEnabled) {
        return await this.processStandardAI(input, processingDetails, startTime);
      }

      // Step 2: Sentiment analysis
      const sentimentAnalysis = analyzeSentiment(input.messageContent);
      processingDetails.sentimentAnalysis = sentimentAnalysis;

      // Analyze conversation sentiment if history available
      let conversationSentiment = null;
      if (input.conversationHistory && input.conversationHistory.length > 0) {
        conversationSentiment = analyzeConversationSentiment(input.conversationHistory);
      }

      // Step 3: Tone adaptation
      const toneContextInput: ToneAdaptationInput = {
        userMessage: input.messageContent,
        organizationPersona: input.organizationPersona || "friendly",
        conversationHistory: input.conversationHistory || [],
        contextualInfo: {
          urgency: sentimentAnalysis.urgency,
          category: sentimentAnalysis.complexity === "complex" ? "technical" : "general",
          ...(input.conversationSubject && { subject: input.conversationSubject }),
        },
      };
      if (input.customerInfo !== undefined) {
        toneContextInput.customerInfo = input.customerInfo;
      }
      const toneContext = buildAdvancedToneContext(toneContextInput);

      processingDetails.toneAdaptation = {
        finalTone: toneContext.tone,
        adaptationReason: toneContext.adaptationReason,
        systemPromptLength: toneContext.systemPrompt.length,
      };

      // Step 4: Generate AI response with adapted tone
      const aiResponse = await this.generateAIResponse(input, toneContext);

      if (!aiResponse.success) {
        return {
          success: false,
          confidence: 0,
          escalated: false,
          humanLikeProcessing: processingDetails,
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          ...(aiResponse.error && { error: aiResponse.error }),
        };
      }

      // Step 5: Check if we should bypass human-like processing due to performance
      const bypassCheck = shouldBypassHumanAI({
        responseTime: Date.now() - startTime,
        tokenCount: aiResponse.tokensUsed,
        organizationId: input.organizationId,
      });

      if (bypassCheck.bypass) {
        return await this.finalizeResponse(
          input,
          aiResponse.content,
          aiResponse.confidence,
          aiResponse.tokensUsed,
          processingDetails,
          startTime
        );
      }

      // Step 6: Content filtering and humanization
      let processedContent = aiResponse.content;

      if (humanAIConfig.enabled) {
        // 6a: Phrase filtering
        const filteredContent = phraseFilter(processedContent, {
          removeRoboticPhrases: true,
          adjustFormality: "decrease",
          preserveReadability: true,
        });

        processingDetails.contentFiltering = {
          originalLength: processedContent.length,
          filteredLength: filteredContent.length,
          improvementApplied: filteredContent !== processedContent,
        };

        // 6b: Personalization
        const personalizationContext: PersonalizationContext = {
          timeOfDay: this.getTimeOfDay(),
          conversationLength: input.conversationHistory?.length || 0,
          ...(input.customerInfo?.name && { customerName: input.customerInfo.name }),
          ...(input.customerInfo?.tier && { customerTier: input.customerInfo.tier }),
          ...(input.customerInfo?.previousInteractions !== undefined && {
            previousInteractions: input.customerInfo.previousInteractions,
          }),
        };

        const personalizedContent = input.options?.skipPersonalization
          ? filteredContent
          : personalize(filteredContent, personalizationContext);

        processingDetails.personalization = {
          applied: !input.options?.skipPersonalization,
          customerName: personalizationContext.customerName,
          timeOfDay: personalizationContext.timeOfDay,
          lengthChange: personalizedContent.length - filteredContent.length,
        };

        // 6c: Optional typo injection
        if (!input.options?.skipTypoInjection && FEATURE_FLAGS.AI_TYPING_SIMULATION) {
          const typoResult = typoInjector(personalizedContent, {
            probability: HUMAN_AI_CONFIG.TYPO_PROBABILITY,
            preserveReadability: true,
          });

          processedContent = typoResult.text;
          processingDetails.typoInjection = {
            applied: typoResult.corrections.length > 0,
            typosInjected: typoResult.corrections.length,
            corrections: typoResult.corrections.map((c: unknown) => ({
              type: c.typoType,
              position: c.typoPosition,
            })),
          };
        } else {
          processedContent = personalizedContent;
          processingDetails.typoInjection = { applied: false, typosInjected: 0 };
        }
      }

      // Step 7: Improved typing simulation with natural patterns
      if (!input.options?.skipTypingSimulation && humanAIConfig.typingSimulation) {
        // Determine appropriate typing persona based on context
        const typingPersona = getContextualPersona(
          input.organizationPersona || "professional",
          sentimentAnalysis.sentiment,
          sentimentAnalysis.urgency,
          input.customerInfo?.tier
        );

        // Determine message complexity
        const messageComplexity = this.determineMessageComplexity(processedContent, sentimentAnalysis);

        // Calculate improved typing timings
        const enhancedTimings = calculateEnhancedTypingTimings(processedContent, {
          persona: typingPersona,
          sentiment: sentimentAnalysis.sentiment,
          urgency: sentimentAnalysis.urgency,
          complexity: messageComplexity,
        });

        // Simulate improved typing with progress tracking
        const enhancedTypingResult = await simulateEnhancedTyping(processedContent, {
          persona: typingPersona,
          sentiment: sentimentAnalysis.sentiment,
          urgency: sentimentAnalysis.urgency,
          complexity: messageComplexity,
          onProgress: (progress) => {
            // Broadcast typing progress for real-time updates
            this.broadcastTypingProgress(input.organizationId, input.conversationId, progress);
          },
        });

        // Also run the traditional typing simulation for compatibility
        const typingResult = await simulateTyping({
          organizationId: input.organizationId,
          conversationId: input.conversationId,
          content: processedContent,
          sendPartial: FEATURE_FLAGS.REALTIME_PARTIAL_MESSAGES,
          metadata: {
            ai_generated: true,
            human_like_mode: true,
            sentiment: sentimentAnalysis.sentiment,
            tone: toneContext.tone,
            enhanced_typing: true,
            typing_persona: typingPersona,
          },
        });

        processingDetails.typingSimulation = {
          applied: true,
          totalDuration: typingResult.totalDuration,
          partialMessageSent: typingResult.partialMessageSent,
          typingSpeed: Math.round(typingResult.timings.typingSpeed),
          success: typingResult.success,
        };

        processingDetails.enhancedTyping = {
          persona: typingPersona,
          burstPatterns: enhancedTimings.burstPatterns.length,
          naturalPauses:
            enhancedTimings.sentencePauses.length + enhancedTimings.thinkingPauses.filter((p) => p > 0).length,
          correctionPauses: enhancedTimings.correctionPauses.length,
          readingTime: enhancedTimings.readingTime,
          emotionalModifier: enhancedTimings.emotionalModifier,
        };
      }

      // Step 8: Finalize and save response
      return await this.finalizeResponse(
        input,
        processedContent,
        aiResponse.confidence,
        aiResponse.tokensUsed,
        processingDetails,
        startTime
      );
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        escalated: false,
        humanLikeProcessing: processingDetails,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate AI response with tone-adapted prompts
   */
  private async generateAIResponse(
    input: HumanLikePipelineInput,
    toneContext: unknown
  ): Promise<{ success: boolean; content: string; confidence: number; tokensUsed: number; error?: string }> {
    try {
      // Build conversation history
      const conversationHistory = (input.conversationHistory || [])
        .slice(-8) // Last 8 messages for context
        .map((msg: unknown) => ({
          role: msg.senderType === "visitor" || msg.senderType === "customer" ? "user" : "assistant",
          content: msg.content,
        }));

      // Build AI messages with tone context
      const aiMessages = [
        { role: "system" as const, content: toneContext.systemPrompt },
        ...toneContext.examples,
        ...conversationHistory,
        { role: "user" as const, content: input.messageContent },
      ];

      const completion = await openaiService.createChatCompletion(aiMessages, "gpt-4o-mini");

      const content = completion.choices[0]?.message?.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;
      const confidence = this.calculateConfidence(content, input.messageContent);

      return {
        success: true,
        content,
        confidence,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        content: "",
        confidence: 0,
        tokensUsed: 0,
        error: error instanceof Error ? error.message : "AI generation failed",
      };
    }
  }

  /**
   * Process with standard AI (fallback when human-like mode is disabled)
   */
  private async processStandardAI(
    input: HumanLikePipelineInput,
    processingDetails: unknown,
    startTime: number
  ): Promise<HumanLikePipelineResult> {
    // This would implement the standard AI processing logic
    // For now, return a placeholder
    return {
      success: false,
      confidence: 0,
      escalated: false,
      humanLikeProcessing: processingDetails,
      processingTime: Date.now() - startTime,
      tokensUsed: 0,
      error: "Standard AI processing not implemented in this pipeline",
    };
  }

  /**
   * Finalize response by saving to database and broadcasting
   */
  private async finalizeResponse(
    input: HumanLikePipelineInput,
    content: string,
    confidence: number,
    tokensUsed: number,
    processingDetails: unknown,
    startTime: number
  ): Promise<HumanLikePipelineResult> {
    // Implementation would save message and broadcast
    // For now, return success result
    return {
      success: true,
      response: content,
      confidence,
      escalated: false,
      humanLikeProcessing: processingDetails,
      processingTime: Date.now() - startTime,
      tokensUsed,
    };
  }

  /**
   * Calculate confidence score for response
   */
  private calculateConfidence(response: string, originalMessage: string): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for very short responses
    if (response.length < 20) confidence -= 0.2;

    // Reduce confidence for generic responses
    if (response.includes("I understand") && response.length < 50) confidence -= 0.1;

    // Increase confidence for specific, detailed responses
    if (response.length > 100 && response.includes("?")) confidence += 0.1;

    // Reduce confidence if response suggests escalation
    if (response.toLowerCase().includes("escalate") || response.toLowerCase().includes("human agent")) {
      confidence -= 0.3;
    }

    return Math.max(0.1, Math.min(0.99, confidence));
  }

  /**
   * Get current time of day for personalization
   */
  private getTimeOfDay(): "morning" | "afternoon" | "evening" {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }

  /**
   * Determine message complexity for typing simulation
   */
  private determineMessageComplexity(content: string, sentimentAnalysis: unknown): "simple" | "medium" | "complex" {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

    // Technical indicators
    const hasTechnicalTerms = /\b(API|SDK|configuration|authentication|integration|deployment)\b/i.test(content);
    const hasCodeOrLinks = /https?:\/\/|www\.|\/\w+|[{}[\]()]/g.test(content);

    // Complexity scoring
    let complexityScore = 0;

    // Word count
    if (words > 50) complexityScore += 2;
    else if (words > 20) complexityScore += 1;

    // Sentence structure
    if (sentences > 3) complexityScore += 1;

    // Technical content
    if (hasTechnicalTerms) complexityScore += 2;
    if (hasCodeOrLinks) complexityScore += 1;

    // Sentiment complexity
    if (sentimentAnalysis.complexity === "complex") complexityScore += 2;
    else if (sentimentAnalysis.complexity === "medium") complexityScore += 1;

    // Determine final complexity
    if (complexityScore >= 5) return "complex";
    if (complexityScore >= 2) return "medium";
    return "simple";
  }

  /**
   * Broadcast typing progress for real-time UI updates
   */
  private async broadcastTypingProgress(
    organizationId: string,
    conversationId: string,
    progress: {
      content: string;
      percentage: number;
      phase: "reading" | "thinking" | "typing" | "pausing" | "correcting";
    }
  ): Promise<void> {
    try {
      const channel = `${organizationId}:conversation:${conversationId}`;

      await this.supabase.channel(channel).send({
        type: "broadcast",
        event: "enhanced_typing_progress",
        payload: {
          ...progress,
          timestamp: new Date().toISOString(),
          senderType: "ai_assistant",
        },
      });
    } catch (error) {
      // Don't throw error for progress broadcasts
    }
  }
}

// Export singleton instance
export const humanLikeAIPipeline = new HumanLikeAIPipeline();
