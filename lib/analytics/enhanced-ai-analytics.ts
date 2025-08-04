/**
 * Enhanced AI Analytics Service
 * 
 * Tracks and analyzes the performance of the enhanced AI features including
 * RAG responses, handover decisions, confidence scoring, and user satisfaction.
 */

import { supabase } from '@/lib/supabase';

export interface AIInteractionMetrics {
  conversationId?: string;
  organizationId: string; // API level - maps to business_id in database
  messageId?: string;
  aiResponseTime: number;
  confidence: number;
  sentiment: string;
  handoverTriggered: boolean;
  handoverReason?: string;
  sourcesUsed: number;
  empathyScore: number;
  userSatisfaction?: number; // 1-5 rating
  responseCategory: 'quick_reply' | 'detailed_response' | 'escalation';
  timestamp: string;
}

export interface AIPerformanceMetrics {
  totalInteractions: number;
  averageConfidence: number;
  averageResponseTime: number;
  handoverRate: number;
  satisfactionScore: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseTimeDistribution: {
    fast: number; // <1s
    medium: number; // 1-3s
    slow: number; // >3s
  };
  confidenceDistribution: {
    high: number; // >0.8
    medium: number; // 0.5-0.8
    low: number; // <0.5
  };
}

export interface AITrendData {
  date: string;
  interactions: number;
  averageConfidence: number;
  handoverRate: number;
  satisfactionScore: number;
  averageResponseTime: number;
}

export class EnhancedAIAnalyticsService {
  /**
   * Track an AI interaction using existing AIInteraction table
   */
  async trackInteraction(metrics: AIInteractionMetrics): Promise<void> {
    try {
      const supabaseClient = supabase.server();

      const { error } = await supabaseClient
        .from('AIInteraction')
        .insert({
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: metrics.conversationId || `session_${Date.now()}`,
          type: 'enhanced_response',
          input: metrics.conversationId || 'conversation',
          output: 'ai_response',
          business_id: metrics.organizationId, // Map organizationId to business_id
          confidence: metrics.confidence,
          sentiment: metrics.sentiment,
          handover_triggered: metrics.handoverTriggered,
          handover_reason: metrics.handoverReason,
          sources_used: metrics.sourcesUsed,
          empathy_score: metrics.empathyScore,
          user_satisfaction: metrics.userSatisfaction,
          response_category: metrics.responseCategory,
          response_time_ms: metrics.aiResponseTime,
          createdAt: metrics.timestamp,
          metadata: {
            messageId: metrics.messageId,
            conversationId: metrics.conversationId,
          },
        });

      if (error) {
        console.error('Error tracking AI interaction:', error);
      }
    } catch (error) {
      console.error('Error in trackInteraction:', error);
    }
  }

