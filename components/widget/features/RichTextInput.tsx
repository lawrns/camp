"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Bold, Italic, Link, Code } from "lucide-react";

interface RichTextInputProps {
  onSendMessage: (message: string, htmlContent?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  showFormatting?: boolean;
}

const FORMAT_BUTTONS = [
  { command: "bold", icon: <Bold className="h-4 w-4" />, title: "Bold" },
  { command: "italic", icon: <Italic className="h-4 w-4" />, title: "Italic" },
  { command: "createLink", icon: <Link className="h-4 w-4" />, title: "Link" },
  { command: "formatBlock", icon: <Code className="h-4 w-4" />, title: "Code", value: "pre" },
];

export const RichTextInput: React.FC<RichTextInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  onStartTyping,
  onStopTyping,
  showFormatting = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    const text = editorRef.current.textContent || "";

    setHtmlContent(html);
    setPlainText(text);

    // Trigger typing indicators
    if (text.length > 0 && onStartTyping) {
      onStartTyping();
    } else if (text.length === 0 && onStopTyping) {
      onStopTyping();
    }
  }, [onStartTyping, onStopTyping]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Enter" && e.shiftKey) {
        // Allow line break
        return;
      }

      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            executeCommand("bold");
            break;
          case "i":
            e.preventDefault();
            executeCommand("italic");
            break;
          case "k":
            e.preventDefault();
            executeCommand("createLink");
            break;
        }
      }
    },
    [plainText, htmlContent, onStopTyping]
  );

  // Submit message
  const handleSubmit = useCallback(() => {
    if (plainText.trim() && !disabled) {
      onSendMessage(plainText.trim(), htmlContent);

      // Clear editor
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        setHtmlContent("");
        setPlainText("");
      }

      if (onStopTyping) {
        onStopTyping();
      }
    }
  }, [plainText, htmlContent, disabled, onSendMessage, onStopTyping]);

  // Execute formatting command
  const executeCommand = useCallback(
    (command: string, value?: string) => {
      if (!editorRef.current) return;

      setIsFormatting(true);

      try {
        if (command === "createLink") {
          const url = prompt("Enter URL:");
          if (url) {
            document.execCommand("createLink", false, url);
          }
        } else if (command === "formatBlock" && value === "pre") {
          document.execCommand("formatBlock", false, "pre");
        } else {
          document.execCommand(command, false, value);
        }

        editorRef.current.focus();
        handleInput();
      } catch (error) {

      } finally {
        setIsFormatting(false);
      }
    },
    [handleInput]
  );

  // Check if command is active
  const isCommandActive = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setShowToolbar(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay hiding toolbar to allow toolbar clicks
    setTimeout(() => setShowToolbar(false), 150);
  }, []);

  return (
    <div className="relative">
      {/* Formatting Toolbar */}
      {showFormatting && showToolbar && (
        <OptimizedMotion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-ds-border bg-background absolute bottom-full left-0 right-0 mb-2 flex items-center space-x-1 rounded-ds-lg border p-spacing-sm shadow-card-deep"
        >
          {FORMAT_BUTTONS.map((button) => (
            <OptimizedMotion.button
              key={button.command}
              type="button"
              onClick={() => executeCommand(button.command, button.value)}
              disabled={disabled || isFormatting}
              className={`rounded spacing-1.5 transition-colors hover:bg-gray-100 ${
                isCommandActive(button.command) ? "bg-blue-100 text-blue-600" : "text-gray-600"
              }`}
              title={button.title}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {button.icon}
            </OptimizedMotion.button>
          ))}
        </OptimizedMotion.div>
      )}

      {/* Rich Text Editor */}
      <div className="flex items-end space-x-3">
        <div className="relative flex-1">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`max-h-32 min-h-[48px] w-full overflow-y-auto radius-2xl border border-[var(--fl-color-border)] bg-gray-50 px-4 py-3 placeholder-gray-500 transition-all duration-200 focus:border-[var(--fl-color-brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
            style={{
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />

          {/* Character count */}
          {plainText.length > 800 && (
            <div className="absolute -top-6 right-0 text-tiny text-gray-400">{plainText.length}/1000</div>
          )}
        </div>

        {/* Send Button */}
        <OptimizedMotion.button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !plainText.trim()}
          className="radius-2xl bg-gradient-to-r from-purple-500 to-blue-500 spacing-3 text-white shadow-card-deep transition-all duration-200 hover:from-purple-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={{ scale: disabled || !plainText.trim() ? 1 : 1.05, y: -1 }}
          whileTap={{ scale: disabled || !plainText.trim() ? 1 : 0.95 }}
          style={{
            filter: "drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3))",
          }}
        >
          {disabled ? (
            <OptimizedMotion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5"
            >
              ⟳
            </OptimizedMotion.div>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </OptimizedMotion.button>
      </div>

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        [contenteditable] pre {
          background: #f3f4f6;
          border-radius: 4px;
          padding: 8px;
          margin: 4px 0;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          font-size: 0.875rem;
        }

        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }

        [contenteditable] strong {
          font-weight: 600;
        }

        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
