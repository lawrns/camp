import { useEffect, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { ChannelFactory } from "@/lib/realtime/channels";
import { getBrowserClient } from "@/lib/supabase";
import { useAudioNotifications } from "./useAudioNotifications";

// Mock deprecated supabase hook
function useDeprecatedSupabase() {
  return {
    supabase: null,
    loading: false,
    error: null,
  };
}

interface MessageNotificationOptions {
  conversationId?: string;
  userId: string;
  organizationId: string;
  enabled?: boolean;
  soundUrl?: string | undefined;
  onNewMessage?: (message: any) => void;
}

export function useMessageNotifications({
  conversationId,
  userId,
  organizationId,
  enabled = true,
  soundUrl,
  onNewMessage,
}: MessageNotificationOptions) {
  const { playBackgroundNotification } = useAudioNotifications({
    enabled,
    ...(soundUrl !== undefined && { soundUrl }),
  });

  const lastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Use unified realtime hook for connection status
  const [realtimeState] = useRealtime({
    type: "general",
    organizationId: organizationId || "",
    userId
  });
  const connectionStatus = realtimeState.connectionStatus;

  useEffect(() => {
    if (!enabled || !organizationId) return;

    // Use native Supabase client for notifications since this is browser-only
    const supabaseClient = getBrowserClient();
    if (!supabaseClient) return;
    
    const channelName = `cf-org-messages-bcast-${organizationId}-${conversationId || "all"}`;
    const channel = supabaseClient.channel(channelName);

    // Subscribe to new messages
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: conversationId ? `conversation_id=eq.${conversationId}` : `organization_id=eq.${organizationId}`,
      },
      async (payload) => {
        const newMessage = payload.new;

        // Skip if this is the initial load
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          lastMessageIdRef.current = newMessage.id;
          return;
        }

        // Skip if we've already processed this message
        if (lastMessageIdRef.current === newMessage.id) {
          return;
        }

        // Skip if the message is from the current user (agent)
        if (newMessage.sender_id === userId) {
          return;
        }

        // Skip if the message is from another agent
        if (newMessage.sender_type === "agent" || newMessage.sender_type === "bot") {
          return;
        }

        // Play notification sound
        await playBackgroundNotification();

        // Call callback if provided
        onNewMessage?.(newMessage);

        // Update last message ID
        lastMessageIdRef.current = newMessage.id;

        // Also show browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("New Message", {
            body: newMessage.content?.substring(0, 100) || "You have a new message",
            icon: "/favicon.svg",
            tag: `message-${newMessage.id}`,
            requireInteraction: false,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Auto close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        }
      }
    );

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
      } else if (status === "CHANNEL_ERROR") {
      }
    });

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, userId, organizationId, enabled, playBackgroundNotification, onNewMessage]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // We'll request permission on first user interaction
      const requestPermission = async () => {
        try {
          await Notification.requestPermission();
        } catch (error) {}
      };

      // Add click listener to request permission
      const handleClick = () => {
        requestPermission();
        document.removeEventListener("click", handleClick);
      };

      document.addEventListener("click", handleClick, { once: true });

      return () => {
        document.removeEventListener("click", handleClick);
      };
    }
    return undefined;
  }, []);
}
