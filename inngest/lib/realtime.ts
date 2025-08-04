/**
 * RILL-Compliant Realtime Publishing for Inngest Functions
 * Provides utilities for publishing realtime updates from background jobs
 */

import { broadcastToConversation, broadcastToOrganization } from "@/lib/realtime";

interface RealtimePublishOptions {
  channelType: "messages" | "typing" | "presence" | "notifications" | "handoffs" | "ai-status" | "conversations";
  resourceId: string;
  organizationId: string;
  event: string;
  payload: unknown;
  retries?: number;
  timeout?: number;
  priority?: "low" | "normal" | "high" | "critical";
}

interface BatchedEvent {
  channelType: "messages" | "typing" | "presence" | "notifications" | "handoffs" | "ai-status" | "conversations";
  resourceId: string;
  organizationId: string;
  event: string;
  payload: unknown;
  priority?: "low" | "normal" | "high" | "critical";
}

/**
 * Publish a single event using LeanRealtime system
 */
export async function publishToSupabaseRealtime(options: RealtimePublishOptions): Promise<void> {
  const { channelType, resourceId, organizationId, event, payload, retries = 3, priority = "normal" } = options;

  let attempt = 0;
  while (attempt < retries) {
    try {
      // 🔥 CRITICAL FIX: Use LeanRealtime instead of deprecated UnifiedRealtimeManager
      const eventData = {
        ...payload,
        timestamp: new Date().toISOString(),
        priority,
      };

      if (channelType === "conversations" || channelType === "messages") {
        // Use conversation broadcasting
        await broadcastToConversation(organizationId, resourceId, event, eventData);
      } else {
        // Use organization broadcasting for other channel types
        await broadcastToOrganization(organizationId, event, eventData);
      }

      console.log(`✅ [LeanRealtime-Inngest] Published event: ${event} to ${channelType}:${resourceId}`);
      return;
    } catch (error) {
      attempt++;
      const isLastAttempt = attempt >= retries;

      console.error(`❌ Realtime publish attempt ${attempt} failed:`, error);

      if (isLastAttempt) {
        // Don't throw on final failure - log and continue
        // Background jobs shouldn't fail because of realtime issues
        console.error(
          `🚨 Failed to publish realtime event after ${retries} attempts: ${event} to ${channelType}:${resourceId}`
        );
        return;
      }

      // Exponential backoff
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Publish multiple events in batch with RILL-compliant patterns
 */
export async function publishBatchedRealtimeEvents(events: BatchedEvent[]): Promise<void> {
  if (events.length === 0) return;

  // Group events by organization and resource type to optimize connections
  const eventsByOrg = new Map<
    string,
    Map<string, { resourceId: string; event: string; payload: unknown; priority: string }[]>
  >();

  for (const { channelType, resourceId, organizationId, event, payload, priority = "normal" } of events) {
    if (!eventsByOrg.has(organizationId)) {
      eventsByOrg.set(organizationId, new Map());
    }
    const orgMap = eventsByOrg.get(organizationId)!;

    if (!orgMap.has(channelType)) {
      orgMap.set(channelType, []);
    }
    orgMap.get(channelType)!.push({ resourceId, event, payload, priority: priority || "normal" });
  }

  // Process each organization's events
  const promises = Array.from(eventsByOrg.entries()).map(async ([organizationId, resourceMap]) => {
    try {
      // 🔥 CRITICAL FIX: Use LeanRealtime instead of deprecated UnifiedRealtimeManager

      // Send all events for this organization
      for (const [channelType, events] of resourceMap) {
        for (const { resourceId, event, payload, priority } of events) {
          const eventData = {
            ...payload,
            timestamp: new Date().toISOString(),
            priority,
          };

          if (channelType === "conversations" || channelType === "messages") {
            // Use conversation broadcasting
            await broadcastToConversation(organizationId, resourceId, event, eventData);
          } else {
            // Use organization broadcasting for other channel types
            await broadcastToOrganization(organizationId, event, eventData);
          }
        }
      }

      console.log(
        `✅ [LeanRealtime-Inngest] Published ${Array.from(resourceMap.values()).flat().length} events for org: ${organizationId}`
      );
    } catch (error) {
      console.error(`❌ Failed to publish batched events for org: ${organizationId}`, error);
    }
  });

  // Wait for all organizations to complete
  await Promise.allSettled(promises);
}

/**
 * Rate-limited publishing to prevent flooding using RILL patterns
 */
class RealtimePublisher {
  private eventQueue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private readonly maxConcurrent = 5;
  private readonly delayBetweenEvents = 100; // ms

  async enqueue(publishFn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventQueue.push(async () => {
        try {
          await publishFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, this.maxConcurrent);

      await Promise.allSettled(batch.map((fn: unknown) => fn()));

      if (this.eventQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delayBetweenEvents));
      }
    }

    this.isProcessing = false;
  }
}

// Singleton publisher instance
export const realtimePublisher = new RealtimePublisher();
