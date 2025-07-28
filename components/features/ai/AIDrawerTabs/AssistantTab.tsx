"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  CheckCircle as Check,
  Copy,
  ArrowsClockwise as RefreshCw,
  PaperPlaneTilt as Send,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card } from "@/components/unified-ui/components/Card";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationWithRelations } from "@/types/entities/conversation";

// Mock InboxContext since it doesn't exist
const mockInboxContext = {
  generateRAGResponse: async () => ({ response: "Mock RAG response", confidence: 0.8 }),
};

interface AssistantTabProps {
  conversation: ConversationWithRelations;
  onSuggestionSelect: (suggestion: string) => void;
}

export const AssistantTab: React.FC<AssistantTabProps> = ({ conversation, onSuggestionSelect }) => {
  const { generateRAGResponse } = mockInboxContext;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Load initial suggestions
  useEffect(() => {
    // Don't automatically load suggestions to prevent unwanted messages
    // User should manually request suggestions when needed
    // if (conversation.assignee_type === 'ai') {
    //   loadSuggestions();
    // }
  }, [conversation.id]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // In real implementation, this would fetch from RAG service
      // Note: generateRAGResponse should NOT automatically send messages
      // It should only generate suggestions for the agent to review
      // await generateRAGResponse(conversation.id);

      // Mock suggestions for now
      setSuggestions([
        "I understand your concern about the shipping delay. Let me check the current status of your order and provide you with an update.",
        "Thank you for reaching out. I can help you with the refund process. First, could you please provide your order number?",
        "I apologize for the inconvenience. Our technical team is aware of this issue and working on a fix. In the meantime, here's a workaround...",
      ]);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelect = (suggestion: string, index: number) => {
    setSelectedIndex(index);
    onSuggestionSelect(suggestion);

    // Visual feedback
    setTimeout(() => setSelectedIndex(null), 500);
  };

  return (
    <div className="flex h-full flex-col space-y-3 spacing-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">AI Suggestions</h3>
          <p className="mt-0.5 text-tiny text-[var(--fl-color-text-muted)]">Click to insert • Copy to clipboard</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={isLoading} className="h-8">
          <Icon icon={RefreshCw} className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="spacing-3">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </Card>
          ))
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className={cn(
                "cursor-pointer spacing-4 transition-all duration-200",
                "hover:border-status-info-light hover:shadow-md",
                selectedIndex === index && "bg-status-info-light ring-2 ring-blue-400"
              )}
              onClick={() => handleSelect(suggestion, index)}
            >
              <div className="space-y-spacing-sm">
                <p className="leading-relaxed text-foreground text-sm">{suggestion}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="secondary" className="text-tiny">
                      85% match
                    </Badge>
                    <Badge variant="outline" className="text-tiny">
                      Professional
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(suggestion, index);
                      }}
                    >
                      {copiedIndex === index ? (
                        <Icon icon={Check} className="text-semantic-success-dark h-3.5 w-3.5" />
                      ) : (
                        <Icon icon={Copy} className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(suggestion, index);
                      }}
                    >
                      <Icon icon={Send} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-[var(--fl-color-text-muted)]">
            <p className="text-sm">No suggestions available</p>
            <Button variant="outline" size="sm" onClick={loadSuggestions} className="mt-4">
              Generate Suggestions
            </Button>
          </div>
        )}
      </div>

      {/* Footer tip */}
      {suggestions.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-center text-tiny text-[var(--fl-color-text-muted)]">
            💡 Tip: Press <kbd className="bg-background rounded px-1 py-0.5 text-tiny">Tab</kbd> to quickly
            insert the top suggestion
          </p>
        </div>
      )}
    </div>
  );
};
