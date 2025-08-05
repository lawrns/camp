import { useEffect, useState } from "react";
import {
  Warning as AlertCircle,
  CheckCircle,
  Copy,
  Lightbulb,
  Spinner as Loader2,
  ArrowsClockwise as RefreshCw,
  PaperPlaneTilt as Send,
  Sparkle as Sparkles,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { useUIStore } from "@/store/domains/ui/ui-store";

/**
 * AI Suggested Replies Component - MASSUPGRADE.md Phase 3
 *
 * Connects to /api/ai/suggested-replies endpoint
 * Provides real AI-generated reply suggestions for agents
 */

("use client");

interface SuggestedReply {
  id: string;
  content: string;
  confidence: number;
  reasoning: string;
  category: "helpful" | "empathetic" | "technical" | "closing";
  sources?: Array<{
    title: string;
    excerpt: string;
  }>;
}

interface SuggestedRepliesProps {
  conversationId: string;
  organizationId: string;
  lastMessage?: string;
  onReplySelect?: (reply: string) => void;
  onReplySend?: (reply: string) => void;
  className?: string;
}

export function SuggestedReplies({
  conversationId,
  organizationId,
  lastMessage,
  onReplySelect,
  onReplySend,
  className = "",
}: SuggestedRepliesProps) {
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReply, setSelectedReply] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { addNotification } = useUIStore();

  // Fetch suggestions when last message changes
  useEffect(() => {
    if (lastMessage && lastMessage.trim()) {
      fetchSuggestions();
    }
  }, [lastMessage, conversationId]);

  const fetchSuggestions = async () => {
    if (!lastMessage?.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggested-replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          organizationId,
          lastMessage: lastMessage.trim(),
          context: "agent_dashboard",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch suggestions");
      }

      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReply = async (reply: SuggestedReply) => {
    try {
      await navigator.clipboard.writeText(reply.content);
      setCopiedId(reply.id);

      addNotification({
        type: "success",
        message: "Reply copied to clipboard",
      });

      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      addNotification({
        type: "error",
        message: "Failed to copy reply",
      });
    }
  };

  const handleSelectReply = (reply: SuggestedReply) => {
    setSelectedReply(reply.content);
    if (onReplySelect) {
      onReplySelect(reply.content);
    }
  };

  const handleSendReply = () => {
    if (selectedReply.trim() && onReplySend) {
      onReplySend(selectedReply);
      setSelectedReply("");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "helpful":
        return "bg-blue-100 text-blue-800";
      case "empathetic":
        return "bg-green-100 text-green-800";
      case "technical":
        return "bg-purple-100 text-purple-800";
      case "closing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-ds-2">
            <Icon icon={Sparkles} className="h-5 w-5" />
            AI Suggested Replies
          </div>
          <Button onClick={fetchSuggestions} disabled={isLoading || !lastMessage?.trim()} variant="outline" size="sm">
            {isLoading ? (
              <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon={RefreshCw} className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>AI-generated reply suggestions based on conversation context</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-spacing-lg">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Loader2} className="h-5 w-5 animate-spin" />
              <span className="text-foreground text-sm">Generating suggestions...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border-status-error-light flex items-center gap-ds-2 rounded-ds-md border bg-[var(--fl-color-danger-subtle)] spacing-3">
            <Icon icon={AlertCircle} className="h-4 w-4 text-red-600" />
            <span className="text-red-600-dark text-sm">{error}</span>
          </div>
        )}

        {/* No Message State */}
        {!lastMessage?.trim() && !isLoading && (
          <div className="p-spacing-lg text-center text-[var(--fl-color-text-muted)]">
            <Icon icon={Lightbulb} className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Waiting for customer message to generate suggestions</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((reply: unknown) => (
              <div
                key={reply.id}
                className="cursor-pointer rounded-ds-lg border spacing-3 transition-colors hover:bg-[var(--fl-color-background-subtle)]"
                onClick={() => handleSelectReply(reply)}
              >
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="outline" className={getCategoryColor(reply.category)}>
                      {reply.category}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(reply.confidence)}`}>
                      {Math.round(reply.confidence * 100)}% confidence
                    </span>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyReply(reply);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    {copiedId === reply.id ? (
                      <Icon icon={CheckCircle} className="text-semantic-success-dark h-4 w-4" />
                    ) : (
                      <Icon icon={Copy} className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Content */}
                <p className="leading-relaxed mb-2 text-sm text-gray-800">{reply.content}</p>

                {/* Reasoning */}
                <p className="text-foreground text-tiny italic">{reply.reasoning}</p>

                {/* Sources */}
                {reply.sources && reply.sources.length > 0 && (
                  <div className="mt-2 border-t border-[var(--fl-color-border-subtle)] pt-2">
                    <p className="mb-1 text-tiny text-[var(--fl-color-text-muted)]">Based on:</p>
                    <div className="space-y-1">
                      {reply.sources.map((source: { title: string; excerpt: string }, index: number) => (
                        <div key={index} className="text-foreground text-tiny">
                          <span className="font-medium">{source.title}</span>
                          <span className="text-[var(--fl-color-text-muted)]"> - {source.excerpt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Suggestions */}
        {!isLoading && !error && lastMessage?.trim() && suggestions.length === 0 && (
          <div className="p-spacing-lg text-center text-[var(--fl-color-text-muted)]">
            <Icon icon={Lightbulb} className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No suggestions available for this message</p>
            <Button onClick={fetchSuggestions} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* Selected Reply Editor */}
        {selectedReply && (
          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-medium">Edit and send reply:</label>
            <Textarea
              value={selectedReply}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedReply(e.target.value)}
              placeholder="Edit the suggested reply before sending..."
              rows={3}
              className="w-full"
            />
            <div className="flex gap-ds-2">
              <Button onClick={handleSendReply} disabled={!selectedReply.trim()} className="flex-1" leftIcon={<Icon icon={Send} className="h-4 w-4" />}>
                Send Reply
              </Button>
              <Button onClick={() => setSelectedReply("")} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuggestedReplies;
