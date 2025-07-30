/**
 * Chat Interface Component
 *
 * Split from Panel.tsx for HMR optimization
 * Handles message display, input, and chat functionality
 */

import React, { useRef, useEffect, lazy, Suspense } from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { PaperPlaneTilt, Smiley } from "../icons/OptimizedIcons";

// Lazy load heavy chat features
const LazyEmojiPicker = lazy(() =>
  import("../features/EmojiPicker").then((module) => ({
    default: module.EmojiPicker,
  }))
);

const LazyFileUpload = lazy(() =>
  import("../features/FileUpload").then((module) => ({
    default: module.FileUpload,
  }))
);

interface Message {
  id: string;
  content: string;
  senderType: "visitor" | "agent" | "ai";
  senderName?: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isConnected,
  isTyping,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  className = "",
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim() && !isTyping) {
      onStartTyping();
    } else if (!value.trim() && isTyping) {
      onStopTyping();
    }
  };

  // Handle message sending
  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && isConnected) {
      onSendMessage(trimmedMessage);
      setInputValue("");
      onStopTyping();
      inputRef.current?.focus();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-full flex-col ${className}`} data-testid="chat-interface">
      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto spacing-3" data-testid="message-list">
        {messages.length === 0 ? (
          <div className="text-foreground-muted py-8 text-center">
            <p>Start a conversation!</p>
            <p className="mt-1 text-sm">We're here to help.</p>
          </div>
        ) : (
          messages.map((message) => (
            <OptimizedMotion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.senderType === "visitor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-ds-lg px-4 py-2 lg:max-w-md ${
                  message.senderType === "visitor" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`mt-1 text-xs ${message.senderType === "visitor" ? "text-blue-100" : "text-gray-500"}`}
                  data-testid="message-timestamp"
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </OptimizedMotion.div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <div className="bg-background rounded-ds-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400" style={{ animationDelay: "0.1s" }} />
                <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </OptimizedMotion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--fl-color-border-subtle)] spacing-3">
        <div className="flex items-end space-x-spacing-sm">
          {/* Emoji picker button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="hover:text-foreground p-spacing-sm text-gray-400 transition-colors"
            aria-label="Add emoji"
            type="button"
          >
            <Smiley size={20} />
          </button>

          {/* Message input */}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="disabled:bg-background w-full resize-none rounded-ds-xl border border-[var(--fl-color-border-subtle)] px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "120px" }}
              data-testid="message-input"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className="bg-primary hover:bg-primary rounded-ds-lg p-spacing-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            aria-label="Send message"
            type="button"
            data-testid="widget-send-button"
          >
            <PaperPlaneTilt size={20} weight="fill" />
          </button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="mt-2">
            <Suspense fallback={<div className="text-foreground-muted text-sm">Loading emojis...</div>}>
              <LazyEmojiPicker
                onEmojiSelect={(emoji) => {
                  setInputValue((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
