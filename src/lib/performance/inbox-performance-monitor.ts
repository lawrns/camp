/**
 * Inbox-specific performance monitoring
 * Tracks message rendering, conversation switching, and UI responsiveness
 */

export interface InboxPerformanceMetrics {
  // Message List Performance
  messageRenderTime: number[];
  messageScrollPerformance: number;
  virtualScrollEfficiency: number;

  // Conversation Performance
  conversationSwitchTime: number[];
  conversationLoadTime: number[];
  messageLoadTime: number[];

  // UI Responsiveness
  inputLatency: number[];
  typingIndicatorDelay: number[];
  searchResponseTime: number[];

  // Network Performance
  messageDeliveryTime: number[];
  realtimeLatency: number[];
  apiResponseTime: Map<string, number[]>;

  // Memory Usage
  conversationCacheSize: number;
  messageCacheSize: number;
  totalMemoryUsage: number;
}

export interface PerformanceBudget {
  metric: string;
  budget: number;
  actual?: number;
  status: "pass" | "warning" | "fail";
}

export class InboxPerformanceMonitor {
  private metrics: InboxPerformanceMetrics = {
    messageRenderTime: [],
    messageScrollPerformance: 0,
    virtualScrollEfficiency: 100,
    conversationSwitchTime: [],
    conversationLoadTime: [],
    messageLoadTime: [],
    inputLatency: [],
    typingIndicatorDelay: [],
    searchResponseTime: [],
    messageDeliveryTime: [],
    realtimeLatency: [],
    apiResponseTime: new Map(),
    conversationCacheSize: 0,
    messageCacheSize: 0,
    totalMemoryUsage: 0,
  };

  private budgets: Map<string, number> = new Map([
    ["messageRenderTime", 16], // 60fps
    ["conversationSwitchTime", 200],
    ["messageLoadTime", 500],
    ["inputLatency", 50],
    ["searchResponseTime", 300],
    ["messageDeliveryTime", 1000],
    ["realtimeLatency", 100],
  ]);

  private observers: Map<string, PerformanceObserver> = new Map();
  private callbacks: ((metrics: InboxPerformanceMetrics) => void)[] = [];
  private intersectionObserver?: IntersectionObserver;
  private scrollTimeout?: NodeJS.Timeout;

  constructor() {
    this.setupObservers();
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    if (typeof window === "undefined") return;

    // Intersection Observer for message visibility
    this.setupIntersectionObserver();

    // User timing for measuring operations
    this.setupUserTimingObserver();

    // Resource timing for API calls
    this.setupResourceTimingObserver();
  }

