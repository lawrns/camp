/**
 * Custom hook for AI suggestions
 * Separates AI suggestion logic from UI components
 */

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface SuggestionContext {
  conversationId: string;
  lastMessage: string;
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  customerInfo?: {
    name?: string;
    email?: string;
    previousIssues?: string[];
  };
}

interface AIResponse {
  suggestions: string[];
  confidence: number;
  reasoning?: string;
}

interface UseAISuggestionsReturn {
  // State
  suggestions: string[];
  isGenerating: boolean;
  confidence: number;
  error: string | null;

  // Actions
  generateSuggestions: (context: SuggestionContext) => Promise<void>;
  clearSuggestions: () => void;
  selectSuggestion: (suggestion: string) => string;

  // Utilities
  applySuggestion: (suggestion: string, currentText: string) => string;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Generate AI suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (context: SuggestionContext): Promise<AIResponse> => {
      // Get auth token from Supabase session
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if session exists
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/ai/suggested-replies", {
        method: "POST",
        headers,
        body: JSON.stringify({
          conversationId: context.conversationId,
          lastMessage: context.lastMessage,
          history: context.conversationHistory,
          customerInfo: context.customerInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      return response.json();
    },
    onMutate: () => {
      setIsGenerating(true);
      setError(null);
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      setConfidence(data.confidence || 0);

      if (data.suggestions.length === 0) {
        toast.info("No suggestions available for this context");
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to generate suggestions";
      setError(message);
      toast.error(message);
      setSuggestions([]);
      setConfidence(0);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const generateSuggestions = useCallback(
    async (context: SuggestionContext) => {
      // Don't generate if already generating
      if (isGenerating) return;

      // Clear previous suggestions
      setSuggestions([]);

      await generateSuggestionsMutation.mutateAsync(context);
    },
    [isGenerating]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setConfidence(0);
    setError(null);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      // Track suggestion usage (analytics)
      // In a real app, this would send analytics
      // Clear suggestions after selection
      clearSuggestions();

      return suggestion;
    },
    [clearSuggestions]
  );

  const applySuggestion = useCallback((suggestion: string, currentText: string) => {
    // If there's existing text, append the suggestion
    if (currentText.trim()) {
      return `${currentText}\n\n${suggestion}`;
    }

    // Otherwise, just use the suggestion
    return suggestion;
  }, []);

  return {
    // State
    suggestions,
    isGenerating,
    confidence,
    error,

    // Actions
    generateSuggestions,
    clearSuggestions,
    selectSuggestion,

    // Utilities
    applySuggestion,
  };
}
