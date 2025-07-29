"use client";

/**
 * Simple Widget Interface for E2E Testing
 *
 * This provides a basic chat interface that mimics the widget behavior
 * for testing real-time messaging functionality.
 */
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "visitor" | "agent" | "ai";
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read";
}

export default function WidgetInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Widget UI state additions
  const [isOpen, setIsOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Derived unread count (simple: all agent/ai messages while closed)
  const unreadCount = messages.filter((m: Message) => m.sender !== "visitor" && !isOpen).length;

  const insertEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
  };
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const organizationId = "b5e80170-004c-4e82-a88c-3e2166b169dd";

  useEffect(() => {
    // Initialize conversation
    initializeConversation();

    // Set up real-time connection simulation
    setIsConnected(true);
    // Widget interface initialized
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    try {
      // Get visitor info with generated identity
      const visitorResponse = await fetch("/api/widget/visitor-info");
      let visitorIdentity = null;

      if (visitorResponse.ok) {
        const visitorData = await visitorResponse.json();
        visitorIdentity = visitorData.identity;
      }

      // Create or get existing conversation
      const response = await fetch("/api/widget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({
          action: "create-conversation",
          visitorId: "visitor-" + Date.now(),
          organizationId,
          metadata: {
            source: "widget",
            visitorIdentity: visitorIdentity || {
              name: "Test Visitor",
              email: "test-visitor@example.com",
              avatar: "/images/avatars/1.png",
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation?.id || data.conversationId);
        // Conversation initialized with visitor identity
      } else {
        // Use fallback conversation ID for testing
        setConversationId("test-conversation-" + Date.now());
      }
    } catch (error) {
      setConversationId("test-conversation-" + Date.now());
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !conversationId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: "visitor",
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");
    stopTyping();

    try {
      // Send message to widget API
      const response = await fetch("/api/widget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({
          action: "send-message",
          conversationId,
          content: messageText,
          visitorId: "visitor-" + Date.now(), // Generate visitor ID
          organizationId,
        }),
      });

      if (response.ok) {
        // Update message status
        setMessages((prev) =>
          prev.map((msg: Message) => (msg.id === newMessage.id ? { ...msg, status: "sent" } : msg))
        );
        // Message sent successfully
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg: Message) => (msg.id === newMessage.id ? { ...msg, status: "sending" } : msg))
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Visitor started typing

      // Send typing indicator to agent
      if (conversationId) {
        fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isTyping: true,
            userType: "visitor",
            organizationId,
          }),
        }).catch(console.error);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      // Visitor stopped typing

      // Send stop typing indicator
      if (conversationId) {
        fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isTyping: false,
            userType: "visitor",
            organizationId,
          }),
        }).catch(console.error);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return "⏳";
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Launcher bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-ds-full bg-blue-600 text-white shadow-lg focus:outline-none"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-ds-full bg-red-600 px-1 text-xs">{unreadCount}</span>
          )}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[70vh] w-[90vw] max-w-md flex-col rounded-ds-lg border bg-white shadow-xl sm:bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 spacing-3 text-white">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Campfire Support</span>
              <span className={`h-2 w-2 rounded-ds-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-xl leading-none text-white">
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto spacing-4">
            {messages.length === 0 && (
              <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
                <div className="mb-2 text-lg">👋 Welcome!</div>
                <div>Send a message to start the conversation</div>
              </div>
            )}
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "visitor" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-ds-lg px-4 py-2 lg:max-w-md ${message.sender === "visitor"
                      ? "bg-blue-600 text-white"
                      : message.sender === "ai"
                        ? "border border-purple-200 bg-purple-100 text-purple-900"
                        : "bg-gray-100 text-gray-900"
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-xs opacity-75">{message.timestamp.toLocaleTimeString()}</div>
                    {message.sender === "visitor" && (
                      <div className="text-xs opacity-75">{getStatusIcon(message.status)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {agentTyping && (
              <div className="flex justify-start">
                <div className="rounded-ds-lg bg-gray-100 px-4 py-2 text-gray-900">
                  <div className="flex items-center space-x-1">
                    <div className="text-sm">Agent is typing</div>
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
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom bar */}
          <div className="flex items-end space-x-2 border-t bg-[var(--fl-color-background-subtle)] spacing-3">
            <div className="relative">
              <button onClick={() => setShowEmoji(!showEmoji)} className="select-none text-2xl">
                😊
              </button>
              {showEmoji && (
                <div className="absolute bottom-10 right-0 z-50 grid grid-cols-6 gap-2 rounded border bg-white spacing-2 text-xl shadow-lg">
                  {["😀", "😂", "😍", "👍", "🙏", "🎉", "😢", "😡", "🤔", "😎", "🥳", "🚀"].map((e: string) => (
                    <button key={e} onClick={() => insertEmoji(e)} className="transition-transform hover:scale-110">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={messageText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-ds-lg border border-[var(--fl-color-border-strong)] px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!messageText.trim() || !conversationId}
              className="rounded-ds-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              Send
            </button>
          </div>

          {/* Debug info moved to console only */}
          {/* console.log removed */}
        </div>
      )}
    </>
  );
}
