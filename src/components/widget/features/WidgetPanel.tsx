"use client";

/**
 * Widget Panel - Advanced Features Container
 *
 * This component contains all the advanced widget functionality
 * and is lazy-loaded only when the widget is opened.
 *
 * Features included:
 * - Chat interface
 * - Message history
 * - Typing indicators
 * - File upload (lazy)
 * - Emoji picker (lazy)
 * - AI handover (lazy)
 */

import React, { useEffect, useRef, useState } from "react";
import { useWidgetCore } from "../core/WidgetLauncher";

// Lazy-load advanced features
const LazyEmojiPicker = React.lazy(() =>
  import("./EmojiPicker").then((module) => ({
    default: module.EmojiPicker,
  }))
);

const LazyFileUpload = React.lazy(() =>
  import("./FileUpload").then((module) => ({
    default: module.FileUpload,
  }))
);

const LazyAIHandover = React.lazy(() =>
  import("./AIHandoverQueue").then((module) => ({
    default: module.AIHandoverQueue,
  }))
);

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "ai";
  timestamp: Date;
  type?: "text" | "file" | "emoji";
}

export const WidgetPanel: React.FC = () => {
  const { closeWidget, organizationId, conversationId, userId } = useWidgetCore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAIHandover, setShowAIHandover] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! How can I help you today?",
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border border-gray-200 mt-2 flex h-96 w-80 flex-col overflow-hidden rounded-lg shadow-xl transition-all duration-200 ease-in-out">
      {/* Header */}
      <div className="bg-blue-600 flex items-center justify-between px-4 py-3 text-white">
        <div>
          <h3 className="font-semibold text-sm">Chat Support</h3>
          <p className="text-xs opacity-90">We're here to help</p>
        </div>
        <button
          onClick={closeWidget}
          className="rounded p-1 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Close chat"
          data-testid="close-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">
            <div className="mb-2 text-3xl">👋</div>
            <p className="text-sm">Welcome! How can we help you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-lg px-3 py-2 shadow-sm transition-all duration-200 ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-center space-x-2">
          {/* Action Buttons */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-500 hover:text-gray-700 rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Add emoji"
          >
            😊
          </button>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="text-gray-500 hover:text-gray-700 rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Upload file"
          >
            📎
          </button>

          {/* Message Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-blue-600 rounded-lg p-2 text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>

        {/* Lazy-loaded feature panels */}
        {showEmojiPicker && (
          <React.Suspense fallback={<div className="text-foreground-muted p-spacing-sm text-center">Loading emojis...</div>}>
            <LazyEmojiPicker
              onEmojiSelect={(emoji) => {
                setInputValue((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
            />
          </React.Suspense>
        )}

        {showFileUpload && (
          <React.Suspense fallback={<div className="text-foreground-muted p-spacing-sm text-center">Loading file upload...</div>}>
            <LazyFileUpload
              onFileSelect={(file) => {

                setShowFileUpload(false);
              }}
            />
          </React.Suspense>
        )}

        {showAIHandover && (
          <React.Suspense fallback={<div className="text-foreground-muted p-spacing-sm text-center">Loading AI handover...</div>}>
            <LazyAIHandover
              onHandover={() => {

                setShowAIHandover(false);
              }}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
};
