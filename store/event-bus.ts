/**
 * Event Bus System for Cross-Store Communication
 *
 * This module provides a centralized event bus for communication between
 * different Zustand stores in the application. It supports:
 * - Type-safe event definitions
 * - Async event handling
 * - Event prioritization
 * - Error handling with retry logic
 * - Debug mode for development
 * - Event history tracking
 * - Performance monitoring
 */

// Import React for hooks
import * as React from "react";
import { customStorage } from "./persistence-config";

// ===== TYPE DEFINITIONS =====

/**
 * Event priority levels
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Base event interface that all events must extend
 */
export interface BaseEvent {
  id: string;
  timestamp: number;
  source: string; // Which store/component emitted the event
  priority?: EventPriority;
  metadata?: Record<string, any>;
}

/**
 * Event handler function type
 */
export type EventHandler<T extends BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event handler with error handling
 */
export interface EventHandlerConfig<T extends BaseEvent> {
  handler: EventHandler<T>;
  priority?: EventPriority;
  async?: boolean;
  retryCount?: number;
  retryDelay?: number;
  errorHandler?: (error: Error, event: T) => void;
}

/**
 * Event types for the application
 */
export interface EventTypes {
  // Authentication events
  "auth:login": BaseEvent & {
    userId: string;
    organizationId: string;
    session: any;
  };
  "auth:logout": BaseEvent & {
    userId: string;
  };
  "auth:clear": BaseEvent & {
    userId: string;
  };
  "auth:token-refreshed": BaseEvent & {
    userId: string;
    newToken: string;
  };

  // Conversation events
  "conversation:created": BaseEvent & {
    conversationId: string;
    customerId: string;
    channel: string;
  };
  "conversation:updated": BaseEvent & {
    conversationId: string;
    updates: Record<string, any>;
  };
  "conversation:deleted": BaseEvent & {
    conversationId: string;
  };
  "conversation:assigned": BaseEvent & {
    conversationId: string;
    assigneeId: string;
    previousAssigneeId?: string;
  };
  "conversation:status-changed": BaseEvent & {
    conversationId: string;
    newStatus: string;
    previousStatus: string;
  };
  "conversation:read": BaseEvent & {
    conversationId: string;
  };

  // Message events
  "message:sent": BaseEvent & {
    messageId: string;
    conversationId: string;
    content: string;
    sender: "user" | "customer" | "ai";
  };
  "message:received": BaseEvent & {
    messageId: string;
    conversationId: string;
    content: string;
    sender: "user" | "customer" | "ai";
  };
  "message:added": BaseEvent & {
    conversationId: string;
    message: any;
  };
  "message:updated": BaseEvent & {
    messageId: string;
    conversationId: string;
    updates: Record<string, any>;
  };
  "message:deleted": BaseEvent & {
    messageId: string;
    conversationId: string;
  };
  "messages:loaded": BaseEvent & {
    conversationId: string;
    count: number;
  };
  "messages:error": BaseEvent & {
    conversationId: string;
    error: string;
  };

  // AI events
  "ai:handover-requested": BaseEvent & {
    conversationId: string;
    confidence: number;
    reason: string;
  };
  "ai:response-generated": BaseEvent & {
    conversationId: string;
    messageId: string;
    confidence: number;
  };
  "ai:error": BaseEvent & {
    conversationId?: string;
    error: string;
    code: string;
  };

  // Real-time events
  "realtime:connected": BaseEvent & {
    channel: string;
  };
  "realtime:disconnected": BaseEvent & {
    channel: string;
    reason?: string;
  };
  "realtime:error": BaseEvent & {
    channel: string;
    error: string;
  };

  // UI events
  "ui:theme-changed": BaseEvent & {
    theme: "light" | "dark";
  };
  "ui:sidebar-toggled": BaseEvent & {
    isOpen: boolean;
  };
  "ui:notification-shown": BaseEvent & {
    notificationId: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
  };

  // Performance events
  "performance:slow-render": BaseEvent & {
    componentName: string;
    renderTime: number;
  };
  "performance:api-slow": BaseEvent & {
    endpoint: string;
    duration: number;
  };
  "performance:memory-warning": BaseEvent & {
    usage: number;
    threshold: number;
  };

