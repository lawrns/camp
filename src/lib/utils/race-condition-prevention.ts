/**
 * Race Condition Prevention Utilities
 *
 * This module provides utilities to prevent race conditions in state management,
 * API calls, and realtime event processing.
 */

import { debounce, throttle } from "lodash";

/**
 * Mutex implementation for critical sections
 */
export class Mutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()!;
      resolve();
    } else {
      this.locked = false;
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Sequential queue for operations that must be processed in order
 */
export class SequentialQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private processing = false;
  private results: T[] = [];

  async add(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      try {
        const result = await operation();
        this.results.push(result);
      } catch (error) {}
    }
    this.processing = false;
  }

  clear(): void {
    this.queue = [];
    this.results = [];
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
export class RequestDeduplicator {
  private inFlightRequests = new Map<string, Promise<unknown>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      return existing as T;
    }

    const promise = requestFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise as T;
  }

  clear(key?: string): void {
    if (key) {
      this.inFlightRequests.delete(key);
    } else {
      this.inFlightRequests.clear();
    }
  }
}

/**
 * Optimistic locking for entities
 */
export interface VersionedEntity {
  id: string;
  version: number;
  updatedAt: string;
}

export class OptimisticLockManager {
  private versions = new Map<string, number>();

  checkVersion(entity: VersionedEntity): boolean {
    const currentVersion = this.versions.get(entity.id);
    if (currentVersion === undefined) {
      this.versions.set(entity.id, entity.version);
      return true;
    }
    return entity.version >= currentVersion;
  }

  updateVersion(id: string, version: number): void {
    this.versions.set(id, version);
  }

  incrementVersion(id: string): number {
    const current = this.versions.get(id) || 0;
    const next = current + 1;
    this.versions.set(id, next);
    return next;
  }

  clear(id?: string): void {
    if (id) {
      this.versions.delete(id);
    } else {
      this.versions.clear();
    }
  }
}

/**
 * Atomic update manager for state updates
 */
export class AtomicUpdateManager {
  private updateQueue = new SequentialQueue<void>();
  private mutex = new Mutex();

  async atomicUpdate<T>(getter: () => T, setter: (value: T) => void, updater: (current: T) => T): Promise<void> {
    return this.mutex.withLock(async () => {
      const current = getter();
      const updated = updater(current);
      setter(updated);
    });
  }

  async batchUpdate<T>(
    updates: Array<{
      getter: () => T;
      setter: (value: T) => void;
      updater: (current: T) => T;
    }>
  ): Promise<void> {
    return this.mutex.withLock(async () => {
      for (const { getter, setter, updater } of updates) {
        const current = getter();
        const updated = updater(current);
        setter(updated);
      }
    });
  }
}

/**
 * Debounced action runner with cancellation
 */
export class DebouncedActionRunner {
  private actions = new Map<string, ReturnType<typeof debounce>>();

  run(key: string, action: () => void | Promise<void>, delay: number = 300): void {
    let debouncedAction = this.actions.get(key);

    if (!debouncedAction) {
      debouncedAction = debounce(action, delay);
      this.actions.set(key, debouncedAction);
    }

    debouncedAction();
  }

  cancel(key: string): void {
    const action = this.actions.get(key);
    if (action) {
      action.cancel();
      this.actions.delete(key);
    }
  }

  cancelAll(): void {
    for (const action of this.actions.values()) {
      action.cancel();
    }
    this.actions.clear();
  }
}

/**
 * Throttled action runner
 */
export class ThrottledActionRunner {
  private actions = new Map<string, ReturnType<typeof throttle>>();

  run(key: string, action: () => void | Promise<void>, delay: number = 100): void {
    let throttledAction = this.actions.get(key);

    if (!throttledAction) {
      throttledAction = throttle(action, delay);
      this.actions.set(key, throttledAction);
    }

    throttledAction();
  }

  cancel(key: string): void {
    const action = this.actions.get(key);
    if (action) {
      action.cancel();
      this.actions.delete(key);
    }
  }

