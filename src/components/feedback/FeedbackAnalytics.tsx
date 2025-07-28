/**
 * Feedback Analytics Dashboard
 *
 * Comprehensive feedback analysis and insights:
 * - Performance correlation analysis
 * - Sentiment trends and distribution
 * - Issue categorization and prioritization
 * - Real-time alerts and notifications
 * - Actionable insights and recommendations
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  FeedbackEntry,
  FeedbackAnalytics,
  FeedbackSentiment,
  FeedbackCategory,
  PerformanceSnapshot,
} from "@/lib/feedback";

interface FeedbackAnalyticsProps {
  organizationId: string;
  timeRange: "24h" | "7d" | "30d" | "90d";
}

export function FeedbackAnalyticsDashboard({ organizationId, timeRange }: FeedbackAnalyticsProps) {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | "all">("all");

  // Load feedback data
  useEffect(() => {
    const loadFeedbackData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/feedback/analytics?org=${organizationId}&range=${timeRange}`);
        const data = await response.json();
        setAnalytics(data.analytics);
        setFeedbackEntries(data.entries);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    loadFeedbackData();
  }, [organizationId, timeRange]);

  // Performance correlation analysis
  const performanceCorrelations = useMemo(() => {
    if (!feedbackEntries.length) return null;

    const lowRatingEntries = feedbackEntries.filter((entry) => (entry.rating || 0) <= 2);
    const highRatingEntries = feedbackEntries.filter((entry) => (entry.rating || 0) >= 4);

    const avgLowRatingPerf = calculateAveragePerformance(lowRatingEntries);
    const avgHighRatingPerf = calculateAveragePerformance(highRatingEntries);

    return {
      lowRating: avgLowRatingPerf,
      highRating: avgHighRatingPerf,
      correlations: {
        fpsCorrelation: avgLowRatingPerf.fps < avgHighRatingPerf.fps,
        memoryCorrelation: avgLowRatingPerf.memoryUsage > avgHighRatingPerf.memoryUsage,
        loadTimeCorrelation: avgLowRatingPerf.loadTime > avgHighRatingPerf.loadTime,
      },
    };
  }, [feedbackEntries]);

  const calculateAveragePerformance = (entries: FeedbackEntry[]): PerformanceSnapshot => {
    if (!entries.length) {
      return {
        timestamp: "",
        fps: 60,
        memoryUsage: 0,
        loadTime: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        networkType: "unknown",
        deviceType: "desktop",
        browserName: "unknown",
        browserVersion: "unknown",
      };
    }

    const totals = entries.reduce(
      (acc, entry) => ({
        fps: acc.fps + entry.performanceSnapshot.fps,
        memoryUsage: acc.memoryUsage + entry.performanceSnapshot.memoryUsage,
        loadTime: acc.loadTime + entry.performanceSnapshot.loadTime,
        lcp: acc.lcp + entry.performanceSnapshot.lcp,
        fid: acc.fid + entry.performanceSnapshot.fid,
        cls: acc.cls + entry.performanceSnapshot.cls,
      }),
      { fps: 0, memoryUsage: 0, loadTime: 0, lcp: 0, fid: 0, cls: 0 }
    );

    const count = entries.length;
    return {
      timestamp: new Date().toISOString(),
      fps: totals.fps / count,
      memoryUsage: totals.memoryUsage / count,
      loadTime: totals.loadTime / count,
      lcp: totals.lcp / count,
      fid: totals.fid / count,
      cls: totals.cls / count,
      networkType: "mixed",
      deviceType: "mixed" as any,
      browserName: "mixed",
      browserVersion: "mixed",
    };
  };

  // Filtered feedback entries
  const filteredEntries = useMemo(() => {
    if (selectedCategory === "all") return feedbackEntries;
    return feedbackEntries.filter((entry) => entry.category === selectedCategory);
  }, [feedbackEntries, selectedCategory]);

  if (loading) {
    return (
      <div className="p-spacing-md">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-spacing-md text-center">
        <p className="text-foreground-muted">No feedback data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-spacing-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Feedback Analytics</h2>
        <div className="flex items-center space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory | "all")}
            className="border-ds-border-strong rounded-ds-md border px-3 py-2"
          >
            <option value="all">All Categories</option>
            {Object.values(FeedbackCategory).map((category) => (
              <option key={category} value={category}>
                {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
          <h3 className="text-foreground-muted text-sm font-medium">Total Feedback</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalFeedback}</p>
        </div>

        <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
          <h3 className="text-foreground-muted text-sm font-medium">Average Rating</h3>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.averageRating.toFixed(1)}
            <span className="ml-1 text-base text-yellow-500">★</span>
          </p>
        </div>

        <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
          <h3 className="text-foreground-muted text-sm font-medium">Performance Issues</h3>
          <p className="text-3xl font-bold text-red-600">
            {analytics.performanceCorrelations.lowFpsIssues + analytics.performanceCorrelations.slowLoadingIssues}
          </p>
        </div>

        <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
          <h3 className="text-foreground-muted text-sm font-medium">Positive Sentiment</h3>
          <p className="text-3xl font-bold text-green-600">
            {Math.round(
              (((analytics.sentimentDistribution[FeedbackSentiment.POSITIVE] || 0) +
                (analytics.sentimentDistribution[FeedbackSentiment.VERY_POSITIVE] || 0)) /
                analytics.totalFeedback) *
                100
            )}
            %
          </p>
        </div>
      </div>

      {/* Performance Correlation Analysis */}
      {performanceCorrelations && (
        <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Performance Correlation Analysis</h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="text-center">
              <h4 className="text-foreground-muted text-sm font-medium">Frame Rate Impact</h4>
              <div className="mt-2">
                <span className="text-3xl font-bold text-red-600">
                  {performanceCorrelations.lowRating.fps.toFixed(1)} FPS
                </span>
                <p className="text-foreground-muted text-sm">Low ratings</p>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold text-green-600">
                  {performanceCorrelations.highRating.fps.toFixed(1)} FPS
                </span>
                <p className="text-foreground-muted text-sm">High ratings</p>
              </div>
              {performanceCorrelations.correlations.fpsCorrelation && (
                <p className="mt-2 text-tiny text-orange-600">⚠️ Strong correlation detected</p>
              )}
            </div>

            <div className="text-center">
              <h4 className="text-foreground-muted text-sm font-medium">Memory Usage Impact</h4>
              <div className="mt-2">
                <span className="text-3xl font-bold text-red-600">
                  {(performanceCorrelations.lowRating.memoryUsage / 1024 / 1024).toFixed(1)} MB
                </span>
                <p className="text-foreground-muted text-sm">Low ratings</p>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold text-green-600">
                  {(performanceCorrelations.highRating.memoryUsage / 1024 / 1024).toFixed(1)} MB
                </span>
                <p className="text-foreground-muted text-sm">High ratings</p>
              </div>
              {performanceCorrelations.correlations.memoryCorrelation && (
                <p className="mt-2 text-tiny text-orange-600">⚠️ Strong correlation detected</p>
              )}
            </div>

            <div className="text-center">
              <h4 className="text-foreground-muted text-sm font-medium">Load Time Impact</h4>
              <div className="mt-2">
                <span className="text-3xl font-bold text-red-600">
                  {(performanceCorrelations.lowRating.loadTime / 1000).toFixed(1)}s
                </span>
                <p className="text-foreground-muted text-sm">Low ratings</p>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold text-green-600">
                  {(performanceCorrelations.highRating.loadTime / 1000).toFixed(1)}s
                </span>
                <p className="text-foreground-muted text-sm">High ratings</p>
              </div>
              {performanceCorrelations.correlations.loadTimeCorrelation && (
                <p className="mt-2 text-tiny text-orange-600">⚠️ Strong correlation detected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Distribution */}
      <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Sentiment Distribution</h3>

        <div className="space-y-3">
          {Object.entries(analytics.sentimentDistribution).map(([sentiment, count]) => {
            const percentage = (count / analytics.totalFeedback) * 100;
            const color = {
              [FeedbackSentiment.VERY_POSITIVE]: "bg-green-500",
              [FeedbackSentiment.POSITIVE]: "bg-green-400",
              [FeedbackSentiment.NEUTRAL]: "bg-gray-400",
              [FeedbackSentiment.NEGATIVE]: "bg-red-400",
              [FeedbackSentiment.VERY_NEGATIVE]: "bg-red-500",
            }[sentiment as FeedbackSentiment];

            return (
              <div key={sentiment} className="flex items-center">
                <div className="text-foreground w-24 text-sm capitalize">{sentiment.replace(/_/g, " ")}</div>
                <div className="mx-3 h-4 flex-1 rounded-ds-full bg-gray-200">
                  <div className={`h-4 rounded-ds-full ${color}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="w-16 text-right text-sm text-gray-900">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Issues */}
      <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Top Issues</h3>

        <div className="space-y-3">
          {analytics.topIssues.slice(0, 5).map((issue, index) => (
            <div key={index} className="bg-background flex items-center justify-between rounded spacing-3">
              <div>
                <h4 className="font-medium text-gray-900">
                  {issue.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </h4>
                <p className="text-foreground text-sm">{issue.description}</p>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-gray-900">{issue.count}</div>
                <div className="text-foreground-muted text-sm">{issue.averageRating.toFixed(1)}★ avg</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-background rounded-ds-lg border p-spacing-md shadow">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Recent Feedback</h3>

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {filteredEntries.slice(0, 10).map((entry) => (
            <div key={entry.id} className="border-l-4 border-[var(--fl-color-brand)] py-2 pl-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{entry.title}</h4>
                <div className="flex items-center space-x-spacing-sm">
                  {entry.rating && (
                    <span className="text-yellow-500">
                      {"★".repeat(entry.rating)}
                      {"☆".repeat(5 - entry.rating)}
                    </span>
                  )}
                  <span
                    className={`rounded-ds-full px-2 py-1 text-xs ${
                      entry.priority === "critical"
                        ? "bg-red-100 text-red-800"
                        : entry.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : entry.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {entry.priority}
                  </span>
                </div>
              </div>
              <p className="text-foreground mt-1 text-sm">{entry.description}</p>
              <div className="text-foreground-muted mt-2 text-tiny">
                {new Date(entry.timestamp).toLocaleString()} •{entry.performanceSnapshot.fps.toFixed(0)} FPS •
                {(entry.performanceSnapshot.memoryUsage / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackAnalyticsDashboard;
