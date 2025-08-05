'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, TrendingUp } from 'lucide-react';

interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  tone: 'professional' | 'friendly' | 'empathetic' | 'technical';
  category: 'quick_reply' | 'detailed_response' | 'escalation';
  reasoning: string;
}

interface AIReplySuggestionsProps {
  conversationId: string;
  organizationId: string;
  lastCustomerMessage?: string;
  conversationHistory: Array<{
    id: string;
    content: string;
    senderType: string;
    timestamp: string;
  }>;
  onSelectSuggestion: (content: string) => void;
  className?: string;
}

export function AIReplySuggestions({
  conversationId,
  organizationId,
  lastCustomerMessage,
  conversationHistory,
  onSelectSuggestion,
  className = '',
}: AIReplySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate AI suggestions when conversation changes
  useEffect(() => {
    if (lastCustomerMessage && conversationId) {
      generateSuggestions();
    }
  }, [lastCustomerMessage, conversationId]);

  const generateSuggestions = async () => {
    if (!lastCustomerMessage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/reply-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          organizationId,
          messageContent: lastCustomerMessage,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      setError('Failed to generate suggestions');
      // Provide fallback suggestions
      setSuggestions([
        {
          id: 'fallback-1',
          content: "Thank you for reaching out. I'll help you with that right away.",
          confidence: 0.8,
          tone: 'professional',
          category: 'quick_reply',
          reasoning: 'Standard professional acknowledgment',
        },
        {
          id: 'fallback-2',
          content: "I understand your concern. Let me look into this for you and get back with a solution.",
          confidence: 0.7,
          tone: 'empathetic',
          category: 'detailed_response',
          reasoning: 'Empathetic response for customer concerns',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-[var(--fl-color-primary-subtle)] text-[var(--fl-color-primary)]';
      case 'friendly': return 'bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)]';
      case 'empathetic': return 'bg-purple-100 text-purple-800';
      case 'technical': return 'bg-[var(--fl-color-surface)] text-[var(--fl-color-text)]';
      default: return 'bg-[var(--fl-color-surface)] text-[var(--fl-color-text)]';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quick_reply': return Clock;
      case 'detailed_response': return TrendingUp;
      case 'escalation': return Sparkles;
      default: return Sparkles;
    }
  };

  if (!lastCustomerMessage) {
    return null;
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-[var(--fl-spacing-2)] mb-3">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-medium text-gray-900">AI Reply Suggestions</h3>
        {isLoading && (
          <div className="ml-auto">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const CategoryIcon = getCategoryIcon(suggestion.category);
          
          return (
            <div
              key={suggestion.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => onSelectSuggestion(suggestion.content)}
            >
              <div className="flex items-start justify-between gap-[var(--fl-spacing-2)] mb-2">
                <div className="flex items-center gap-[var(--fl-spacing-2)]">
                  <CategoryIcon className="h-3 w-3 text-gray-500" />
                  <Badge variant="secondary" className={getToneColor(suggestion.tone)}>
                    {suggestion.tone}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                {suggestion.content}
              </p>
              
              <p className="text-xs text-gray-500 italic">
                {suggestion.reasoning}
              </p>
            </div>
          );
        })}
      </div>

      {suggestions.length === 0 && !isLoading && !error && (
        <div className="text-sm text-gray-500 text-center py-4">
          No suggestions available for this message
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={isLoading}
          className="w-full"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {isLoading ? 'Generating...' : 'Refresh Suggestions'}
        </Button>
      </div>
    </Card>
  );
}
