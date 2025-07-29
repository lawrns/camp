/**
 * Enhanced AI Service
 * 
 * Integrates RAG, handover logic, and advanced AI features for production-ready
 * intelligent conversation handling.
 */

import { unifiedRAGService } from './rag/UnifiedRAGService';
import { AIHandoverService } from './handover';
import { confidenceAnalytics } from './confidence-analytics';
import { openaiService } from './openai';
import { analyzeSentiment } from './sentiment';
import { supabase } from '@/lib/supabase';
import { enhancedAIAnalytics } from '@/lib/analytics/enhanced-ai-analytics';
import { slackService } from '@/lib/integrations/enhanced-slack-service';

export interface EnhancedAIRequest {
  conversationId: string;
  organizationId: string; // Using existing organizations table
  messageContent: string;
  messageId: string;
  customerInfo?: {
    name?: string;
    email?: string;
    tier?: string;
  };
  conversationHistory: Array<{
    id: string;
    content: string;
    senderType: 'customer' | 'ai' | 'agent';
    timestamp: string;
  }>;
}

export interface EnhancedAIResponse {
  content: string;
  confidence: number;
  shouldHandover: boolean;
  handoverReason?: string;
  suggestedActions: string[];
  sentiment: string;
  responseTime: number;
  sources?: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  metadata: {
    aiPersonality: string;
    empathyScore: number;
    complexity: string;
    urgency: string;
  };
}

export class EnhancedAIService {
  private handoverService: AIHandoverService;
  private confidenceThreshold = 0.7;

  constructor() {
    this.handoverService = new AIHandoverService();
  }

  /**
   * Convert SentimentAnalysis object to string representation
   */
  private sentimentToString(sentimentAnalysis: any): string {
    if (typeof sentimentAnalysis === 'string') {
      return sentimentAnalysis;
    }
    
    const compound = sentimentAnalysis.sentiment?.compound || 0;
    
    if (compound >= 0.5) return 'positive';
    if (compound <= -0.5) return 'negative';
    if (compound <= -0.1) return 'frustrated';
    return 'neutral';
  }

  /**
   * Process a customer message and generate an intelligent response
   */
  async processMessage(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const startTime = Date.now();

    try {
      // 1. Analyze sentiment and complexity
      const sentimentAnalysis = await analyzeSentiment(request.messageContent);
      const sentiment = this.sentimentToString(sentimentAnalysis);
      const complexity = this.analyzeComplexity(request.messageContent, request.conversationHistory);
      const urgency = this.determineUrgency(request.messageContent, sentiment);

      // 2. Get organization context
      const organizationContext = await this.getOrganizationContext(request.organizationId);

      // 3. Use RAG for knowledge-based response
      const ragInput = {
        conversationId: request.conversationId,
        organizationId: request.organizationId,
        messageContent: request.messageContent,
        messageId: request.messageId,
        conversationHistory: request.conversationHistory,
        organizationPersona: organizationContext.persona || 'helpful',
        useKnowledgeBase: true,
        useHumanLikeMode: true,
        confidenceThreshold: this.confidenceThreshold,
        customerInfo: request.customerInfo || {},
        options: {
          maxKnowledgeChunks: 5,
        },
      };

      const ragResponse = await unifiedRAGService.processMessage(ragInput);

      // 4. Evaluate handover necessity
      const handoverContext = {
        conversationId: request.conversationId,
        organizationId: request.organizationId,
        customerId: request.customerInfo?.email,
        customerName: request.customerInfo?.name,
        customerEmail: request.customerInfo?.email,
        aiPersonality: {
          id: 'default',
          name: 'Assistant',
          description: 'AI Assistant for customer support',
          systemPrompt: 'You are a helpful customer support assistant.',
          responseStyle: 'professional',
          specialties: ['general_support'],
          traits: [],
          empathyLevel: 0.8,
          formalityLevel: 0.7
        },
        messageHistory: request.conversationHistory,
        currentIssue: {
          category: this.categorizeIssue(request.messageContent),
          description: request.messageContent,
          urgency,
          tags: this.extractTags(request.messageContent),
        },
        aiAnalysis: {
          confidence: ragResponse.confidence || 0.5,
          sentiment,
          complexity,
          suggestedActions: this.generateSuggestedActions(request.messageContent, sentiment),
          escalationReasons: ragResponse.escalated ? [ragResponse.escalationReason || 'Low AI confidence'] : [],
        },
      };

      const handoverResult = await this.handoverService.evaluateHandover(handoverContext);

      // 5. Record analytics
      await confidenceAnalytics.recordInteraction({
        conversationId: request.conversationId,
        organizationId: request.organizationId,
        confidence: ragResponse.confidence,
        userSatisfaction: null, // Will be updated later
        responseTime: Date.now() - startTime,
        handoverTriggered: handoverResult.shouldHandover,
      });

      // 6. Build enhanced response
      const response: EnhancedAIResponse = {
        content: ragResponse.response || 'I apologize, but I was unable to generate a response.',
        confidence: ragResponse.confidence || 0.5,
        shouldHandover: handoverResult.shouldHandover,
        handoverReason: handoverResult.reason,
        suggestedActions: handoverContext.aiAnalysis.suggestedActions,
        sentiment,
        responseTime: Date.now() - startTime,
        sources: ragResponse.knowledgeUsed?.map((source: any) => ({
          title: source.title || 'Knowledge Base',
          content: source.content || '',
          relevance: source.relevance || 0.8,
        })) || [],
        metadata: {
          aiPersonality: ragResponse.suggestedAgent || 'Assistant',
          empathyScore: 0.8,
          complexity,
          urgency,
        },
      };

      return response;

    } catch (error) {
      console.error('Enhanced AI Service error:', error);
      
      // Fallback response
      return {
        content: "I apologize, but I'm experiencing some technical difficulties. Let me connect you with a human agent who can better assist you.",
        confidence: 0.1,
        shouldHandover: true,
        handoverReason: 'Technical error in AI processing',
        suggestedActions: ['Connect to human agent'],
        sentiment: 'neutral',
        responseTime: Date.now() - startTime,
        metadata: {
          aiPersonality: 'Assistant',
          empathyScore: 0.7,
          complexity: 'unknown',
          urgency: 'medium',
        },
      };
    }
  }

