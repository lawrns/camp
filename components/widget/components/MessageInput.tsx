"use client";

import React, { useEffect, useRef, useState } from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  channel?: any; // Supabase channel for typing indicators
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  showEmojiPicker?: boolean;
  showFileUpload?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onFileSelect,
  disabled = false,
  placeholder = "Type your message...",
  channel,
  onStartTyping,
  onStopTyping,
  showEmojiPicker = true,
  showFileUpload = true,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Keep focus on input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    // Keep focus on input after emoji selection
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFileSelect = (file: File) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
    setIsFileUploadOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
      // Stop typing when message is sent
      if (onStopTyping) {
        onStopTyping();
      }
    } else if (e.key !== "Enter") {
      // Use enhanced typing functions for better performance
      if (onStartTyping) {
        onStartTyping();
      }

      // Fallback to channel if enhanced functions not available
      if (!onStartTyping && channel) {
        channel.send({
          type: "broadcast",
          event: "typing_start",
          payload: { userId: "user", timestamp: Date.now() },
        });

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          channel.send({
            type: "broadcast",
            event: "typing_stop",
            payload: { userId: "user", timestamp: Date.now() },
          });
        }, 3000);
      }
    }
  };

  // Auto-focus input when component mounts
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="relative">
      <OptimizedMotion.form
        onSubmit={handleSubmit}
        className="flex items-end space-x-spacing-sm rounded-ds-xl border border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] spacing-3"
        animate={{
          borderColor: isFocused ? "#667eea" : "#e5e7eb",
          backgroundColor: isFocused ? "#f8fafc" : "#f9fafb",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Action Buttons (Left Side) */}
        <div className="flex items-center space-x-1">
          {showEmojiPicker && (
            <OptimizedMotion.button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="hover:text-foreground flex h-8 w-8 items-center justify-center rounded-ds-lg text-[var(--fl-color-text-muted)] transition-colors hover:bg-gray-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Add emoji"
            >
              😊
            </OptimizedMotion.button>
          )}

          {showFileUpload && onFileSelect && (
            <OptimizedMotion.button
              type="button"
              onClick={() => setIsFileUploadOpen(true)}
              className="hover:text-foreground flex h-8 w-8 items-center justify-center rounded-ds-lg text-[var(--fl-color-text-muted)] transition-colors hover:bg-gray-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Upload file"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </OptimizedMotion.button>
          )}
        </div>

        {/* Message Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-500 outline-none disabled:cursor-not-allowed"
            maxLength={1000}
          />
          {message.length > 800 && (
            <div className="absolute -top-6 right-0 text-tiny text-gray-400">{message.length}/1000</div>
          )}
        </div>

        {/* Send Button */}
        <OptimizedMotion.button
          type="submit"
          disabled={disabled || !message.trim()}
          className="flex h-10 min-w-[40px] items-center justify-center rounded-ds-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] p-spacing-sm text-white transition-all duration-200 hover:shadow-card-deep disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={{ scale: disabled || !message.trim() ? 1 : 1.05 }}
          whileTap={{ scale: disabled || !message.trim() ? 1 : 0.95 }}
        >
          {disabled ? (
            <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </OptimizedMotion.button>
      </OptimizedMotion.form>

      {/* Emoji Picker - Simple fallback */}
      {isEmojiPickerOpen && (
        <div className="bg-background absolute bottom-full left-0 mb-2 rounded-ds-lg border border-[var(--fl-color-border-subtle)] p-spacing-sm shadow-card-deep">
          <div className="grid grid-cols-6 gap-1">
            {["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "✨", "🚀", "💪", "🙌", "👏"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="hover:bg-background rounded spacing-1 text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Modal - Simple fallback */}
      {isFileUploadOpen && (
        <div className="bg-background absolute bottom-full left-0 mb-2 rounded-ds-lg border border-[var(--fl-color-border-subtle)] spacing-3 shadow-card-deep">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="text-sm"
          />
          <button
            onClick={() => setIsFileUploadOpen(false)}
            className="hover:text-foreground ml-2 text-sm text-[var(--fl-color-text-muted)]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
