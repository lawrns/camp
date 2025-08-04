/**
 * User Feedback System with Performance Correlation
 *
 * Comprehensive feedback collection and analysis system:
 * - Real-time feedback collection with performance metrics
 * - Sentiment analysis and categorization
 * - Performance correlation and insights
 * - Automated issue detection and alerting
 * - A/B testing feedback integration
 */

import React, { useState, useCallback, useEffect } from "react";

// Feedback types
export enum FeedbackType {
  BUG_REPORT = "bug_report",
  FEATURE_REQUEST = "feature_request",
  PERFORMANCE_ISSUE = "performance_issue",
  UI_UX_FEEDBACK = "ui_ux_feedback",
  GENERAL_FEEDBACK = "general_feedback",
  SATISFACTION_RATING = "satisfaction_rating",
}

// Feedback categories
export enum FeedbackCategory {
  WIDGET_LOADING = "widget_loading",
  MESSAGE_SENDING = "message_sending",
  AI_RESPONSES = "ai_responses",
  ACCESSIBILITY = "accessibility",
  MOBILE_EXPERIENCE = "mobile_experience",
  PERFORMANCE = "performance",
  DESIGN = "design",
  FUNCTIONALITY = "functionality",
}

// Feedback sentiment
export enum FeedbackSentiment {
  VERY_NEGATIVE = "very_negative",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  POSITIVE = "positive",
  VERY_POSITIVE = "very_positive",
}

// Performance metrics snapshot
export interface PerformanceSnapshot {
  timestamp: string;
  fps: number;
  memoryUsage: number;
  loadTime: number;
  lcp: number;
  fid: number;
  cls: number;
  networkType: string;
  deviceType: "mobile" | "desktop" | "tablet";
  browserName: string;
  browserVersion: string;
}

// Feedback entry
export interface FeedbackEntry {
  id: string;
  timestamp: string;
  type: FeedbackType;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  rating?: number; // 1-5 scale
  title: string;
  description: string;
  userContext: {
    userId?: string;
    organizationId?: string;
    sessionId: string;
    userAgent: string;
    url: string;
    referrer?: string;
  };
  performanceSnapshot: PerformanceSnapshot;
  metadata: {
    featureFlags: Record<string, boolean>;
    abTestVariants: Record<string, string>;
    widgetVersion: string;
    buildVersion: string;
  };
  attachments?: {
    screenshot?: string;
    consoleLog?: string[];
    networkLog?: unknown[];
  };
  status: "new" | "acknowledged" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
}

// Feedback analytics
export interface FeedbackAnalytics {
  totalFeedback: number;
  sentimentDistribution: Record<FeedbackSentiment, number>;
  categoryDistribution: Record<FeedbackCategory, number>;
  averageRating: number;
  performanceCorrelations: {
    lowFpsIssues: number;
    highMemoryIssues: number;
    slowLoadingIssues: number;
    networkRelatedIssues: number;
  };
  trends: {
    daily: Array<{ date: string; count: number; averageRating: number }>;
    weekly: Array<{ week: string; count: number; averageRating: number }>;
  };
  topIssues: Array<{
    category: FeedbackCategory;
    count: number;
    averageRating: number;
    description: string;
  }>;
}

// Feedback configuration
export interface FeedbackConfig {
  enabled: boolean;
  collectPerformanceMetrics: boolean;
  enableScreenshots: boolean;
  enableConsoleLogs: boolean;
  enableNetworkLogs: boolean;
  autoSubmitThreshold?: number; // Auto-submit on performance issues
  sentimentAnalysisEnabled: boolean;
  realTimeAlerting: boolean;
  retentionDays: number;
}

// Feedback collector class
export class FeedbackCollector {
  private config: FeedbackConfig;
  private performanceObserver?: PerformanceObserver;
  private feedbackQueue: FeedbackEntry[] = [];

