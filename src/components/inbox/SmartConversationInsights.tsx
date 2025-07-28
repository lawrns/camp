"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Warning as AlertTriangle,
  ArrowRight,
  ChartBar as BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  Heart,
  Info,
  Lightbulb,
  ChatCircle as MessageCircle,
  Shield,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendDown as TrendingDown,
  TrendUp as TrendingUp,
  Users,
  XCircle,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Types for conversation insights
interface SentimentAnalysis {
  overall: "positive" | "neutral" | "negative";
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  trend: "improving" | "declining" | "stable";
  riskScore: number;
}

interface CustomerJourneyStage {
  stage: "awareness" | "consideration" | "purchase" | "onboarding" | "support" | "retention" | "advocacy";
  confidence: number;
  indicators: string[];
  nextLikelyActions: string[];
  recommendations: string[];
}

interface ConversationInsight {
  id: string;
  conversationId: string;
  type: "sentiment" | "journey" | "prediction" | "escalation" | "opportunity" | "risk";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  metadata: Record<string, any>;
  timestamp: string;
}

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  lifetimeValue: number;
  conversationHistory: number;
  satisfactionScore: number;
  riskScore: number;
  preferences: {
    communicationStyle: "formal" | "casual" | "technical";
    preferredChannels: string[];
    responseTimeExpectation: "immediate" | "fast" | "standard";
  };
}

interface SmartConversationInsightsProps {
  conversationId: string;
  customerId?: string;
  organizationId: string;
  onInsightAction?: (insight: ConversationInsight, action: string) => void;
  className?: string;
}

