"use client";

import { useEffect, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  senderType: "visitor" | "operator" | "ai";
  senderId: string | null;
  created_at: string;
  sending?: boolean;
}

interface SimpleMessageLoaderProps {
  conversationId: string | null;
}

export function SimpleMessageLoader({ conversationId }: SimpleMessageLoaderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the API endpoint instead of direct Supabase query for consistency
        const {
          data: { session },
        } = await supabase.browser().auth.getSession();
        const authHeaders: Record<string, string> = {};

        if (session?.access_token) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "GET",
          headers: authHeaders,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const result = await response.json();
        setMessages((result.messages || []) as unknown as Message[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        // Send final typing stop event before unsubscribing
        if (isTyping) {
          channel.send({
            type: "broadcast",
            event: "typing",
            payload: {
              user_id: "current-user",
              typing: false,
            },
          });
        }
        channel.unsubscribe();
        setChannel(null);
      }
      setTypingUsers([]);
      setIsTyping(false);
    };
  }, [conversationId]);

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;

    // Clean up existing subscription
    if (channel) {
      channel.unsubscribe();
    }

    const { createBrowserClient } = require("@/lib/supabase");
    const supabaseClient = createBrowserClient();

    const newChannel = supabaseClient
      .channel(`conversation_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: unknown) => {

          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates - check both id and temp id
            if (
              prev.find((m) => m.id === newMessage.id || (m.id.startsWith("temp-") && m.content === newMessage.content))
            ) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: unknown) => {

          const updatedMessage = payload.new as Message;
          setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)));
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: unknown }) => {

        if (payload.user_id !== "current-user") {
          setTypingUsers((prev) => {
            if (payload.typing && !prev.includes(payload.user_id)) {
              return [...prev, payload.user_id];
            } else if (!payload.typing) {
              return prev.filter((id) => id !== payload.user_id);
            }
            return prev;
          });
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();

      })
      .on("presence", { event: "join" }, ({ key, newPresences }: { key: unknown; newPresences: unknown }) => {

      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }: { key: unknown; leftPresences: unknown }) => {

      })
      .subscribe((status: unknown) => {

        if (status === "SUBSCRIBED") {
          // Track presence
          newChannel.track({
            user_id: "current-user",
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(newChannel);
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim() || sending) return;

    const trimmedContent = content.trim();
    setSending(true);
    setError(null);

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: trimmedContent,
      senderType: "operator" as const,
      senderId: null,
      created_at: new Date().toISOString(),
      sending: true,
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Get authentication headers from the current session
      const {
        data: { session },
      } = await supabase.browser().auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          content: trimmedContent,
          senderType: "operator",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send message: ${response.status}`);
      }

      const newMessage = await response.json();

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                id: newMessage.id,
                content: newMessage.content,
                senderType: newMessage.senderType,
                senderId: newMessage.senderId,
                created_at: newMessage.created_at,
              }
            : msg
        )
      );
    } catch (err) {

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));

      // Set user-friendly error message
      const errorMessage = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--fl-color-text-muted)]">
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
          <h3 className="text-foreground text-sm font-medium">Select a conversation</h3>
          <p className="text-tiny text-gray-400">Choose a conversation from the list to view messages</p>
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-red-600">Error: {error}</p>
          <p className="text-tiny text-[var(--fl-color-text-muted)]">Check console for details</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
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
            <p className="text-tiny text-[var(--fl-color-text-muted)]">We're here to help! 👋</p>
          </div>
        </div>

        {/* Simple message input */}
        <div className="bg-background border-t spacing-3">
          <div className="flex items-center gap-ds-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="border-ds-border-strong flex-1 rounded-ds-lg border px-4 py-2 focus:border-[var(--fl-color-brand)] focus:outline-none"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input?.value.trim()) {
                  sendMessage(input.value);
                  input.value = "";
                }
              }}
              disabled={sending}
              className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
        {messages.map((message: unknown) => (
          <div
            key={message.id}
            className={`flex ${message.senderType === "operator" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-ds-lg px-4 py-2 lg:max-w-md ${
                message.senderType === "operator"
                  ? message.sending
                    ? "bg-blue-400 text-white opacity-70"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="mt-1 flex items-center justify-between">
                <p
                  className={`text-xs ${message.senderType === "operator" ? "text-blue-100" : "text-[var(--fl-color-text-muted)]"}`}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
                {message.sending && (
                  <div className="ml-2 flex items-center">
                    <div className="h-3 w-3 animate-spin rounded-ds-full border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex justify-start">
              <div className="max-w-xs rounded-ds-lg bg-gray-200 px-4 py-2 text-gray-900 lg:max-w-md">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">
                    {typingUsers.length === 1 ? "Someone is typing" : `${typingUsers.length} people are typing`}
                  </span>
                  <div className="flex space-x-1">
                    <div className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-500"></div>
                    <div
                      className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-500"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-500"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simple message input */}
      <div className="bg-background border-t spacing-3">
        <div className="flex items-center gap-ds-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="border-ds-border-strong flex-1 rounded-ds-lg border px-4 py-2 focus:border-[var(--fl-color-brand)] focus:outline-none"
            disabled={sending}
            onChange={(e) => {
              const value = e.currentTarget.value;
              const isCurrentlyTyping = value.length > 0;

              if (isCurrentlyTyping !== isTyping) {
                setIsTyping(isCurrentlyTyping);
                if (channel) {
                  channel.send({
                    type: "broadcast",
                    event: "typing",
                    payload: {
                      user_id: "current-user",
                      typing: isCurrentlyTyping,
                    },
                  });
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                sendMessage(e.currentTarget.value);
                e.currentTarget.value = "";
                // Stop typing indicator when message is sent
                setIsTyping(false);
                if (channel) {
                  channel.send({
                    type: "broadcast",
                    event: "typing",
                    payload: {
                      user_id: "current-user",
                      typing: false,
                    },
                  });
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input?.value.trim()) {
                sendMessage(input.value);
                input.value = "";
                // Stop typing indicator when message is sent
                setIsTyping(false);
                if (channel) {
                  channel.send({
                    type: "broadcast",
                    event: "typing",
                    payload: {
                      user_id: "current-user",
                      typing: false,
                    },
                  });
                }
              }
            }}
            disabled={sending}
            className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
