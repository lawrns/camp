"use client";

import React, { useState } from "react";
import { Sparkle as Sparkles, X } from "@phosphor-icons/react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { AISuggestion, ComposerPluginProps } from "../types";

const SAMPLE_SUGGESTIONS: AISuggestion[] = [
  {
    id: "1",
    content: "Thank you for reaching out! I understand your concern and I'm here to help.",
    confidence: 0.9,
    category: "response",
    reasoning: "Professional and empathetic opening",
  },
  {
    id: "2",
    content: "Let me look into this issue for you right away.",
    confidence: 0.8,
    category: "response",
    reasoning: "Shows immediate action and care",
  },
  {
    id: "3",
    content: "I'll escalate this to our technical team for a faster resolution.",
    confidence: 0.7,
    category: "escalation",
    reasoning: "Appropriate for technical issues",
  },
];

export function AIPlugin({ pluginId, content, onContentChange, onAction, disabled }: ComposerPluginProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionSelect = (suggestion: AISuggestion) => {
    onContentChange(suggestion.content);
    onAction(pluginId, "suggestion-selected", suggestion);
    setShowSuggestions(false);
  };

  // Show suggestions when content is empty or partially typed
  const shouldShowSuggestions = showSuggestions && content.trim().length < 50;

  return (
    <>
      {/* AI Suggestions Section */}
      {shouldShowSuggestions && (
        <div className="border-b border-[--border-subtle] bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Sparkles} className="h-4 w-4 text-[--color-primary]" />
              <span className="text-sm font-medium text-[--text-primary]">AI Suggestions</span>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded",
                "text-[--text-muted] hover:bg-white/50 hover:text-[--text-primary]",
                "transition-colors duration-200"
              )}
              title="Hide AI suggestions"
            >
              <Icon icon={X} className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-spacing-sm">
            {SAMPLE_SUGGESTIONS.map((suggestion: unknown) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                disabled={disabled}
                className={cn(
                  "text-typography-sm w-full rounded-ds-md border border-[--border-subtle] px-3 py-2 text-left",
                  "bg-white transition-colors duration-200 hover:bg-[--bg-subtle]",
                  "hover:border-[--color-primary]/30 text-[--text-primary]",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                title={`Confidence: ${Math.round(suggestion.confidence * 100)}% - ${suggestion.reasoning}`}
              >
                <div className="flex items-start justify-between gap-ds-2">
                  <span className="flex-1">{suggestion.content}</span>
                  <span className="rounded bg-[--bg-subtle] px-1.5 py-0.5 text-tiny text-[--text-muted]">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show AI Suggestions Button */}
      {!showSuggestions && (
        <div className="bg-[--bg-subtle]/10 border-b border-[--border-subtle] px-3 py-2">
          <button
            onClick={() => setShowSuggestions(true)}
            disabled={disabled}
            className={cn(
              "text-typography-sm flex items-center gap-2 rounded-ds-md px-3 py-1.5",
              "text-[--text-muted] hover:text-[--color-primary]",
              "transition-colors duration-200 hover:bg-[--bg-subtle]",
              disabled && "cursor-not-allowed opacity-50"
            )}
            title="Get AI suggestions"
          >
            <Icon icon={Sparkles} className="h-4 w-4" />
            <span>AI Suggestions</span>
          </button>
        </div>
      )}
    </>
  );
}
