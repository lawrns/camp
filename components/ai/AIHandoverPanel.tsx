import { useEffect, useState } from "react";
import {
  Warning as AlertCircle,
  Robot as Bot,
  Brain,
  Spinner as Loader2,
  ChatCircle as MessageSquare,
  Play,
  Square,
  User,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Switch } from "@/components/unified-ui/components/switch";
import { Icon } from "@/lib/ui/Icon";
import { useUIStore } from "@/store/domains/ui/ui-store";

("use client");

/**
 * AI Handover Panel Component - MASSUPGRADE.md Phase 3
 *
 * Connects to /api/ai/handover/* endpoints
 * Provides real AI handover controls with status tracking
 */

interface AIHandoverPanelProps {
  conversationId: string;
  organizationId: string;
  onStatusChange?: (status: AIHandoverStatus) => void;
}

interface AIHandoverStatus {
  isActive: boolean;
  confidence: number;
  strategy: string;
  lastResponse?: string;
  responseCount: number;
  startedAt?: string;
  error?: string;
}

export function AIHandoverPanel({ conversationId, organizationId, onStatusChange }: AIHandoverPanelProps) {
  const [status, setStatus] = useState<AIHandoverStatus>({
    isActive: false,
    confidence: 0,
    strategy: "none",
    responseCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addNotification } = useUIStore();

  // Check current AI handover status on mount
  useEffect(() => {
    checkHandoverStatus();
  }, [conversationId]);

  const checkHandoverStatus = async () => {
    try {
      const response = await fetch(`/api/ai/handover/status?conversationId=${conversationId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(result.status);
        if (onStatusChange) {
          onStatusChange(result.status);
        }
      }
    } catch (error) {}
  };

  const startAIHandover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai?action=handover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start AI handover");
      }

      if (result.success) {
        const newStatus = {
          isActive: true,
          confidence: result.confidence || 0.8,
          strategy: result.strategy || "knowledge_base",
          responseCount: 0,
          startedAt: new Date().toISOString(),
        };

        setStatus(newStatus);

        addNotification({
          type: "success",
          message: "AI handover started successfully",
        });

        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);

      addNotification({
        type: "error",
        message: `Failed to start AI handover: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopAIHandover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai?action=handover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to stop AI handover");
      }

      if (result.success) {
        const newStatus = {
          isActive: false,
          confidence: 0,
          strategy: "none",
          responseCount: status.responseCount,
        };

        setStatus(newStatus);

        addNotification({
          type: "info",
          message: "AI handover stopped",
        });

        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);

      addNotification({
        type: "error",
        message: `Failed to stop AI handover: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHandover = async () => {
    if (status.isActive) {
      await stopAIHandover();
    } else {
      await startAIHandover();
    }
  };

  const getStrategyDisplay = (strategy: string) => {
    switch (strategy) {
      case "knowledge_base":
        return { label: "Knowledge Base", icon: Brain, color: "bg-blue-100 text-blue-800" };
      case "conversation_context":
        return { label: "Context Aware", icon: MessageSquare, color: "bg-purple-100 text-purple-800" };
      case "fallback":
        return { label: "Fallback", icon: Bot, color: "bg-gray-100 text-gray-800" };
      default:
        return { label: "None", icon: User, color: "bg-gray-100 text-gray-800" };
    }
  };

  const strategyInfo = getStrategyDisplay(status.strategy);
  const StrategyIcon = strategyInfo.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-ds-2">
            <Icon icon={Bot} className="h-5 w-5" />
            AI Handover
          </div>
          <Badge
            variant={status.isActive ? "default" : "secondary"}
            className={status.isActive ? "bg-status-success-light text-green-800" : ""}
          >
            {status.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>Let AI handle responses automatically with intelligent context awareness</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main Toggle */}
        <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center gap-3">
            {status.isActive ? (
              <Icon icon={Bot} className="text-semantic-success-dark h-6 w-6" />
            ) : (
              <Icon icon={User} className="text-foreground h-6 w-6" />
            )}
            <div>
              <div className="font-medium">
                {status.isActive ? "AI is handling responses" : "Manual responses only"}
              </div>
              <div className="text-foreground text-sm">
                {status.isActive ? `Using ${strategyInfo.label} strategy` : "Click to enable AI assistance"}
              </div>
            </div>
          </div>

          <Switch checked={status.isActive} onChange={toggleHandover} disabled={isLoading} />
        </div>

        {/* AI Status Details */}
        {status.isActive && (
          <div className="space-y-3">
            {/* Strategy */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strategy:</span>
              <Badge variant="outline" className={strategyInfo.color}>
                <StrategyIcon className="mr-1 h-3 w-3" />
                {strategyInfo.label}
              </Badge>
            </div>

            {/* Confidence */}
            <div className="space-y-spacing-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence:</span>
                <span className="text-foreground text-sm">{Math.round(status.confidence * 100)}%</span>
              </div>
              <Progress value={status.confidence * 100} className="h-2" />
            </div>

            {/* Response Count */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Responses:</span>
              <span className="text-foreground text-sm">{status.responseCount}</span>
            </div>

            {/* Started At */}
            {status.startedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Started:</span>
                <span className="text-foreground text-sm">{new Date(status.startedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="border-status-error-light flex items-center gap-ds-2 rounded-ds-md border bg-[var(--fl-color-danger-subtle)] spacing-3">
            <Icon icon={AlertCircle} className="h-4 w-4 text-red-600" />
            <span className="text-red-600-dark text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-ds-2 pt-2">
          <Button
            onClick={toggleHandover}
            disabled={isLoading}
            variant={status.isActive ? "destructive" : "primary"}
            className="flex-1"
          >
            {isLoading ? (
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
            ) : status.isActive ? (
              <Icon icon={Square} className="mr-2 h-4 w-4" />
            ) : (
              <Icon icon={Play} className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Processing..." : status.isActive ? "Stop AI" : "Start AI"}
          </Button>

          <Button onClick={checkHandoverStatus} variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {/* Help Text */}
        <div className="rounded-ds-md bg-[var(--fl-color-background-subtle)] spacing-3 text-tiny text-[var(--fl-color-text-muted)]">
          <strong>How it works:</strong> When enabled, AI will automatically respond to visitor messages using knowledge
          base content and conversation context. You can take over at any time.
        </div>
      </CardContent>
    </Card>
  );
}

export default AIHandoverPanel;
