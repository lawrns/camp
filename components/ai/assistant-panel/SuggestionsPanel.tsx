/**
 * AI Suggestions Panel Component
 */

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Copy, ThumbsUp } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { SuggestedResponse } from "./types";
import { getCategoryIcon, getConfidenceColor } from "./utils";

interface SuggestionsPanelProps {
  suggestions: SuggestedResponse[];
  onSuggestionSelect?: (suggestion: SuggestedResponse) => void;
  className?: string;
}

export const SuggestionsPanel = ({ suggestions, onSuggestionSelect, className }: SuggestionsPanelProps) => {
  const handleSuggestionClick = (suggestion: SuggestedResponse) => {
    onSuggestionSelect?.(suggestion);
  };

  const handleCopySuggestion = async (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {

    }
  };

  if (suggestions.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Icon icon={ThumbsUp} className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-[var(--fl-color-text-muted)]">No suggestions available</p>
        <p className="mt-1 text-tiny text-gray-400">AI will generate suggestions as the conversation progresses</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-3 spacing-3">
        {suggestions.map((suggestion, index) => (
          <OptimizedMotion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer border-l-4 border-l-blue-500 transition-colors hover:bg-[var(--fl-color-background-subtle)]"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <CardContent className="spacing-3">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center space-x-spacing-sm">
                    {getCategoryIcon(suggestion.category)}
                    <Badge variant="secondary" className="text-tiny">
                      {suggestion.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-spacing-sm">
                    <span className={cn("text-typography-xs font-medium", getConfidenceColor(suggestion.confidence))}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleCopySuggestion(suggestion.content, e)}
                      className="h-6 w-6 p-0"
                    >
                      <Icon icon={Copy} className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="leading-relaxed text-foreground mb-2 text-sm">{suggestion.content}</p>

                <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
                  <span>Intent: {suggestion.intent}</span>
                  <OptimizedMotion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" variant="outline" className="h-6 text-tiny">
                      Use Suggestion
                    </Button>
                  </OptimizedMotion.div>
                </div>
              </CardContent>
            </Card>
          </OptimizedMotion.div>
        ))}
      </div>
    </ScrollArea>
  );
};
