"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmartReplyPanel } from '@/components/InboxDashboard/sub-components/SmartReplyPanel';
import { Sparkle, Spinner } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  category: 'greeting' | 'question' | 'resolution' | 'escalation';
}

interface SmartRepliesHeaderIconProps {
  conversationId: string;
  organizationId: string;
  lastMessage?: string;
  onReplySelect: (reply: string) => void;
  className?: string;
}

export function SmartRepliesHeaderIcon({
  conversationId,
  organizationId,
  lastMessage,
  onReplySelect,
  className
}: SmartRepliesHeaderIconProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load smart replies when popover opens
  useEffect(() => {
    if (isOpen && conversationId && suggestions.length === 0) {
      loadSmartReplies();
    }
  }, [isOpen, conversationId]);

  const loadSmartReplies = async () => {
    setIsLoading(true);
    try {
      // Mock smart replies for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockSuggestions: SmartReply[] = [
        {
          id: '1',
          text: 'Thank you for reaching out! I\'ll help you resolve this issue right away.',
          confidence: 0.95,
          category: 'greeting'
        },
        {
          id: '2', 
          text: 'I understand your concern. Let me check your account details and get back to you.',
          confidence: 0.88,
          category: 'question'
        },
        {
          id: '3',
          text: 'This issue has been resolved. Please let me know if you need any further assistance.',
          confidence: 0.82,
          category: 'resolution'
        },
        {
          id: '4',
          text: 'I\'m escalating this to our technical team for immediate attention.',
          confidence: 0.75,
          category: 'escalation'
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to load smart replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySelect = (reply: string) => {
    onReplySelect(reply);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 relative",
            isLoading && "animate-pulse",
            className
          )}
          title="Smart Replies"
        >
          {isLoading ? (
            <Spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkle className="h-4 w-4" />
          )}
          {suggestions.length > 0 && !isLoading && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
              variant="default"
            >
              {suggestions.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <SmartReplyPanel
          conversationId={conversationId}
          organizationId={organizationId}
          customerMessage={lastMessage || ''}
          conversationHistory={[]}
          onReplySelect={handleReplySelect}
          isVisible={isOpen}
          isCompact={true}
          maxHeight="400px"
        />
      </PopoverContent>
    </Popover>
  );
}

// Export types for use in other components
export type { SmartReply, SmartRepliesHeaderIconProps };
