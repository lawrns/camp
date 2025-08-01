// components/ai/AIMessageComposer.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Brain,
  PencilSimple as Edit,
  File,
  Microphone as Mic,
  ArrowsClockwise as RefreshCw,
  PaperPlaneTilt as Send,
  Sparkle as Sparkles,
  X,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Progress } from "@/components/unified-ui/components/Progress";
import { isFeatureEnabled } from "@/lib/features";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export interface AISuggestion {
  id: string;
  text: string;
  confidence: number;
  intent?: string;
  category?: "quick" | "detailed" | "followup";
}

export interface TypingStatus {
  isTyping: boolean;
  progress: number;
  phase: "reading" | "thinking" | "typing" | "pausing" | "correcting";
  estimatedTimeRemaining?: number;
}

interface AIMessageComposerProps {
  onSend: (message: string, attachment?: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;

  // AI-specific props
  suggestions?: AISuggestion[];
  isGeneratingSuggestions?: boolean;
  onUseSuggestion?: (suggestion: AISuggestion) => void;
  onEditSuggestion?: (suggestion: AISuggestion) => void;
  onGenerateNew?: () => void;
  onDismissSuggestions?: () => void;

  // Improved typing features
  aiTypingStatus?: TypingStatus;
  showAIIndicators?: boolean;
  confidenceThreshold?: number;

  // Smart formatting
  enableSmartFormatting?: boolean;
  enableQuickActions?: boolean;

  // File upload
  enableFileUpload?: boolean;
  onFileUpload?: (file: File) => void;

  // Voice input
  enableVoiceInput?: boolean;
  onVoiceInput?: (transcript: string) => void;

  // Template suggestions
  templates?: Array<{ id: string; label: string; content: string }>;
  onUseTemplate?: (template: string) => void;
}

export function AIMessageComposer({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",

  // AI props
  suggestions = [],
  isGeneratingSuggestions = false,
  onUseSuggestion,
  onEditSuggestion,
  onGenerateNew,
  onDismissSuggestions,

  // Improved typing
  aiTypingStatus,
  showAIIndicators = true,
  confidenceThreshold = 0.8,

  // Smart features
  enableSmartFormatting = true,
  enableQuickActions = true,
  enableFileUpload = true,
  enableVoiceInput = false,

  // Templates
  templates = [],
  onUseTemplate,
}: AIMessageComposerProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [smartFormatPreview, setSmartFormatPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Auto-expand textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Show suggestions when AI generates them or is generating
  useEffect(() => {
    if (suggestions.length > 0 || isGeneratingSuggestions) {
      setShowSuggestions(true);
    }
  }, [suggestions, isGeneratingSuggestions]);

  // Smart formatting preview
  useEffect(() => {
    if (enableSmartFormatting && message.length > 20) {
      // Simple smart formatting: detect lists, emphasize key points
      const formatted = message
        .replace(/^- (.+)$/gm, "• $1")
        .replace(/\*([^*]+)\*/g, "**$1**")
        .replace(/_([\w\s]+)_/g, "*$1*");

      if (formatted !== message) {
        setSmartFormatPreview(formatted);
      } else {
        setSmartFormatPreview(null);
      }
    } else {
      setSmartFormatPreview(null);
    }
  }, [message, enableSmartFormatting]);

  const handleSend = useCallback(() => {
    const finalMessage = smartFormatPreview || message;
    if ((finalMessage.trim() || attachment) && !disabled) {
      onSend(finalMessage.trim(), attachment || undefined);
      setMessage("");
      setAttachment(null);
      setShowSuggestions(false);
      setSmartFormatPreview(null);
      setIsExpanded(false);
    }
  }, [message, smartFormatPreview, attachment, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          // Use selected suggestion
          const suggestion = suggestions[selectedSuggestionIndex];
          if (suggestion && onUseSuggestion) {
            onUseSuggestion(suggestion);
            return;
          }
        }
        handleSend();
      }

      if (e.key === "Escape") {
        setShowSuggestions(false);
        setIsExpanded(false);
      }

      // Navigate suggestions with arrow keys
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        }
      }
    },
    [showSuggestions, suggestions, selectedSuggestionIndex, onUseSuggestion, handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      if (onTyping) {
        onTyping();
      }

      // Auto-expand if message gets longer
      if (e.target.value.length > 50 && !isExpanded) {
        setIsExpanded(true);
      }
    },
    [onTyping, isExpanded]
  );

  const handleFileUpload = useCallback((file: File) => {
    setAttachment(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && enableFileUpload) {
        handleFileUpload(file);
      }
    },
    [enableFileUpload, handleFileUpload]
  );

  const handleUseSuggestion = useCallback(
    (suggestion: AISuggestion) => {
      if (onUseSuggestion) {
        onUseSuggestion(suggestion);
      } else {
        setMessage(suggestion.text);
        setShowSuggestions(false);
      }
    },
    [onUseSuggestion]
  );

  const handleApplySmartFormat = useCallback(() => {
    if (smartFormatPreview) {
      setMessage(smartFormatPreview);
      setSmartFormatPreview(null);
    }
  }, [smartFormatPreview]);

  const quickActions = [
    { icon: Zap, label: "Quick reply", action: () => {} },
    { icon: Brain, label: "AI assist", action: () => {} },
    { icon: RefreshCw, label: "Rephrase", action: () => {} },
  ];

  const highConfidenceSuggestions = suggestions.filter((s) => s.confidence >= confidenceThreshold);
  const hasHighConfidenceSuggestions = highConfidenceSuggestions.length > 0;

  return (
    <div className="ai-message-composer relative">
      {/* AI Suggestions */}
      <OptimizedAnimatePresence>
        {showSuggestions && (suggestions.length > 0 || isGeneratingSuggestions) && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 rounded-ds-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 spacing-3"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-ds-2">
                <div className="relative">
                  <Icon icon={Sparkles} className="h-4 w-4 text-purple-600" />
                  {hasHighConfidenceSuggestions && (
                    <div className="bg-semantic-success absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-ds-full" />
                  )}
                </div>
                <span className="text-sm font-medium text-purple-700">AI Suggestions</span>
                {hasHighConfidenceSuggestions && (
                  <Badge
                    variant="secondary"
                    className="text-green-600-dark bg-[var(--fl-color-success-subtle)] text-tiny"
                  >
                    High confidence
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="hover:text-foreground text-gray-400 transition-colors"
              >
                <Icon icon={X} className="h-4 w-4" />
              </button>
            </div>

            {/* Suggestions */}
            {isGeneratingSuggestions ? (
              <div className="space-y-spacing-sm">
                <div className="animate-pulse space-y-spacing-sm">
                  <div className="h-4 w-3/4 rounded bg-purple-200"></div>
                  <div className="h-4 w-full rounded bg-purple-200"></div>
                  <div className="h-4 w-2/3 rounded bg-purple-200"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-spacing-sm">
                {suggestions.map((suggestion, index) => (
                  <OptimizedMotion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "cursor-pointer rounded-ds-md border spacing-3 transition-all",
                      index === selectedSuggestionIndex
                        ? "border-purple-300 bg-white shadow-sm ring-2 ring-purple-200"
                        : "border-purple-100 bg-white/50 hover:border-purple-200 hover:bg-white",
                      suggestion.confidence >= confidenceThreshold &&
                        "border-status-success-light bg-status-success-light/50"
                    )}
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    {/* Confidence indicator */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-ds-2">
                        {suggestion.category && (
                          <Badge variant="outline" className="text-tiny">
                            {suggestion.category}
                          </Badge>
                        )}
                        {suggestion.confidence >= confidenceThreshold && (
                          <div className="flex items-center gap-1">
                            <div className="bg-semantic-success h-1.5 w-1.5 rounded-ds-full"></div>
                            <span className="text-green-600-dark text-tiny">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suggestion text */}
                    <p className="leading-relaxed text-foreground line-clamp-2 text-sm">{suggestion.text}</p>

                    {/* Actions */}
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseSuggestion(suggestion);
                        }}
                        className="hover:text-status-info-dark text-tiny font-medium text-blue-600 transition-colors"
                      >
                        Use
                      </button>
                      {onEditSuggestion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSuggestion(suggestion);
                          }}
                          className="text-foreground hover:text-foreground flex items-center gap-1 text-tiny transition-colors"
                        >
                          <Icon icon={Edit} className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  </OptimizedMotion.div>
                ))}
              </div>
            )}

            {/* Generate more button */}
            {!isGeneratingSuggestions && suggestions.length > 0 && onGenerateNew && (
              <button
                onClick={onGenerateNew}
                className="mt-3 flex items-center gap-1 text-sm text-purple-600 transition-colors hover:text-purple-700"
              >
                <Icon icon={RefreshCw} className="h-3 w-3" />
                Generate alternatives
              </button>
            )}
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Smart formatting preview */}
      {smartFormatPreview && (
        <OptimizedMotion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-status-info-light mb-2 rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Sparkles} className="h-4 w-4 text-blue-600" />
              <span className="text-status-info-dark text-sm font-medium">Smart formatting detected</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleApplySmartFormat}
              className="hover:text-status-info-dark text-blue-600"
            >
              Apply
            </Button>
          </div>
          <div className="bg-background text-foreground rounded border p-spacing-sm font-mono text-sm">{smartFormatPreview}</div>
        </OptimizedMotion.div>
      )}

      {/* AI Typing Status */}
      {aiTypingStatus?.isTyping && showAIIndicators && (
        <OptimizedMotion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="border-status-success-light mb-3 rounded-ds-lg border bg-gradient-to-r from-green-50 to-teal-50 spacing-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Brain} className="text-semantic-success-dark h-4 w-4 animate-pulse" />
              <span className="text-green-600-dark text-sm font-medium">AI is {aiTypingStatus.phase}...</span>
            </div>
            <div className="flex-1">
              <Progress value={aiTypingStatus.progress} className="h-2 bg-[var(--fl-color-success-subtle)]" />
            </div>
            {aiTypingStatus.estimatedTimeRemaining && (
              <span className="text-semantic-success-dark text-tiny">
                {Math.round(aiTypingStatus.estimatedTimeRemaining / 1000)}s
              </span>
            )}
          </div>
        </OptimizedMotion.div>
      )}

      {/* Main composer */}
      <div
        ref={dropRef}
        className={cn(
          "ai-composer-container relative rounded-ds-lg border transition-all duration-200",
          isDragging && "bg-status-info-light border-brand-blue-500",
          isExpanded && "shadow-lg",
          disabled && "opacity-50",
          "border-[var(--fl-color-border-strong)] bg-white"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        {/* Attachment preview */}
        {attachment && (
          <div className="border-b border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-ds-2">
                <Icon icon={File} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                <span className="text-foreground text-sm">{attachment.name}</span>
                <Badge variant="outline" className="text-tiny">
                  {Math.round(attachment.size / 1024)}KB
                </Badge>
              </div>
              <button onClick={() => setAttachment(null)} className="hover:text-foreground text-gray-400">
                <Icon icon={X} className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-ds-2 spacing-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "text-typography-sm w-full resize-none border-0 bg-transparent focus:outline-none",
                "max-h-[120px] min-h-[20px] placeholder:text-neutral-500"
              )}
              rows={1}
            />

            {/* Character count for longer messages */}
            {message.length > 200 && (
              <div className="absolute bottom-1 right-1 text-tiny text-gray-400">{message.length}</div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Quick actions */}
            {enableQuickActions && isExpanded && (
              <div className="mr-2 flex items-center gap-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="hover:bg-background hover:text-foreground rounded spacing-1.5 text-gray-400 transition-colors"
                    title={action.label}
                  >
                    <action.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}

            {/* File upload */}
            {enableFileUpload && isFeatureEnabled("FILE_UPLOADS") && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="hover:bg-background hover:text-foreground rounded p-spacing-sm text-gray-400 transition-colors"
                  title="Attach file"
                >
                  <Icon icon={File} className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Voice input */}
            {enableVoiceInput && (
              <button
                onClick={() => setIsRecording(!isRecording)}
                disabled={disabled}
                className={cn(
                  "rounded spacing-2 transition-colors",
                  isRecording
                    ? "text-status-error bg-status-error-light hover:bg-red-200"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                )}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <Icon icon={Mic} className="h-4 w-4" />
              </button>
            )}

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={(!message.trim() && !attachment) || disabled}
              size="sm"
              className="ml-1"
            >
              <Icon icon={Send} className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Templates */}
        {templates.length > 0 && isExpanded && (
          <div className="border-t border-[var(--fl-color-border-subtle)] px-3 pb-3">
            <div className="mt-2 flex flex-wrap items-center gap-ds-2">
              <span className="text-tiny text-[var(--fl-color-text-muted)]">Quick templates:</span>
              {templates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  onClick={() => onUseTemplate?.(template.content)}
                  className="bg-background rounded px-2 py-1 text-tiny transition-colors hover:bg-gray-200"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      {isExpanded && (
        <div className="mt-2 flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
          <span>
            <kbd className="bg-background rounded px-1 py-0.5 text-tiny">Enter</kbd> to send,{" "}
            <kbd className="bg-background rounded px-1 py-0.5 text-tiny">Shift+Enter</kbd> for new line
          </span>
          {showSuggestions && suggestions.length > 0 && (
            <span>
              <kbd className="bg-background rounded px-1 py-0.5 text-tiny">↑↓</kbd> to navigate suggestions
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AIMessageComposer;
