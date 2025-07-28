"use client";

import React, { useEffect, useState } from "react";
import { Brain, Copy, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { useRAG } from "@/hooks/useRAG";
import { Icon } from "@/lib/ui/Icon";

interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  reasoning?: string;
  category?: string;
}

interface AIAssistPanelProps {
  conversationId: string;
  onSuggestionSelect: (content: string) => void;
  className?: string;
}

export const AIAssistPanel: React.FC<AIAssistPanelProps> = ({ conversationId, onSuggestionSelect, className = "" }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { generateRAGResponse, searchRAGSnippets } = useRAG();

  // Generate AI suggestions
  const generateSuggestions = async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate RAG response
      await generateRAGResponse(conversationId);

      // Mock suggestions for now - replace with actual RAG results
      const mockSuggestions: AISuggestion[] = [
        {
          id: "1",
          content: "Thank you for contacting us. I understand your concern and I'm here to help.",
          confidence: 0.92,
          reasoning: "Standard empathetic greeting based on conversation context",
          category: "greeting",
        },
        {
          id: "2",
          content:
            "Let me look into this issue for you right away. Can you provide more details about when this started?",
          confidence: 0.87,
          reasoning: "Proactive assistance request based on problem-solving patterns",
          category: "clarification",
        },
        {
          id: "3",
          content: "I apologize for any inconvenience this has caused. Let me escalate this to our technical team.",
          confidence: 0.75,
          reasoning: "Escalation response for technical issues",
          category: "escalation",
        },
      ];

      setSuggestions(mockSuggestions);
    } catch (err) {
      setError("Failed to generate suggestions");

    } finally {
      setIsLoading(false);
    }
  };

  // Generate suggestions when conversation changes
  useEffect(() => {
    if (conversationId) {
      generateSuggestions();
    }
  }, [conversationId]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    onSuggestionSelect(suggestion.content);
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {

    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  if (isLoading) {
    return (
      <div className={`spacing-4 ${className}`}>
        <div className="flex items-center space-x-spacing-sm text-sm text-[var(--fl-color-text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <span>Generating AI suggestions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`spacing-4 ${className}`}>
        <div className="mb-2 text-sm text-red-600">{error}</div>
        <button onClick={generateSuggestions} className="text-sm text-blue-600 hover:text-blue-800">
          Try again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={`spacing-4 ${className}`}>
        <div className="text-center text-sm text-[var(--fl-color-text-muted)]">
          <Icon icon={Brain} className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>No AI suggestions available</p>
          <button onClick={generateSuggestions} className="mt-1 text-blue-600 hover:text-blue-800">
            Generate suggestions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-sm font-medium">
          <Icon icon={Brain} className="mr-1 h-4 w-4" />
          AI Suggestions
        </h4>
        <button onClick={generateSuggestions} className="text-tiny text-blue-600 hover:text-blue-800">
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-background cursor-pointer rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 transition-colors hover:border-[var(--fl-color-border-interactive)]"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="mb-2 flex items-start justify-between">
              <div
                className={`rounded-ds-full px-2 py-1 text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}
              >
                {getConfidenceLevel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(suggestion.content);
                  }}
                  className="hover:text-foreground spacing-1 text-gray-400"
                  title="Copy to clipboard"
                >
                  <Icon icon={Copy} className="h-3 w-3" />
                </button>
              </div>
            </div>

            <p className="leading-relaxed mb-2 text-sm text-gray-800">{suggestion.content}</p>

            {suggestion.reasoning && (
              <p className="text-tiny italic text-[var(--fl-color-text-muted)]">{suggestion.reasoning}</p>
            )}

            {suggestion.category && (
              <div className="mt-2">
                <span className="inline-block rounded bg-[var(--fl-color-info-subtle)] px-2 py-1 text-tiny text-blue-800">
                  {suggestion.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[var(--fl-color-border)] pt-3">
        <div className="flex items-center justify-between text-tiny text-[var(--fl-color-text-muted)]">
          <span>Powered by AI</span>
          <div className="flex space-x-spacing-sm">
            <button className="hover:text-foreground flex items-center space-x-1">
              <Icon icon={ThumbsUp} className="h-3 w-3" />
              <span>Helpful</span>
            </button>
            <button className="hover:text-foreground flex items-center space-x-1">
              <Icon icon={ThumbsDown} className="h-3 w-3" />
              <span>Not helpful</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
