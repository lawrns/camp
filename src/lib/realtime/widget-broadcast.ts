/**
 * Widget Broadcast Utility
 * Handles real-time broadcasting for widget messages
 */

import { createWidgetClient } from "@/lib/supabase/widget-client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Keep track of active channels with metadata for proper cleanup
interface ChannelInfo {
  channel: RealtimeChannel;
  lastUsed: number;
  subscribers: number;
  retryCount: number;
}

const activeChannels = new Map<string, ChannelInfo>();
const CHANNEL_CLEANUP_INTERVAL = 60000; // 1 minute
const CHANNEL_IDLE_TIMEOUT = 300000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;

// Cleanup inactive channels periodically to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const channelsToCleanup: string[] = [];

  activeChannels.forEach((channelInfo, name) => {
    if (now - channelInfo.lastUsed > CHANNEL_IDLE_TIMEOUT && channelInfo.subscribers === 0) {
      channelsToCleanup.push(name);
    }
  });

  channelsToCleanup.forEach((name) => {
    const channelInfo = activeChannels.get(name);
    if (channelInfo) {
      try {
        const supabase = createWidgetClient();
        supabase.removeChannel(channelInfo.channel);
        activeChannels.delete(name);

      } catch (error) {

      }
    }
  });
}, CHANNEL_CLEANUP_INTERVAL);

/**
 * Broadcast a message to real-time channels
 * This maintains persistent connections for continuous updates
 */
export async function widgetBroadcast(
  organizationId: string,
  conversationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<boolean> {
  // Use standardized channel naming (specification compliant)
  const channelName = `bcast:conv:${organizationId}:${conversationId}`;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const supabase = createWidgetClient();

      // Get or create channel with improved management
      let channelInfo = activeChannels.get(channelName);

      if (!channelInfo) {
        // Create new channel with proper configuration
        const channel = supabase.channel(channelName, {
          config: {
            broadcast: {
              self: false, // Don't receive own messages
              ack: false, // Don't wait for acknowledgment
            },
            presence: {
              key: `widget_${organizationId}_${conversationId}`,
            },
          },
        });

        // Subscribe to the channel with improved error handling
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Channel subscription timeout after 10s for ${channelName}`));
          }, 10000); // Increased timeout to 10 seconds

          channel.subscribe((status: string) => {

            if (status === "SUBSCRIBED") {
              clearTimeout(timeout);
              channelInfo = {
                channel,
                lastUsed: Date.now(),
                subscribers: 1,
                retryCount: 0,
              };
              activeChannels.set(channelName, channelInfo);

              resolve();
            } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
              clearTimeout(timeout);
              reject(new Error(`Channel subscription failed with status: ${status}`));
            }
            // Continue waiting for other statuses like "JOINING"
          });
        });
      } else {
        // Update last used time and increment subscribers
        channelInfo.lastUsed = Date.now();
        channelInfo.subscribers++;
        channelInfo.retryCount = 0; // Reset retry count on successful reuse
      }

      // Send the broadcast message using the channel from channelInfo
      const broadcastPayload = {
        type: "broadcast" as const,
        event,
        payload: {
          ...data,
          organizationId,
          conversationId,
          timestamp: new Date().toISOString(),
        },
      };

      await channelInfo.channel.send(broadcastPayload);

      // Also broadcast to organization-wide channel for dashboard updates
      const orgChannelName = `org:${organizationId}`;
      let orgChannelInfo = activeChannels.get(orgChannelName);

      if (!orgChannelInfo) {
        const orgChannel = supabase.channel(orgChannelName);
        await new Promise<void>((resolve) => {
          orgChannel.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              orgChannelInfo = {
                channel: orgChannel,
                lastUsed: Date.now(),
                subscribers: 1,
                retryCount: 0,
              };
              activeChannels.set(orgChannelName, orgChannelInfo);
              resolve();
            }
          });
        });
      } else {
        orgChannelInfo.lastUsed = Date.now();
        orgChannelInfo.subscribers++;
      }

      await orgChannelInfo.channel.send({
        type: "broadcast" as const,
        event: "conversation_updated",
        payload: {
          conversationId,
          organizationId,
          lastMessage: data,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {

      // Update retry count for the channel
      const channelInfo = activeChannels.get(channelName);
      if (channelInfo) {
        channelInfo.retryCount++;
        if (channelInfo.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Remove failed channel to force recreation
          const supabase = createWidgetClient();
          supabase.removeChannel(channelInfo.channel);
          activeChannels.delete(channelName);

        }
      }

      // If this is the last attempt, return false
      if (attempt === MAX_RETRY_ATTEMPTS) {

        return false;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false; // Should never reach here, but TypeScript requires it
}

// Cleanup function to remove channels when no longer needed
export function cleanupChannels() {
  const supabase = createWidgetClient();
  activeChannels.forEach((channelInfo: ChannelInfo, name: string) => {
    try {
      supabase.removeChannel(channelInfo.channel);

    } catch (error) {

    }
  });
  activeChannels.clear();
}

// Cleanup on page unload to prevent memory leaks
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanupChannels);
}