export function SmartConversationInsights({
  conversationId,
  customerId,
  organizationId,
  onInsightAction,
  className,
}: SmartConversationInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [customerJourney, setCustomerJourney] = useState<CustomerJourneyStage | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);

  // Mock data - in real implementation, this would come from AI analysis APIs
  useEffect(() => {
    const mockSentiment: SentimentAnalysis = {
      overall: "neutral",
      confidence: 0.78,
      emotions: {
        joy: 0.2,
        anger: 0.4,
        fear: 0.1,
        sadness: 0.2,
        surprise: 0.05,
        disgust: 0.05,
      },
      trend: "declining",
      riskScore: 0.65,
    };

    const mockJourney: CustomerJourneyStage = {
      stage: "support",
      confidence: 0.89,
      indicators: ["Technical issue reported", "Multiple follow-ups", "Escalation request"],
      nextLikelyActions: ["Request refund", "Cancel subscription", "Escalate to manager"],
      recommendations: [
        "Assign to senior technical support",
        "Offer compensation or credit",
        "Schedule follow-up call",
      ],
    };

    const mockProfile: CustomerProfile = {
      id: "customer-123",
      name: "John Smith",
      email: "john.smith@company.com",
      tier: "gold",
      lifetimeValue: 15420,
      conversationHistory: 23,
      satisfactionScore: 4.2,
      riskScore: 0.65,
      preferences: {
        communicationStyle: "formal",
        preferredChannels: ["email", "chat"],
        responseTimeExpectation: "fast",
      },
    };

    const mockInsights: ConversationInsight[] = [
      {
        id: "insight-1",
        conversationId,
        type: "escalation",
        title: "High Escalation Risk Detected",
        description: "Customer sentiment declining, multiple unresolved issues mentioned",
        severity: "high",
        confidence: 0.87,
        actionable: true,
        recommendations: [
          "Assign to senior agent immediately",
          "Offer proactive compensation",
          "Schedule manager callback",
        ],
        metadata: { triggerWords: ["frustrated", "unacceptable", "cancel"], responseTime: "5min+" },
        timestamp: "2 minutes ago",
      },
      {
        id: "insight-2",
        conversationId,
        type: "opportunity",
        title: "Upsell Opportunity Identified",
        description: "Customer asking about premium features, showing purchase intent",
        severity: "medium",
        confidence: 0.72,
        actionable: true,
        recommendations: ["Introduce premium plan benefits", "Offer limited-time discount", "Connect with sales team"],
        metadata: { keywords: ["premium", "upgrade", "features"], intent: "purchase" },
        timestamp: "5 minutes ago",
      },
      {
        id: "insight-3",
        conversationId,
        type: "prediction",
        title: "Response Strategy Suggestion",
        description: "Based on customer profile, formal tone with technical details recommended",
        severity: "low",
        confidence: 0.94,
        actionable: true,
        recommendations: [
          "Use formal communication style",
          "Include technical documentation links",
          "Offer screen-sharing session",
        ],
        metadata: { communicationStyle: "formal", customerTier: "gold" },
        timestamp: "Just now",
      },
    ];

    setSentimentAnalysis(mockSentiment);
    setCustomerJourney(mockJourney);
    setCustomerProfile(mockProfile);
    setInsights(mockInsights);
  }, [conversationId]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-muted)]";
      case "negative":
        return "text-red-600 bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]";
      case "neutral":
        return "text-yellow-600 bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)]";
      default:
        return "text-gray-600 bg-[var(--fl-color-background-subtle)] border-[var(--fl-color-border)]";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500 bg-[var(--fl-color-danger-subtle)]";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-yellow-500 bg-[var(--fl-color-warning-subtle)]";
      case "low":
        return "border-l-blue-500 bg-[var(--fl-color-info-subtle)]";
      default:
        return "border-l-gray-500 bg-[var(--fl-color-background-subtle)]";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "sentiment":
        return <Icon icon={Heart} className="h-4 w-4" />;
      case "journey":
        return <Icon icon={Target} className="h-4 w-4" />;
      case "prediction":
        return <Icon icon={Brain} className="h-4 w-4" />;
      case "escalation":
        return <Icon icon={AlertTriangle} className="h-4 w-4" />;
      case "opportunity":
        return <Icon icon={Star} className="h-4 w-4" />;
      case "risk":
        return <Icon icon={Shield} className="h-4 w-4" />;
      default:
        return <Icon icon={Info} className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-purple-100 text-purple-800";
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "silver":
        return "bg-gray-100 text-gray-800";
      case "bronze":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getJourneyStageColor = (stage: string) => {
    const colors = {
      awareness: "bg-blue-100 text-blue-800",
      consideration: "bg-purple-100 text-purple-800",
      purchase: "bg-green-100 text-green-800",
      onboarding: "bg-indigo-100 text-indigo-800",
      support: "bg-orange-100 text-orange-800",
      retention: "bg-yellow-100 text-yellow-800",
      advocacy: "bg-pink-100 text-pink-800",
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleInsightAction = (insight: ConversationInsight, action: string) => {
    onInsightAction?.(insight, action);

    // Update insight status or remove from list
    setInsights((prev) =>
      prev.map((i: ConversationInsight) =>
        i.id === insight.id
          ? { ...i, metadata: { ...i.metadata, actionTaken: action, actionTimestamp: new Date().toISOString() } }
          : i
      )
    );
  };

  return (
    <div className={cn("smart-conversation-insights space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Smart Insights</h3>
          <p className="text-foreground text-sm">AI-powered conversation analysis</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Icon icon={Brain} className="h-3 w-3" />
          AI Powered
        </Badge>
      </div>

      {/* Customer Profile Summary */}
      {customerProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <Icon icon={Users} className="h-4 w-4" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{customerProfile.name}</h4>
                <p className="text-foreground text-sm">{customerProfile.email}</p>
              </div>
              <Badge className={getTierColor(customerProfile.tier)}>{customerProfile.tier.toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
              <div>
                <p className="text-foreground text-sm">Lifetime Value</p>
                <p className="text-base font-semibold">${customerProfile.lifetimeValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-foreground text-sm">Conversations</p>
                <p className="text-base font-semibold">{customerProfile.conversationHistory}</p>
              </div>
              <div>
                <p className="text-foreground text-sm">Satisfaction</p>
                <p className="text-base font-semibold">{customerProfile.satisfactionScore}/5</p>
              </div>
              <div>
                <p className="text-foreground text-sm">Risk Score</p>
                <p className="text-base font-semibold text-orange-600">{Math.round(customerProfile.riskScore * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Analysis */}
      {sentimentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <Icon icon={Heart} className="h-4 w-4" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getSentimentColor(sentimentAnalysis.overall)}>
                  {sentimentAnalysis.overall.toUpperCase()}
                </Badge>
                <span className="text-foreground text-sm">
                  Confidence: {Math.round(sentimentAnalysis.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-ds-2">
                {sentimentAnalysis.trend === "declining" ? (
                  <Icon icon={TrendingDown} className="text-brand-mahogany-500 h-4 w-4" />
                ) : sentimentAnalysis.trend === "improving" ? (
                  <Icon icon={TrendingUp} className="text-semantic-success h-4 w-4" />
                ) : (
                  <Icon icon={Activity} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                )}
                <span className="text-foreground text-sm capitalize">{sentimentAnalysis.trend}</span>
              </div>
            </div>

            <div className="space-y-spacing-sm">
              <div className="flex justify-between text-sm">
                <span>Risk Score</span>
                <span className="font-medium">{Math.round(sentimentAnalysis.riskScore * 100)}%</span>
              </div>
              <Progress value={sentimentAnalysis.riskScore * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-tiny">
              {Object.entries(sentimentAnalysis.emotions).map(([emotion, value]) => (
                <div key={emotion} className="text-center">
                  <p className="text-foreground capitalize">{emotion}</p>
                  <p className="font-medium">{Math.round(value * 100)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Journey Stage */}
      {customerJourney && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <Icon icon={Target} className="h-4 w-4" />
              Customer Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={getJourneyStageColor(customerJourney.stage)}>
                {customerJourney.stage.toUpperCase()}
              </Badge>
              <span className="text-foreground text-sm">
                Confidence: {Math.round(customerJourney.confidence * 100)}%
              </span>
            </div>

            <div>
              <h5 className="mb-2 font-medium text-gray-900">Key Indicators</h5>
              <div className="space-y-1">
                {customerJourney.indicators.map((indicator, index) => (
                  <div key={index} className="text-foreground flex items-center gap-ds-2 text-sm">
                    <Icon icon={CheckCircle} className="text-semantic-success h-3 w-3" />
                    {indicator}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="mb-2 font-medium text-gray-900">Likely Next Actions</h5>
              <div className="space-y-1">
                {customerJourney.nextLikelyActions.map((action, index) => (
                  <div key={index} className="text-foreground flex items-center gap-ds-2 text-sm">
                    <Icon icon={ArrowRight} className="h-3 w-3 text-[var(--fl-color-info)]" />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Insights */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Actionable Insights</h4>
        {insights.map((insight: ConversationInsight) => (
          <Card key={insight.id} className={cn("border-l-4", getSeverityColor(insight.severity))}>
            <CardContent className="spacing-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-ds-2">
                    {getInsightIcon(insight.type)}
                    <h5 className="font-semibold text-gray-900">{insight.title}</h5>
                    <Badge
                      variant="secondary"
                      className={cn(
                        insight.severity === "critical" && "bg-status-error-light text-red-800",
                        insight.severity === "high" && "bg-orange-100 text-orange-800",
                        insight.severity === "medium" && "bg-status-warning-light text-yellow-800",
                        insight.severity === "low" && "bg-status-info-light text-blue-800"
                      )}
                    >
                      {insight.severity}
                    </Badge>
                    <span className="text-tiny text-[var(--fl-color-text-muted)]">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>

                  <p className="text-foreground mb-3 text-sm">{insight.description}</p>

                  <div className="space-y-spacing-sm">
                    <h6 className="text-tiny font-medium uppercase tracking-wide text-gray-900">Recommendations</h6>
                    {insight.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="text-foreground flex items-center gap-ds-2 text-sm">
                        <Icon icon={Lightbulb} className="text-semantic-warning h-3 w-3" />
                        {rec}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                    <span>{insight.timestamp}</span>
                    <span>Type: {insight.type}</span>
                  </div>
                </div>

                {insight.actionable && !insight.metadata?.actionTaken && (
                  <div className="ml-4 flex gap-ds-2">
                    <Button size="sm" onClick={() => handleInsightAction(insight, "apply")} className="gap-1">
                      <Icon icon={Zap} className="h-3 w-3" />
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleInsightAction(insight, "dismiss")}>
                      Dismiss
                    </Button>
                  </div>
                )}

                {insight.metadata?.actionTaken && (
                  <Badge variant="secondary" className="ml-4">
                    {insight.metadata.actionTaken === "apply" ? "Applied" : "Dismissed"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