  private analyzeComplexity(message: string, history: any[]): 'simple' | 'moderate' | 'complex' {
    const indicators = {
      simple: ['hello', 'hi', 'thanks', 'yes', 'no', 'ok'],
      complex: ['technical', 'integration', 'api', 'error', 'bug', 'issue', 'problem', 'refund', 'cancel'],
    };

    const lowerMessage = message.toLowerCase();
    const hasComplexIndicators = indicators.complex.some(word => lowerMessage.includes(word));
    const hasMultipleQuestions = (message.match(/\?/g) || []).length > 1;
    const isLongMessage = message.length > 200;
    const hasLongHistory = history.length > 10;

    if (hasComplexIndicators || hasMultipleQuestions || isLongMessage || hasLongHistory) {
      return 'complex';
    }

    if (indicators.simple.some(word => lowerMessage.includes(word))) {
      return 'simple';
    }

    return 'moderate';
  }

  private determineUrgency(message: string, sentiment: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'broken', 'down'];
    const lowerMessage = message.toLowerCase();

    if (urgentKeywords.some(word => lowerMessage.includes(word))) {
      return 'critical';
    }

    if (sentiment === 'angry' || sentiment === 'frustrated') {
      return 'high';
    }

    if (sentiment === 'negative') {
      return 'medium';
    }

    return 'low';
  }

  private categorizeIssue(message: string): string {
    const categories = {
      'technical': ['error', 'bug', 'broken', 'not working', 'issue'],
      'billing': ['payment', 'charge', 'bill', 'invoice', 'refund'],
      'account': ['login', 'password', 'account', 'profile', 'settings'],
      'general': ['question', 'help', 'how to', 'information'],
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private extractTags(message: string): string[] {
    const tags: string[] = [];
    const lowerMessage = message.toLowerCase();

    const tagMap = {
      'urgent': ['urgent', 'asap', 'emergency'],
      'technical': ['api', 'integration', 'code', 'error'],
      'billing': ['payment', 'charge', 'refund'],
      'mobile': ['mobile', 'app', 'ios', 'android'],
    };

    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private generateSuggestedActions(message: string, sentiment: string): string[] {
    const actions: string[] = [];

    if (sentiment === 'negative' || sentiment === 'frustrated') {
      actions.push('Acknowledge concern', 'Provide empathetic response');
    }

    if (message.toLowerCase().includes('refund')) {
      actions.push('Check refund policy', 'Escalate to billing team');
    }

    if (message.toLowerCase().includes('technical') || message.toLowerCase().includes('error')) {
      actions.push('Gather technical details', 'Check system status');
    }

    if (actions.length === 0) {
      actions.push('Provide helpful information', 'Ask clarifying questions');
    }

    return actions;
  }

  private async getOrganizationContext(organizationId: string) {
    try {
      const supabaseClient = supabase.admin();
      const { data: organization } = await supabaseClient
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      return {
        persona: (organization as any)?.ai_persona || 'helpful',
        settings: (organization as any)?.settings || {},
      };
    } catch (error) {
      console.error('Error fetching organization context:', error);
      return {
        persona: 'helpful',
        settings: {},
      };
    }
  }

  private determineResponseCategory(content: string, shouldHandover: boolean): 'quick_reply' | 'detailed_response' | 'escalation' {
    if (shouldHandover) {
      return 'escalation';
    }

    if (content.length < 100) {
      return 'quick_reply';
    }

    return 'detailed_response';
  }
}

export const enhancedAIService = new EnhancedAIService();
