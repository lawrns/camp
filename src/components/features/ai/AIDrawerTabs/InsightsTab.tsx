"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Lightbulb,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import type { Conversation, ConversationWithRelations } from "@/types/entities/conversation";

interface InsightsTabProps {
  conversation: ConversationWithRelations;
  onActionSelect: (action: string) => void;
}

interface SmartSuggestion {
  id: string;
  type: "response" | "action" | "escalation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  action?: string;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ conversation, onActionSelect }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mock suggestions - in real app, generate from AI analysis
  const smartSuggestions: SmartSuggestion[] = [
    {
      id: "1",
      type: "escalation",
      title: "Consider Escalation",
      description:
        "Customer sentiment has declined over the last 3 messages. Technical issue may require specialist support.",
      confidence: 85,
      impact: "high",
      action: "/escalate Technical issue beyond standard support scope",
    },
    {
      id: "2",
      type: "response",
      title: "Offer Compensation",
      description:
        "Customer has experienced multiple issues. Consider offering a discount or credit to maintain satisfaction.",
      confidence: 78,
      impact: "medium",
      action:
        "We apologize for the inconvenience. As a gesture of goodwill, we'd like to offer you a 20% discount on your next purchase.",
    },
    {
      id: "3",
      type: "action",
      title: "Create Follow-up Ticket",
      description: "This issue may require long-term tracking. Create a ticket for proper resolution workflow.",
      confidence: 92,
      impact: "medium",
      action: "/ticket shipping-delay-investigation",
    },
  ];

  const conversationMetrics = {
    duration: "15 min",
    messageCount: 8,
    sentimentTrend: -15, // negative trend
    responseTime: "2.3 min avg",
    customerEffort: 7, // out of 10
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
      case "medium":
        return "text-orange-600 bg-orange-50";
      case "low":
        return "text-green-600 bg-[var(--fl-color-success-subtle)]";
      default:
        return "text-gray-600 bg-[var(--fl-color-background-subtle)]";
    }
  };

  const handleActionClick = (suggestion: SmartSuggestion) => {
    if (suggestion.action) {
      onActionSelect(suggestion.action);
    }
    setExpandedId(expandedId === suggestion.id ? null : suggestion.id);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 spacing-3">
        {/* Escalation Alert */}
        {smartSuggestions.some((s) => s.type === "escalation" && s.confidence > 80) && (
          <Alert className="border-orange-200 bg-orange-50">
            <Icon icon={AlertTriangle} className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>Escalation Recommended:</strong> AI confidence dropping, customer sentiment negative.
              <Button
                variant="link"
                className="ml-1 h-auto p-0 text-orange-700 underline"
                onClick={() => onActionSelect("/escalate")}
              >
                Escalate now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Conversation Metrics */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-900">Conversation Analytics</h4>
          <div className="grid grid-cols-2 gap-3">
            <Card className="spacing-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-tiny text-[var(--fl-color-text-muted)]">Duration</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{conversationMetrics.duration}</div>
                </div>
                <Icon icon={Clock} className="h-4 w-4 text-gray-400" />
              </div>
            </Card>

            <Card className="spacing-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-tiny text-[var(--fl-color-text-muted)]">Response Time</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{conversationMetrics.responseTime}</div>
                </div>
                <Icon icon={Zap} className="h-4 w-4 text-gray-400" />
              </div>
            </Card>

            <Card className="spacing-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-tiny text-[var(--fl-color-text-muted)]">Sentiment Trend</div>
                  <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-red-600">
                    <Icon icon={TrendingUp} className="h-3 w-3 rotate-180" />
                    {Math.abs(conversationMetrics.sentimentTrend)}%
                  </div>
                </div>
              </div>
            </Card>

            <Card className="spacing-3">
              <div>
                <div className="text-tiny text-[var(--fl-color-text-muted)]">Customer Effort</div>
                <div className="mt-1 flex items-center gap-ds-2">
                  <Progress value={conversationMetrics.customerEffort * 10} className="h-2" />
                  <span className="text-sm font-semibold text-gray-900">
                    {conversationMetrics.customerEffort}/10
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Smart Suggestions */}
        <div>
          <h4 className="mb-3 flex items-center gap-ds-2 text-sm font-medium text-gray-900">
            <Icon icon={Lightbulb} className="h-4 w-4" />
            Smart Suggestions
          </h4>
          <div className="space-y-3">
            {smartSuggestions.map((suggestion: unknown) => (
              <Card
                key={suggestion.id}
                className={`cursor-pointer spacing-4 transition-all duration-200 hover:shadow-md ${
                  expandedId === suggestion.id ? "ring-2 ring-blue-400" : ""
                }`}
                onClick={() => handleActionClick(suggestion)}
              >
                <div className="space-y-spacing-sm">
                  <div className="flex items-start justify-between gap-ds-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-ds-2">
                        <h5 className="text-sm font-medium text-gray-900">{suggestion.title}</h5>
                        <Badge variant="secondary" className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                      <p className="text-foreground text-tiny">{suggestion.description}</p>
                    </div>
                    <div className="flex items-center gap-ds-2">
                      <Badge variant="outline" className="text-tiny">
                        {suggestion.confidence}%
                      </Badge>
                      <Icon
                        icon={ChevronRight}
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedId === suggestion.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {expandedId === suggestion.id && suggestion.action && (
                    <div className="border-t pt-3">
                      <p className="mb-2 text-tiny text-[var(--fl-color-text-muted)]">Suggested action:</p>
                      <div className="rounded-ds-md bg-[var(--fl-color-background-subtle)] spacing-3">
                        <code className="text-foreground whitespace-pre-wrap text-tiny">{suggestion.action}</code>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionSelect(suggestion.action!);
                        }}
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Historical Insights */}
        <Card className="border-status-info-light bg-[var(--fl-color-info-subtle)] spacing-3">
          <h4 className="mb-2 text-sm font-medium text-blue-900">Pattern Detected</h4>
          <p className="text-sm text-blue-800">
            Similar conversations with shipping delay topics have a 73% escalation rate. Consider proactive escalation
            or offering immediate compensation to improve resolution.
          </p>
        </Card>
      </div>
    </div>
  );
};
