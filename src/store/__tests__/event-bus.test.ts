/**
 * Event Bus System Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus, EventPriority, type EventTypes } from "../event-bus";

describe("EventBus", () => {
  beforeEach(() => {
    // Clear event bus before each test
    eventBus.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should emit and receive events", async () => {
      const handler = vi.fn();

      eventBus.on("message:sent", handler);

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: "msg-1",
          conversationId: "conv-1",
          content: "Hello",
          sender: "user",
        })
      );
    });

    it("should unsubscribe handlers", async () => {
      const handler = vi.fn();

      const unsubscribe = eventBus.on("message:sent", handler);
      unsubscribe();

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle multiple handlers for same event", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on("message:sent", handler1);
      eventBus.on("message:sent", handler2);

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle once subscription", async () => {
      const handler = vi.fn();

      eventBus.once("message:sent", handler);

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-2",
        conversationId: "conv-1",
        content: "World",
        sender: "user",
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Priority Handling", () => {
    it("should execute handlers in priority order", async () => {
      const executionOrder: number[] = [];

      eventBus.on("message:sent", {
        handler: () => executionOrder.push(1),
        priority: EventPriority.LOW,
      });

      eventBus.on("message:sent", {
        handler: () => executionOrder.push(2),
        priority: EventPriority.CRITICAL,
      });

      eventBus.on("message:sent", {
        handler: () => executionOrder.push(3),
        priority: EventPriority.HIGH,
      });

      eventBus.on("message:sent", {
        handler: () => executionOrder.push(4),
        priority: EventPriority.NORMAL,
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(executionOrder).toEqual([2, 3, 4, 1]); // CRITICAL, HIGH, NORMAL, LOW
    });
  });

  describe("Async Handlers", () => {
    it("should handle async handlers", async () => {
      const results: string[] = [];

      eventBus.on("message:sent", {
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push("async1");
        },
        async: true,
      });

      eventBus.on("message:sent", {
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          results.push("async2");
        },
        async: true,
      });

      eventBus.on("message:sent", {
        handler: () => {
          results.push("sync");
        },
        async: false,
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      // Sync handler should execute first
      expect(results[0]).toBe("sync");
      // Async handlers can complete in any order
      expect(results).toContain("async1");
      expect(results).toContain("async2");
      expect(results.length).toBe(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle handler errors", async () => {
      const errorHandler = vi.fn();
      const successHandler = vi.fn();

      eventBus.on("message:sent", {
        handler: () => {
          throw new Error("Handler error");
        },
        errorHandler,
      });

      eventBus.on("message:sent", successHandler);

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          messageId: "msg-1",
        })
      );
      expect(successHandler).toHaveBeenCalled();
    });

    it("should retry failed handlers", async () => {
      let attempts = 0;
      const handler = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Retry me");
        }
      });

      eventBus.on("message:sent", {
        handler,
        retryCount: 2,
        retryDelay: 10,
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(handler).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });
  });

  describe("Event History", () => {
    it("should maintain event history", async () => {
      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      await eventBus.emit("conversation:created", {
        source: "test",
        conversationId: "conv-1",
        customerId: "cust-1",
        channel: "web",
      });

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        source: "test",
        messageId: "msg-1",
      });
      expect(history[1]).toMatchObject({
        source: "test",
        conversationId: "conv-1",
      });
    });

    it("should filter history", async () => {
      const now = Date.now();

      await eventBus.emit("message:sent", {
        source: "test1",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
        timestamp: now - 2000,
      });

      await eventBus.emit("message:sent", {
        source: "test2",
        messageId: "msg-2",
        conversationId: "conv-1",
        content: "World",
        sender: "user",
        timestamp: now - 1000,
      });

      const filteredHistory = eventBus.getHistory({
        source: "test1",
      });

      expect(filteredHistory).toHaveLength(1);
      expect(filteredHistory[0].source).toBe("test1");

      const timeFilteredHistory = eventBus.getHistory({
        startTime: now - 1500,
      });

      expect(timeFilteredHistory).toHaveLength(1);
      expect(timeFilteredHistory[0]).toMatchObject({
        messageId: "msg-2",
      });
    });
  });

  describe("Statistics", () => {
    it("should provide event statistics", async () => {
      eventBus.on("message:sent", vi.fn());
      eventBus.on("message:sent", vi.fn());
      eventBus.on("conversation:created", vi.fn());

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-2",
        conversationId: "conv-1",
        content: "World",
        sender: "user",
      });

      const stats = eventBus.getStats();

      expect(stats.totalEvents).toBe(2);
      expect(stats.handlerCounts["message:sent"]).toBe(2);
      expect(stats.handlerCounts["conversation:created"]).toBe(1);
      expect(stats.queueSize).toBe(0);
    });
  });

  describe("Debug Mode", () => {
    it("should log events in debug mode", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      eventBus.setDebugMode(true);

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EventBus] Emitting message:sent:"),
        expect.any(Object)
      );

      eventBus.setDebugMode(false);
    });
  });

  describe("Performance Monitoring", () => {
    it("should warn on slow event processing", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      eventBus.setPerformanceMonitoring(true);

      eventBus.on("message:sent", {
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
        },
        async: false, // Sync to ensure it blocks
      });

      await eventBus.emit("message:sent", {
        source: "test",
        messageId: "msg-1",
        conversationId: "conv-1",
        content: "Hello",
        sender: "user",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("[EventBus] Slow event processing"));

      eventBus.setPerformanceMonitoring(false);
    });
  });

  describe("Type Safety", () => {
    it("should enforce type safety for events", () => {
      // This is a compile-time test, but we can verify runtime behavior
      const handler = vi.fn();

      eventBus.on("auth:login", handler);

      // TypeScript would prevent incorrect event data at compile time
      // At runtime, we can still emit and verify the handler receives the data
      eventBus.emit("auth:login", {
        source: "test",
        userId: "user-123",
        organizationId: "org-456",
        session: { token: "abc123" },
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          organizationId: "org-456",
        })
      );
    });
  });
});