  /**
   * Setup intersection observer for message visibility
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry: unknown) => {
          if (entry.isIntersecting) {
            const messageElement = entry.target as HTMLElement;
            const renderTime = performance.now() - parseFloat(messageElement.dataset.renderStart || "0");
            if (renderTime > 0 && renderTime < 1000) {
              this.recordMessageRenderTime(renderTime);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );
  }

  /**
   * Setup user timing observer
   */
  private setupUserTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: unknown) => {
          if (entry.entryType === "measure") {
            this.handlePerformanceMeasure(entry as PerformanceMeasure);
          }
        });
      });
      observer.observe({ entryTypes: ["measure"] });
      this.observers.set("userTiming", observer);
    } catch (error) {}
  }

  /**
   * Setup resource timing observer
   */
  private setupResourceTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: unknown) => {
          if (entry.name.includes("/api/")) {
            this.recordApiResponseTime(entry.name, entry.duration);
          }
        });
      });
      observer.observe({ entryTypes: ["resource"] });
      this.observers.set("resourceTiming", observer);
    } catch (error) {}
  }

  /**
   * Handle performance measure
   */
  private handlePerformanceMeasure(measure: PerformanceMeasure): void {
    const { name, duration } = measure;

    if (name.startsWith("conversation-switch")) {
      this.recordConversationSwitchTime(duration);
    } else if (name.startsWith("message-load")) {
      this.recordMessageLoadTime(duration);
    } else if (name.startsWith("search-response")) {
      this.recordSearchResponseTime(duration);
    } else if (name.startsWith("typing-indicator")) {
      this.recordTypingIndicatorDelay(duration);
    }
  }

  /**
   * Start measuring an operation
   */
  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * End measuring an operation
   */
  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name, "measure")[0];
    return measure ? measure.duration : 0;
  }

  /**
   * Observe message element
   */
  observeMessage(element: HTMLElement): void {
    if (this.intersectionObserver) {
      element.dataset.renderStart = performance.now().toString();
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Record metrics
   */
  private recordMessageRenderTime(time: number): void {
    this.metrics.messageRenderTime.push(time);
    this.keepRecentMetrics("messageRenderTime", 100);
    this.checkBudget("messageRenderTime", time);
    this.notifyCallbacks();
  }

  private recordConversationSwitchTime(time: number): void {
    this.metrics.conversationSwitchTime.push(time);
    this.keepRecentMetrics("conversationSwitchTime", 50);
    this.checkBudget("conversationSwitchTime", time);
    this.notifyCallbacks();
  }

  private recordMessageLoadTime(time: number): void {
    this.metrics.messageLoadTime.push(time);
    this.keepRecentMetrics("messageLoadTime", 50);
    this.checkBudget("messageLoadTime", time);
    this.notifyCallbacks();
  }

  private recordSearchResponseTime(time: number): void {
    this.metrics.searchResponseTime.push(time);
    this.keepRecentMetrics("searchResponseTime", 50);
    this.checkBudget("searchResponseTime", time);
    this.notifyCallbacks();
  }

  private recordTypingIndicatorDelay(time: number): void {
    this.metrics.typingIndicatorDelay.push(time);
    this.keepRecentMetrics("typingIndicatorDelay", 50);
    this.notifyCallbacks();
  }

  recordInputLatency(time: number): void {
    this.metrics.inputLatency.push(time);
    this.keepRecentMetrics("inputLatency", 100);
    this.checkBudget("inputLatency", time);
    this.notifyCallbacks();
  }

  recordMessageDeliveryTime(time: number): void {
    this.metrics.messageDeliveryTime.push(time);
    this.keepRecentMetrics("messageDeliveryTime", 50);
    this.checkBudget("messageDeliveryTime", time);
    this.notifyCallbacks();
  }

  recordRealtimeLatency(time: number): void {
    this.metrics.realtimeLatency.push(time);
    this.keepRecentMetrics("realtimeLatency", 100);
    this.checkBudget("realtimeLatency", time);
    this.notifyCallbacks();
  }

  private recordApiResponseTime(endpoint: string, time: number): void {
    const times = this.metrics.apiResponseTime.get(endpoint) || [];
    times.push(time);
    if (times.length > 50) times.shift();
    this.metrics.apiResponseTime.set(endpoint, times);
    this.notifyCallbacks();
  }

  /**
   * Record scroll performance
   */
  recordScrollPerformance(fps: number): void {
    this.metrics.messageScrollPerformance = fps;

    // Debounce scroll performance updates
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.notifyCallbacks();
    }, 100);
  }

  /**
   * Update memory usage
   */
  updateMemoryUsage(conversationCount: number, messageCount: number): void {
    // Estimate memory usage (simplified)
    this.metrics.conversationCacheSize = conversationCount * 2; // ~2KB per conversation
    this.metrics.messageCacheSize = messageCount * 0.5; // ~500B per message

    // @ts-ignore - performance.memory is Chrome-specific
    if (performance.memory) {
      // @ts-ignore
      this.metrics.totalMemoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    this.notifyCallbacks();
  }

  /**
   * Keep only recent metrics
   */
  private keepRecentMetrics(metric: keyof InboxPerformanceMetrics, maxCount: number): void {
    const array = this.metrics[metric];
    if (Array.isArray(array) && array.length > maxCount) {
      this.metrics[metric] = array.slice(-maxCount) as unknown;
    }
  }

  /**
   * Check performance budget
   */
  private checkBudget(metric: string, value: number): void {
    const budget = this.budgets.get(metric);
    if (budget && value > budget) {
      if (process.env.NODE_ENV === "development") {
      }
    }
  }

  /**
   * Get performance budgets status
   */
  getPerformanceBudgets(): PerformanceBudget[] {
    const budgets: PerformanceBudget[] = [];

    this.budgets.forEach((budget, metric) => {
      const values = this.metrics[metric as keyof InboxPerformanceMetrics];
      let actual: number | undefined;

      if (Array.isArray(values) && values.length > 0) {
        actual = values.reduce((sum: unknown, val: unknown) => sum + val, 0) / values.length;
      } else if (typeof values === "number") {
        actual = values;
      }

      if (actual !== undefined) {
        budgets.push({
          metric,
          budget,
          actual,
          status: actual <= budget ? "pass" : actual <= budget * 1.5 ? "warning" : "fail",
        });
      }
    });

    return budgets;
  }

  /**
   * Get average metric value
   */
  private getAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum: unknown, val: unknown) => sum + val, 0) / values.length;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      averageMessageRenderTime: this.getAverage(this.metrics.messageRenderTime),
      averageConversationSwitchTime: this.getAverage(this.metrics.conversationSwitchTime),
      averageMessageLoadTime: this.getAverage(this.metrics.messageLoadTime),
      averageInputLatency: this.getAverage(this.metrics.inputLatency),
      averageSearchResponseTime: this.getAverage(this.metrics.searchResponseTime),
      scrollPerformance: this.metrics.messageScrollPerformance,
      memoryUsage: this.metrics.totalMemoryUsage,
      budgetStatus: this.getPerformanceBudgets(),
    };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: InboxPerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb: unknown) => cb !== callback);
    };
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback: unknown) => callback(this.metrics));
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.observers.forEach((observer: unknown) => observer.disconnect());
    this.observers.clear();
    this.intersectionObserver?.disconnect();
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.callbacks = [];
  }
}

// Singleton instance
export const inboxPerformanceMonitor = new InboxPerformanceMonitor();
