// components/ai/AIReplySuggestions.tsx
import { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { PencilSimple as Edit, ArrowsClockwise as RefreshCw, Sparkle as Sparkles, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AISuggestion {
  id: string;
  text: string;
  confidence: number;
  intent?: string;
}

interface AIReplySuggestionsProps {
  suggestions: AISuggestion[];
  onUseSuggestion: (suggestion: AISuggestion) => void;
  onEditSuggestion: (suggestion: AISuggestion) => void;
  onGenerateNew: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function AIReplySuggestions({
  suggestions,
  onUseSuggestion,
  onEditSuggestion,
  onGenerateNew,
  onDismiss,
  isLoading = false,
}: AIReplySuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!suggestions.length && !isLoading) return null;

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-3"
        data-component="AIReplySuggestions"
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-ds-2">
            <div className="relative">
              <Icon icon={Sparkles} className="h-4 w-4 text-purple-600" />
              <div className="absolute inset-0 animate-ping">
                <Icon icon={Sparkles} className="h-4 w-4 text-purple-600 opacity-75" />
              </div>
            </div>
            <span className="text-sm font-medium text-purple-700">AI reply suggestions</span>
          </div>
          <button onClick={onDismiss} className="hover:text-foreground text-gray-400 transition-colors">
            <Icon icon={X} className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestions */}
        {isLoading ? (
          <div className="rounded-ds-lg border border-purple-200 bg-purple-50 spacing-3">
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
                  "cursor-pointer rounded-ds-lg border border-purple-200 bg-purple-50 spacing-4 transition-all",
                  "hover:border-[var(--fl-color-brand-hover)] hover:shadow-sm",
                  selectedIndex === index && "ring-2 ring-purple-400 ring-offset-1"
                )}
                onClick={() => setSelectedIndex(index)}
              >
                {/* Confidence indicator */}
                {suggestion.confidence > 0.8 && (
                  <div className="mb-2 flex items-center gap-1">
                    <div className="bg-semantic-success h-1.5 w-1.5 rounded-ds-full"></div>
                    <span className="text-green-600-dark text-tiny">High confidence</span>
                  </div>
                )}

                {/* Suggestion text */}
                <p className="leading-relaxed text-foreground line-clamp-3 text-sm">{suggestion.text}</p>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseSuggestion(suggestion);
                    }}
                    className="hover:text-status-info-dark text-sm font-medium text-blue-600 transition-colors"
                  >
                    Use
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSuggestion(suggestion);
                    }}
                    className="text-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                  >
                    <Icon icon={Edit} className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              </OptimizedMotion.div>
            ))}
          </div>
        )}

        {/* Generate more button */}
        {!isLoading && suggestions.length > 0 && (
          <button
            onClick={onGenerateNew}
            className="mt-2 flex items-center gap-1 text-sm text-purple-600 transition-colors hover:text-purple-700"
          >
            <Icon icon={RefreshCw} className="h-3 w-3" />
            Generate alternative
          </button>
        )}
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}

// Export the type for use in other components
export type { AISuggestion };
