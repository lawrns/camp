/**
 * Performance optimization recommendations based on metrics
 */

import { InboxPerformanceMetrics } from "./inbox-performance-monitor";
import { ReactPerformanceMetrics } from "./react-performance-monitor";
import { WebVitalsMetrics } from "./web-vitals-monitor";

export interface PerformanceRecommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "rendering" | "network" | "memory" | "interaction";
  title: string;
  description: string;
  impact: string;
  solution: string;
  metrics?: Record<string, number>;
}

export class PerformanceRecommendationEngine {
  /**
   * Generate recommendations based on Web Vitals
   */
  static fromWebVitals(metrics: WebVitalsMetrics): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // LCP recommendations
    if (metrics.lcp && metrics.lcp > 4000) {
      recommendations.push({
        id: "lcp-critical",
        severity: "critical",
        category: "rendering",
        title: "Critical: Largest Contentful Paint is too slow",
        description: `LCP is ${(metrics.lcp / 1000).toFixed(2)}s, which is above the 4s threshold for poor performance.`,
        impact: "Users perceive the page as slow to load, leading to higher bounce rates.",
        solution:
          "Optimize server response times, implement resource hints (preload/preconnect), and optimize critical rendering path.",
        metrics: { lcp: metrics.lcp },
      });
    } else if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push({
        id: "lcp-warning",
        severity: "warning",
        category: "rendering",
        title: "Warning: Largest Contentful Paint needs improvement",
        description: `LCP is ${(metrics.lcp / 1000).toFixed(2)}s, which needs improvement.`,
        impact: "Page load feels sluggish to some users.",
        solution: "Consider lazy loading non-critical resources and optimizing image formats.",
        metrics: { lcp: metrics.lcp },
      });
    }

    // FID recommendations
    if (metrics.fid && metrics.fid > 300) {
      recommendations.push({
        id: "fid-critical",
        severity: "critical",
        category: "interaction",
        title: "Critical: First Input Delay is too high",
        description: `FID is ${metrics.fid.toFixed(0)}ms, indicating poor interactivity.`,
        impact: "Users experience unresponsive interactions, leading to frustration.",
        solution: "Break up long tasks, implement code splitting, and use web workers for heavy computations.",
        metrics: { fid: metrics.fid },
      });
    }

    // CLS recommendations
    if (metrics.cls && metrics.cls > 0.25) {
      recommendations.push({
        id: "cls-critical",
        severity: "critical",
        category: "rendering",
        title: "Critical: High Cumulative Layout Shift",
        description: `CLS is ${metrics.cls.toFixed(3)}, causing significant visual instability.`,
        impact: "Content jumping around frustrates users and can cause mis-clicks.",
        solution: "Set explicit dimensions for images/videos, avoid injecting content above existing content.",
        metrics: { cls: metrics.cls },
      });
    }

    // TTFB recommendations
    if (metrics.ttfb && metrics.ttfb > 1800) {
      recommendations.push({
        id: "ttfb-warning",
        severity: "warning",
        category: "network",
        title: "Warning: Slow server response time",
        description: `TTFB is ${(metrics.ttfb / 1000).toFixed(2)}s, indicating slow server response.`,
        impact: "Delays initial page rendering and affects all subsequent metrics.",
        solution: "Optimize server processing, implement caching, use a CDN, or upgrade hosting.",
        metrics: { ttfb: metrics.ttfb },
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on React performance
   */
  static fromReactMetrics(metrics: ReactPerformanceMetrics): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Slow renders
    const slowComponents = Array.from(metrics.components.entries())
      .filter(([_, data]) => data.averageRenderTime > 16)
      .sort((a, b) => b[1].averageRenderTime - a[1].averageRenderTime)
      .slice(0, 3);

    if (slowComponents.length > 0) {
      recommendations.push({
        id: "react-slow-renders",
        severity: "warning",
        category: "rendering",
        title: "Components with slow render times detected",
        description: `${slowComponents.length} components are rendering slower than 16ms (60fps threshold).`,
        impact: "UI feels sluggish and unresponsive during interactions.",
        solution: `Optimize these components: ${slowComponents.map(([id]) => id).join(", ")}. Use React.memo, useMemo, and useCallback appropriately.`,
        metrics: Object.fromEntries(slowComponents.map(([id, data]) => [id, data.averageRenderTime])),
      });
    }

    // Frequent updates
    const frequentUpdaters = metrics.renderPatterns.filter((p: any) => p.pattern === "frequent-updates").slice(0, 3);

    if (frequentUpdaters.length > 0) {
      recommendations.push({
        id: "react-frequent-updates",
        severity: "warning",
        category: "rendering",
        title: "Components updating too frequently",
        description: `${frequentUpdaters.length} components are re-rendering excessively.`,
        impact: "Unnecessary re-renders waste CPU and can cause performance degradation.",
        solution: `Review state management in: ${frequentUpdaters.map((p: any) => p.componentId).join(", ")}. Consider debouncing state updates.`,
        metrics: Object.fromEntries(frequentUpdaters.map((p: any) => [p.componentId, p.count])),
      });
    }

    // Cascading updates
    const cascadingUpdates = metrics.renderPatterns.filter((p: any) => p.pattern === "cascading-updates");

    if (cascadingUpdates.length > 0) {
      recommendations.push({
        id: "react-cascading-updates",
        severity: "critical",
        category: "rendering",
        title: "Cascading updates detected",
        description: "Multiple components are triggering sequential updates in a cascade pattern.",
        impact: "Causes render waterfalls that significantly impact performance.",
        solution: "Batch state updates, review component hierarchy, and consider using useReducer for complex state.",
        metrics: { cascadingComponents: cascadingUpdates.length },
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on inbox performance
   */
  static fromInboxMetrics(summary: any): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Message render time
    if (summary.averageMessageRenderTime > 16) {
      recommendations.push({
        id: "inbox-message-render",
        severity: "warning",
        category: "rendering",
        title: "Message rendering is slow",
        description: `Average message render time is ${summary.averageMessageRenderTime.toFixed(1)}ms.`,
        impact: "Messages appear to load slowly, affecting perceived performance.",
        solution: "Implement virtualization for long message lists, optimize message component rendering.",
        metrics: { averageMessageRenderTime: summary.averageMessageRenderTime },
      });
    }

    // Conversation switch time
    if (summary.averageConversationSwitchTime > 500) {
      recommendations.push({
        id: "inbox-conversation-switch",
        severity: "critical",
        category: "interaction",
        title: "Slow conversation switching",
        description: `Switching conversations takes ${summary.averageConversationSwitchTime.toFixed(0)}ms on average.`,
        impact: "Agents experience delays when navigating between conversations.",
        solution: "Implement conversation prefetching, optimize message loading, cache recent conversations.",
        metrics: { averageConversationSwitchTime: summary.averageConversationSwitchTime },
      });
    }

    // Input latency
    if (summary.averageInputLatency > 100) {
      recommendations.push({
        id: "inbox-input-latency",
        severity: "critical",
        category: "interaction",
        title: "High input latency detected",
        description: `Input latency is ${summary.averageInputLatency.toFixed(0)}ms, making typing feel unresponsive.`,
        impact: "Typing and interactions feel sluggish, reducing agent productivity.",
        solution: "Debounce input handlers, optimize state updates, reduce re-renders during typing.",
        metrics: { averageInputLatency: summary.averageInputLatency },
      });
    }

    // Memory usage
    if (summary.memoryUsage > 100) {
      recommendations.push({
        id: "inbox-memory-usage",
        severity: "warning",
        category: "memory",
        title: "High memory usage",
        description: `Application is using ${summary.memoryUsage.toFixed(1)}MB of memory.`,
        impact: "Can cause browser slowdowns and crashes on lower-end devices.",
        solution: "Implement proper cleanup in useEffect hooks, limit cached data, use pagination.",
        metrics: { memoryUsage: summary.memoryUsage },
      });
    }

    // Budget failures
    const failedBudgets = summary.budgetStatus?.filter((b: any) => b.status === "fail") || [];
    if (failedBudgets.length > 0) {
      recommendations.push({
        id: "inbox-budget-failures",
        severity: "critical",
        category: "rendering",
        title: `${failedBudgets.length} performance budgets exceeded`,
        description: `The following metrics exceed their budgets: ${failedBudgets.map((b: any) => b.metric).join(", ")}`,
        impact: "Multiple performance targets are being missed.",
        solution: "Focus on optimizing the metrics that exceed budgets by the largest margin.",
        metrics: Object.fromEntries(failedBudgets.map((b: any) => [b.metric, b.actual])),
      });
    }

    return recommendations;
  }

  /**
   * Generate actionable optimization checklist
   */
  static getOptimizationChecklist(): string[] {
    return [
      "✓ Implement React.memo for expensive components",
      "✓ Use useMemo and useCallback to prevent unnecessary recalculations",
      "✓ Implement virtualization for long lists (react-window)",
      "✓ Add loading states with skeleton screens",
      "✓ Implement code splitting with React.lazy()",
      "✓ Optimize bundle size with tree shaking",
      "✓ Use intersection observer for lazy loading",
      "✓ Implement service worker for caching",
      "✓ Optimize images (WebP, proper sizing, lazy loading)",
      "✓ Minimize main thread work with Web Workers",
      "✓ Implement request debouncing and throttling",
      "✓ Use CSS containment for layout stability",
      "✓ Prefetch critical resources",
      "✓ Implement progressive enhancement",
      "✓ Monitor and alert on performance regressions",
    ];
  }

  /**
   * Prioritize recommendations
   */
  static prioritizeRecommendations(recommendations: PerformanceRecommendation[]): PerformanceRecommendation[] {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const categoryPriority = { interaction: 0, rendering: 1, network: 2, memory: 3 };

    return recommendations.sort((a, b) => {
      // First sort by severity
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by category priority
      return categoryPriority[a.category] - categoryPriority[b.category];
    });
  }
}
