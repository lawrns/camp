import { useEffect, useRef } from "react";
import { getSupabaseLegacy, RealtimeChannel } from "@/lib/supabase";

/**
 * Hook to listen to Supabase Realtime broadcast events
 */
export function useSupabaseEvent<T = Record<string, unknown>>(
  channelName: string,
  eventName: string,
  callback: (payload: T) => void,
  dependencies: unknown[] = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel
    const channel = getSupabaseLegacy().channel(channelName);
    channelRef.current = channel;

    // Subscribe to broadcast events
    channel.on("broadcast", { event: eventName }, ({ payload }: any) => {
      callback(payload as T);
    });

    // Subscribe to the channel
    channel.subscribe((status: any) => {
      if (status === "SUBSCRIBED") {
        // Successfully subscribed
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, eventName, ...dependencies]);

  return channelRef.current;
}

/**
 * Hook to listen to a Supabase event only once
 */
export function useSupabaseEventOnce<T = Record<string, unknown>>(
  channelName: string,
  eventName: string,
  callback: (payload: T) => void,
  dependencies: unknown[] = []
) {
  const hasTriggered = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (hasTriggered.current) return;

    const channel = getSupabaseLegacy().channel(channelName);
    channelRef.current = channel;

    channel.on("broadcast", { event: eventName }, ({ payload }: any) => {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        callback(payload as T);
      }
    });

    channel.subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, eventName, ...dependencies]);

  return channelRef.current;
}

/**
 * Hook to send broadcast events to a Supabase Realtime channel
 */
export function useSupabaseBroadcast() {
  const sendEvent = async (channelName: string, eventName: string, payload: any) => {
    const channel = getSupabaseLegacy().channel(channelName);

    await channel.subscribe();

    const result = await channel.send({
      type: "broadcast",
      event: eventName,
      payload,
    });

    return result;
  };

  return { sendEvent };
}
