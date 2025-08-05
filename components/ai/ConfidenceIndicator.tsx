import React, { useState } from "react";
import { AlertTriangle as AlertTriangle, Brain, CheckCircle, Info, TrendUp as TrendingUp, Zap as Zap,  } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";

interface ConfidenceBreakdown {
  overall: number;
  knowledge: number;
  context: number;
  historical: number;
  sentiment: number;
  shouldEscalate: boolean;
}

interface ConfidenceIndicatorProps {
  confidence: ConfidenceBreakdown;
  shouldShowToUser: boolean;
  onEscalate?: () => void;
  onFeedback?: (feedback: "helpful" | "not_helpful" | "escalate_needed") => void;
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  shouldShowToUser,
  onEscalate,
  onFeedback,
  className = "",
}: ConfidenceIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-[var(--fl-color-success-subtle)]";
    if (score >= 0.6) return "text-yellow-600 bg-[var(--fl-color-warning-subtle)]";
    return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <Icon icon={CheckCircle} className="h-4 w-4" />;
    if (score >= 0.6) return <Icon icon={Info} className="h-4 w-4" />;
    return <Icon icon={AlertTriangle} className="h-4 w-4" />;
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High Confidence";
    if (score >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  const handleFeedback = (feedback: "helpful" | "not_helpful" | "escalate_needed") => {
    setFeedbackGiven(true);
    onFeedback?.(feedback);
  };

  const handleEscalate = () => {
    onEscalate?.();
    handleFeedback("escalate_needed");
  };

  if (!shouldShowToUser) {
    return null;
  }

  const overallScore = Math.round(confidence.overall * 100);
  const colorClass = getConfidenceColor(confidence.overall);

  return (
    <div className={`rounded-ds-lg border spacing-3 ${className}`}>
      {/* Main Confidence Display */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 rounded-ds-full px-3 py-1 ${colorClass}`}>
          {getConfidenceIcon(confidence.overall)}
          <span className="text-sm font-medium">
            {getConfidenceLabel(confidence.overall)} ({overallScore}%)
          </span>
        </div>

        <div className="flex items-center gap-ds-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="hover:text-foreground text-sm text-[var(--fl-color-text-muted)]"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>

          {confidence.shouldEscalate && (
            <button
              onClick={handleEscalate}
              className="hover:bg-primary flex items-center gap-1 rounded-ds-md bg-brand-blue-500 px-3 py-1 text-sm text-white"
            >
              <Icon icon={Zap} className="h-3 w-3" />
              Get Human Help
            </button>
          )}
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          <div className="text-foreground text-sm">
            <div className="mb-2 flex items-center gap-ds-2">
              <Icon icon={Brain} className="h-4 w-4" />
              <span className="font-medium">Confidence Breakdown</span>
            </div>

            <div className="space-y-spacing-sm">
              <ConfidenceBar label="Knowledge Base" score={confidence.knowledge} />
              <ConfidenceBar label="Context Understanding" score={confidence.context} />
              <ConfidenceBar label="Historical Accuracy" score={confidence.historical} />
              <ConfidenceBar label="Sentiment Analysis" score={confidence.sentiment} />
            </div>
          </div>

          {/* Explanation */}
          <div className="rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm text-tiny text-[var(--fl-color-text-muted)]">
            {confidence.overall >= 0.8 && (
              <p>✅ High confidence: The AI has strong knowledge and context for this query.</p>
            )}
            {confidence.overall >= 0.6 && confidence.overall < 0.8 && (
              <p>⚠️ Medium confidence: The AI can help but may benefit from additional context.</p>
            )}
            {confidence.overall < 0.6 && (
              <p>🚨 Low confidence: This query may require human expertise for the best response.</p>
            )}
          </div>

          {/* Feedback Section */}
          {!feedbackGiven && (
            <div className="border-t border-[var(--fl-color-border)] pt-2">
              <p className="mb-2 text-tiny text-[var(--fl-color-text-muted)]">
                Was this confidence assessment helpful?
              </p>
              <div className="flex gap-ds-2">
                <button
                  onClick={() => handleFeedback("helpful")}
                  className="text-green-600-dark rounded bg-[var(--fl-color-success-subtle)] px-2 py-1 text-tiny hover:bg-green-200"
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => handleFeedback("not_helpful")}
                  className="text-red-600-dark rounded bg-[var(--fl-color-danger-subtle)] px-2 py-1 text-tiny hover:bg-red-200"
                >
                  👎 No
                </button>
                <button
                  onClick={() => handleFeedback("escalate_needed")}
                  className="text-status-info-dark rounded bg-[var(--fl-color-info-subtle)] px-2 py-1 text-tiny hover:bg-blue-200"
                >
                  🤝 Need Human
                </button>
              </div>
            </div>
          )}

          {feedbackGiven && (
            <div className="border-t border-[var(--fl-color-border)] pt-2">
              <p className="text-semantic-success-dark text-tiny">✅ Thank you for your feedback!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConfidenceBarProps {
  label: string;
  score: number;
}

function ConfidenceBar({ label, score }: ConfidenceBarProps) {
  const percentage = Math.round(score * 100);
  const barColor =
    score >= 0.8
      ? "bg-[var(--fl-color-success-subtle)]0"
      : score >= 0.6
        ? "bg-[var(--fl-color-warning-subtle)]0"
        : "bg-[var(--fl-color-danger-subtle)]0";

  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground min-w-0 flex-1 text-tiny">{label}</span>
      <div className="ml-2 flex items-center gap-ds-2">
        <div className="h-2 w-16 overflow-hidden rounded-ds-full bg-gray-200">
          <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="w-8 text-right text-tiny text-[var(--fl-color-text-muted)]">{percentage}%</span>
      </div>
    </div>
  );
}

// Hook for using confidence in components
export function useConfidenceResponse() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getConfidence = async (
    query: string,
    conversationId: string,
    organizationId: string,
    options: { generateResponse?: boolean; mailboxId?: number } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/confidence-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversationId,
          organizationId,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (
    conversationId: string,
    messageId: string,
    organizationId: string,
    feedback: "helpful" | "not_helpful" | "escalate_needed",
    userComment?: string
  ) => {
    try {
      const response = await fetch("/api/ai/confidence-response", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId,
          organizationId,
          feedback,
          userComment,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    getConfidence,
    sendFeedback,
    isLoading,
    error,
  };
}

// Example usage in a message component
export function MessageWithConfidence({
  message,
  conversationId,
  organizationId,
}: {
  message: unknown;
  conversationId: string;
  organizationId: string;
}) {
  const { sendFeedback } = useConfidenceResponse();

  const handleEscalate = () => {
    // Trigger handoff logic
  };

  const handleFeedback = (feedback: "helpful" | "not_helpful" | "escalate_needed") => {
    sendFeedback(conversationId, message.id, organizationId, feedback)
      .then(() => {})
      .catch(() => {});
  };

  return (
    <div className="space-y-3">
      {/* Message Content */}
      <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
        <p>{message.content}</p>
      </div>

      {/* Confidence Indicator */}
      {message.confidence && (
        <ConfidenceIndicator
          confidence={message.confidence.breakdown}
          shouldShowToUser={message.confidence.shouldShowToUser}
          onEscalate={handleEscalate}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
