"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Composer } from "@/components/InboxDashboard/sub-components/Composer";
import { createApiClient } from "@/lib/supabase";
import { UNIFIED_CHANNELS } from "@/lib/realtime/unified-channel-standards";

interface Message {
  id: string;
  content: string;
  sender_type: "visitor" | "operator" | "ai";
  sender_id: string;
  created_at: string;
  metadata?: any;
}

interface TypingUser {
  user_id: string;
  user_type: "visitor" | "operator";
  user_name?: string;
}

interface RealtimeMessageLoaderProps {
  conversationId: string | number | null;
}

export function RealtimeMessageLoader({ conversationId }: RealtimeMessageLoaderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = "current-operator"; // TODO: Get from auth context
  const currentUserType = "operator";

  // Convert conversationId to string for consistency
  const conversationIdStr = conversationId ? conversationId.toString() : null;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createApiClient();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", String(conversationId))
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setMessages((data || []) as unknown as Message[]);
        // Scroll to bottom after loading
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, scrollToBottom]);

  // Handle new message
  const handleNewMessage = useCallback(
    (newMessage: Message) => {
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        if (prev.find((m) => m.id === newMessage.id)) {
          return prev;
        }
        const updated = [...prev, newMessage];
        setTimeout(scrollToBottom, 100);
        return updated;
      });
    },
    [scrollToBottom]
  );

  // Handle typing indicators
  const updateTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationIdStr) return;

      try {
        const supabase = createApiClient();

        // Check authentication status first
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          return;
        }

        if (isTyping) {
          // Insert or update typing indicator
          const { error } = await supabase.from("typing_indicators").upsert({
            conversation_id: conversationIdStr,
            operator_id: currentUserId,
            is_typing: true,
            last_character_at: new Date().toISOString(),
          });

          if (error) {
          }
        } else {
          // Remove typing indicator
          const { error } = await supabase
            .from("typing_indicators")
            .delete()
            .eq("conversation_id", conversationIdStr)
            .eq("operator_id", currentUserId);

          if (error) {
          }
        }
      } catch (error) {}
    },
    [conversationIdStr, currentUserId, currentUserType]
  );

  // Handle user presence
  const updatePresence = useCallback(
    async (status: "online" | "away" | "offline") => {
      try {
        const supabase = createApiClient();

        // Check authentication status first
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          return;
        }

        const { error } = await supabase.from("user_presence").upsert({
          user_id: currentUserId,
          user_type: currentUserType,
          organization_id: "default-org", // TODO: Get from auth context
          status,
          last_seen_at: new Date().toISOString(),
        });

        if (error) {
        }
      } catch (error) {}
    },
    [currentUserId, currentUserType]
  );

  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversationIdStr) {
      setMessages([]);
      setTypingUsers([]);
      setConnectionStatus("disconnected");
      return;
    }

    const supabase = createApiClient();
    setConnectionStatus("connecting");

    // Load initial messages
    loadMessages();

    // Set user as online
    updatePresence("online");
    setIsOnline(true);

    // Subscribe to new messages
    // FIXED: Use unified channel naming pattern
    const organizationId = "default-org"; // TODO: Get from auth context
    const messagesChannel = supabase
      .channel(UNIFIED_CHANNELS.conversation(organizationId, conversationIdStr))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationIdStr}`,
        },
        (payload: any) => {
          handleNewMessage(payload.new as Message);
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        }
      });

    // Subscribe to typing indicators (both database changes and broadcast events)
    // FIXED: Use same conversation channel for typing events
    const typingChannel = supabase
      .channel(`org:${organizationId}:conversation:${conversationIdStr}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationIdStr}`,
        },
        (payload: any) => {
          const typing = payload.new;
          if (typing.user_id !== currentUserId) {
            // Don't show own typing
            setTypingUsers((prev) => {
              const filtered = prev.filter((u: any) => u.user_id !== typing.user_id);
              return [
                ...filtered,
                {
                  user_id: typing.user_id,
                  user_type: typing.user_type,
                  user_name: typing.user_type === "visitor" ? "Customer" : "Agent",
                },
              ];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationIdStr}`,
        },
        (payload: any) => {
          const typing = payload.old;
          setTypingUsers((prev) => prev.filter((u: any) => u.user_id !== typing.user_id));
        }
      )
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { conversationId: typingConversationId, isTyping, content, sender_id, sender_type } = payload.payload;

        // Only process if it's for this conversation and not from current user
        if (typingConversationId === conversationIdStr && sender_id !== currentUserId) {
          if (isTyping && content) {
            // Show typing preview with content
            setTypingUsers((prev) => {
              const filtered = prev.filter((u: any) => u.user_id !== sender_id);
              return [
                ...filtered,
                {
                  user_id: sender_id,
                  user_type: sender_type || "visitor",
                  user_name: sender_type === "visitor" ? "Customer" : "Agent",
                  content: content, // Real-time typing preview content
                  timestamp: Date.now(),
                },
              ];
            });
          } else if (!isTyping) {
            // Remove typing indicator
            setTypingUsers((prev) => prev.filter((u: any) => u.user_id !== sender_id));
          }
        }
      })
      .subscribe();

    // Auto-clear typing indicators after 5 seconds
    // REPLACED: Use database triggers or real-time cleanup instead of polling
    // Typing indicators should be managed by the real-time subscription system
    // and cleaned up automatically by database triggers or TTL mechanisms

    // Cleanup function
    return () => {
      // Set user as offline
      updatePresence("offline");
      setIsOnline(false);

      // Clear typing indicator
      updateTypingStatus(false);

      // Remove subscriptions
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);

      // REMOVED: No more polling interval to clean up

      setConnectionStatus("disconnected");
      setTypingUsers([]);
    };
  }, [conversationIdStr, loadMessages, handleNewMessage, currentUserId, updatePresence, updateTypingStatus]);

  // Handle page visibility to update presence
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence("away");
        setIsOnline(false);
      } else {
        updatePresence("online");
        setIsOnline(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [updatePresence]);

  // Format time for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--fl-color-background-subtle)]">
        <div className="bg-white rounded-ds-lg shadow-sm border border-[var(--fl-color-border)] p-8 max-w-sm mx-4">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-foreground text-base font-medium mb-2">Select a conversation</h3>
            <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging with your customers.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-foreground text-sm">Loading messages...</p>
          <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-600">Error: {error}</p>
          <p className="mb-4 text-tiny text-[var(--fl-color-text-muted)]">Connection: {connectionStatus}</p>
          <button
            onClick={loadMessages}
            className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Connection Status Bar */}
      <div
        className={`px-4 py-2 text-xs font-medium transition-colors ${
          connectionStatus === "connected"
            ? "text-green-600-dark bg-[var(--fl-color-success-subtle)]"
            : connectionStatus === "connecting"
              ? "text-yellow-600-dark bg-[var(--fl-color-warning-subtle)]"
              : "text-red-600-dark bg-[var(--fl-color-danger-subtle)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-ds-2">
            <div
              className={`h-2 w-2 rounded-ds-full ${
                connectionStatus === "connected"
                  ? "bg-semantic-success"
                  : connectionStatus === "connecting"
                    ? "bg-semantic-warning"
                    : "bg-brand-mahogany-500"
              }`}
            ></div>
            {connectionStatus === "connected"
              ? "Real-time connected"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
          </span>
          <span className="flex items-center gap-ds-2">
            <div className={`h-2 w-2 rounded-ds-full ${isOnline ? "bg-semantic-success" : "bg-neutral-400"}`}></div>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-base font-medium text-gray-900">No messages yet</h3>
            <p className="text-foreground mb-4 text-sm">Start the conversation by sending a message below.</p>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">Real-time features enabled ⚡</p>
          </div>
        ) : (
          <>
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === "operator" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-ds-lg px-4 py-3 shadow-sm lg:max-w-md ${
                    message.sender_type === "operator"
                      ? "bg-blue-600 text-white"
                      : message.sender_type === "ai"
                        ? "border border-purple-200 bg-purple-100 text-purple-900"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="leading-relaxed text-sm">{message.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p
                      className={`text-xs ${message.sender_type === "operator" ? "text-blue-100" : "text-[var(--fl-color-text-muted)]"}`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                    {message.sender_type === "ai" && (
                      <span className="rounded-ds-full bg-purple-200 px-2 py-1 text-tiny text-purple-700">AI</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators with Real-time Preview */}
            {typingUsers.length > 0 && (
              <div className="space-y-spacing-sm">
                {typingUsers.map((user: any) => (
                  <div key={user.user_id} className="flex justify-start">
                    <div className="bg-background max-w-xs rounded-ds-lg border-l-2 border-[var(--fl-color-border-interactive)] px-4 py-3 lg:max-w-md">
                      <div className="mb-1 flex items-center gap-ds-2">
                        <div className="h-2 w-2 rounded-ds-full bg-brand-blue-500"></div>
                        <span className="text-foreground text-tiny font-medium">{user.user_name} is typing...</span>
                      </div>
                      {user.content && user.content.trim() ? (
                        <div className="text-sm italic text-gray-800">
                          "{user.content}"<span className="animate-pulse">|</span>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <div
                            className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Rich Message Composer */}
      <Composer
        conversationId={conversationIdStr || ""}
        onSendMessage={async (content: string, isInternalNote: boolean) => {
          // Message will be added via real-time subscription
        }}
      />
    </div>
  );
}
