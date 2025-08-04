import React from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Utility functions for proper real-time subscription cleanup
 * Prevents memory leaks and connection issues
 */

export interface CleanupOptions {
  timeout?: number; // Timeout for unsubscribe operation in ms
  forceRemove?: boolean; // Force remove channel even if unsubscribe fails
  logErrors?: boolean; // Whether to log cleanup errors
}

/**
 * Safely cleanup a single Supabase realtime channel
 * Handles both unsubscribe and channel removal with proper error handling
 */
export async function cleanupRealtimeChannel(
  channel: RealtimeChannel | null,
  options: CleanupOptions = {}
): Promise<boolean> {
  const { timeout = 5000, forceRemove = true, logErrors = true } = options;

  if (!channel) {
    if (logErrors) console.warn("[cleanupRealtimeChannel] No channel provided for cleanup");
    return false;
  }

  try {
    if (logErrors) console.log("[cleanupRealtimeChannel] Starting cleanup for channel:", channel.topic);

    // Create a promise that resolves when unsubscribe completes or times out
    const unsubscribePromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Unsubscribe timeout after ${timeout}ms`));
      }, timeout);

      channel.unsubscribe()
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });

    try {
      await unsubscribePromise;
      if (logErrors) console.log("[cleanupRealtimeChannel] Channel unsubscribed successfully");
    } catch (unsubscribeError) {
      if (logErrors) {
        console.warn("[cleanupRealtimeChannel] Unsubscribe failed:", unsubscribeError);
      }
      
      if (!forceRemove) {
        throw unsubscribeError;
      }
    }

    // Remove the channel from Supabase client
    const client = supabase.browser();
    if (client) {
      client.removeChannel(channel);
      if (logErrors) console.log("[cleanupRealtimeChannel] Channel removed successfully");
    }

    return true;
  } catch (error) {
    if (logErrors) {
      console.error("[cleanupRealtimeChannel] Cleanup failed:", error);
    }

    // Last resort: try to force remove the channel
    if (forceRemove) {
      try {
        const client = supabase.browser();
        if (client) {
          client.removeChannel(channel);
          if (logErrors) console.log("[cleanupRealtimeChannel] Force removal successful");
          return true;
        }
      } catch (forceError) {
        if (logErrors) {
          console.error("[cleanupRealtimeChannel] Force removal failed:", forceError);
        }
      }
    }

    return false;
  }
}

/**
 * Cleanup multiple realtime channels
 * Useful for components that manage multiple subscriptions
 */
export async function cleanupMultipleChannels(
  channels: (RealtimeChannel | null)[],
  options: CleanupOptions = {}
): Promise<boolean[]> {
  const { logErrors = true } = options;

  if (logErrors) {
    console.log(`[cleanupMultipleChannels] Cleaning up ${channels.length} channels`);
  }

  const cleanupPromises = channels.map(channel => 
    cleanupRealtimeChannel(channel, options)
  );

  try {
    const results = await Promise.allSettled(cleanupPromises);
    const successes = results.map(result => result.status === 'fulfilled' && result.value);
    
    if (logErrors) {
      const successCount = successes.filter(Boolean).length;
      console.log(`[cleanupMultipleChannels] Cleanup completed: ${successCount}/${channels.length} successful`);
    }

    return successes;
  } catch (error) {
    if (logErrors) {
      console.error("[cleanupMultipleChannels] Batch cleanup failed:", error);
    }
    return new Array(channels.length).fill(false);
  }
}

/**
 * Create a cleanup function that can be used in useEffect return
 * Provides a standardized way to handle cleanup across components
 */
export function createChannelCleanup(
  channels: RealtimeChannel | RealtimeChannel[] | null,
  options: CleanupOptions = {}
): () => void {
  return () => {
    if (!channels) return;

    if (Array.isArray(channels)) {
      cleanupMultipleChannels(channels, options);
    } else {
      cleanupRealtimeChannel(channels, options);
    }
  };
}

/**
 * Hook-style cleanup utility for React components
 * Returns a cleanup function that can be called manually or in useEffect
 */
export function useRealtimeCleanup() {
  const channelsRef = React.useRef<RealtimeChannel[]>([]);

  const addChannel = React.useCallback((channel: RealtimeChannel) => {
    channelsRef.current.push(channel);
  }, []);

  const removeChannel = React.useCallback((channel: RealtimeChannel) => {
    const index = channelsRef.current.indexOf(channel);
    if (index > -1) {
      channelsRef.current.splice(index, 1);
    }
  }, []);

  const cleanupAll = React.useCallback(async (options: CleanupOptions = {}) => {
    const channels = [...channelsRef.current];
    channelsRef.current = [];
    return cleanupMultipleChannels(channels, options);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupAll({ logErrors: false }); // Silent cleanup on unmount
    };
  }, [cleanupAll]);

  return {
    addChannel,
    removeChannel,
    cleanupAll,
    channels: channelsRef.current,
  };
}