  // System events
  "system:error": BaseEvent & {
    error: Error;
    context?: string;
  };
  "system:online": BaseEvent;
  "system:offline": BaseEvent;
  "system:reconnect-requested": BaseEvent & {
    reason?: string;
  };
}

// ===== EVENT BUS IMPLEMENTATION =====

class EventBus {
  private handlers: Map<keyof EventTypes, Set<EventHandlerConfig<any>>> = new Map();
  private eventHistory: BaseEvent[] = [];
  private maxHistorySize = 1000;
  private debugMode = false;
  private performanceMonitoring = false;
  private eventQueue: Array<{ event: BaseEvent; handlers: Set<EventHandlerConfig<any>> }> = [];
  private isProcessing = false;

  constructor() {
    // Load debug mode from localStorage
    if (typeof window !== "undefined") {
      this.debugMode = localStorage.getItem("eventBus:debug") === "true";
      this.performanceMonitoring = localStorage.getItem("eventBus:performance") === "true";
    }
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof EventTypes>(
    eventType: K,
    handler: EventHandler<EventTypes[K]> | EventHandlerConfig<EventTypes[K]>
  ): () => void {
    const config: EventHandlerConfig<EventTypes[K]> =
      typeof handler === "function" ? { handler, priority: EventPriority.NORMAL } : handler;

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(config);

    // Return unsubscribe function
    return () => {
      handlers.delete(config);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to an event only once
   */
  once<K extends keyof EventTypes>(eventType: K, handler: EventHandler<EventTypes[K]>): () => void {
    const wrappedHandler: EventHandler<EventTypes[K]> = (event) => {
      unsubscribe();
      return handler(event);
    };

    const unsubscribe = this.on(eventType, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  async emit<K extends keyof EventTypes>(
    eventType: K,
    eventData: Omit<EventTypes[K], keyof BaseEvent> & Partial<BaseEvent>
  ): Promise<void> {
    const event: EventTypes[K] = {
      id: eventData.id || this.generateEventId(),
      timestamp: eventData.timestamp || Date.now(),
      source: eventData.source || "unknown",
      priority: eventData.priority || EventPriority.NORMAL,
      ...eventData,
    } as EventTypes[K];

    // Add to history
    this.addToHistory(event);

    // Debug logging
    if (this.debugMode) {
      console.log(`[EventBus] Emitting ${eventType}:`, event);
    }

    // Performance tracking
    const startTime = this.performanceMonitoring ? performance.now() : 0;

    // Get handlers
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      if (this.debugMode) {
        console.log(`[EventBus] No handlers for ${eventType}`);
      }
      return;
    }

    // Add to queue based on priority
    this.eventQueue.push({ event, handlers });
    this.eventQueue.sort((a, b) => (b.event.priority || 0) - (a.event.priority || 0));

    // Process queue
    await this.processQueue();

    // Performance logging
    if (this.performanceMonitoring) {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`[EventBus] Slow event processing for ${eventType}: ${duration}ms`);
      }
    }
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const { event, handlers } = this.eventQueue.shift()!;

      // Sort handlers by priority
      const sortedHandlers = Array.from(handlers).sort(
        (a, b) => (b.priority || EventPriority.NORMAL) - (a.priority || EventPriority.NORMAL)
      );

      // Execute handlers
      const promises: Promise<void>[] = [];

      for (const config of sortedHandlers) {
        if (config.async) {
          // Async handlers run in parallel
          promises.push(this.executeHandler(config, event));
        } else {
          // Sync handlers run sequentially
          await this.executeHandler(config, event);
        }
      }

      // Wait for all async handlers
      await Promise.all(promises);
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single handler with error handling and retry logic
   */
  private async executeHandler<T extends BaseEvent>(config: EventHandlerConfig<T>, event: T): Promise<void> {
    const maxRetries = config.retryCount || 0;
    const retryDelay = config.retryDelay || 1000;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await Promise.resolve(config.handler(event));
        return; // Success
      } catch (error) {
        lastError = error as Error;

        if (this.debugMode) {
          console.error(`[EventBus] Handler error (attempt ${attempt + 1}):`, error);
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    // All retries failed
    if (lastError && config.errorHandler) {
      try {
        config.errorHandler(lastError, event);
      } catch (errorHandlerError) {
        console.error("[EventBus] Error handler failed:", errorHandlerError);
      }
    } else if (lastError) {
      console.error("[EventBus] Unhandled event handler error:", lastError);
    }
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.handlers.clear();
    this.eventQueue = [];
    this.eventHistory = [];
  }

  /**
   * Get event history
   */
  getHistory(filter?: {
    eventType?: keyof EventTypes;
    source?: string;
    startTime?: number;
    endTime?: number;
  }): BaseEvent[] {
    let history = [...this.eventHistory];

    if (filter) {
      if (filter.eventType) {
        history = history.filter((e: any) => this.getEventType(e) === filter.eventType);
      }
      if (filter.source) {
        history = history.filter((e: any) => e.source === filter.source);
      }
      if (filter.startTime) {
        history = history.filter((e: any) => e.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        history = history.filter((e: any) => e.timestamp <= filter.endTime!);
      }
    }

    return history;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("eventBus:debug", enabled.toString());
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  setPerformanceMonitoring(enabled: boolean): void {
    this.performanceMonitoring = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("eventBus:performance", enabled.toString());
    }
  }

  /**
   * Get statistics about event usage
   */
  getStats(): {
    totalEvents: number;
    eventCounts: Record<string, number>;
    handlerCounts: Record<string, number>;
    queueSize: number;
  } {
    const eventCounts: Record<string, number> = {};

    for (const event of this.eventHistory) {
      const type = this.getEventType(event);
      eventCounts[type] = (eventCounts[type] || 0) + 1;
    }

    const handlerCounts: Record<string, number> = {};
    for (const [eventType, handlers] of Array.from(this.handlers.entries())) {
      handlerCounts[eventType] = handlers.size;
    }

    return {
      totalEvents: this.eventHistory.length,
      eventCounts,
      handlerCounts,
      queueSize: this.eventQueue.length,
    };
  }

  // ===== PRIVATE HELPERS =====

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(event: BaseEvent): void {
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private getEventType(event: BaseEvent): string {
    // This is a simplified version - in a real implementation,
    // you might want to store the event type with the event
    for (const [type, handlers] of Array.from(this.handlers.entries())) {
      // Check if this event matches the type (simplified check)
      return type;
    }
    return "unknown";
  }
}

// ===== SINGLETON INSTANCE =====

export const eventBus = new EventBus();

// ===== ZUSTAND INTEGRATION HELPERS =====

/**
 * Create a Zustand middleware that emits events on state changes
 */
export const createEventEmitterMiddleware =
  <T extends object>(
    storeName: string,
    eventMapping?: {
      [K in keyof T]?: keyof EventTypes;
    }
  ) =>
  (config: any) =>
  (set: any, get: any, api: any) => {
    const wrappedSet = (updater: any, replace?: boolean) => {
      const prevState = get();

      set(updater, replace);

      const nextState = get();

      // Emit events for changed properties
      if (eventMapping) {
        for (const [key, eventType] of Object.entries(eventMapping)) {
          if (prevState[key] !== nextState[key] && eventType) {
            eventBus.emit(eventType as keyof EventTypes, {
              source: storeName,
              // @ts-ignore - dynamic event data
              ...nextState[key],
            });
          }
        }
      }
    };

    return config(wrappedSet, get, api);
  };

/**
 * Hook to subscribe to events in React components
 */
export function useEventBus<K extends keyof EventTypes>(
  eventType: K,
  handler: EventHandler<EventTypes[K]>,
  deps: React.DependencyList = []
): void {
  React.useEffect(() => {
    const unsubscribe = eventBus.on(eventType, handler);
    return unsubscribe;
  }, [eventType, ...deps]);
}

/**
 * Hook to emit events from React components
 */
export function useEventEmitter() {
  return React.useCallback(
    <K extends keyof EventTypes>(
      eventType: K,
      eventData: Omit<EventTypes[K], keyof BaseEvent> & Partial<BaseEvent>
    ) => {
      return eventBus.emit(eventType, eventData);
    },
    []
  );
}

// ===== DEVELOPMENT TOOLS =====

// Expose event bus to window in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__eventBus = eventBus;
  console.log("[EventBus] Development mode - eventBus available at window.__eventBus");
}
