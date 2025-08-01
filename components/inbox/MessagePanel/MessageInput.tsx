"use client";

import React, { useCallback, useMemo } from "react";
import { Paperclip, PaperPlaneTilt as Send } from "@phosphor-icons/react";
import { AIReplySuggestions } from "@/components/ai/AIReplySuggestions";
import { Button } from "@/components/ui/Button-unified";
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

      <form onSubmit={handleSubmit} className="ds-inbox-composer">
        <div className="flex" style={{ gap: 'var(--ds-inbox-composer-gap)' }}>
          <div className="relative flex-1">
            <Textarea
              value={value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              className="ds-inbox-textarea"
              data-testid="message-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ds-inbox-button ds-inbox-button-secondary absolute"
              style={{ right: 'var(--ds-spacing-2)', top: 'var(--ds-spacing-2)' }}
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
            className="ds-inbox-button ds-inbox-button-primary self-end"
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
