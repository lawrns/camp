/**
 * Real-time Sentiment Analysis Service
 *
 * Monitors conversation sentiment in real-time and triggers alerts
 * when negative sentiment is detected or escalation risk is high.
 */

import { analyseSentiment, analyzeConversationSentiment, type SentimentAnalysis } from "@/lib/ai/sentiment";
import { supabase } from "@/lib/supabase";

const supabaseClient = supabase.admin();

export interface SentimentAlert {
  conversationId: string;
  organizationId: string;
  alertType: "negative_sentiment" | "escalation_risk" | "sentiment_decline";
  severity: "low" | "medium" | "high" | "critical";
  sentiment: SentimentAnalysis;
  conversationTrend?: {
    overallSentiment: string;
    sentimentTrend: "improving" | "declining" | "stable";
    escalationRisk: number;
  };
  recommendedActions: string[];
  timestamp: string;
}

export class RealTimeSentimentService {
  private alertThresholds = {
    negativeConfidence: 0.7,
    escalationRisk: 0.6,
    sentimentDeclineThreshold: 0.3,
  };

  /**
   * Analyze message sentiment and trigger alerts if needed
   */
  async analyzeMessageSentiment(
    messageId: string,
    conversationId: string,
    content: string,
    organizationId: string
  ): Promise<SentimentAlert | null> {
    try {
      // Analyze current message sentiment
      const sentiment = analyseSentiment(content);

      // Get conversation history for trend analysis
      const { data: messages } = await supabase
        .from("messages")
        .select("content, sender_type, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      let conversationTrend = null;
      if (messages && messages.length > 1) {
        conversationTrend = analyzeConversationSentiment(messages);
      }

      // Check for alert conditions
      const alert = this.checkAlertConditions(conversationId, organizationId, sentiment, conversationTrend);

      if (alert) {
        // Store sentiment data
        await this.storeSentimentData(messageId, conversationId, sentiment, conversationTrend);

        // Trigger real-time alert
        await this.triggerSentimentAlert(alert);

        return alert;
      }

      // Store sentiment data even if no alert
      await this.storeSentimentData(messageId, conversationId, sentiment, conversationTrend);

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if sentiment conditions warrant an alert
   */
  private checkAlertConditions(
    conversationId: string,
    organizationId: string,
    sentiment: SentimentAnalysis,
    conversationTrend: any
  ): SentimentAlert | null {
    const alerts: SentimentAlert[] = [];

    // Check for negative sentiment
    if (
      (sentiment.sentiment === "frustrated" || sentiment.sentiment === "angry") &&
      sentiment.confidence >= this.alertThresholds.negativeConfidence
    ) {
      alerts.push({
        conversationId,
        organizationId,
        alertType: "negative_sentiment",
        severity: sentiment.sentiment === "angry" ? "high" : "medium",
        sentiment,
        conversationTrend,
        recommendedActions: this.getRecommendedActions("negative_sentiment", sentiment),
        timestamp: new Date().toISOString(),
      });
    }

    // Check for escalation risk
    if (conversationTrend && conversationTrend.escalationRisk >= this.alertThresholds.escalationRisk) {
      alerts.push({
        conversationId,
        organizationId,
        alertType: "escalation_risk",
        severity: conversationTrend.escalationRisk >= 0.8 ? "critical" : "high",
        sentiment,
        conversationTrend,
        recommendedActions: this.getRecommendedActions("escalation_risk", sentiment),
        timestamp: new Date().toISOString(),
      });
    }

    // Check for sentiment decline
    if (conversationTrend && conversationTrend.sentimentTrend === "declining" && sentiment.urgency === "high") {
      alerts.push({
        conversationId,
        organizationId,
        alertType: "sentiment_decline",
        severity: "medium",
        sentiment,
        conversationTrend,
        recommendedActions: this.getRecommendedActions("sentiment_decline", sentiment),
        timestamp: new Date().toISOString(),
      });
    }

    // Return the highest severity alert
    if (alerts.length > 0) {
      return alerts.sort((a, b) => {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })[0];
    }

    return null;
  }

  /**
   * Get recommended actions based on alert type and sentiment
   */
  private getRecommendedActions(alertType: string, sentiment: SentimentAnalysis): string[] {
    const actions: string[] = [];

    switch (alertType) {
      case "negative_sentiment":
        actions.push("Acknowledge the customer's frustration");
        actions.push("Offer immediate assistance");
        if (sentiment.sentiment === "angry") {
          actions.push("Consider escalating to senior agent");
          actions.push("Use empathetic language");
        }
        break;

      case "escalation_risk":
        actions.push("Escalate to human agent immediately");
        actions.push("Review conversation history");
        actions.push("Prepare resolution options");
        actions.push("Consider manager involvement");
        break;

      case "sentiment_decline":
        actions.push("Check if customer needs are being met");
        actions.push("Clarify any confusion");
        actions.push("Offer alternative solutions");
        break;
    }

    // Add urgency-specific actions
    if (sentiment.urgency === "high") {
      actions.push("Prioritize this conversation");
      actions.push("Respond within 2 minutes");
    }

    return actions;
  }

  /**
   * Store sentiment analysis data in database
   */
  private async storeSentimentData(
    messageId: string,
    conversationId: string,
    sentiment: SentimentAnalysis,
    conversationTrend: any
  ): Promise<void> {
    try {
      await supabase.from("conversation_sentiment_tracking").insert({
        message_id: messageId,
        conversation_id: conversationId,
        sentiment_type: sentiment.sentiment,
        confidence: sentiment.confidence,
        emotions: sentiment.emotions,
        urgency: sentiment.urgency,
        complexity: sentiment.complexity,
        keywords: sentiment.keywords,
        conversation_trend: conversationTrend
          ? {
              overall_sentiment: conversationTrend.overallSentiment,
              sentiment_trend: conversationTrend.sentimentTrend,
              escalation_risk: conversationTrend.escalationRisk,
            }
          : null,
        analyzed_at: new Date().toISOString(),
      });
    } catch (error) {}
  }

  /**
   * Trigger real-time sentiment alert
   */
  private async triggerSentimentAlert(alert: SentimentAlert): Promise<void> {
    try {
      // Store alert in database
      await supabase.from("sentiment_alerts").insert({
        conversation_id: alert.conversationId,
        organization_id: alert.organizationId,
        alert_type: alert.alertType,
        severity: alert.severity,
        sentiment_data: {
          sentiment: alert.sentiment.sentiment,
          confidence: alert.sentiment.confidence,
          emotions: alert.sentiment.emotions,
          urgency: alert.sentiment.urgency,
        },
        conversation_trend: alert.conversationTrend,
        recommended_actions: alert.recommendedActions,
        status: "active",
        created_at: alert.timestamp,
      });

      // Broadcast real-time alert to agents
      await supabase.channel(`organization:${alert.organizationId}`).send({
        type: "broadcast",
        event: "sentiment_alert",
        payload: alert,
      });
    } catch (error) {}
  }

  /**
   * Get sentiment alerts for a conversation
   */
  async getConversationAlerts(conversationId: string): Promise<SentimentAlert[]> {
    try {
      const { data: alerts } = await supabase
        .from("sentiment_alerts")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      return (
        alerts?.map((alert: unknown) => ({
          conversationId: alert.conversation_id,
          organizationId: alert.organization_id,
          alertType: alert.alert_type,
          severity: alert.severity,
          sentiment: alert.sentiment_data,
          conversationTrend: alert.conversation_trend,
          recommendedActions: alert.recommended_actions,
          timestamp: alert.created_at,
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Mark sentiment alert as resolved
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from("sentiment_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);
    } catch (error) {}
  }
}

// Export singleton instance
export const realTimeSentimentService = new RealTimeSentimentService();
