/**
 * Debounced version of useAISuggestions hook
 * Prevents excessive API calls for AI suggestion generation
 */

import { useCallback, useEffect, useRef } from "react";
import { useAISuggestions } from "./useAISuggestions";

interface UseDebouncedAISuggestionsOptions {
  conversationId?: string;
  lastCustomerMessage?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useDebouncedAISuggestions({
  conversationId,
  lastCustomerMessage,
  enabled = true,
  debounceMs = 1000,
}: UseDebouncedAISuggestionsOptions) {
  const {
    suggestions,
    isGenerating,
    confidence,
    error,
    generateSuggestions,
    clearSuggestions,
    selectSuggestion,
    applySuggestion,
  } = useAISuggestions();

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastGeneratedRef = useRef<{ conversationId?: string; message?: string } | undefined>(undefined);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced generation effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if we should generate suggestions
    const shouldGenerate =
      enabled &&
      conversationId &&
      lastCustomerMessage &&
      (lastGeneratedRef.current?.conversationId !== conversationId ||
        lastGeneratedRef.current?.message !== lastCustomerMessage);

    if (shouldGenerate) {
      // Set up debounced generation
      timeoutRef.current = setTimeout(async () => {
        try {
          await generateSuggestions({
            conversationId,
            lastMessage: lastCustomerMessage,
          });

          // Update last generated reference
          lastGeneratedRef.current = {
            conversationId,
            message: lastCustomerMessage,
          };
        } catch (error) {}
      }, debounceMs);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [conversationId, lastCustomerMessage, enabled, debounceMs, generateSuggestions]);

  // Force generate suggestions (bypasses debouncing)
  const forceGenerateSuggestions = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (conversationId && lastCustomerMessage) {
      await generateSuggestions({
        conversationId,
        lastMessage: lastCustomerMessage,
      });

      lastGeneratedRef.current = {
        conversationId,
        message: lastCustomerMessage,
      };
    }
  }, [conversationId, lastCustomerMessage, generateSuggestions]);

  return {
    // State
    suggestions,
    isGenerating,
    confidence,
    error,

    // Actions
    generateSuggestions: forceGenerateSuggestions,
    clearSuggestions,
    selectSuggestion,
    applySuggestion,
  };
}
