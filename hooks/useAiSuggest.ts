import { useEffect, useRef, useState } from "react";
import { useAIState, useComposerState } from "@/store/useInboxStore";

interface AISuggestionResponse {
  suggestions: Array<{
    id: string;
    content: string;
    confidence: number;
    reasoning?: string;
  }>;
}

// Simple debounced value hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useAISuggest() {
  const { draftText, noteMode } = useComposerState();
  const { suggestions, isLoadingSuggestions, setSuggestions, setIsLoadingSuggestions, clearSuggestions } = useAIState();

  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedDraft = useDebouncedValue(draftText, 500); // Wait 500ms after typing stops

  useEffect(() => {
    // Don't suggest for internal notes
    if (noteMode) {
      clearSuggestions();
      return;
    }

    const wordCount = debouncedDraft.trim().split(/\s+/).filter(Boolean).length;

    // Only fetch suggestions if we have more than 5 words
    if (wordCount <= 5) {
      clearSuggestions();
      return;
    }

    const fetchSuggestions = async () => {
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoadingSuggestions(true);

      try {
        const response = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft: debouncedDraft,
            context: {
              // Add conversation context here if needed
              messageType: "reply",
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data: AISuggestionResponse = await response.json();

        // Only set suggestions if we still have the same draft
        if (debouncedDraft === draftText) {
          setSuggestions(data.suggestions.slice(0, 3)); // Max 3 suggestions
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          clearSuggestions();
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedDraft, noteMode]);

  const applySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      // This will be handled by the composer
      return suggestion.content;
    }
    return null;
  };

  const dismissSuggestions = () => {
    clearSuggestions();
  };

  return {
    suggestions,
    isLoadingSuggestions,
    applySuggestion,
    dismissSuggestions,
  };
}
