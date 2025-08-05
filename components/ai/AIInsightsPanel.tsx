"use client";

import React from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Activity, ArrowDown, ArrowUp, ChartBar as BarChart3, Brain, Info, MessageCircle as MessageSquare, Minus, Sparkles as Sparkles, Target, TrendDown as TrendingDown, TrendUp as TrendingUp, Zap as Zap,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface SentimentData {
  time: string;
  score: number;
  label: string;
}

interface IntentData {
  intent: string;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface EntityData {
  entity: string;
  frequency: number;
  relevance: number;
  category: string;
}

interface ConversationMetrics {
  totalMessages: number;
  avgResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  escalationRate: number;
}

interface AIInsightsPanelProps {
  conversationId: string;
  sentimentHistory: SentimentData[];
  currentSentiment: "positive" | "neutral" | "negative";
  detectedIntents: IntentData[];
  extractedEntities: EntityData[];
  conversationMetrics: ConversationMetrics;
  confidence: number;
  contextRelevance: number;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function AIInsightsPanel({
  conversationId,
  sentimentHistory,
  currentSentiment,
  detectedIntents,
  extractedEntities,
  conversationMetrics,
  confidence,
  contextRelevance,
  className,
  variant = "default",
}: AIInsightsPanelProps) {
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<"5m" | "15m" | "30m" | "1h">("15m");
  const [showDetailedMetrics, setShowDetailedMetrics] = React.useState(false);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return TrendingUp;
      case "negative":
        return TrendingDown;
      default:
        return Activity;
    }
  };

  const getTrendIcon = (trend: IntentData["trend"]) => {
    switch (trend) {
      case "up":
        return ArrowUp;
      case "down":
        return ArrowDown;
      default:
        return Minus;
    }
  };

