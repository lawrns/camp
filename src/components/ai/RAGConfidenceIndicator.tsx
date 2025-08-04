"use client";

import { AIResponse } from "@/lib/services/rag-ai-service";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, Brain, CheckCircle, Clock, TrendingUp } from "lucide-react";
import React from "react";

interface RAGConfidenceIndicatorProps {
  response: AIResponse;
  showDetails?: boolean;
  className?: string;
}

export function RAGConfidenceIndicator({ response, showDetails = false, className = "" }: RAGConfidenceIndicatorProps) {
  const confidenceLevel = getConfidenceLevel(response.confidence);
  const confidenceColor = getConfidenceColor(confidenceLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-ds-lg border bg-white spacing-3 shadow-sm ${className}`}
    >
      {/* Main confidence display */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-spacing-sm">
          <Brain className={`h-4 w-4 ${confidenceColor.text}`} />
          <span className="text-foreground text-sm font-medium">AI Confidence</span>
        </div>
        <ConfidenceBadge confidence={response.confidence} level={confidenceLevel} />
      </div>

      {/* Confidence bar */}
      <div className="mb-3 h-2 w-full rounded-ds-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${response.confidence * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-2 rounded-ds-full ${confidenceColor.bg}`}
        />
      </div>

      {/* Details section */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Sources */}
            {response.sources.length > 0 && (
              <div>
                <div className="mb-2 flex items-center space-x-spacing-sm">
                  <BookOpen className="h-4 w-4 text-[var(--fl-color-info)]" />
                  <span className="text-foreground text-sm font-medium">Sources ({response.sources.length})</span>
                </div>
                <div className="space-y-1">
                  {response.sources.slice(0, 3).map((source, index) => (
                    <SourceItem key={source.id} source={source} index={index} />
                  ))}
                  {response.sources.length > 3 && (
                    <div className="pl-2 text-tiny text-[var(--fl-color-text-muted)]">
                      +{response.sources.length - 3} more sources
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <div className="mb-1 flex items-center space-x-spacing-sm">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-foreground text-sm font-medium">Reasoning</span>
              </div>
              <p className="text-foreground pl-6 text-tiny">{response.reasoning}</p>
            </div>

            {/* Performance metrics */}
            <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{response.responseTime}ms</span>
              </div>
              {response.shouldHandover && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Handover recommended</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
  level: string;
}

function ConfidenceBadge({ confidence, level }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);
  const colors = getConfidenceColor(level);

  return <div className={`rounded-ds-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>{percentage}%</div>;
}

interface SourceItemProps {
  source: unknown;
  index: number;
}

function SourceItem({ source, index }: SourceItemProps) {
  const relevancePercentage = Math.round(source.relevanceScore * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-tiny font-medium text-gray-800">{source.title}</div>
        {source.url && <div className="truncate text-tiny text-blue-600">{source.url}</div>}
      </div>
      <div className="ml-2 text-tiny text-[var(--fl-color-text-muted)]">{relevancePercentage}%</div>
    </motion.div>
  );
}

// Utility functions
function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.6) return "medium";
  if (confidence >= 0.4) return "low";
  return "very-low";
}

function getConfidenceColor(level: string) {
  switch (level) {
    case "high":
      return {
        bg: "bg-ds-color-success-100",
        text: "text-ds-color-success-700",
        border: "border-[var(--ds-color-success-muted)]",
      };
    case "medium":
      return {
        bg: "bg-ds-color-warning-100",
        text: "text-ds-color-warning-700",
        border: "border-[var(--ds-color-warning-muted)]",
      };
    case "low":
      return {
        bg: "bg-ds-color-warning-100",
        text: "text-ds-color-warning-700",
        border: "border-[var(--ds-color-warning-200)]",
      };
    case "very-low":
      return {
        bg: "bg-ds-color-error-100",
        text: "text-ds-color-error-700",
        border: "border-[var(--ds-color-error-muted)]",
      };
    default:
      return {
        bg: "bg-ds-color-neutral-100",
        text: "text-ds-color-neutral-700",
        border: "border-[var(--ds-color-border)]",
      };
  }
}

// Analytics dashboard component
export function RAGAnalyticsDashboard({ organizationId }: { organizationId: string }) {
  const [analytics, setAnalytics] = React.useState({
    totalQueries: 0,
    averageConfidence: 0,
    handoverRate: 0,
    topSources: [] as { title: string; usage: number }[],
    responseTimeP95: 0,
  });

  React.useEffect(() => {
    // Fetch real analytics data from API
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/rag?organizationId=${organizationId}&includeInsights=true`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics({
            totalQueries: data.metrics?.totalQueries || 0,
            averageConfidence: data.metrics?.relevanceScore || 0,
            handoverRate: data.metrics?.usage?.failedRequests / Math.max(data.metrics?.usage?.totalRequests, 1) || 0,
            topSources:
              data.topDocuments?.slice(0, 3).map((doc: unknown) => ({
                title: doc.title,
                usage: doc.hitCount,
              })) || [],
            responseTimeP95: data.metrics?.performance?.p95ResponseTime || 0,
          });
        }
      } catch (error) {

        // Keep default values on error
      }
    };

    fetchAnalytics();
  }, [organizationId]);

  return (
    <div className="grid grid-cols-1 gap-3 spacing-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Queries */}
      <div className="bg-background rounded-ds-lg border spacing-3 shadow-card-base">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">Total Queries</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalQueries.toLocaleString()}</p>
          </div>
          <Brain className="h-8 w-8 text-[var(--fl-color-info)]" />
        </div>
      </div>

      {/* Average Confidence */}
      <div className="bg-background rounded-ds-lg border spacing-3 shadow-card-base">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">Avg Confidence</p>
            <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.averageConfidence * 100)}%</p>
          </div>
          <CheckCircle className="h-8 w-8 text-[var(--fl-color-success)]" />
        </div>
      </div>

      {/* Handover Rate */}
      <div className="bg-background rounded-ds-lg border spacing-3 shadow-card-base">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">Handover Rate</p>
            <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.handoverRate * 100)}%</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {/* Response Time */}
      <div className="bg-background rounded-ds-lg border spacing-3 shadow-card-base">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">Response Time P95</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.responseTimeP95}ms</p>
          </div>
          <Clock className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      {/* Top Sources */}
      <div className="bg-background rounded-ds-lg border spacing-3 shadow-card-base md:col-span-2 lg:col-span-4">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Top Knowledge Sources</h3>
        <div className="space-y-3">
          {analytics.topSources.map((source, index) => (
            <div key={source.title} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-blue-100">
                  <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{source.title}</span>
              </div>
              <div className="flex items-center space-x-spacing-sm">
                <div className="h-2 w-24 rounded-ds-full bg-gray-200">
                  <div className="bg-primary h-2 rounded-ds-full" style={{ width: `${(source.usage / 50) * 100}%` }} />
                </div>
                <span className="text-foreground text-sm">{source.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