  /**
   * Get AI performance metrics for a time period using existing AIInteraction table
   */
  async getPerformanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AIPerformanceMetrics> {
    try {
      const supabaseClient = supabase.server();

      const { data, error } = await supabaseClient
        .from('AIInteraction')
        .select('*')
        .eq('business_id', organizationId) // Map organizationId to business_id
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return this.getEmptyMetrics();
      }

      const totalInteractions = data.length;
      const averageConfidence = data.reduce((sum, item) => sum + (item.confidence || 0), 0) / totalInteractions;
      const averageResponseTime = data.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / totalInteractions;
      const handoverCount = data.filter(item => item.handover_triggered).length;
      const handoverRate = handoverCount / totalInteractions;
      
      const satisfactionData = data.filter(item => item.user_satisfaction !== null);
      const satisfactionScore = satisfactionData.length > 0
        ? satisfactionData.reduce((sum, item) => sum + item.user_satisfaction, 0) / satisfactionData.length
        : 0;

      // Calculate distributions
      const sentimentCounts = data.reduce((acc, item) => {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const responseTimeCounts = data.reduce((acc, item) => {
        const responseTime = item.response_time_ms || 0;
        if (responseTime < 1000) acc.fast++;
        else if (responseTime < 3000) acc.medium++;
        else acc.slow++;
        return acc;
      }, { fast: 0, medium: 0, slow: 0 });

      const confidenceCounts = data.reduce((acc, item) => {
        const confidence = item.confidence || 0;
        if (confidence > 0.8) acc.high++;
        else if (confidence > 0.5) acc.medium++;
        else acc.low++;
        return acc;
      }, { high: 0, medium: 0, low: 0 });

      return {
        totalInteractions,
        averageConfidence,
        averageResponseTime,
        handoverRate,
        satisfactionScore,
        sentimentDistribution: {
          positive: sentimentCounts.positive || 0,
          neutral: sentimentCounts.neutral || 0,
          negative: sentimentCounts.negative || 0,
        },
        responseTimeDistribution: responseTimeCounts,
        confidenceDistribution: confidenceCounts,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get AI performance trends over time
   */
  async getTrendData(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<AITrendData[]> {
    try {
      const supabaseClient = supabase.server();
      
      // Get raw data
      const { data, error } = await supabaseClient
        .from('AIInteraction')
        .select('*')
        .eq('business_id', organizationId) // Map organizationId to business_id
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString())
        .order('createdAt', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group data by time period
      const groupedData = this.groupDataByTime(data, granularity);
      
      return Object.entries(groupedData).map(([date, items]) => {
        const interactions = items.length;
        const averageConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / interactions;
        const handoverCount = items.filter(item => item.handover_triggered).length;
        const handoverRate = handoverCount / interactions;
        const averageResponseTime = items.reduce((sum, item) => sum + item.ai_response_time, 0) / interactions;
        
        const satisfactionData = items.filter(item => item.user_satisfaction !== null);
        const satisfactionScore = satisfactionData.length > 0
          ? satisfactionData.reduce((sum, item) => sum + item.user_satisfaction, 0) / satisfactionData.length
          : 0;

        return {
          date,
          interactions,
          averageConfidence,
          handoverRate,
          satisfactionScore,
          averageResponseTime,
        };
      });
    } catch (error) {
      console.error('Error getting trend data:', error);
      return [];
    }
  }

  /**
   * Get real-time AI metrics (last hour)
   */
  async getRealTimeMetrics(organizationId: string): Promise<{
    activeConversations: number;
    averageResponseTime: number;
    currentConfidence: number;
    recentHandovers: number;
  }> {
    try {
      const supabaseClient = supabase.server();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data, error } = await supabaseClient
        .from('AIInteraction')
        .select('*')
        .eq('business_id', organizationId) // Map organizationId to business_id
        .gte('createdAt', oneHourAgo.toISOString());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          activeConversations: 0,
          averageResponseTime: 0,
          currentConfidence: 0,
          recentHandovers: 0,
        };
      }

      const uniqueConversations = new Set(data.map(item => item.sessionId)).size;
      const averageResponseTime = data.reduce((sum, item) => sum + item.ai_response_time, 0) / data.length;
      const currentConfidence = data.reduce((sum, item) => sum + item.confidence, 0) / data.length;
      const recentHandovers = data.filter(item => item.handover_triggered).length;

      return {
        activeConversations: uniqueConversations,
        averageResponseTime,
        currentConfidence,
        recentHandovers,
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return {
        activeConversations: 0,
        averageResponseTime: 0,
        currentConfidence: 0,
        recentHandovers: 0,
      };
    }
  }

  private getEmptyMetrics(): AIPerformanceMetrics {
    return {
      totalInteractions: 0,
      averageConfidence: 0,
      averageResponseTime: 0,
      handoverRate: 0,
      satisfactionScore: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      responseTimeDistribution: { fast: 0, medium: 0, slow: 0 },
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
    };
  }

  private groupDataByTime(data: unknown[], granularity: 'hour' | 'day' | 'week'): Record<string, any[]> {
    return data.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      let key: string;

      switch (granularity) {
        case 'hour':
          key = date.toISOString().slice(0, 13) + ':00:00.000Z';
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }
}

export const enhancedAIAnalytics = new EnhancedAIAnalyticsService();