  const renderSentimentChart = () => {
    const height = 80;
    const width = "100%";
    const padding = 10;

    // Create SVG path for sentiment line
    const points = sentimentHistory
      .map((data, index) => {
        const x = (index / (sentimentHistory.length - 1)) * 100;
        const y = 50 - data.score * 40; // Center at 50, scale to fit
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="relative h-20 w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(156 163 175)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Background areas */}
          <rect x="0" y="0" width="100" height="30" fill="url(#sentimentGradient)" opacity="0.1" />
          <rect x="0" y="70" width="100" height="30" fill="url(#sentimentGradient)" opacity="0.1" />

          {/* Center line */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />

          {/* Sentiment line */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-purple-600 dark:text-purple-400"
          />

          {/* Data points */}
          {sentimentHistory.map((data, index) => {
            const x = (index / (sentimentHistory.length - 1)) * 100;
            const y = 50 - data.score * 40;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="currentColor"
                className={cn(
                  "transition-all",
                  data.score > 0.3
                    ? "text-semantic-success-dark"
                    : data.score < -0.3
                      ? "text-red-600"
                      : "text-[var(--fl-color-text-muted)]"
                )}
              />
            );
          })}
        </svg>

        {/* Time labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-tiny text-[var(--fl-color-text-muted)]">
          <span>{sentimentHistory[0]?.time}</span>
          <span>Now</span>
        </div>
      </div>
    );
  };

  const renderIntentDistribution = () => {
    return (
      <div className="space-y-spacing-sm">
        {detectedIntents.slice(0, 5).map((intent, index) => {
          const TrendIcon = getTrendIcon(intent.trend);

          return (
            <OptimizedMotion.div
              key={intent.intent}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{intent.intent.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-ds-2">
                    <span className="text-tiny text-[var(--fl-color-text-muted)]">{intent.percentage}%</span>
                    <TrendIcon
                      className={cn(
                        "h-3 w-3",
                        intent.trend === "up" && "text-semantic-success-dark",
                        intent.trend === "down" && "text-red-600",
                        intent.trend === "stable" && "text-gray-400"
                      )}
                    />
                  </div>
                </div>
                <Progress value={intent.percentage} className="h-1.5" />
              </div>
            </OptimizedMotion.div>
          );
        })}
      </div>
    );
  };

  const renderEntityCloud = () => {
    return (
      <div className="flex flex-wrap gap-ds-2">
        {extractedEntities.map((entity, index) => {
          const size = Math.min(Math.max(entity.relevance * 1.5, 0.8), 1.2);

          return (
            <OptimizedMotion.div
              key={entity.entity}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.1 }}
            >
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all",
                  entity.category === "product" && "text-status-info-dark border-brand-blue-500/50 dark:text-blue-300",
                  entity.category === "feature" && "border-purple-500/50 text-purple-700 dark:text-purple-300",
                  entity.category === "issue" && "border-brand-mahogany-500/50 text-status-error-dark dark:text-red-300"
                )}
                style={{ fontSize: `${size * 0.75}rem` }}
              >
                {entity.entity}
                {entity.frequency > 1 && <span className="ml-1 text-tiny opacity-60">({entity.frequency})</span>}
              </Badge>
            </OptimizedMotion.div>
          );
        })}
      </div>
    );
  };

  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="space-y-3 spacing-3">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                {React.createElement(getSentimentIcon(currentSentiment), {
                  className: cn("h-4 w-4", getSentimentColor(currentSentiment)),
                })}
                <span className="text-sm font-medium capitalize">{currentSentiment}</span>
              </div>
              <p className="text-tiny text-[var(--fl-color-text-muted)]">Current Mood</p>
            </div>
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <Icon icon={Sparkles} className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-tiny text-[var(--fl-color-text-muted)]">AI Confidence</p>
            </div>
          </div>

          {/* Mini Sentiment Chart */}
          <div>
            <h4 className="mb-2 text-tiny font-medium">Sentiment Trend</h4>
            {renderSentimentChart()}
          </div>

          {/* Top Intents */}
          <div>
            <h4 className="mb-2 text-tiny font-medium">Top Intents</h4>
            <div className="flex flex-wrap gap-1">
              {detectedIntents.slice(0, 3).map((intent: unknown) => (
                <Badge key={intent.intent} variant="secondary" className="text-tiny">
                  {intent.intent.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-ds-2 text-base font-semibold">
            <Icon icon={Brain} className="h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
          <div className="flex items-center gap-ds-2">
            <Badge variant="outline" className="text-tiny">
              {selectedTimeRange}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                    className="hover:bg-background rounded spacing-1 transition-colors dark:hover:bg-neutral-800"
                  >
                    <Icon icon={Info} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-tiny">Toggle detailed metrics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sentiment Analysis Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={BarChart3} className="h-4 w-4 text-purple-600" />
              Sentiment Analysis
            </h3>
            <div className="flex items-center gap-ds-2">
              {React.createElement(getSentimentIcon(currentSentiment), {
                className: cn("h-4 w-4", getSentimentColor(currentSentiment)),
              })}
              <span className={cn("text-typography-sm font-medium capitalize", getSentimentColor(currentSentiment))}>
                {currentSentiment}
              </span>
            </div>
          </div>
          {renderSentimentChart()}
        </div>

        {/* Intent Recognition Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-ds-2 text-sm font-medium">
            <Icon icon={Zap} className="h-4 w-4 text-purple-600" />
            Intent Distribution
          </h3>
          {renderIntentDistribution()}
        </div>

        {/* Entity Extraction Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-ds-2 text-sm font-medium">
            <Icon icon={MessageSquare} className="h-4 w-4 text-purple-600" />
            Key Topics & Entities
          </h3>
          {renderEntityCloud()}
        </div>

        {/* Conversation Metrics */}
        <OptimizedAnimatePresence>
          {showDetailedMetrics && (
            <OptimizedMotion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 border-t border-[var(--fl-color-border)] pt-3 dark:border-gray-700"
            >
              <h3 className="flex items-center gap-ds-2 text-sm font-medium">
                <Icon icon={Target} className="h-4 w-4 text-purple-600" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-tiny">Avg Response Time</span>
                    <span className="text-tiny font-medium">{conversationMetrics.avgResponseTime}ms</span>
                  </div>
                  <Progress value={Math.min(100, (200 - conversationMetrics.avgResponseTime) / 2)} className="h-1" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-tiny">Resolution Rate</span>
                    <span className="text-tiny font-medium">
                      {(conversationMetrics.resolutionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(conversationMetrics.resolutionRate * 100, 100)} className="h-1" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-tiny">Satisfaction</span>
                    <span className="text-tiny font-medium">
                      {(conversationMetrics.customerSatisfaction * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(conversationMetrics.customerSatisfaction * 100, 100)} className="h-1" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-tiny">Context Relevance</span>
                    <span className="text-tiny font-medium">{(contextRelevance * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(contextRelevance * 100, 100)} className="h-1" />
                </div>
              </div>
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </CardContent>
    </Card>
  );
}
