"use client";

import React, { useCallback, useMemo } from "react";
import { Paperclip, Send as Send } from "lucide-react";
import { AIReplySuggestions } from "@/components/ai/AIReplySuggestions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useDebouncedAISuggestions } from "@/hooks/useDebouncedAISuggestions";
import { Icon } from "@/lib/ui/Icon";
import type { AISuggestion, MessageInputProps } from "./types";

export function MessageInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  onFocus,
  onBlur,
  isSending,
  isFileUploading = false,
  placeholder = "Type your message...",
  conversationId,
  lastCustomerMessage,
  showAISuggestions = true,
}: MessageInputProps) {
  // Use debounced AI suggestions to prevent excessive API calls
  const {
    suggestions,
    isGenerating,
    generateSuggestions,
    clearSuggestions,
    applySuggestion,
    error: suggestionsError,
  } = useDebouncedAISuggestions({
    conversationId: conversationId || "",
    lastCustomerMessage: lastCustomerMessage || "",
    enabled: showAISuggestions && !value.trim(),
    debounceMs: 1000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isSending) {
      onSend();
      clearSuggestions();
    }
  };

  const handleUseSuggestion = useCallback(
    (suggestion: AISuggestion) => {
      try {
        const newValue = applySuggestion(suggestion.text, value);
        onChange(newValue);
        clearSuggestions();
      } catch (error) {}
    },
    [applySuggestion, value, onChange, clearSuggestions]
  );

  const handleEditSuggestion = useCallback(
    (suggestion: AISuggestion) => {
      try {
        onChange(suggestion.text);
        clearSuggestions();
      } catch (error) {}
    },
    [onChange, clearSuggestions]
  );

  // Memoize formatted suggestions to prevent unnecessary re-renders
  const formattedSuggestions: AISuggestion[] = useMemo(() => {
    // Only show suggestions if no error occurred
    if (suggestionsError) {
      return [];
    }

    return suggestions.map((text, index) => ({
      id: `suggestion-${index}`,
      text,
      confidence: 0.8,
    }));
  }, [suggestions, suggestionsError]);

  return (
    <div className="chat-input-sticky sticky-bottom-fade">
      {/* AI Suggestions with Error Handling */}
      {showAISuggestions && (formattedSuggestions.length > 0 || isGenerating) && (
        <div className="px-6 pt-3">
          <AIReplySuggestions
            suggestions={formattedSuggestions}
            onUseSuggestion={handleUseSuggestion}
            onEditSuggestion={handleEditSuggestion}
            onGenerateNew={generateSuggestions}
            onDismiss={clearSuggestions}
            isLoading={isGenerating}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-spacing-md">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Textarea
              value={value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              className="border-ds-border-strong max-h-32 min-h-[48px] resize-none rounded-ds-xl pr-12 focus:border-[var(--fl-color-border-interactive)] focus:ring-blue-400"
              data-testid="message-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="button-press smooth-transition absolute right-2 top-2 text-gray-400 hover:text-blue-600"
              disabled={isFileUploading}
            >
              {isFileUploading ? (
                <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-current" />
              ) : (
                <Icon icon={Paperclip} className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!value.trim() || isSending}
            className="button-press button-hover smooth-transition self-end bg-[#246BFF] px-4 py-2 text-white shadow-card-base hover:bg-[#246BFF]/90"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-white" />
            ) : (
              <Icon icon={Send} className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
