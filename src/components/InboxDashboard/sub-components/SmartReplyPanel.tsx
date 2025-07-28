/**
 * Smart Reply Panel - AGENT DASHBOARD COMPONENT ONLY
 *
 * Displays AI-generated smart reply suggestions for agents
 * CRITICAL: This component exists only in the agent dashboard
 * Widget has NO access to smart replies or AI suggestions
 *
 * Features:
 * - AI-powered reply suggestions
 * - Confidence indicators
 * - One-click reply insertion
 * - Tone and category indicators
 * - Performance metrics
 */

import { SmartReplyService } from "@/lib/ai/SmartReplyService";
import { AlertTriangle, Clock, MessageSquare, Sparkles, TrendingUp, Zap } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface SmartReplyPanelProps {
  conversationId: string;
  organizationId: string;
  customerMessage: string;
  conversationHistory: Array<{
    content: string;
    senderType: "customer" | "agent";
    timestamp: string;
  }>;
  onReplySelect: (reply: string) => void;
  isVisible: boolean;
}

interface SmartReply {
  id: string;
  content: string;
  confidence: number;
  category: "helpful" | "empathetic" | "solution" | "escalation" | "closing";
  tone: "professional" | "friendly" | "empathetic" | "direct";
  estimatedResponseTime?: string;
  suggestedActions?: string[];
}

export const SmartReplyPanel: React.FC<SmartReplyPanelProps> = ({
  conversationId,
  organizationId,
  customerMessage,
  conversationHistory,
  onReplySelect,
  isVisible,
}) => {
  const [smartReplies, setSmartReplies] = useState<SmartReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentiment, setSentiment] = useState<string>("neutral");
  const [urgencyLevel, setUrgencyLevel] = useState<string>("medium");
  const [suggestedHandover, setSuggestedHandover] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const smartReplyService = new SmartReplyService();

  // Generate smart replies when customer message changes
  useEffect(() => {
    if (customerMessage && isVisible) {
      generateSmartReplies();
    }
  }, [customerMessage, isVisible]);

  const generateSmartReplies = useCallback(async () => {
    if (!customerMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await smartReplyService.generateSmartReplies({
        conversationId,
        organizationId,
        customerMessage,
        conversationHistory,
        customerProfile: {
          // Could be enhanced with actual customer data
          preferredLanguage: "en",
        },
        businessContext: {
          industry: "Technology",
          supportCategory: "General",
        },
      });

      setSmartReplies(response.suggestions);
      setSentiment(response.conversationSentiment);
      setUrgencyLevel(response.urgencyLevel);
      setSuggestedHandover(response.suggestedHandover);
      setProcessingTime(response.processingTime);
    } catch (error) {

      setError("Failed to generate suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, organizationId, customerMessage, conversationHistory]);

  const handleReplyClick = (reply: SmartReply) => {
    onReplySelect(reply.content);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-[var(--fl-color-success-subtle)]";
    if (confidence >= 0.6) return "text-yellow-600 bg-[var(--fl-color-warning-subtle)]";
    return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "helpful":
        return <MessageSquare className="h-4 w-4" />;
      case "empathetic":
        return <Sparkles className="h-4 w-4" />;
      case "solution":
        return <Zap className="h-4 w-4" />;
      case "escalation":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      case "frustrated":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-background flex w-80 flex-col border-l border-[var(--fl-color-border)]">
      {/* Panel header with proper spacing */}
      <div className="border-b border-ds-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Smart Replies</h3>
          </div>
          <div className="flex items-center gap-ds-4">
            {processingTime > 0 && (
              <div className="flex items-center gap-1 text-sm text-foreground-muted">
                <Clock className="h-3 w-3" />
                <span>{processingTime.toFixed(0)}ms</span>
              </div>
            )}
            <span className="text-sm text-foreground-muted">AI-powered suggestions</span>
          </div>
        </div>
      </div>

      {/* Conversation Analysis */}
      <div className="mt-3 space-y-spacing-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Sentiment:</span>
          <span className={`font-medium capitalize ${getSentimentColor(sentiment)}`}>{sentiment}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Urgency:</span>
          <span
            className={`font-medium capitalize ${urgencyLevel === "critical"
              ? "text-red-600"
              : urgencyLevel === "high"
                ? "text-orange-600"
                : urgencyLevel === "medium"
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
          >
            {urgencyLevel}
          </span>
        </div>
        {suggestedHandover && (
          <div className="flex items-center space-x-spacing-sm rounded-ds-lg bg-orange-50 p-spacing-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">Consider human handover</span>
          </div>
        )}
      </div>

      {/* AI Suggestions section */}
      <div className="p-spacing-lg">
        <h4 className="mb-4 font-medium text-gray-900">AI Suggestions</h4>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="bg-background h-16 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-[var(--fl-color-danger)]" />
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={generateSmartReplies} className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                Try again
              </button>
            </div>
          ) : smartReplies.length === 0 ? (
            <div className="rounded-ds-lg bg-blue-50 p-spacing-md">
              <p className="text-sm text-blue-700">
                AI-powered response suggestions and customer insights will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {smartReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="group cursor-pointer rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 transition-all hover:border-[var(--fl-color-border-interactive)] hover:shadow-card-base"
                  onClick={() => handleReplyClick(reply)}
                >
                  {/* Reply Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-spacing-sm">
                      <div className="text-foreground">{getCategoryIcon(reply.category)}</div>
                      <span className="text-foreground text-tiny font-medium capitalize">{reply.category}</span>
                      <span className="text-tiny capitalize text-[var(--fl-color-text-muted)]">{reply.tone}</span>
                    </div>
                    <div className={`rounded-ds-full px-2 py-1 text-xs font-medium ${getConfidenceColor(reply.confidence)}`}>
                      {Math.round(reply.confidence * 100)}%
                    </div>
                  </div>

                  {/* Reply Content */}
                  <p className="mb-2 text-sm text-gray-800 group-hover:text-gray-900">{reply.content}</p>

                  {/* Reply Metadata */}
                  <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
                    {reply.estimatedResponseTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{reply.estimatedResponseTime}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <TrendingUp className="h-3 w-3" />
                      <span>Click to use</span>
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  {reply.suggestedActions && reply.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reply.suggestedActions.map((action, index) => (
                        <span
                          key={index}
                          className="rounded-ds-full bg-[var(--fl-color-info-subtle)] px-2 py-1 text-tiny text-blue-700"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="text-foreground flex items-center justify-between text-tiny">
            <span>AI-powered suggestions</span>
            <button
              onClick={generateSmartReplies}
              disabled={isLoading}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
