/**
 * StreamingMessageDisplay Component
 *
 * Displays AI messages with real-time streaming updates.
 * Shows typing indicators and progressive content rendering.
 */

"use client";

import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { StreamingMessage } from "@/lib/ai/StreamingResponseService";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface StreamingMessageDisplayProps {
  conversationId: string;
  organizationId: string;
  onMessageComplete?: (message: StreamingMessage) => void;
  onError?: (error: Error) => void;
  className?: string;
  showTypingIndicator?: boolean;
  showTokenCount?: boolean;
  enableSoundEffects?: boolean;
}

interface TypingDotsProps {
  className?: string;
}

function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400 [animation-delay:0ms]" />
      <div className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400 [animation-delay:150ms]" />
      <div className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400 [animation-delay:300ms]" />
    </div>
  );
}

interface StreamingTextProps {
  content: string;
  isComplete: boolean;
  className?: string;
}

function StreamingText({ content, isComplete, className }: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const contentRef = useRef(content);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update displayed content when new content arrives
  useEffect(() => {
    if (content !== contentRef.current) {
      contentRef.current = content;
      setDisplayedContent(content);
    }
  }, [content]);

  // Handle cursor blinking
  useEffect(() => {
    if (!isComplete) {
      intervalRef.current = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);
    } else {
      setShowCursor(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isComplete]);

  return (
    <div className={cn("relative", className)}>
      <div className="prose prose-sm max-w-none">
        {displayedContent}
        {!isComplete && showCursor && <span className="ml-1 animate-pulse">|</span>}
      </div>
      {!isComplete && <div className="absolute -bottom-1 right-0 text-tiny text-gray-400">Generating...</div>}
    </div>
  );
}

export function StreamingMessageDisplay({
  conversationId,
  organizationId,
  onMessageComplete,
  onError,
  className,
  showTypingIndicator = true,
  showTokenCount = false,
  enableSoundEffects = false,
}: StreamingMessageDisplayProps) {
  const [playedSound, setPlayedSound] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { message, isStreaming, isTyping, error, connectionState, isConnected, retry, clearMessage } =
    useStreamingResponse({
      conversationId,
      organizationId,
      onMessageComplete: (msg) => {
        setPlayedSound(false); // Reset for next message
        onMessageComplete?.(msg);
      },
      onError: onError || (() => { }),
    });

  // Play sound effect when streaming starts (optional)
  useEffect(() => {
    if (enableSoundEffects && isStreaming && !playedSound) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("/sounds/message-start.mp3");
          audioRef.current.volume = 0.3;
        }
        audioRef.current.play().catch(() => {
          // Ignore audio play errors (user hasn't interacted with page yet)
        });
        setPlayedSound(true);
      } catch (error) {
        // Ignore audio errors
      }
    }
  }, [enableSoundEffects, isStreaming, playedSound]);

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (connectionState === "connecting") {
      return (
        <div className="flex items-center space-x-spacing-sm text-sm text-[var(--fl-color-text-muted)]">
          <div className="h-2 w-2 animate-pulse rounded-ds-full bg-orange-200" />
          <span>Connecting...</span>
        </div>
      );
    }

    if (connectionState === "error" || error) {
      return (
        <div className="text-brand-mahogany-500 flex items-center space-x-spacing-sm text-sm">
          <div className="h-2 w-2 rounded-ds-full bg-red-400" />
          <span>Connection error</span>
          <button onClick={retry} className="text-tiny underline hover:no-underline">
            Retry
          </button>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="flex items-center space-x-spacing-sm text-sm text-[var(--fl-color-text-muted)]">
          <div className="h-2 w-2 rounded-ds-full bg-neutral-400" />
          <span>Disconnected</span>
        </div>
      );
    }

    return null;
  };

  // Main content area
  const renderContent = () => {
    // Show typing indicator when AI is preparing to respond
    if (isTyping && !message && showTypingIndicator) {
      return (
        <div className="flex items-center space-x-3 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-brand-blue-500">
              <span className="text-sm font-medium text-white">AI</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-spacing-sm">
              <span className="text-foreground text-sm">AI is thinking</span>
              <TypingDots />
            </div>
          </div>
        </div>
      );
    }

    // Show streaming message
    if (message) {
      return (
        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-brand-blue-500">
                <span className="text-sm font-medium text-white">AI</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">AI Assistant</span>
                {showTokenCount && message.tokenCount && message.tokenCount > 0 && (
                  <span className="text-tiny text-blue-600">{message.tokenCount} tokens</span>
                )}
              </div>

              <StreamingText content={message.content} isComplete={message.isComplete} className="text-gray-800" />

              {message.isComplete && (
                <div className="mt-2 text-tiny text-[var(--fl-color-text-muted)]">
                  Completed at {message.timestamp.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // No active streaming
    return null;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Connection status */}
      {renderConnectionStatus()}

      {/* Main content */}
      {renderContent()}

      {/* Error display */}
      {error && (
        <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
          <div className="flex items-center space-x-spacing-sm">
            <div className="text-brand-mahogany-500 h-4 w-4">⚠️</div>
            <span className="text-red-600-dark text-sm">Streaming error: {(error instanceof Error ? error.message : String(error))}</span>
            <button onClick={clearMessage} className="text-tiny text-red-600 underline hover:no-underline">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamingMessageDisplay;
