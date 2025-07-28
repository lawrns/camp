"use client";

import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import React, { useState, useCallback } from "react";
import { Plus } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  isCompact?: boolean;
  className?: string;
}

// Quick reaction emojis for widget
const QUICK_REACTIONS = ["👍", "❤️", "😊", "😮", "😢", "😡"];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onReactionAdd,
  onReactionRemove,
  currentUserId,
  isCompact = false,
  className = "",
}) => {
  const [showQuickPicker, setShowQuickPicker] = useState(false);

  const handleReactionClick = useCallback(
    (emoji: string) => {
      const existingReaction = reactions.find((r) => r.emoji === emoji);

      if (existingReaction?.hasReacted) {
        onReactionRemove(messageId, emoji);
      } else {
        onReactionAdd(messageId, emoji);
      }
    },
    [messageId, reactions, onReactionAdd, onReactionRemove]
  );

  const handleQuickReaction = useCallback(
    (emoji: string) => {
      handleReactionClick(emoji);
      setShowQuickPicker(false);
    },
    [handleReactionClick]
  );

  // Don't render if no reactions and not showing picker
  if (reactions.length === 0 && !showQuickPicker) {
    return (
      <div className={`flex items-center ${className}`}>
        <OptimizedMotion.button
          onClick={() => setShowQuickPicker(true)}
          className="hover:bg-background hover:text-foreground rounded-ds-full spacing-1 text-gray-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Add reaction"
        >
          <Plus className="h-3 w-3" />
        </OptimizedMotion.button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${isCompact ? "mt-1" : "mt-2"} ${className}`}>
      {/* Existing reactions */}
      <OptimizedAnimatePresence>
        {reactions.map((reaction) => (
          <OptimizedMotion.button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction.emoji)}
            className={`flex items-center space-x-1 rounded-ds-full px-2 py-1 text-xs transition-all ${
              reaction.hasReacted
                ? "border border-[var(--fl-color-border-interactive)] bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border border-[var(--fl-color-border)] bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${reaction.hasReacted ? "Remove" : "Add"} ${reaction.emoji} reaction`}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </OptimizedMotion.button>
        ))}
      </OptimizedAnimatePresence>

      {/* Add reaction button */}
      <div className="relative">
        <OptimizedMotion.button
          onClick={() => setShowQuickPicker(!showQuickPicker)}
          className="hover:bg-background hover:text-foreground rounded-ds-full spacing-1 text-gray-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Add reaction"
        >
          <Plus className="h-3 w-3" />
        </OptimizedMotion.button>

        {/* Quick reaction picker */}
        <OptimizedAnimatePresence>
          {showQuickPicker && (
            <OptimizedMotion.div
              className="bg-background border-ds-border absolute bottom-full left-0 z-50 mb-2 flex space-x-1 rounded-ds-lg border p-spacing-sm shadow-card-deep"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <OptimizedMotion.button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="hover:bg-background rounded-ds-md p-spacing-sm text-base transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </OptimizedMotion.button>
              ))}
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </div>
    </div>
  );
};
