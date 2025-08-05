// AISuggestionsPanel component for AI-generated suggestions

import * as React from "react";
import { ArrowRight, Lightbulb, Bot, Sparkles, X } from "lucide-react";
import type { AISuggestion } from "../types";

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  onUseSuggestion: (suggestion: AISuggestion) => void;
  onClose: () => void;
  isGenerating: boolean;
}

/**
 * AI suggestions panel component
 */
export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  suggestions,
  onUseSuggestion,
  onClose,
  isGenerating,
}) => {
  // Get suggestion type icon and color
  const getSuggestionStyle = (type: AISuggestion["type"]) => {
    switch (type) {
      case "response":
        return {
          icon: Bot,
          color: "text-blue-600",
          bg: "bg-[var(--fl-color-info-subtle)]",
          border: "border-[var(--fl-color-info-muted)]",
        };
      case "action":
        return {
          icon: ArrowRight,
          color: "text-green-600",
          bg: "bg-[var(--fl-color-success-subtle)]",
          border: "border-[var(--fl-color-success-muted)]",
        };
      case "escalation":
        return {
          icon: Lightbulb,
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
        };
      default:
        return {
          icon: Sparkles,
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
        };
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="bg-background absolute bottom-full left-0 right-0 z-20 mb-2 max-h-96 overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] shadow-card-deep">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] spacing-3">
        <h3 className="flex items-center text-sm font-medium text-gray-900">
          <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
          AI Suggestions
        </h3>
        <button onClick={onClose} className="hover:text-foreground text-gray-400" aria-label="Close AI suggestions">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isGenerating ? (
          // Loading state
          <div className="spacing-4 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-purple-600"></div>
            <p className="text-foreground mb-1 text-sm">Generating suggestions...</p>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">AI is analyzing the conversation context</p>
          </div>
        ) : suggestions.length === 0 ? (
          // Empty state
          <div className="spacing-4 text-center text-[var(--fl-color-text-muted)]">
            <Bot className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm">No suggestions available</p>
            <p className="mt-1 text-tiny text-gray-400">Try generating new suggestions based on the conversation</p>
          </div>
        ) : (
          // Suggestions list
          <div className="space-y-3 spacing-3">
            {suggestions.map((suggestion) => {
              const style = getSuggestionStyle(suggestion.type);
              const IconComponent = style.icon;

              return (
                <button
                  key={suggestion.id}
                  onClick={() => onUseSuggestion(suggestion)}
                  className={`w-full rounded-ds-lg border spacing-3 text-left transition-all hover:shadow-sm ${style.border} ${style.bg} hover:bg-opacity-80`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 rounded-ds-lg bg-white spacing-2 ${style.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-xs font-medium uppercase tracking-wide ${style.color}`}>
                          {suggestion.type}
                        </span>
                        <span
                          className={`rounded-ds-full px-2 py-1 text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}
                        >
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>

                      <p className="mb-2 line-clamp-3 text-sm text-gray-900">{suggestion.content}</p>

                      {suggestion.reasoning && (
                        <p className="text-foreground text-tiny italic">&quot;{suggestion.reasoning}&quot;</p>
                      )}
                    </div>

                    {/* Use button indicator */}
                    <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowRight className={`h-4 w-4 ${style.color}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="border-t border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
            <span>
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} generated
            </span>
            <span className="flex items-center">
              <Sparkles className="mr-1 h-3 w-3" />
              Powered by AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestionsPanel;