  constructor(config: FeedbackConfig) {
    this.config = config;
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring for automatic feedback
  private initializePerformanceMonitoring(): void {
    if (!this.config.collectPerformanceMetrics) return;

    // Monitor for performance issues that might trigger automatic feedback
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "measure" && entry.duration > 5000) {
            // Automatically create feedback for slow operations
            this.createAutomaticFeedback("performance_issue", {
              title: "Slow Operation Detected",
              description: `Operation "${entry.name}" took ${entry.duration.toFixed(0)}ms`,
              category: FeedbackCategory.PERFORMANCE,
            });
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ["measure"] });
    }
  }

  // Collect current performance snapshot
  private async collectPerformanceSnapshot(): Promise<PerformanceSnapshot> {
    const now = performance.now();

    // Get performance metrics (would integrate with usePerformanceMonitor)
    const performanceMetrics = (window as unknown).__PERFORMANCE_METRICS__ || {};

    return {
      timestamp: new Date().toISOString(),
      fps: performanceMetrics.fps || 60,
      memoryUsage: performanceMetrics.memoryUsage || 0,
      loadTime: now,
      lcp: performanceMetrics.lcp || 0,
      fid: performanceMetrics.fid || 0,
      cls: performanceMetrics.cls || 0,
      networkType: (navigator as unknown).connection?.effectiveType || "unknown",
      deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
      browserName: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
    };
  }

  // Get browser information
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[1] : "Unknown";
  }

  // Analyze sentiment from text
  private analyzeSentiment(text: string): FeedbackSentiment {
    if (!this.config.sentimentAnalysisEnabled) {
      return FeedbackSentiment.NEUTRAL;
    }

    // Simple sentiment analysis (in production, use a proper NLP service)
    const positiveWords = ["good", "great", "excellent", "amazing", "love", "perfect", "awesome"];
    const negativeWords = ["bad", "terrible", "awful", "hate", "broken", "slow", "frustrating"];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter((word) => positiveWords.includes(word)).length;
    const negativeCount = words.filter((word) => negativeWords.includes(word)).length;

    if (negativeCount > positiveCount + 1) return FeedbackSentiment.NEGATIVE;
    if (positiveCount > negativeCount + 1) return FeedbackSentiment.POSITIVE;
    return FeedbackSentiment.NEUTRAL;
  }

  // Create feedback entry
  async createFeedback(
    type: FeedbackType,
    options: {
      category: FeedbackCategory;
      title: string;
      description: string;
      rating?: number;
      userId?: string;
      organizationId?: string;
      includeScreenshot?: boolean;
      includeConsoleLogs?: boolean;
    }
  ): Promise<FeedbackEntry> {
    const performanceSnapshot = await this.collectPerformanceSnapshot();
    const sentiment = this.analyzeSentiment(options.description);

    const feedback: FeedbackEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      category: options.category,
      sentiment,
      rating: options.rating,
      title: options.title,
      description: options.description,
      userContext: {
        userId: options.userId,
        organizationId: options.organizationId,
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
      },
      performanceSnapshot,
      metadata: {
        featureFlags: this.getFeatureFlags(),
        abTestVariants: this.getABTestVariants(),
        widgetVersion: "3.0.0",
        buildVersion: process.env.BUILD_VERSION || "development",
      },
      attachments: {},
      status: "new",
      priority: this.calculatePriority(type, sentiment, performanceSnapshot),
      tags: this.generateTags(type, options.category, sentiment),
    };

    // Collect attachments if enabled
    if (options.includeScreenshot && this.config.enableScreenshots) {
      feedback.attachments!.screenshot = await this.captureScreenshot();
    }

    if (options.includeConsoleLogs && this.config.enableConsoleLogs) {
      feedback.attachments!.consoleLog = this.getConsoleLogs();
    }

    // Add to queue and submit
    this.feedbackQueue.push(feedback);
    await this.submitFeedback(feedback);

    return feedback;
  }

  // Create automatic feedback for performance issues
  private async createAutomaticFeedback(
    type: string,
    details: { title: string; description: string; category: FeedbackCategory }
  ): Promise<void> {
    if (!this.config.autoSubmitThreshold) return;

    await this.createFeedback(FeedbackType.PERFORMANCE_ISSUE, {
      ...details,
      includeScreenshot: false,
      includeConsoleLogs: true,
    });
  }

  // Calculate feedback priority
  private calculatePriority(
    type: FeedbackType,
    sentiment: FeedbackSentiment,
    performance: PerformanceSnapshot
  ): "low" | "medium" | "high" | "critical" {
    // Critical: Performance issues with very negative sentiment
    if (type === FeedbackType.PERFORMANCE_ISSUE && sentiment === FeedbackSentiment.VERY_NEGATIVE) {
      return "critical";
    }

    // Critical: Very slow performance
    if (performance.fps < 15 || performance.loadTime > 10000) {
      return "critical";
    }

    // High: Bug reports or negative feedback
    if (type === FeedbackType.BUG_REPORT || sentiment === FeedbackSentiment.NEGATIVE) {
      return "high";
    }

    // Medium: Performance issues or neutral feedback
    if (type === FeedbackType.PERFORMANCE_ISSUE || sentiment === FeedbackSentiment.NEUTRAL) {
      return "medium";
    }

    return "low";
  }

  // Generate tags for categorization
  private generateTags(type: FeedbackType, category: FeedbackCategory, sentiment: FeedbackSentiment): string[] {
    const tags = [type, category, sentiment];

    // Add performance-related tags
    const performance = (window as unknown).__PERFORMANCE_METRICS__ || {};
    if (performance.fps < 30) tags.push("low_fps");
    if (performance.memoryUsage > 100) tags.push("high_memory");
    if (performance.loadTime > 3000) tags.push("slow_loading");

    return tags;
  }

  // Helper methods
  private getSessionId(): string {
    return sessionStorage.getItem("session_id") || crypto.randomUUID();
  }

  private getFeatureFlags(): Record<string, boolean> {
    return (window as unknown).__FEATURE_FLAGS__ || {};
  }

  private getABTestVariants(): Record<string, string> {
    return (window as unknown).__AB_TEST_VARIANTS__ || {};
  }

  private async captureScreenshot(): Promise<string> {
    // In a real implementation, use html2canvas or similar
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }

  private getConsoleLogs(): string[] {
    // In a real implementation, capture console logs
    return ["Console logs would be captured here"];
  }

  // Submit feedback to backend
  private async submitFeedback(feedback: FeedbackEntry): Promise<void> {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Send real-time alert for critical feedback
      if (feedback.priority === "critical" && this.config.realTimeAlerting) {
        await this.sendRealTimeAlert(feedback);
      }
    } catch (error) {

      // Store locally for retry
      localStorage.setItem(`feedback_${feedback.id}`, JSON.stringify(feedback));
    }
  }

  // Send real-time alert for critical feedback
  private async sendRealTimeAlert(feedback: FeedbackEntry): Promise<void> {
    // In a real implementation, send to Slack, PagerDuty, etc.

  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Global feedback collector instance
let globalFeedbackCollector: FeedbackCollector | null = null;

// Initialize feedback collector
export function initializeFeedbackCollector(config: FeedbackConfig): FeedbackCollector {
  globalFeedbackCollector = new FeedbackCollector(config);
  return globalFeedbackCollector;
}

// Get global feedback collector
export function getFeedbackCollector(): FeedbackCollector | null {
  return globalFeedbackCollector;
}

export default {
  FeedbackCollector,
  FeedbackType,
  FeedbackCategory,
  FeedbackSentiment,
  initializeFeedbackCollector,
  getFeedbackCollector,
};