  cancelAll(): void {
    for (const action of this.actions.values()) {
      action.cancel();
    }
    this.actions.clear();
  }
}

/**
 * Event ordering manager for handling out-of-order events
 */
export interface OrderedEvent<T = unknown> {
  id: string;
  timestamp: number;
  data: T;
}

export class EventOrderingManager {
  private eventBuffer = new Map<string, OrderedEvent[]>();
  private processedEvents = new Set<string>();
  private maxBufferSize = 100;
  private maxBufferAge = 5000; // 5 seconds

  async processEvent(
    channelId: string,
    event: OrderedEvent,
    handler: (event: OrderedEvent) => Promise<void>
  ): Promise<void> {
    // Skip if already processed
    if (this.processedEvents.has(event.id)) {
      return;
    }

    // Get or create buffer for channel
    let buffer = this.eventBuffer.get(channelId);
    if (!buffer) {
      buffer = [];
      this.eventBuffer.set(channelId, buffer);
    }

    // Add event to buffer
    buffer.push(event);
    buffer.sort((a, b) => a.timestamp - b.timestamp);

    // Clean old events
    const now = Date.now();
    buffer = buffer.filter((e: OrderedEvent) => now - e.timestamp < this.maxBufferAge);

    // Limit buffer size
    if (buffer.length > this.maxBufferSize) {
      buffer = buffer.slice(-this.maxBufferSize);
    }

    this.eventBuffer.set(channelId, buffer);

    // Process events in order
    const toProcess: OrderedEvent[] = [];
    for (const bufferedEvent of buffer) {
      if (!this.processedEvents.has(bufferedEvent.id)) {
        toProcess.push(bufferedEvent);
      }
    }

    for (const eventToProcess of toProcess) {
      try {
        await handler(eventToProcess);
        this.processedEvents.add(eventToProcess.id);
      } catch (error) {}
    }
  }

  clear(channelId?: string): void {
    if (channelId) {
      this.eventBuffer.delete(channelId);
    } else {
      this.eventBuffer.clear();
      this.processedEvents.clear();
    }
  }
}

/**
 * State conflict resolver for handling concurrent updates
 */
export interface ConflictResolution<T> {
  strategy: "last-write-wins" | "merge" | "custom";
  resolver?: (current: T, incoming: T) => T;
}

export class StateConflictResolver<T extends VersionedEntity> {
  resolve(current: T, incoming: T, resolution: ConflictResolution<T>): T {
    // If versions match, no conflict
    if (current.version === incoming.version) {
      return incoming;
    }

    // Apply resolution strategy
    switch (resolution.strategy) {
      case "last-write-wins":
        return new Date(incoming.updatedAt) > new Date(current.updatedAt) ? incoming : current;

      case "merge":
        // Simple merge - prefer newer fields
        const merged = { ...current };
        for (const key in incoming) {
          if (key !== "version" && key !== "id") {
            merged[key] = incoming[key];
          }
        }
        merged.version = Math.max(current.version, incoming.version) + 1;
        merged.updatedAt = new Date().toISOString();
        return merged;

      case "custom":
        if (!resolution.resolver) {
          throw new Error("Custom resolver function required");
        }
        return resolution.resolver(current, incoming);

      default:
        return incoming;
    }
  }
}

/**
 * Global race condition prevention instances
 */
export const globalMutex = new Mutex();
export const apiDeduplicator = new RequestDeduplicator();
export const updateManager = new AtomicUpdateManager();
export const debouncedRunner = new DebouncedActionRunner();
export const throttledRunner = new ThrottledActionRunner();
export const eventOrderer = new EventOrderingManager();
export const lockManager = new OptimisticLockManager();

/**
 * Cleanup function for application shutdown
 */
export function cleanupRaceConditionPrevention(): void {
  apiDeduplicator.clear();
  debouncedRunner.cancelAll();
  throttledRunner.cancelAll();
  eventOrderer.clear();
  lockManager.clear();
}
