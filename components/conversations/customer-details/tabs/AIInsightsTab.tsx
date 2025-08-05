import React from "react";
import { AlertTriangle as AlertTriangle, Star, TrendUp as TrendingUp, Zap as Zap } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AIInsights {
  sentiment?: {
    label: string;
    score: number;
    confidence: number;
    trend: "improving" | "declining" | "stable";
  };
  intent?: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
  escalationRisk?: {
    level: "low" | "medium" | "high";
    confidence: number;
    factors?: string[];
  };
  satisfaction?: {
    score: number;
    trend: "up" | "down" | "stable";
  };
}

interface AIInsightsTabProps {
  insights: AIInsights | null;
  isLoadingInsights: boolean;
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "bg-[var(--fl-color-success-subtle)] text-green-700 border-[var(--fl-color-success-muted)]";
    case "negative":
      return "bg-[var(--fl-color-danger-subtle)] text-red-700 border-[var(--fl-color-danger-muted)]";
    case "neutral":
    default:
      return "bg-[var(--fl-color-background-subtle)] text-gray-700 border-[var(--fl-color-border)]";
  }
}

function getEscalationColor(level: string): string {
  switch (level) {
    case "high":
      return "bg-[var(--fl-color-danger-subtle)] text-red-700 border-[var(--fl-color-danger-muted)]";
    case "low":
      return "bg-[var(--fl-color-success-subtle)] text-green-700 border-[var(--fl-color-success-muted)]";
    case "medium":
    default:
      return "bg-[var(--fl-color-warning-subtle)] text-yellow-700 border-[var(--fl-color-warning-muted)]";
  }
}

export function AIInsightsTab({ insights, isLoadingInsights }: AIInsightsTabProps) {
  return (
    <div className="panel-content-padding space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-ds-2 font-semibold text-gray-900">
          <Icon icon={Zap} className="text-semantic-warning h-4 w-4" />
          AI-Powered Insights
        </h4>
        {isLoadingInsights && <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-yellow-600"></div>}
      </div>

      {insights && (
        <>
          {/* Sentiment Analysis */}
          <Card className="border-[var(--fl-color-border)] shadow-card-base">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>Sentiment Analysis</span>
                <Icon
                  icon={TrendingUp}
                  className={cn(
                    "h-4 w-4",
                    insights?.sentiment?.trend === "improving" && "text-semantic-success",
                    insights?.sentiment?.trend === "declining" && "text-brand-mahogany-500",
                    insights?.sentiment?.trend === "stable" && "text-[var(--fl-color-text-muted)]"
                  )}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <Badge className={cn("border font-medium", getSentimentColor(insights?.sentiment?.label || "neutral"))}>
                  {insights?.sentiment?.label || "neutral"}
                </Badge>
                <span className="text-foreground text-sm font-medium">
                  {insights?.sentiment?.confidence || 85}% confident
                </span>
              </div>
              <div className="mb-3">
                <div className="text-foreground mb-2 flex justify-between text-tiny">
                  <span>Sentiment Score</span>
                  <span>{((insights?.sentiment?.score || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(insights?.sentiment?.score || 0.5) * 100} className="h-2" />
              </div>
              <p className="text-tiny italic text-[var(--fl-color-text-muted)]">
                Trend: {insights?.sentiment?.trend || "stable"} over recent interactions
              </p>
            </CardContent>
          </Card>

          {/* Intent Detection */}
          <Card className="border-[var(--fl-color-border)] shadow-card-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Intent Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{insights?.intent?.category || "General Inquiry"}</span>
                <span className="text-foreground text-sm">{insights?.intent?.confidence || 75}% confident</span>
              </div>
              {insights?.intent?.subcategory && (
                <p className="text-foreground mb-2 text-sm">Subcategory: {insights.intent.subcategory}</p>
              )}
              <Progress value={insights?.intent?.confidence || 75} className="h-2" />
            </CardContent>
          </Card>

          {/* Escalation Risk */}
          <Card className="border-[var(--fl-color-border)] shadow-card-base">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold">
                Escalation Risk
                {insights?.escalationRisk?.level === "high" && (
                  <Icon icon={AlertTriangle} className="text-brand-mahogany-500 h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <Badge
                  className={cn("border font-medium", getEscalationColor(insights?.escalationRisk?.level || "medium"))}
                >
                  {(insights?.escalationRisk?.level || "medium").charAt(0).toUpperCase() +
                    (insights?.escalationRisk?.level || "medium").slice(1)}{" "}
                  Risk
                </Badge>
                <span className="text-foreground text-sm">{insights?.escalationRisk?.confidence || 50}% confident</span>
              </div>
              {(insights?.escalationRisk?.factors?.length || 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-foreground text-tiny font-medium">Risk Factors:</p>
                  {(insights?.escalationRisk?.factors || []).map((factor, index) => (
                    <p key={index} className="text-foreground text-tiny">
                      • {factor}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Satisfaction */}
          <Card className="border-[var(--fl-color-border)] shadow-card-base">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>Customer Satisfaction</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon
                      icon={Star}
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(insights?.satisfaction?.score || 4.5)
                          ? "fill-current text-yellow-400"
                          : "text-neutral-300"
                      )}
                    />
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">
                  {insights?.satisfaction?.score ? insights.satisfaction.score.toFixed(1) : "4.5"}/5.0
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    insights?.satisfaction?.trend === "up" &&
                      "bg-status-success-light text-status-success-dark border-status-success-light",
                    insights?.satisfaction?.trend === "down" &&
                      "bg-status-error-light text-status-error-dark border-status-error-light",
                    insights?.satisfaction?.trend === "stable" && "border-[var(--fl-color-border)] bg-neutral-50 text-neutral-700"
                  )}
                >
                  {insights?.satisfaction?.trend === "up" && "↗ Improving"}
                  {insights?.satisfaction?.trend === "down" && "↘ Declining"}
                  {insights?.satisfaction?.trend === "stable" && "→ Stable"}
                  {!insights?.satisfaction?.trend && "→ Stable"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
